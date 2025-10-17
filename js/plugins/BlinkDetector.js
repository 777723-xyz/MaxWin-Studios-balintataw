/*:
 * @plugindesc Blink Detection v1.3
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
 * BlinkDetector v1.3 (EAR-based)
 * - Stops when on Title screen (camera + HUD off).
 * - Resumes automatically after starting or loading a game.
 * - Keeps camera active across map changes and menus.
 * - Uses WebcamInGame.js if available, else getUserMedia fallback.
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

  // Feed + state
  var video = null;
  var img = null;
  var espReloadInterval = null;
  var __BD_sharedDetector = null;
  var detector = null;
  var detecting = false;
  var targetSwitch = 0;
  var targetCommonEvent = 0;
  var hud = null;
  var blinkCount = 0;

  // UI
  var hudVisible = true;
  var previewVisible = false;
  var previewBox = null;
  var previewVideoEl = null;
  var previewImgEl = null;
  var overlayCanvas = null;
  var overlayCtx = null;

  // ESP32 reconnect
  var reconnectAttempts = 0;
  var maxReconnectAttempts = 12;
  var reconnecting = false;
  var reconnectBaseDelay = 2000;
  var reconnectTimer = null;

  // Detection tuning
  var BASELINE_WINDOW = 40;
  var MIN_CLOSE_FRAMES = 3;
  var COOLDOWN_MS = 350;
  var baselineSamples = [];
  var adaptiveFactor = 0.82;
  var closeFrames = 0;
  var openFrames = 0;
  var MIN_OPEN_FRAMES = 3;

  // --- New state for auto-stop/resume ---
  var _BD_autoStoppedByTitle = false;
  var _BD_lastStartArgs = [0, 0];

  function isTitleScene() {
    return SceneManager && SceneManager._scene instanceof Scene_Title;
  }

  // ---------- Utilities ----------
  function dist(a, b) {
    var dx = a.x - b.x,
      dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function calcEAR(kp, idx) {
    var p1 = kp[idx[0]],
      p2 = kp[idx[1]],
      p3 = kp[idx[2]],
      p4 = kp[idx[3]],
      p5 = kp[idx[4]],
      p6 = kp[idx[5]];
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
    if (SceneManager._scene instanceof Scene_MenuBase)
      hud.style.display = 'none';
    else hud.style.display = 'block';
  }

  // ---------- Preview ----------
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
      overlayCanvas.width = 160;
      overlayCanvas.height = 120;
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
    if (overlayCtx)
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  function attachPreviewFromFeed(feed) {
    var box = previewBox;
    if (!box) createPreviewBox();
    if (box) box.innerHTML = '';
    if (feed && typeof feed.play === 'function') {
      if (!previewVideoEl) {
        previewVideoEl = document.createElement('video');
        previewVideoEl.setAttribute('playsinline', '');
        previewVideoEl.setAttribute('autoplay', '');
        previewVideoEl.muted = true;
        previewVideoEl.style.width = '100%';
        previewVideoEl.style.height = '100%';
        previewVideoEl.style.objectFit = 'cover';
      }
      previewVideoEl.srcObject = feed.srcObject || null;
      try {
        previewVideoEl.play();
      } catch (e) {}
      box.appendChild(previewVideoEl);
    }
    ensureOverlay();
  }

  // ---------- Camera setup ----------
  async function initCamera() {
    cleanupMedia();
    // try getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.muted = true;
      video.style.width = '100%';
      video.style.height = '100%';
      document.body.appendChild(video);
      var stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      video.srcObject = stream;
      try {
        video.play();
      } catch (e) {}
      ensureOverlay();
      resizeOverlayToBox();
      attachPreviewFromFeed(video);
    }
  }

  function cleanupMedia() {
    if (espReloadInterval) clearInterval(espReloadInterval);
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
          for (var i = 0; i < tracks.length; i++) tracks[i].stop();
        }
        video.remove();
      } catch (e) {}
      video = null;
    }
  }

  // ---------- Detector ----------
  async function setupDetector() {
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
    __BD_sharedDetector = detector;
    updateHUD('🟢 Detection Ready', 'lime');
  }

  // ---------- Detection loop ----------
  async function detectBlinkLoop() {
    updateHUD('🟢 Detecting blinks...', 'lime');
    var smoothEAR = [];
    var SMOOTH = 5;
    var lastBlinkMs = 0;
    while (detecting) {
      if (isTitleScene()) {
        await sleep(120);
        continue;
      }
      try {
        var feed = video || img;
        if (!feed) {
          await sleep(200);
          continue;
        }
        var feedW = video ? video.videoWidth : 0;
        var feedH = video ? video.videoHeight : 0;
        if (!feedW || !feedH) {
          await sleep(60);
          continue;
        }
        resizeOverlayToBox();
        var boxW = overlayCanvas.width,
          boxH = overlayCanvas.height;
        var cover = computeCoverTransform(feedW, feedH, boxW, boxH);
        var faces = await detector.estimateFaces(feed);
        if (faces && faces.length > 0) {
          var face = faces[0],
            kp = face.keypoints;
          var leftEAR = calcEAR(kp, [33, 160, 158, 133, 153, 144]);
          var rightEAR = calcEAR(kp, [362, 385, 387, 263, 373, 380]);
          var ear = (leftEAR + rightEAR) / 2;
          smoothEAR.push(ear);
          if (smoothEAR.length > SMOOTH) smoothEAR.shift();
          var smoothed =
            smoothEAR.reduce(function (a, b) {
              return a + b;
            }, 0) / smoothEAR.length;
          if (smoothed > 1) smoothed = 1;
          if (smoothed < 0) smoothed = 0;
          if (smoothed > blinkSensitivity) {
            baselineSamples.push(smoothed);
            if (baselineSamples.length > BASELINE_WINDOW)
              baselineSamples.shift();
          }
          var baseline = 0;
          if (baselineSamples.length > 4) {
            for (var i = 0; i < baselineSamples.length; i++)
              baseline += baselineSamples[i];
            baseline /= baselineSamples.length;
          }
          var thr = baseline ? baseline * adaptiveFactor : blinkSensitivity;
          if (smoothed < thr) {
            closeFrames++;
            openFrames = 0;
          } else {
            openFrames++;
            if (openFrames > MIN_OPEN_FRAMES) closeFrames = 0;
          }
          var now = Date.now(),
            canBlink = now - lastBlinkMs > COOLDOWN_MS,
            isBlink = false;
          if (canBlink && closeFrames >= MIN_CLOSE_FRAMES) {
            lastBlinkMs = now;
            isBlink = true;
            blinkCount++;
            updateHUD('🔵 Blink Detected', 'cyan');
            triggerActions();
            closeFrames = 0;
          } else updateHUD('🟢 Detecting blinks...', 'lime');
          clearOverlay();
          overlayCtx.strokeStyle = isBlink ? 'cyan' : 'lime';
          overlayCtx.lineWidth = 2;
          overlayCtx.strokeRect(4, 4, boxW - 8, boxH - 8);
          overlayCtx.font = '12px monospace';
          overlayCtx.fillStyle = isBlink ? 'cyan' : 'white';
          overlayCtx.fillText(
            'EAR:' + ear.toFixed(3) + ' Thr:' + thr.toFixed(3),
            6,
            14
          );
        } else {
          clearOverlay();
          updateHUD('⚪ No face detected', 'gray');
        }
      } catch (e) {
        await sleep(100);
      }
      await sleep(80);
    }
  }

  // ---------- Trigger ----------
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
        var i = new Game_Interpreter();
        i.setup(ce.list);
        i.executeCommand();
      }
    }
  }

  // ---------- Start / Stop ----------
  async function startDetection(sw, ceid) {
    if (detecting) return;
    targetSwitch = Number(sw) || 0;
    targetCommonEvent = Number(ceid) || 0;
    _BD_lastStartArgs = [targetSwitch, targetCommonEvent];
    detecting = true;
    blinkCount = 0;
    createHUD();
    createPreviewBox();
    updateHUD('🟡 Initializing...', 'yellow');
    try {
      await initCamera();
      await setupDetector();
      detectBlinkLoop();
    } catch (e) {
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
      } catch (e) {}
    }
    hud = null;
    previewBox = null;
    overlayCanvas = null;
    overlayCtx = null;
  }

  // ---------- Scene Management (auto-stop/resume + menu fix) ----------
  (function () {
    var _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function () {
      _SceneManager_updateMain.call(this);
      var scene = this._scene;
      // stop on Title or Boot
      if (scene instanceof Scene_Title || scene instanceof Scene_Boot) {
        if (detecting) {
          _BD_autoStoppedByTitle = true;
          stopDetection();
        }
        return;
      }
      // keep camera alive inside menus
      if (scene instanceof Scene_MenuBase) {
        if (video && !video.srcObject && navigator.mediaDevices) {
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(function (s) {
              video.srcObject = s;
              video.play();
            })
            .catch(function () {});
        }
        return;
      }
      // resume after leaving title
      if (_BD_autoStoppedByTitle && !detecting) {
        _BD_autoStoppedByTitle = false;
        startDetection(_BD_lastStartArgs[0], _BD_lastStartArgs[1]);
      }
    };
  })();

  // ---------- Plugin Command ----------
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
