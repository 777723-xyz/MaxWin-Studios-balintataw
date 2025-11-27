/*:
 * @plugindesc Chalice Puzzle Minigame – chooses 1 of 24 scrambled word images + validates player input.
 * @author ChatGPT
 *
 * @param ChaliceImage
 * @text Chalice Base Image
 * @type file
 * @dir img/pictures
 * @desc Chalice picture that always shows behind the words.
 *
 * @param CorrectImage
 * @text Correct Combination Image
 * @type file
 * @dir img/pictures
 * @desc Image shown when the correct order is typed (Hilom Lunas Dios Luz)
 *
 * @param WordImages
 * @text 24 Possible Word Orders
 * @type file[]
 * @dir img/pictures
 * @desc Add all 24 word-order images here.
 *
 * @param InputImages
 * @text Input Display Images (Optional)
 * @type file[]
 * @dir img/pictures
 * @desc Add images that represent the player's typed sequence (same order as WordImages)
 *
 * @param PictureID_Base
 * @text Picture ID – Chalice
 * @type number
 * @default 1
 * @desc Picture ID used for the chalice.
 *
 * @param PictureID_Words
 * @text Picture ID – Words/Scrambled Image
 * @type number
 * @default 2
 * @desc Picture ID used for the scrambled word image.
 *
 * @param PictureID_Input
 * @text Picture ID – Input Image
 * @type number
 * @default 3
 * @desc Picture ID used for the typed-input image.
 *
 * @param X_Position
 * @text Picture X Position
 * @type number
 * @default 408
 * @desc Horizontal position of the puzzle images.
 *
 * @param Y_Position
 * @text Picture Y Position
 * @type number
 * @default 204
 * @desc Vertical position of the puzzle images.
 *
 * @help
 * ============================================================================
 *              ★    CHALICE PUZZLE – HOW TO USE    ★
 * ============================================================================
 *
 * The player must type the correct 4-word combination:
 *
 *      HILOM LUNAS DIOS LUZ
 *
 * This plugin:
 *   • Shows the chalice base picture
 *   • Randomly selects 1 of 24 scrambled word images
 *   • Accepts keyboard typing from player
 *   • Matches the typed combination to one of the 24 possibilities
 *   • Shows correct/incorrect images automatically
 *
 *
 * ============================================================================
 *                          ★ Plugin Command ★
 * ============================================================================
 *
 *     ChalicePuzzle Start
 *
 * Runs the entire minigame.
 *
 *
 * ============================================================================
 *                     REQUIRED IMAGE NAMING RULE
 * ============================================================================
 *
 * You will assign all 24 scrambled word images inside the plugin parameter:
 *
 *      ➝ WordImages[]
 *
 * The plugin will automatically random-pick one.
 *
 * The input images (typed result) must match the order of WordImages:
 *
 *     WordImages[0]  ↔ InputImages[0]
 *     WordImages[1]  ↔ InputImages[1]
 *     WordImages[2]  ↔ InputImages[2]
 *     ...
 *
 * Optional: If you do not supply InputImages, the plugin will skip showing them.
 *
 *
 * ============================================================================
 *                      CORRECT INPUT STRING (IMPORTANT)
 * ============================================================================
 *
 * PLAYER MUST TYPE **EXACTLY**:
 *
 *          HILOM LUNAS DIOS LUZ
 *
 * Case-insensitive.
 *
 *
 * ============================================================================
 *                            END OF HELP
 * ============================================================================
 */

(function () {
  const params = PluginManager.parameters('ChalicePuzzle');

  const CHALICE = String(params['ChaliceImage'] || '');
  const CORRECT = String(params['CorrectImage'] || '');

  const WORD_IMAGES = JSON.parse(params['WordImages'] || '[]');
  const INPUT_IMAGES = JSON.parse(params['InputImages'] || '[]');

  const PID_BASE = Number(params['PictureID_Base'] || 1);
  const PID_WORDS = Number(params['PictureID_Words'] || 2);
  const PID_INPUT = Number(params['PictureID_Input'] || 3);

  const POS_X = Number(params['X_Position'] || 408);
  const POS_Y = Number(params['Y_Position'] || 204);

  const CORRECT_STRING = 'HILOM LUNAS DIOS LUZ';

  //--------------------------------------------------------------------------
  // ★ Plugin Command
  //--------------------------------------------------------------------------

  const _chalicePluginCmd = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (cmd, args) {
    _chalicePluginCmd.call(this, cmd, args);

    cmd = cmd.toLowerCase();

    if (cmd === 'chalicepuzzle') {
      if (args[0] && args[0].toLowerCase() === 'start') {
        ChalicePuzzle.start();
      }
    }
  };

  //--------------------------------------------------------------------------
  // ★ ChalicePuzzle Namespace
  //--------------------------------------------------------------------------

  const ChalicePuzzle = {
    wordIndex: 0,
    inputString: '',
    solved: false,

    start() {
      this.solved = false;
      this.inputString = '';

      $gameMessage.clear();

      this.wordIndex = Math.floor(Math.random() * WORD_IMAGES.length);

      // Show chalice base
      $gameScreen.showPicture(
        PID_BASE,
        CHALICE,
        0,
        POS_X,
        POS_Y,
        100,
        100,
        255,
        0
      );

      // Show random scrambled words
      const scrambled = WORD_IMAGES[this.wordIndex] || '';
      $gameScreen.showPicture(
        PID_WORDS,
        scrambled,
        0,
        POS_X,
        POS_Y,
        100,
        100,
        255,
        0
      );

      SceneManager.push(Scene_ChalicePuzzle);
    },
  };

  //===========================================================================
  // ★ Scene_ChalicePuzzle  (FIXED VERSION)
  //===========================================================================

  function Scene_ChalicePuzzle() {
    this.initialize(...arguments);
  }

  Scene_ChalicePuzzle.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_ChalicePuzzle.prototype.constructor = Scene_ChalicePuzzle;

  Scene_ChalicePuzzle.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  Scene_ChalicePuzzle.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.createInputWindow();
  };

  Scene_ChalicePuzzle.prototype.start = function () {
    Scene_MenuBase.prototype.start.call(this);
  };

  Scene_ChalicePuzzle.prototype.update = function () {
    Scene_MenuBase.prototype.update.call(this);

    if (ChalicePuzzle.solved) {
      SceneManager.pop();
      // Show correct image
      $gameScreen.showPicture(
        PID_WORDS,
        CORRECT,
        0,
        POS_X,
        POS_Y,
        100,
        100,
        255,
        0
      );
    }
  };

  //---------------------------------------------
  // Create the text input window
  //---------------------------------------------
  Scene_ChalicePuzzle.prototype.createInputWindow = function () {
    const ww = Graphics.width;
    const wh = 80;
    const wx = 0;
    const wy = Graphics.height - wh;

    this._inputWindow = new Window_ChaliceInput(wx, wy, ww, wh);
    this.addWindow(this._inputWindow);
  };

  //--------------------------------------------------------------------------
  // ★ Window_ChaliceInput
  //--------------------------------------------------------------------------

  function Window_ChaliceInput() {
    this.initialize(...arguments);
  }

  Window_ChaliceInput.prototype = Object.create(Window_Base.prototype);
  Window_ChaliceInput.prototype.constructor = Window_ChaliceInput;

  Window_ChaliceInput.prototype.initialize = function (x, y, w, h) {
    Window_Base.prototype.initialize.call(this, x, y, w, h);
    this.refresh();
  };

  Window_ChaliceInput.prototype.refresh = function () {
    this.contents.clear();
    this.drawText(
      'TYPE: ' + ChalicePuzzle.inputString,
      6,
      6,
      this.contents.width
    );
  };

  Window_ChaliceInput.prototype.processHandling = function () {
    if (this.isOpen()) this.processChaliceTyping();
  };

  Window_ChaliceInput.prototype.processChaliceTyping = function () {
    // Collect keys A–Z + SPACE + BACKSPACE
    for (let i = 65; i <= 90; i++) {
      const k = String.fromCharCode(i);
      if (Input.isTriggered(k)) {
        ChalicePuzzle.inputString += k;
        this.refresh();
        this.updatePicturePreview();
      }
    }

    if (Input.isTriggered('space')) {
      ChalicePuzzle.inputString += ' ';
      this.refresh();
      this.updatePicturePreview();
    }

    if (Input.isTriggered('backspace')) {
      ChalicePuzzle.inputString = ChalicePuzzle.inputString.slice(0, -1);
      this.refresh();
      this.updatePicturePreview();
    }

    if (Input.isTriggered('ok')) {
      this.checkAnswer();
    }
  };

  Window_ChaliceInput.prototype.updatePicturePreview = function () {
    if (INPUT_IMAGES.length === 0) return;

    const typed = ChalicePuzzle.inputString.trim().toUpperCase();

    const idx = INPUT_IMAGES.findIndex((img) =>
      img.toUpperCase().includes(typed.replace(/ /g, ''))
    );

    if (idx >= 0) {
      $gameScreen.showPicture(
        PID_INPUT,
        INPUT_IMAGES[idx],
        0,
        POS_X,
        POS_Y + 200,
        100,
        100,
        255,
        0
      );
    } else {
      $gameScreen.erasePicture(PID_INPUT);
    }
  };

  Window_ChaliceInput.prototype.checkAnswer = function () {
    if (ChalicePuzzle.inputString.toUpperCase().trim() === CORRECT_STRING) {
      ChalicePuzzle.solved = true;
    } else {
      SoundManager.playBuzzer();
      ChalicePuzzle.inputString = '';
      $gameScreen.erasePicture(PID_INPUT);
      this.refresh();
    }
  };
})();
