/*:
 * @target MZ MV
 * @plugindesc Shows current mouse X/Y position. Press V to toggle display ON/OFF.
 * @author ChatGPT
 *
 * @help
 * This plugin displays the current mouse cursor position (screen coordinates).
 * Press the "V" key to show or hide the display.
 *
 * No plugin commands.
 */

(function () {
  let showMousePos = false; // toggle state
  let mouseTextSprite = null; // text sprite object

  // Create text sprite
  function createMouseText() {
    const sprite = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    sprite.bitmap.fontSize = 18;
    sprite.z = 9999;
    return sprite;
  }

  // Update mouse text position & content
  function updateMouseText() {
    if (!mouseTextSprite) return;

    const x = TouchInput.x;
    const y = TouchInput.y;

    mouseTextSprite.bitmap.clear();
    if (showMousePos) {
      mouseTextSprite.bitmap.drawText(
        `Mouse: ${x}, ${y}`,
        0,
        0,
        300,
        30,
        'left'
      );
    }
  }

  // Add sprite to the scene
  const _Scene_Map_createDisplayObjects =
    Scene_Map.prototype.createDisplayObjects;
  Scene_Map.prototype.createDisplayObjects = function () {
    _Scene_Map_createDisplayObjects.call(this);
    if (!mouseTextSprite) {
      mouseTextSprite = createMouseText();
      this.addChild(mouseTextSprite);
    }
  };

  // Update every frame
  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _Scene_Map_update.call(this);
    updateMouseText();

    // Toggle with V key
    if (Input.isTriggered('v')) {
      showMousePos = !showMousePos;
    }
  };

  // Add input key V
  const _Input_onKeyDown = Input._onKeyDown;
  Input._onKeyDown = function (event) {
    _Input_onKeyDown.call(this, event);
    if (event.key.toLowerCase() === 'v') {
      this._currentState['v'] = true;
    }
  };

  const _Input_onKeyUp = Input._onKeyUp;
  Input._onKeyUp = function (event) {
    _Input_onKeyUp.call(this, event);
    if (event.key.toLowerCase() === 'v') {
      this._currentState['v'] = false;
    }
  };
})();
