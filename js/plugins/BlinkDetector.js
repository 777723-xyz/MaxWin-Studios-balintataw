/*:
 * @plugindesc Blink Detection v1.2
 * @author John
 *
 * @param HUD Position
 * @type select
 * @option Top-Left
 * @option Top-Right
 * @option Bottom-Left
 * @option Bottom-Right
 * @default Top-Left
 *
 * @param HUD Opacity
 * @type number
 * @min 0
 * @max 1
 * @decimals 1
 * @default 0.8
 *
 * @param Blink Sensitivity
 * @type number
 * @decimals 2
 * @default 0.22
 *
 * @param Use ESP32-CAM
 * @type boolean
 * @default false
 *
 * @param ESP32-CAM IP
 * @type string
 * @default http://192.168.1.12/cam-lo.jpg
 *
 * @help
 * BlinkDetector v1.2 (EAR-based)
 * - Preview fixed (no blank box) & overlay aligned even with object-fit:cover.
 * - Labels: EAR + Threshold + BLINK indicator.
 * - More stable blinks (adaptive baseline, smoothing, hysteresis, reopen gating).
 * - Uses WebcamInGame.js if present; falls back to getUserMedia; legacy MJPEG last.
 *
 * Plugin Commands:
 *   BlinkDetector Start [SwitchID] [CommonEventID]
 *   BlinkDetector Stop
 *
 * Controls:
 *   H - Toggle HUD
 *   P - Toggle Camera Preview
 */

(function () {
  'use strict';

  var params = PluginManager.parameters('BlinkDetector');
  var hudPos = String(params['HUD Position'] || 'Top-Left');
  var hudOpacity = Number(params['HUD Opacity'] || 0.8);
  var blinkSensitivity = Number(params['Blink Sensitivity'] || 0.22);
  var useESP32 = params['Use ESP32-CAM'] === 'true';
  var esp32IP = String(params['ESP32-CAM IP'] || '');

  // Feed state
  var video = null; // <video> for webcam
  var img = null; // <img> for ESP32/MJPEG
  var espReloadInterval = null;

  // Detection state
  var __BD_sharedDetector = null; // singleton to avoid TFJS re-register spam
  var detector = null;
  var detecting = false;
  var targetSwitch = 0;
  var targetCommonEvent = 0;
  var hud = null;
  var blinkCount = 0;

  // UI state
  var hudVisible = true;
  var previewVisible = false;
  var previewBox = null;

  // ESP32 reconnect
  var reconnectAttempts = 0;
  var maxReconnectAttempts = 12;
  var reconnecting = false;
  var reconnectBaseDelay = 2000;
  var reconnectTimer = null;

  // Preview mirrors (never move the original feed)
  var previewVideoEl = null; // mirrors MediaStream video
  var previewImgEl = null; // mirrors MJPEG/ESP32 img

  // Overlay & detection tuning
  var overlayCanvas = null;
  var overlayCtx = null;

  // Tuned for stability
  var BASELINE_WINDOW = 40; // frames to estimate open-eye baseline
  var MIN_CLOSE_FRAMES = 3; // consecutive closed frames to count a blink
  var COOLDOWN_MS = 350; // min ms between blinks
  var baselineSamples = []; // rolling open-eye EARs
  var adaptiveFactor = 0.82; // threshold = baseline * factor (higher = stricter)
  var closeFrames = 0; // closed frame counter
  var openFrames = 0; // reopen gating
  var MIN_OPEN_FRAMES = 3;

  // ---------- Utilities ----------
  function dist(a, b) {
    var dx = a.x - b.x,
      dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function calcEAR(kp, indices) {
    var p1 = kp[indices[0]],
      p2 = kp[indices[1]],
      p3 = kp[indices[2]],
      p4 = kp[indices[3]],
      p5 = kp[indices[4]],
      p6 = kp[indices[5]];
    if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 1.0;
    var vert1 = dist(p2, p6),
      vert2 = dist(p3, p5),
      horiz = dist(p1, p4);
    return (vert1 + vert2) / (2.0 * horiz);
  }
  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  // Map model coords to preview canvas with object-fit:cover
  function computeCoverTransform(feedW, feedH, boxW, boxH) {
    var scale = Math.max(boxW / feedW, boxH / feedH);
    var drawW = feedW * scale,
      drawH = feedH * scale;
    var offsetX = (boxW - drawW) / 2,
      offsetY = (boxH - drawH) / 2;
    return { scale: scale, offsetX: offsetX, offsetY: offsetY };
  }
  function mapPointToOverlay(px, py, t) {
    return { x: px * t.scale + t.offsetX, y: py * t.scale + t.offsetY };
  }

  // ---------- HUD ----------
  function createHUD() {
    if (hud) return;
    hud = document.createElement('div');
    hud.style.position = 'fixed';
    hud.style.padding = '8px 12px';
    hud.style.background = 'rgba(0,0,0,' + hudOpacity + ')';
    hud.style.color = 'white';
    hud.style.fontFamily = 'monospace';
    hud.style.borderRadius = '8px';
    hud.style.zIndex = '9999';
    hud.style.fontSize = '14px';
    hud.style.opacity = '1';
    hud.style.pointerEvents = 'none';

    if (hudPos === 'Top-Right') {
      hud.style.top = '10px';
      hud.style.right = '10px';
    } else if (hudPos === 'Bottom-Left') {
      hud.style.bottom = '10px';
      hud.style.left = '10px';
    } else if (hudPos === 'Bottom-Right') {
      hud.style.bottom = '10px';
      hud.style.right = '10px';
    } else {
      hud.style.top = '10px';
      hud.style.left = '10px';
    }

    hud.innerHTML = 'Blink Detector Ready<br>Blinks: 0';
    document.body.appendChild(hud);
  }
  function updateHUD(status, color) {
    if (!hud) createHUD();
    hud.style.color = color || 'white';
    hud.innerHTML = status + '<br>Blinks: ' + blinkCount;
  }
  function toggleHUD() {
    hudVisible = !hudVisible;
    if (hud) hud.style.opacity = hudVisible ? '1' : '0';
  }

  // ---------- Preview & Overlay ----------
  function createPreviewBox() {
    if (previewBox) return;
    previewBox = document.createElement('div');
    previewBox.style.position = 'fixed';
    previewBox.style.bottom = '10px';
    previewBox.style.right = '10px';
    previewBox.style.width = '160px';
    previewBox.style.height = '120px';
    previewBox.style.border = '2px solid lime';
    previewBox.style.borderRadius = '8px';
    previewBox.style.overflow = 'hidden';
    previewBox.style.zIndex = '9998';
    previewBox.style.display = 'none';
    previewBox.style.background = '#000';
    document.body.appendChild(previewBox);
    ensureOverlay();
  }
  function ensureOverlay() {
    if (!previewBox) createPreviewBox();
    if (!overlayCanvas) {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = previewBox.clientWidth || 160;
      overlayCanvas.height = previewBox.clientHeight || 120;
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.width = '100%';
      overlayCanvas.style.height = '100%';
      overlayCanvas.style.pointerEvents = 'none';
      overlayCtx = overlayCanvas.getContext('2d');
      previewBox.appendChild(overlayCanvas);
    }
  }
  function resizeOverlayToBox() {
    if (!overlayCanvas || !previewBox) return;
    var w = previewBox.clientWidth || 160,
      h = previewBox.clientHeight || 120;
    if (overlayCanvas.width !== w || overlayCanvas.height !== h) {
      overlayCanvas.width = w;
      overlayCanvas.height = h;
    }
  }
  function clearOverlay() {
    if (overlayCtx && overlayCanvas)
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  function ensurePreviewBox() {
    if (!previewBox) createPreviewBox();
    return previewBox;
  }
  function attachPreviewFromFeed(feed) {
    var box = ensurePreviewBox();
    var isVideo = !!(feed && typeof feed.play === 'function');

    if (box) {
      box.innerHTML = '';
    } // clear once

    if (isVideo) {
      if (!previewVideoEl) {
        previewVideoEl = document.createElement('video');
        previewVideoEl.setAttribute('playsinline', '');
        previewVideoEl.setAttribute('autoplay', '');
        previewVideoEl.muted = true;
        previewVideoEl.style.width = '100%';
        previewVideoEl.style.height = '100%';
        previewVideoEl.style.objectFit = 'cover';
        previewVideoEl.style.display = 'block';
      }
      try {
        if (feed.srcObject) previewVideoEl.srcObject = feed.srcObject;
        else if (feed.captureStream)
          previewVideoEl.srcObject = feed.captureStream();
        else if (feed.mozCaptureStream)
          previewVideoEl.srcObject = feed.mozCaptureStream();
        else if (feed.src) previewVideoEl.src = feed.src;
      } catch (e) {}
      try {
        previewVideoEl.play();
      } catch (e2) {}
      box.appendChild(previewVideoEl);
    } else {
      if (!previewImgEl) {
        previewImgEl = document.createElement('img');
        previewImgEl.style.width = '100%';
        previewImgEl.style.height = '100%';
        previewImgEl.style.objectFit = 'cover';
        previewImgEl.style.display = 'block';
      }
      if (img && img.src) previewImgEl.src = img.src;
      box.appendChild(previewImgEl);
    }

    ensureOverlay();
    resizeOverlayToBox();
    if (overlayCanvas && overlayCanvas.parentNode !== box)
      box.appendChild(overlayCanvas);
  }
  function syncPreview() {
    if (!previewVisible) return;
    var feed = video || img;
    if (!feed) return;
    attachPreviewFromFeed(feed);
  }
  function togglePreview() {
    previewVisible = !previewVisible;
    if (!previewBox) createPreviewBox();
    previewBox.style.display = previewVisible ? 'block' : 'none';
    if (previewVisible) {
      ensureOverlay();
      resizeOverlayToBox();
      syncPreview();
    } else {
      clearOverlay();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'h') toggleHUD();
    if (e.key && e.key.toLowerCase() === 'p') togglePreview();
  });

  // ---------- ESP32 helpers ----------
  function clearReconnectState() {
    reconnectAttempts = 0;
    reconnecting = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }
  function scheduleReconnect() {
    if (!useESP32 || reconnecting) return;
    reconnecting = true;
    reconnectAttempts = 0;
    updateHUD('🔄 Reconnecting ESP32...', 'orange');
    tryReconnect();
  }
  function tryReconnect() {
    reconnectAttempts++;
    if (reconnectAttempts > maxReconnectAttempts) {
      updateHUD('🔴 ESP32 reconnect failed', 'red');
      reconnecting = false;
      return;
    }
    var delay = reconnectBaseDelay * Math.pow(1.5, reconnectAttempts - 1);
    reconnectTimer = setTimeout(function () {
      startESP32Feed(esp32IP)
        .then(function () {
          updateHUD('🟢 ESP32 Reconnected', 'lime');
          clearReconnectState();
        })
        .catch(function () {
          reconnecting = false;
          tryReconnect();
        });
    }, delay);
  }

  // ---------- Feed setup ----------
  function appendCacheBuster(url) {
    var sep = url.indexOf('?') > -1 ? '&' : '?';
    return url + sep + 'cb=' + Date.now();
  }
  function loadImageOnce(imgEl, url, timeout) {
    timeout = timeout || 5000;
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) {
          done = true;
          reject(new Error('Timeout'));
        }
      }, timeout);
      imgEl.onload = function () {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve();
        }
      };
      imgEl.onerror = function () {
        if (!done) {
          done = true;
          clearTimeout(timer);
          reject(new Error('Image error'));
        }
      };
      try {
        imgEl.src = appendCacheBuster(url);
      } catch (e) {
        reject(e);
      }
    });
  }
  function waitForNonZeroSize(el, type, timeout) {
    timeout = timeout || 5000;
    return new Promise(function (resolve, reject) {
      var start = Date.now();
      (function check() {
        var w = type === 'video' ? el.videoWidth : el.naturalWidth;
        var h = type === 'video' ? el.videoHeight : el.naturalHeight;
        if (w > 0 && h > 0) resolve();
        else if (Date.now() - start > timeout) reject(new Error('No frame'));
        else requestAnimationFrame(check);
      })();
    });
  }
  function cleanupMedia() {
    if (espReloadInterval) clearInterval(espReloadInterval);
    espReloadInterval = null;
    if (img) {
      try {
        img.remove();
      } catch (e) {}
    }
    img = null;
    if (video) {
      try {
        if (video.srcObject) {
          var tracks = video.srcObject.getTracks();
          for (var i = 0; i < tracks.length; i++) {
            try {
              tracks[i].stop();
            } catch (e2) {}
          }
        }
        video.remove();
      } catch (e) {}
      video = null;
    }
  }
  function startESP32Feed(url) {
    return new Promise(function (resolve, reject) {
      cleanupMedia();
      img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      document.body.appendChild(img);
      img.onerror = function () {
        updateHUD('⚠️ Feed error', 'orange');
        if (useESP32) scheduleReconnect();
      };
      loadImageOnce(img, url, 4000)
        .then(function () {
          espReloadInterval = setInterval(function () {
            try {
              img.src = appendCacheBuster(url);
            } catch (e) {}
          }, 450);
          resolve();
        })
        .catch(reject);
    });
  }

  // ---------- Init Camera (ESP32 -> in-game webcam -> getUserMedia -> MJPEG) ----------
  async function initCamera() {
    cleanupMedia();

    // 1) ESP32-CAM
    if (useESP32) {
      try {
        await startESP32Feed(esp32IP);
        await waitForNonZeroSize(img, 'image', 5000);
        updateHUD('🟢 ESP32 Connected', 'lime');
        clearReconnectState();
        ensureOverlay();
        resizeOverlayToBox();
        syncPreview();
        return;
      } catch (err) {
        updateHUD('🔴 ESP32 Failed', 'red');
        scheduleReconnect();
        return;
      }
    }

    // 2) In-game webcam (WebcamInGame.js)
    try {
      if (
        window.WebcamInGame &&
        typeof window.WebcamInGame.start === 'function'
      ) {
        await window.WebcamInGame.start();
        var feedEl = window.WebcamInGame.getFeedEl();
        if (feedEl) {
          video = feedEl;
          try {
            video.style.display = 'block';
          } catch (e0) {}
          await waitForNonZeroSize(video, 'video', 5000);
          updateHUD('🟢 In-game Webcam Connected', 'lime');
          ensureOverlay();
          resizeOverlayToBox();
          syncPreview();
          return;
        }
      }
    } catch (eA) {}

    // 3) getUserMedia fallback
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.display = 'block';
        document.body.appendChild(video);

        var stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        try {
          video.srcObject = stream;
        } catch (e1) {
          video.src = window.URL.createObjectURL(stream);
        }
        try {
          video.play();
        } catch (e2) {}
        await waitForNonZeroSize(video, 'video', 5000);
        updateHUD('🟢 Local Camera (getUserMedia) Connected', 'lime');
        ensureOverlay();
        resizeOverlayToBox();
        syncPreview();
        return;
      }
    } catch (eB) {}

    // 4) Legacy local MJPEG
    var localWebcamURL = 'http://localhost:8080/video';
    try {
      await startESP32Feed(localWebcamURL);
      await waitForNonZeroSize(img, 'image', 5000);
      updateHUD('🟢 Local Webcam (HTTP MJPEG) Connected', 'lime');
      ensureOverlay();
      resizeOverlayToBox();
      syncPreview();
      return;
    } catch (err2) {
      updateHUD('🔴 Local Webcam Failed', 'red');
      throw err2;
    }
  }

  // ---------- Detector ----------
  async function setupDetector() {
    try {
      if (window.tf && tf.ready) {
        await tf.ready();
      }
      if (window.tf && tf.getBackend && tf.setBackend) {
        if (tf.getBackend() !== 'webgl') {
          try {
            await tf.setBackend('webgl');
          } catch (e) {}
        }
      }
    } catch (e0) {}

    if (__BD_sharedDetector) {
      detector = __BD_sharedDetector;
      updateHUD('🟢 Detection Ready', 'lime');
      return;
    }

    var model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    detector = await faceLandmarksDetection.createDetector(model, {
      runtime: 'tfjs',
      modelUrl:
        'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection/dist/face_mesh/model.json',
    });

    // Warmup (optional)
    try {
      var dummy = document.createElement('canvas');
      dummy.width = 64;
      dummy.height = 64;
      dummy.getContext('2d').fillRect(0, 0, 64, 64);
      await detector.estimateFaces(dummy);
    } catch (e1) {}

    __BD_sharedDetector = detector;
    updateHUD('🟢 Detection Ready', 'lime');
  }

  // ---------- Overlay Drawing (with cover mapping) ----------
  function drawBoxAndEyes(face, cover, ear, thr, isBlinking, boxW, boxH) {
    if (!overlayCtx || !overlayCanvas) return;
    clearOverlay();

    // Face box
    if (face.box && face.box.xMin != null) {
      var p1 = mapPointToOverlay(face.box.xMin, face.box.yMin, cover);
      var p2 = mapPointToOverlay(face.box.xMax, face.box.yMax, cover);
      var x = Math.floor(p1.x),
        y = Math.floor(p1.y);
      var w = Math.floor(p2.x - p1.x),
        h = Math.floor(p2.y - p1.y);
      overlayCtx.lineWidth = 2;
      overlayCtx.strokeStyle = isBlinking ? 'cyan' : 'lime';
      overlayCtx.strokeRect(x, y, w, h);
    }

    // Eye landmarks
    var kp = face.keypoints || [];
    var leftIdx = [33, 160, 158, 133, 153, 144];
    var rightIdx = [362, 385, 387, 263, 373, 380];

    overlayCtx.fillStyle = isBlinking ? 'cyan' : 'yellow';
    var i, p, q;
    for (i = 0; i < leftIdx.length; i++) {
      p = kp[leftIdx[i]];
      if (!p) continue;
      q = mapPointToOverlay(p.x, p.y, cover);
      overlayCtx.beginPath();
      overlayCtx.arc(q.x, q.y, 2, 0, Math.PI * 2, false);
      overlayCtx.fill();
    }
    for (i = 0; i < rightIdx.length; i++) {
      p = kp[rightIdx[i]];
      if (!p) continue;
      q = mapPointToOverlay(p.x, p.y, cover);
      overlayCtx.beginPath();
      overlayCtx.arc(q.x, q.y, 2, 0, Math.PI * 2, false);
      overlayCtx.fill();
    }

    // Labels
    overlayCtx.font = '12px monospace';
    overlayCtx.fillStyle = isBlinking ? 'cyan' : 'white';
    overlayCtx.fillText(
      'EAR: ' + ear.toFixed(3) + '  Thr: ' + thr.toFixed(3),
      6,
      14
    );
    if (isBlinking) overlayCtx.fillText('BLINK!', 6, 30);
  }

  // ---------- Detection Loop ----------
  async function detectBlinkLoop() {
    updateHUD('🟢 Detecting blinks...', 'lime');
    var smoothEAR = [];
    var SMOOTH = 5;
    var lastBlinkMs = 0;

    while (detecting) {
      try {
        var feed = video || img;
        if (!feed) {
          await sleep(200);
          continue;
        }

        var feedW =
          video && video.videoWidth
            ? video.videoWidth
            : img && img.naturalWidth
            ? img.naturalWidth
            : 0;
        var feedH =
          video && video.videoHeight
            ? video.videoHeight
            : img && img.naturalHeight
            ? img.naturalHeight
            : 0;
        if (!feedW || !feedH) {
          await sleep(60);
          continue;
        }

        resizeOverlayToBox();
        var boxW = overlayCanvas ? overlayCanvas.width : feedW;
        var boxH = overlayCanvas ? overlayCanvas.height : feedH;
        var cover = computeCoverTransform(feedW, feedH, boxW, boxH);

        var faces = await detector.estimateFaces(feed);
        if (faces && faces.length > 0) {
          var face = faces[0],
            kp = face.keypoints;

          var leftEAR = calcEAR(kp, [33, 160, 158, 133, 153, 144]);
          var rightEAR = calcEAR(kp, [362, 385, 387, 263, 373, 380]);
          var ear = (leftEAR + rightEAR) / 2;

          // smoothing
          smoothEAR.push(ear);
          if (smoothEAR.length > SMOOTH) smoothEAR.shift();
          var smoothed =
            smoothEAR.reduce(function (a, b) {
              return a + b;
            }, 0) / smoothEAR.length;
          if (smoothed < 0) smoothed = 0;
          if (smoothed > 1) smoothed = 1;

          // update baseline from open frames
          if (smoothed > blinkSensitivity) {
            baselineSamples.push(smoothed);
            if (baselineSamples.length > BASELINE_WINDOW)
              baselineSamples.shift();
          }
          var baseline = 0;
          if (baselineSamples.length > 4) {
            var sum = 0;
            for (var i = 0; i < baselineSamples.length; i++)
              sum += baselineSamples[i];
            baseline = sum / baselineSamples.length;
          }
          var adaptiveThr = baseline
            ? baseline * adaptiveFactor
            : blinkSensitivity;

          // hysteresis + reopen gating
          if (smoothed < adaptiveThr) {
            closeFrames++;
            openFrames = 0;
          } else {
            openFrames++;
            if (openFrames > MIN_OPEN_FRAMES) closeFrames = 0;
          }

          var now = Date.now();
          var canBlink = now - lastBlinkMs > COOLDOWN_MS;
          var isBlinking = false;
          if (canBlink && closeFrames >= MIN_CLOSE_FRAMES) {
            lastBlinkMs = now;
            isBlinking = true;
            blinkCount++;
            updateHUD('🔵 Blink Detected', 'cyan');
            triggerActions();
            closeFrames = 0;
          } else {
            updateHUD('🟢 Detecting blinks...', 'lime');
          }

          drawBoxAndEyes(
            face,
            cover,
            smoothed,
            adaptiveThr,
            isBlinking,
            boxW,
            boxH
          );
        } else {
          clearOverlay();
          updateHUD('⚪ No face detected', 'gray');
        }
      } catch (err) {
        if (useESP32) scheduleReconnect();
      }
      await sleep(80);
    }
  }

  // ---------- Triggers ----------
  function triggerActions() {
    if (targetSwitch > 0) {
      $gameSwitches.setValue(targetSwitch, true);
      setTimeout(function () {
        $gameSwitches.setValue(targetSwitch, false);
      }, 300);
    }
    if (targetCommonEvent > 0) {
      var ce = $dataCommonEvents[targetCommonEvent];
      if (ce) {
        var interpreter = new Game_Interpreter();
        interpreter.setup(ce.list);
        interpreter.executeCommand();
      }
    }
  }

  // ---------- Start / Stop ----------
  async function startDetection(switchId, commonEventId) {
    if (detecting) return;
    targetSwitch = Number(switchId) || 0;
    targetCommonEvent = Number(commonEventId) || 0;
    detecting = true;
    blinkCount = 0;
    createHUD();
    createPreviewBox();
    updateHUD('🟡 Initializing...', 'yellow');

    try {
      await initCamera();
      await setupDetector();
      detectBlinkLoop();
    } catch (err) {
      updateHUD('❌ Failed to Start', 'red');
      detecting = false;
    }
  }
  function stopDetection() {
    detecting = false;
    cleanupMedia();
    if (hud) {
      try {
        hud.remove();
      } catch (e) {}
    }
    if (previewBox) {
      try {
        previewBox.remove();
      } catch (e2) {}
    }
    previewBox = null;
    overlayCanvas = null;
    overlayCtx = null;
    clearReconnectState();
  }

  // ---------- Plugin Commands ----------
  var _cmd = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _cmd.call(this, command, args);
    if (command === 'BlinkDetector') {
      var sub = args[0];
      if (sub === 'Start') startDetection(args[1], args[2]);
      else if (sub === 'Stop') stopDetection();
    }
  };
})();
