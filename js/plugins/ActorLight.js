/*:
 * @plugindesc Actor Light plugin for side-scrolling games (supports up to 6 custom lights).
 * @help
 *
 * Plugin Commands:
 *  - actorLight [lightName]
 *  - actorLight off
 *
 * Parameters:
 *  - You can define up to 6 custom lights with unique image files.
 *
 *  Example:
 *  - actorLight flashlight (uses light defined in the plugin parameters)
 *  - actorLight off (turns off the actor's light)
 *
 * The plugin supports side-scrolling games, where the light follows the actor.
 *
 * Plugin Parameters (custom lights):
 *  - light1Image: "flashlight" // light1Image file name in img/lights/
 *  - light2Image: "spotlight"  // light2Image file name in img/lights/
 *  - ...
 */

(function () {
  // =================================================================================
  // Plugin Parameters: Configuring up to 6 custom lights with images
  // =================================================================================
  const parameters = PluginManager.parameters('ActorLight');
  const lightImages = [
    String(parameters['light1Image'] || 'flashlight'),
    String(parameters['light2Image'] || 'spotlight'),
    String(parameters['light3Image'] || 'torch'),
    String(parameters['light4Image'] || 'flashlight2'),
    String(parameters['light5Image'] || 'headlight'),
    String(parameters['light6Image'] || 'lantern'),
  ];

  // =================================================================================
  // Creating a Light for the Actor
  // =================================================================================
  Game_CharacterBase.prototype.createLight = function (lightId) {
    if (!this._light) {
      this._light = new Sprite_Light(lightId, this);
      SceneManager._scene.addChild(this._light);
    }
  };

  // Remove the light for the actor
  Game_CharacterBase.prototype.removeLight = function () {
    if (this._light) {
      this._light.remove();
      this._light = null;
    }
  };

  // =================================================================================
  // Light Sprite (draws the light on the actor)
  // =================================================================================
  function Sprite_Light(lightId, character) {
    this.initialize(lightId, character);
  }

  Sprite_Light.prototype = Object.create(Sprite.prototype);
  Sprite_Light.prototype.constructor = Sprite_Light;

  Sprite_Light.prototype.initialize = function (lightId, character) {
    Sprite.prototype.initialize.call(this);

    this._character = character;
    this._lightId = lightId;
    // Get the image file name based on the lightId
    this._lightImage = ImageManager.loadPicture('lights/' + lightId);

    this.bitmap = this._lightImage;
    this.anchor.set(0.5, 0.5); // Center the light image
    this.x = this._character.screenX();
    this.y = this._character.screenY();
    this.opacity = 255; // Light opacity

    this.updatePosition();
  };

  // Update position of the light
  Sprite_Light.prototype.updatePosition = function () {
    this.x = this._character.screenX();
    this.y = this._character.screenY();
  };

  // Update the light position every frame
  const _Sprite_Light_update = Sprite_Light.prototype.update;
  Sprite_Light.prototype.update = function () {
    _Sprite_Light_update.call(this);
    this.updatePosition();
  };

  // Remove the light from the scene
  Sprite_Light.prototype.remove = function () {
    this.parent.removeChild(this);
  };

  // =================================================================================
  // Plugin Command to Trigger Lights
  // =================================================================================
  const _pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _pluginCommand.call(this, command, args);

    if (command === 'actorLight') {
      const actor = $gamePlayer; // Assuming controlling player light

      if (args[0] === 'off') {
        actor.removeLight(); // Turn off light
      } else {
        // Get light ID from parameters (e.g., flashlight)
        const lightId = args[0].toLowerCase();

        // Check if the lightId is a valid light defined in the parameters
        if (lightImages.includes(lightId)) {
          actor.createLight(lightId); // Turn on the specific light
        } else {
          console.error('Invalid lightId: ', lightId); // Log error for invalid lightId
        }
      }
    }
  };
})();
