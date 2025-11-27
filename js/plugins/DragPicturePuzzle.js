/*:
 * @plugindesc Drag & Drop Picture Puzzle (4 draggable images + snapping + glow + reset + CE trigger + delay)
 * @author John Paul Fusin
 *
 * @param Background
 * @type file
 * @dir img/pictures
 * @text Background Image
 *
 * @param Word1
 * @type file
 * @dir img/pictures
 * @text Word Image 1 (first in correct order)
 *
 * @param Word2
 * @type file
 * @dir img/pictures
 * @text Word Image 2
 *
 * @param Word3
 * @type file
 * @dir img/pictures
 * @text Word Image 3
 *
 * @param Word4
 * @type file
 * @dir img/pictures
 * @text Word Image 4 (last in correct order)
 *
 * @param StartX1
 * @type number
 * @default 200
 * @text Starting X for Word 1
 *
 * @param StartX2
 * @type number
 * @default 200
 * @text Starting X for Word 2
 *
 * @param StartX3
 * @type number
 * @default 200
 * @text Starting X for Word 3
 *
 * @param StartX4
 * @type number
 * @default 200
 * @text Starting X for Word 4
 *
 * @param StartY1
 * @type number
 * @default 150
 * @text Starting Y for Word 1
 *
 * @param StartY2
 * @type number
 * @default 250
 * @text Starting Y for Word 2
 *
 * @param StartY3
 * @type number
 * @default 350
 * @text Starting Y for Word 3
 *
 * @param StartY4
 * @type number
 * @default 450
 * @text Starting Y for Word 4
 *
 * @param TargetX1
 * @type number
 * @default 200
 * @text Target X for Word 1
 *
 * @param TargetX2
 * @type number
 * @default 400
 * @text Target X for Word 2
 *
 * @param TargetX3
 * @type number
 * @default 600
 * @text Target X for Word 3
 *
 * @param TargetX4
 * @type number
 * @default 800
 * @text Target X for Word 4
 *
 * @param TargetY
 * @type number
 * @default 400
 * @text Target Y for All Words
 *
 * @param SnapRange
 * @type number
 * @default 50
 * @text Snap Detection Range
 *
 * @param IncorrectSE
 * @type file
 * @dir audio/se
 * @text SE played on incorrect attempt
 *
 * @param GlowStrength
 * @type number
 * @default 64
 * @text Glow Strength On Correct Placement
 *
 * @param SuccessCommonEvent
 * @type common_event
 * @default 0
 * @text Common Event to Trigger on Complete
 *
 * @param SuccessDelay
 * @type number
 * @default 0
 * @text Delay before triggering CE (frames)
 *
 * @help
 * =============================================================================
 * Plugin Command:
 *
 *     DragPuzzle Start
 *
 * ESC or Right-click closes puzzle.
 *
 * Puzzle solved → waits "SuccessDelay" frames → triggers Common Event.
 *
 * Words must be in correct horizontal order:
 *     Word1 → Word2 → Word3 → Word4
 *
 * All must be snapped close enough to target positions to count as correct.
 * =============================================================================
 */

(function () {
  const P = PluginManager.parameters('DragPicturePuzzle');

  const BG = P['Background'] || '';
  const WORDS = [P['Word1'], P['Word2'], P['Word3'], P['Word4']];

  const START_X = [
    Number(P['StartX1']),
    Number(P['StartX2']),
    Number(P['StartX3']),
    Number(P['StartX4']),
  ];
  const START_Y = [
    Number(P['StartY1']),
    Number(P['StartY2']),
    Number(P['StartY3']),
    Number(P['StartY4']),
  ];

  const TARGET_X = [
    Number(P['TargetX1']),
    Number(P['TargetX2']),
    Number(P['TargetX3']),
    Number(P['TargetX4']),
  ];
  const TARGET_Y = Number(P['TargetY']);

  const SNAP = Number(P['SnapRange']);
  const INCORRECT_SE = String(P['IncorrectSE'] || '');
  const GLOW = Number(P['GlowStrength']);
  const CE_ID = Number(P['SuccessCommonEvent'] || 0);
  const DELAY = Number(P['SuccessDelay'] || 0);

  // ----------------------------------------------------------
  // Plugin Command
  // ----------------------------------------------------------

  const _cmd = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (cmd, args) {
    _cmd.call(this, cmd, args);
    if (
      cmd.toLowerCase() === 'dragpuzzle' &&
      args[0].toLowerCase() === 'start'
    ) {
      SceneManager.push(Scene_DragPuzzle);
    }
  };

  // ----------------------------------------------------------
  // Draggable Word Sprite
  // ----------------------------------------------------------

  function Sprite_DragWord() {
    this.initialize(...arguments);
  }
  Sprite_DragWord.prototype = Object.create(Sprite.prototype);
  Sprite_DragWord.prototype.constructor = Sprite_DragWord;

  Sprite_DragWord.prototype.initialize = function (bmp, id) {
    Sprite.prototype.initialize.call(this, bmp);
    this.anchor.set(0.5);
    this._drag = false;
    this._id = id;
  };

  Sprite_DragWord.prototype.update = function () {
    Sprite.prototype.update.call(this);

    if (TouchInput.isTriggered() && this.isInside()) {
      this._drag = true;
    }

    if (this._drag && TouchInput.isPressed()) {
      this.x = TouchInput.x;
      this.y = TouchInput.y;
    }

    if (!TouchInput.isPressed()) {
      if (this._drag) this.trySnap();
      this._drag = false;
    }
  };

  Sprite_DragWord.prototype.trySnap = function () {
    const targetX = TARGET_X[this._id - 1];
    const dx = Math.abs(this.x - targetX);
    const dy = Math.abs(this.y - TARGET_Y);

    if (dx < SNAP && dy < SNAP) {
      this.x = targetX;
      this.y = TARGET_Y;
      this.setGlow(true);
    } else {
      this.setGlow(false);
    }
  };

  Sprite_DragWord.prototype.setGlow = function (active) {
    this.setBlendColor(active ? [255, 255, 150, GLOW] : [0, 0, 0, 0]);
  };

  Sprite_DragWord.prototype.isInside = function () {
    const w = this.width;
    const h = this.height;
    return (
      TouchInput.x > this.x - w / 2 &&
      TouchInput.x < this.x + w / 2 &&
      TouchInput.y > this.y - h / 2 &&
      TouchInput.y < this.y + h / 2
    );
  };

  // ----------------------------------------------------------
  // Puzzle Scene
  // ----------------------------------------------------------

  function Scene_DragPuzzle() {
    this.initialize(...arguments);
  }
  Scene_DragPuzzle.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_DragPuzzle.prototype.constructor = Scene_DragPuzzle;

  Scene_DragPuzzle.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  Scene_DragPuzzle.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);

    // Background
    const bg = ImageManager.loadPicture(BG);
    this._bg = new Sprite(bg);
    this.addChild(this._bg);

    // Words
    this._words = [];
    for (let i = 0; i < 4; i++) {
      const bmp = ImageManager.loadPicture(WORDS[i]);
      const spr = new Sprite_DragWord(bmp, i + 1);
      spr.x = START_X[i];
      spr.y = START_Y[i];
      this._words.push(spr);
      this.addChild(spr);
    }
  };

  // ----------------------------------------------------------
  // Update Scene
  // ----------------------------------------------------------

  Scene_DragPuzzle.prototype.update = function () {
    Scene_MenuBase.prototype.update.call(this);

    // Handle delayed success event
    if (this._successWait && this._successWait > 0) {
      this._successWait--;
      if (this._successWait <= 0) {
        if (CE_ID > 0) $gameTemp.reserveCommonEvent(CE_ID);
        SceneManager.pop();
      }
      return;
    }

    if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
      SceneManager.pop();
      return;
    }

    this.checkSolved();
  };

  // ----------------------------------------------------------
  // Check Puzzle Completion
  // ----------------------------------------------------------

  Scene_DragPuzzle.prototype.checkSolved = function () {
    const sorted = this._words.slice().sort((a, b) => a.x - b.x);

    // Must be correct order 1 → 2 → 3 → 4
    for (let i = 0; i < 4; i++) {
      if (sorted[i]._id !== i + 1) return;
    }

    // Must be snapped to target positions
    for (let i = 0; i < 4; i++) {
      const w = sorted[i];
      const tx = TARGET_X[i];
      const dx = Math.abs(w.x - tx);
      const dy = Math.abs(w.y - TARGET_Y);
      if (dx > SNAP || dy > SNAP) return;
    }

    // ✔ SUCCESS
    SoundManager.playOk();

    if (DELAY > 0) {
      this._successWait = DELAY;
    } else {
      if (CE_ID > 0) $gameTemp.reserveCommonEvent(CE_ID);
      SceneManager.pop();
    }
  };

  // ----------------------------------------------------------
  // Reset Incorrect Attempt
  // ----------------------------------------------------------

  Scene_DragPuzzle.prototype.resetIncorrect = function () {
    if (INCORRECT_SE)
      AudioManager.playSe({ name: INCORRECT_SE, volume: 90, pitch: 100 });

    for (let i = 0; i < 4; i++) {
      const w = this._words[i];

      const originalX = w.x;
      w.x -= 10;

      setTimeout(() => (w.x += 20), 60);
      setTimeout(() => (w.x = originalX), 120);

      setTimeout(() => {
        w.x = START_X[i];
        w.y = START_Y[i];
        w.setGlow(false);
      }, 200);
    }
  };
})();
