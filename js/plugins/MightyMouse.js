//==============================================================================
// Mouse & Touch Function Expansions
// MightyMouse.js
//==============================================================================
/*:
 * @plugindesc v1.3 This script adds missing mouse functions such as hover
 * detection & related event triggering. It also creates drag and drop
 * functionality in-game.
 * also
 * @author Kingpin RBD
 *
 * @param Drag & Drop Maps
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Convert maps drag & drop by default?
 * NO - false     YES - true
 * @default true
 *
 * @param Draggable Objects
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Make objects draggable by default?
 * NO - false     YES - true
 * @default true
 *
 * @param Stackable Objects
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Make dropzones stackable by default?
 * NO - false     YES - true
 * @default false
 *
 * @param Player Draggable
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Make the player draggable by default?
 * NO - false     YES - true
 * @default true
 *
 * @param Vehicles Draggable
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Make vehicles draggable by default?
 * NO - false     YES - true
 * @default true
 *
 * @param Right-click Trigger
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Enable right-click event triggering?
 * NO - false     YES - true
 * @default true
 *
 * @param Middle-click Menu
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Enable opening of Game Menu on middle-button-click?
 * NO - false     YES - true
 * @default true
 *
 * @param Hover Trigger
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Enable event triggering on mouse hover?
 * NO - false     YES - true
 * @default true
 *
 * @param Leave Trigger
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Enable event triggering on mouse leave?
 * NO - false     YES - true
 * @default true
 *
 * @param Center Characters
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Center character images?
 * NO - false     YES - true
 * @default false
 *
 * @param Collision Detection
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Use Image-based Collision Detection?
 * NO - false     YES - true
 * @default true
 *
 * @param Smart Detection
 * @parent ---Options---
 * @type boolean
 * @on YES
 * @off NO
 * @desc Use Smart Detection vs Standard Detection?
 * NO - false     YES - true
 * @default false
 *
 * @help
 * ==============================================================================
 * Information
 * ==============================================================================
 *
 * Note: This script will function with Yanfly's core plugin, but I advise not
 * comboing it with other plugins that modify mouse/touch commands.
 *
 * MightyMouse was created mainly to add missing mouse functions including hover
 * detection & mouse related event triggering(right-click, mouse hover, & mouse
 * leave). It also restricts player click/touch movement to only when clicking
 * empty map space. Though unrelated, it also adds proper image-related
 * collision detection and optionally centers character images to Game_Character
 * based objects including $gamePlayer allowing you to assign big character
 * images to the player, events, and vehicles with automatically adjusted and
 * corrected passibility. Lastly as a totally unique feature, it also provides
 * optional drag and drop functionality to RPG Maker MV.
 *
 * Note: This script also provides touchscreen equivalents to drag and drop
 * functions though they are given untested. Future updates may be able to
 * resolve any reported problems, though in the worst-case scenario it will
 * likely just be removed.
 *
 * ==============================================================================
 * Instructions & Specifications
 * ==============================================================================
 *
 * Drag and Drop
 *
 * By default this script will automatically convert maps alongside the player,
 * events, & vehicles with assigned images into compatible objects. Theoretically
 * any object class that is a child of Game_Character will be given the parameter
 * of being draggable by default and all maps made droppable.
 *
 * Object instances can be made draggable or not by script call. For example:
 *
 * $gamePlayer.draggable = false;
 * $gameMap.event(0).draggable = true;
 * $gameMap.vehicle(0).draggable = false;
 * $gameMap.boat().draggable = false; //Same result as above line
 * AnyGameCharacterObj.draggable = false;
 *
 * Events can also be made draggable by including the tags <draggable> in either
 * its comments or notes section. Draggable objects are assigned unique priority
 * when dropped onto stackable dropzones. Objects with the same priorityType will
 * obtain a higher priority than the last object of that type stacked.
 *
 * In order to create uniquely droppable maps, you first want to disable the
 * 'Drag & Drop Maps' option within the plugin settings. Next, you want to make
 * use of the new function Game_Map.prototype.createDropzone to create custom
 * droppable areas for your map. Example:
 *
 * var newZone = $gameMap.createDropzone(Id, startXtile, startYtile,
 * widthInTiles, heightInTiles, stackableFlag);
 * var myZone = $gameMap.createDropzone('Zone001', 12, 11, 3, 3, true); //Example
 *
 * The above code would create a stackable 3x3 tile dropzone within the current
 * map occupying the coordinates[(12, 11),(13, 12),(14, 13),(12, 11),(13, 12),
 * (14, 13),(12, 11),(13, 12),(14, 13)] and assign it a unique ID of 'Zone001'.
 * The stackableFlag can be omitted. Doing so will default the value to that of
 * the 'Stackable Objects' plugin option. By default anything successfully
 * dropped into a dropzone will adjust to its center-most tile. I recommend odd
 * numbered width & height specifications to more easily keep track of where
 * objects will land. Larger than 1x1 size dropzones just provide the option of
 * dropping in let's say a corner of a zone & having it auto-correct, though 1x1
 * tile-sized zones will suit most scenarios fine. You would simply have to be
 * more precise on drops.
 *
 * You can also assign dropzones images and animations like any other
 * Game_CharacterBase object. This should enable you to assign them drop-state
 * related images and animations. This feature was added with boardgames in
 * mind. Thought it might be useful to be able to change/assign an image or
 * play an animation on a successful collision, drag, or drop in cases of things
 * like trap activations or related status effects & buffs taking affect. Some
 * script call examples:
 *
 * $gameMap.dropzones[id].setImage(charName, charIndex);
 * $gameMap.dropzones[id].requestAnimation(animationId);
 *
 * Character images can be made centered by setting an object's .center value to
 * true. Character images are not centered by default. Events can also be set
 * as centered by including the tag <center> in either its comments or notes
 * section.
 *
 * New Event Triggers
 *
 * Right-click - Right-clicks are now exclusive to activating events. Disabling
 * the Right-click Trigger option will simply disable right-clicks entirely.
 *
 * HoverStart - In order to make an events activate on mouse hover, include the
 * tag <hoverStart> within either its comments or notes section. Leaving the tag
 * in page comments will allow for page specific triggers per page.
 *
 * LeaveStart - In order to make an event activate on mouse leave, include the
 * tag <leaveStart> within either its comments or notes section. Leaving the tag
 * in page comments will allow for page specific triggers per page.
 *
 * ==============================================================================
 * Version Changes
 * ==============================================================================
 *
 * v1.1
 *
 * - Major & Minor bug fixes & QoL changes to the image-based collision detection
 *   feature & also made it semi-optional. It works primarily the same as before.
 *
 * - Disabling the Collision Detection plugin option will make the the game use
 *  the standard collision detection method for objects (Game_Character). That
 *  basically means that all objects will only occupy one map tile regardless of
 *  it's image-size (Big Characters too). This is useful for drag & drop games
 *  that utilize sprites in close proximity.
 *
 *
 * v1.11
 *
 * - Resolved an issue where script calls could not change values properly.
 *
 * - Made a tweak to centering to make it's effect apply sooner.
 *
 *
 * v1.13
 *
 * - Added proper detection for when the mouse is or is not inside the game
 * screen. The function Graphics.isInsideCanvas appears to always return true
 * even when the mouse is out of bounds so I replaced this script's dependencies
 * on it. If you want to reference whether the mouse is off-screen or not use the
 * function TouchInput.isOffScreen(). For example:
 *
 * if (TouchInput.isOffScreen) {pauseGameClock();}
 * if (!TouchInput.isOffScreen) {resumeGameClock();}
 *
 * Resolved an oversight that allowed the detection of objects with no image as
 * valid objects. Remember that you can create a transparent image & use that to
 * make an invisible object interactive if you need it to be.
 *
 *
 * v1.15
 *
 * - Major/minor bug fixes & improvements.
 *
 * - Applied the default right-click behavior to middle-clicks so the game menu
 * is now able to be opened by clicking the middle-button on your mouse. See
 * Plugin Options.
 *
 * - Fixed custom dropzone application. They can now be implemented after game
 * launch by script calls & their sprites will still update with the scene. This
 * previously wasn't the case.
 *
 * - The free version of this script no longer provides functions for handling
 * dropzone sprites. They can be managed like any other sprite though by
 * referencing $gameMap.dropzones[id]._sprite and using Sprite_Character related
 * functions.
 *
 *
 * v1.17
 *
 * - Bug/compatibility issue fixes for RPGMV version 1.6.2
 *
 * - Added Game_Map function 'findDropzone(x, y)'. This function uses the
 * given parameters to find & return the corresponding dropzone. This can be used
 * to interact with specific dropzones through script calls.
 *
 * //An example of how to store a dropzone & reference it's first held object
 * var myDropzone = $gameMap.findDropzone(2, 6);
 * var heldObject1 = myDropzone.object(0);
 *
 * - Added basic dropzone function 'setReaction(commonEventId)'. This function
 * accepts a common event ID as its parameter which will be used to run the
 * corresponding common event immediately after a successful drop.
 *
 * //An example of modifying specific dropzones to react uniquely to a drop
 * var myDropzone1 = $gameMap.findDropzone(2, 4);
 * myDropzone1.setReaction(1);
 * var myDropzone2 = $gameMap.findDropzone(4, 2);
 * myDropzone2.setReaction(3);
 *
 * - To resolve a bug related to saving in-game, I had to modify the way dropzones
 * handle their sprite but they still have them so you can still change their
 * imagaes & play animations on them. You reference the sprite with the dropzone
 * function 'sprite' now. Everything else works the same as far as that.
 *
 *
 * v1.19
 *
 * - Enabled so that disabling drag & drop now allows event triggering by
 * left-click. This can be used in tandem with right-click triggering if desired.
 *
 * - Enabled it so that disabling right-click triggering will enable right-click
 * menu access/cancelling as it is when disabling MightyMouse.
 *
 *
 * v1.2
 *
 * - Added an event tag <playerClick> which when left in an event's comment
 * section or note section will cause an event to only trigger when mouse clicked
 * while the player is both next to & facing the event.
 *
 * v1.21
 *
 * - Resolved an issue that caused characters to ignore the "passable under the
 * tile" flag of specific tiles. Character objects will now pass under those
 * tiles when standing on top of them as before.
 *
 * v1.23
 *
 * - Added an event tag <invalid> which when placed in an event's comment section
 * or note section will cause an event to not be detected by the drag & drop
 * system.
 *
 * Note: This tag is essentially the opposite of the <draggable> tag & it will
 * override that tag when used. It basically adds an alternative way of only
 * restricting certain events from being draggable whereas <draggable> enables
 * only certain events to be draggable.
 *
 * Side-Note: In the exclusive version of Mighty Mouse, this tag also hides the
 * event from mouse detection so the cursor won't react to it.
 *
 * Important: Invalid objects will be treated as not there so they can & will be
 * stacked upon by valid objects automatically. This is great for system events.
 *
 * - Added a plugin option for enabling/disabling player detection by the drag &
 * drop system. In case you need the player to be ignored by drag & drop for
 * whatever reason.
 *
 * - Added a plugin option for enabling/disabling vehicle detection by the drag &
 * drop system.
 *
 * v1.25
 *
 * - Tweaked collision detection for more consistent results.
 *
 * - Added a plugin option for switching the type of collision detection used
 * between standard & smart detection. Both versions attempt to make tile
 * passability around objects more ascetic & realistic. The option has no effect
 * if collision detection is turned off.
 *
 * Note: "Standard" attempts to stick more closely to image dimensions as a
 * guideline while "smart" tweaks the formula a bit to let objects pass by a bit
 * closer vertically which can end up looking really nice which some images. Pair
 * these with either the "Center Characters" option or the <center> event tag to
 * pull off some nice passing effects.
 *
 * v1.27
 *
 * - Critcal bug fixes & updates.
 *
 * - Updated a few variable & function names to match changes made in the premium
 * version a while back that were overlooked for the free version moving forward.
 *
 * v1.29
 *
 * - Autonomous movement & stepping are now paused while an event is being
 * dragged.
 *
 * - Objects can no longer be dropped on impassable tiles.
 *
 * v1.3
 *
 * - Changed versioning scheme moving forward.
 *
 * - Improved hover detection to account for events that are no longer in range
 * due to autonomous movement. Note: This may produce some lag on lower-end PCs.
 *
 * ==============================================================================
 */
//==============================================================================

//==============================================================================
// Paramaters
//==============================================================================

var MightyMouse = {};
MightyMouse.Parameters = PluginManager.parameters('MightyMouse');
MightyMouse.Settings = {};
MightyMouse.Settings.DragAndDrop = eval(
  String(MightyMouse.Parameters['Drag & Drop Maps'])
);
MightyMouse.Settings.AllDraggable = eval(
  String(MightyMouse.Parameters['Draggable Objects'])
);
MightyMouse.Settings.AllStackable = eval(
  String(MightyMouse.Parameters['Stackable Objects'])
);
MightyMouse.Settings.PlayerDrag = eval(
  String(MightyMouse.Parameters['Player Draggable'])
);
MightyMouse.Settings.VehiclesDrag = eval(
  String(MightyMouse.Parameters['Vehicles Draggable'])
);
MightyMouse.Settings.Right_click = eval(
  String(MightyMouse.Parameters['Right-click Trigger'])
);
MightyMouse.Settings.Middle_click = eval(
  String(MightyMouse.Parameters['Middle-click Menu'])
);
MightyMouse.Settings.HoverStart = eval(
  String(MightyMouse.Parameters['Hover Trigger'])
);
MightyMouse.Settings.LeaveStart = eval(
  String(MightyMouse.Parameters['Leave Trigger'])
);
MightyMouse.Settings.CenterCharacters = eval(
  String(MightyMouse.Parameters['Center Characters'])
);
MightyMouse.Settings.CollisionDetection = eval(
  String(MightyMouse.Parameters['Collision Detection'])
);
MightyMouse.Settings.SmartDetection = eval(
  String(MightyMouse.Parameters['Smart Detection'])
);

/**
 * Event Tags
 */

MightyMouse.HoverTag = '<hoverStart>';
MightyMouse.LeaveTag = '<leaveStart>';
MightyMouse.DragTag = '<draggable>';
MightyMouse.CenterTag = '<center>';
MightyMouse.PlayerClickTag = '<playerClick>';
MightyMouse.InvalidTag = '<invalid>';
MightyMouse.ClickableTag = '<clickable>';

/**
 * Reads Comments from event pages.
 */

MightyMouse.tagReader = function (pageListObject) {
  var comments =
    pageListObject.code == 108 || pageListObject.code == 408 ? true : false;
  return comments;
};

/**
 * Searches an active game_event's Comments or Notes sections for tags
 */

MightyMouse.eventReader = function (game_event, tag, action) {
  if (!game_event.page()) {
    return false;
  }
  var comments = game_event.list().filter(this.tagReader);
  var result = null;
  var match = false;
  var matchInString = function (string) {
    result = string.match(tag);
    if (result !== null) {
      match = true;
    }
  };
  //Check Comments section first
  if (comments.length > 0) {
    comments.forEach(function (comment) {
      if (match) return;
      matchInString(comment.parameters[0]);
    });
  }
  // Check Notes section last
  if (!match) {
    if (game_event.event().note) {
      matchInString(game_event.event().note);
    }
  }
  if (match) {
    action.call(game_event, result);
  }
};

//==============================================================================
// TouchInput
//==============================================================================

/**
 * Aliases and redefines various TouchInput components to allow for hover
 * detection, hover & right-click event triggering, as well as drag and drop.
 * Note :Touch function equivalents are included but untested. Theoretically it
 * should work fine.
 */

var _TouchInput_initialize = TouchInput.initialize;
TouchInput.initialize = function () {
  _TouchInput_initialize.call(this);
};

var _TouchInput_clear = TouchInput.clear;
TouchInput.clear = function () {
  _TouchInput_clear.call(this);
  this._prevX = 0;
  this._prevY = 0;
  this._hovering = false;
  this._holding = false;
  this._dragging = false;
  this._outbound = false;
  this._targetZone = null;
  this._target = null;
  this._objects = [];
  this.updateHovering();
};

var _TouchInput_setupEventHandlers = TouchInput._setupEventHandlers;
TouchInput._setupEventHandlers = function () {
  _TouchInput_setupEventHandlers.call(this);
  window.document.addEventListener('mouseleave', function () {
    TouchInput._outbound = true;
  });
  window.document.addEventListener('mouseenter', function () {
    TouchInput._outbound = false;
  });
};

/**
 * Do not alias this function more than once. Doing so will likely create call stack errors.
 * If you need to, re-write it by copying the entire code block & modifying/adding to it.
 */
TouchInput.update = function () {
  if (this.isOffScreen()) {
    if (document.body.style.cursor !== '') {
      document.body.style.cursor = '';
    }
  }
  this._triggered = this._events.triggered;
  this._cancelled = this._events.cancelled;
  this._moved = this._events.moved;
  this._released = this._events.released;
  this._wheelX = this._events.wheelX;
  this._wheelY = this._events.wheelY;
  this._events.triggered = false;
  this._events.cancelled = false;
  this._events.moved = false;
  this._events.released = false;
  this._events.wheelX = 0;
  this._events.wheelY = 0;
  if (this.isPressed()) {
    this._pressedTime++;
  }
  this.updateHovering();
  if (
    SceneManager._scene &&
    SceneManager._scene.constructor === Scene_Map &&
    SceneManager._scene._active
  ) {
    this._objects = this._objects.filter(function (obj) {
      return obj && obj.checkHover();
    });
    if (this._objects.length > 0) {
      this._objects.sort(function (a, b) {
        return b._priority - a._priority;
      });
    }
  }
};

TouchInput.mapX = function () {
  return Math.floor(this._x / 48);
};

TouchInput.mapY = function () {
  return Math.floor(this._y / 48);
};

TouchInput.prevX = function () {
  return Math.floor(this._prevX / 48);
};

TouchInput.prevY = function () {
  return Math.floor(this._prevY / 48);
};

TouchInput.isHovering = function () {
  return this._hovering;
};

TouchInput.isHolding = function () {
  return this._holding;
};

TouchInput.isDragging = function () {
  return this._dragging;
};

TouchInput.isOffScreen = function () {
  return this._outbound;
};

TouchInput.getTargetZone = function () {
  return this._targetZone;
};

TouchInput.overObject = function () {
  var objects = [];
  if (!SceneManager._scene) {
    return false;
  }
  if (
    SceneManager._scene.constructor === Scene_Map &&
    SceneManager._scene._active
  ) {
    for (var i = 0; i < $gameMap.events().length; i++) {
      if ($gameMap.events()[i].checkHover()) {
        if (this._target) {
          if ($gameMap.events()[i] !== this._target) {
            if (
              $gameMap.events()[i]._characterName === '' ||
              $gameMap.events()[i]._invalid
            ) {
              continue;
            }
            objects.push($gameMap.events()[i]);
          }
        } else {
          if (
            $gameMap.events()[i]._characterName === '' ||
            $gameMap.events()[i]._invalid
          ) {
            continue;
          }
          objects.push($gameMap.events()[i]);
        }
      }
    }
    for (var j = 0; j < $gameMap.vehicles.length; j++) {
      if ($gameMap.vehicles()[j].checkHover()) {
        if (this._target) {
          if ($gameMap.vehicles()[j] !== this._target) {
            if (
              $gameMap.vehicles()[j]._characterName === '' ||
              $gameMap.vehicles()[j]._invalid
            ) {
              continue;
            }
            objects.push($gameMap.vehicles()[j]);
          }
        } else {
          if (
            $gameMap.vehicles()[j]._characterName === '' ||
            $gameMap.vehicles()[j]._invalid
          ) {
            continue;
          }
          objects.push($gameMap.vehicles()[j]);
        }
      }
    }
    if ($gamePlayer.checkHover()) {
      if (this._target) {
        if ($gamePlayer !== this._target) {
          if ($gamePlayer._characterName !== '' || $gamePlayer._invalid) {
            objects.push($gamePlayer);
          }
        }
      } else {
        if ($gamePlayer._characterName !== '' || $gamePlayer._invalid) {
          objects.push($gamePlayer);
        }
      }
    }
    this._objects = objects.filter(function (obj) {
      return true;
    });
    if (this._objects.length > 0) {
      return true;
    }
    return false;
  }
};

TouchInput.updateHovering = function () {
  if (!this.isOffScreen()) {
    if (this.overObject()) {
      this._hovering = true;
      this._dragging = false;
    } else {
      this._hovering = false;
    }
  }
};

TouchInput.updateTargetZone = function () {
  if (!this.isOffScreen()) {
    for (var i = 0; i < $gameMap.dropzones.length; i++) {
      if ($gameMap.dropzones[i].checkCoordinates(this.mapX(), this.mapY())) {
        if (!$gameMap.dropzones[i].check()) {
          this._targetZone = null;
          return;
        }
        this._targetZone = $gameMap.dropzones[i];
        return;
      }
      this._targetZone = null;
    }
  }
};

TouchInput.grabTarget = function (event) {
  if (this._objects.length < 1) {
    return;
  }
  var targets = this._objects.filter(function (obj) {
    return obj.draggable;
  }, this);
  if (targets.length < 1) {
    return;
  }
  this._mousePressed = true;
  this._pressedTime = 0;
  this._holding = true;
  targets.sort(function (a, b) {
    return b.priority - a.priority;
  });
  targets.sort(function (a, b) {
    return b._priorityType - a._priorityType;
  });
  this._target = targets[0];
  this._target._initialX = this._target._x;
  this._target._initialY = this._target._y;
  this._target._oldDirFix = this._target._directionFix;
  this._target._oldThrough = this._target._through;
  this._target._oldOpacity = this._target._opacity;
  this._target._oldMoveSpeed = this._target._moveSpeed;
  this._target._oldStepAnime = this._target._stepAnime;
  if (this._target._moveType !== undefined) {
    this._target._oldMoveType = this._target._moveType;
    this._target._moveType = 0;
  }
  this._target._directionFix = true;
  this._target._through = true;
  this._target._opacity = 100;
  this._target._moveSpeed = 8;
  this._target._stepAnime = false;
  this._target.setPosition(this.mapX(), this.mapY());
};

TouchInput.activateEvent = function () {
  for (var i = 0; i < $gameMap.events().length; i++) {
    var ev = $gameMap.events()[i];

    // Must have <clickable> tag
    if (!ev._clickable) continue;

    // Must be under the mouse
    if (ev.checkHover()) {
      // Standard event trigger
      if (ev._trigger === 0) {
        ev.start();
        return;

        // <playerClick> tag trigger
      } else if (ev._trigger === 7) {
        if ($gamePlayer.isInRange(ev)) {
          ev.start();
          return;
        }
      }
    }
  }
};

TouchInput._onLeftButtonDown = function (event) {
  var x = Graphics.pageToCanvasX(event.pageX);
  var y = Graphics.pageToCanvasY(event.pageY);
  if (!this.isOffScreen()) {
    this._mousePressed = true;
    this._pressedTime = 0;
    if (this.overObject() && !$gameMessage.isBusy()) {
      if (MightyMouse.Settings.DragAndDrop) {
        this.grabTarget(event);
        this.updateTargetZone();
        return;
      } else {
        this.activateEvent();
      }
    }
    this._target = null;
    this._onTrigger(x, y);
  }
};

TouchInput._onRightButtonDown = function (event) {
  var x = Graphics.pageToCanvasX(event.pageX);
  var y = Graphics.pageToCanvasY(event.pageY);
  if (!this.isOffScreen()) {
    this._mousePressed = true;
    this._pressedTime = 0;
    if (MightyMouse.Settings.Right_click) {
      if (this.overObject() && !$gameMessage.isBusy()) {
        this.activateEvent();
      }
    } else {
      this._onCancel(x, y);
    }
  }
};

TouchInput._onMiddleButtonDown = function (event) {
  var x = Graphics.pageToCanvasX(event.pageX);
  var y = Graphics.pageToCanvasY(event.pageY);
  if (!this.isOffScreen()) {
    if (MightyMouse.Settings.Middle_click) {
      this._onCancel(x, y);
    }
  }
};

TouchInput._onMouseMove = function (event) {
  if (!this.isHolding()) {
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    this._onMove(x, y);
    if (MightyMouse.Settings.HoverStart) {
      if (this.overObject()) {
        this.onMouseHover();
      }
    }
    if (MightyMouse.Settings.LeaveStart) {
      if (!this.overObject()) {
        this.onMouseLeave();
      }
    }
  } else if (this.isHolding()) {
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    this._onDrag(x, y);
    this.updateTargetZone();
  }
};

TouchInput._onMouseUp = function (event) {
  if (event.button === 0) {
    if (!this.isHolding()) {
      var x = Graphics.pageToCanvasX(event.pageX);
      var y = Graphics.pageToCanvasY(event.pageY);
      this._mousePressed = false;
      this._onRelease(x, y);
    } else if (this.isHolding()) {
      var x = Graphics.pageToCanvasX(event.pageX);
      var y = Graphics.pageToCanvasY(event.pageY);
      this._mousePressed = false;
      this._onDrop(x, y);
      this._holding = false;
    }
  } else if (event.button === 2) {
    var x = Graphics.pageToCanvasX(event.pageX);
    var y = Graphics.pageToCanvasY(event.pageY);
    this._mousePressed = false;
    this._onRelease(x, y);
  }
};

TouchInput._onTouchStart = function (event) {
  for (var i = 0; i < event.changedTouches.length; i++) {
    var touch = event.changedTouches[i];
    var x = Graphics.pageToCanvasX(touch.pageX);
    var y = Graphics.pageToCanvasY(touch.pageY);
    if (Graphics.isInsideCanvas(x, y)) {
      this._screenPressed = true;
      this._pressedTime = 0;
      if (event.touches.length >= 2) {
        if (this.overObject()) {
          this.grabTarget();
          if (this._target) {
            this.updateTargetZone();
            this._holding = true;
            return;
          } else {
            this._holding = false;
            return;
          }
        }
      } else {
        if (this.overObject()) {
          this.activateEvent();
        } else {
          this._target = null;
          this._onTrigger(x, y);
        }
        event.preventDefault();
      }
    }
  }
};

TouchInput._onTouchMove = function (event) {
  for (var i = 0; i < event.changedTouches.length; i++) {
    if (this.isHolding()) {
      var touch = event.changedTouches[i];
      var x = Graphics.pageToCanvasX(touch.pageX);
      var y = Graphics.pageToCanvasY(touch.pageY);
      this._onDrag(x, y);
      this.updateTargetZone();
    } else {
      var touch = event.changedTouches[i];
      var x = Graphics.pageToCanvasX(touch.pageX);
      var y = Graphics.pageToCanvasY(touch.pageY);
      this._onMove(x, y);
    }
  }
};

TouchInput._onTouchEnd = function (event) {
  for (var i = 0; i < event.changedTouches.length; i++) {
    if (this.isHolding()) {
      var touch = event.changedTouches[i];
      var x = Graphics.pageToCanvasX(touch.pageX);
      var y = Graphics.pageToCanvasY(touch.pageY);
      this._screenPressed = false;
      this._onDrop(x, y);
      this._holding = false;
    } else {
      var touch = event.changedTouches[i];
      var x = Graphics.pageToCanvasX(touch.pageX);
      var y = Graphics.pageToCanvasY(touch.pageY);
      this._screenPressed = false;
      this._onRelease(x, y);
    }
  }
};

TouchInput.onMouseHover = function () {
  if (!SceneManager._scene) {
    return;
  }
  if (
    SceneManager._scene.constructor === Scene_Map &&
    SceneManager._scene._active
  ) {
    for (var i = 0; i < $gameMap.events().length; i++) {
      if ($gameMap.events()[i].checkHover() && !$gameMessage.isBusy()) {
        if (
          $gameMap.events()[i].hoverStart &&
          !$gameMap.events()[i].triggered
        ) {
          $gameMap.events()[i].start();
          $gameMap.events()[i].triggered = true;
        } else if (
          $gameMap.events()[i].leaveStart &&
          !$gameMap.events()[i].triggered
        ) {
          $gameMap.events()[i].triggered = true;
        }
      } else if ($gameMap.events()[i].checkLeave() && !$gameMessage.isBusy()) {
        if ($gameMap.events()[i].hoverStart && $gameMap.events()[i].triggered) {
          $gameMap.events()[i].triggered = false;
        } else if (
          $gameMap.events()[i].leaveStart &&
          $gameMap.events()[i].triggered
        ) {
          $gameMap.events()[i].start();
          $gameMap.events()[i].triggered = false;
        }
      }
    }
  }
};

TouchInput.onMouseLeave = function () {
  if (!SceneManager._scene) {
    return;
  }
  if (
    SceneManager._scene.constructor === Scene_Map &&
    SceneManager._scene._active
  ) {
    for (var i = 0; i < $gameMap.events().length; i++) {
      if ($gameMap.events()[i].checkLeave() && !$gameMessage.isBusy()) {
        if ($gameMap.events()[i].leaveStart && $gameMap.events()[i].triggered) {
          $gameMap.events()[i].start();
          $gameMap.events()[i].triggered = false;
        } else if (
          $gameMap.events()[i].hoverStart &&
          $gameMap.events()[i].triggered
        ) {
          $gameMap.events()[i].triggered = false;
        }
      }
    }
  }
};

TouchInput._onMove = function (x, y) {
  this._events.moved = true;
  this._prevX = this._x;
  this._prevY = this._y;
  this._x = x;
  this._y = y;
};

TouchInput._onDrag = function (x, y) {
  this._dragging = true;
  this._prevX = this._x;
  this._prevY = this._y;
  this._x = x;
  this._y = y;
  this._target.drag();
};

TouchInput._onDrop = function (x, y) {
  this._dragging = false;
  this._x = x;
  this._y = y;
  this._target.drop();
};

TouchInput._onClick = function (x, y) {
  this._events.triggered = true;
  this._x = x;
  this._y = y;
  this._date = Date.now();
};

//==============================================================================
// Game_CharacterBase
//==============================================================================

/**
 * Image-related collision detection changes
 */

var _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
Game_CharacterBase.prototype.initMembers = function () {
  _Game_CharacterBase_initMembers.call(this);
  this._priority = 0;
  this._dimensions = { x: 0, y: 0, z: 0 }; //used for internal calculations
  this._coordinates = { x: [], y: [] }; //used to keep track of the location of large/multi-tile objects
  this._projCoords = { x: [], y: [] }; //used to determine passability against of large/multi-tile objects
};

var _Game_CharacterBase_setPosition = Game_CharacterBase.prototype.setPosition;
Game_CharacterBase.prototype.setPosition = function (x, y) {
  _Game_CharacterBase_setPosition.call(this, x, y);
  this.updateCoordinates();
};

Game_CharacterBase.prototype.addPriority = function (value) {
  this._priority += Number(value);
};

Game_CharacterBase.prototype.setPriority = function (value) {
  this._priority = this._priorityType * 500 + 1 + Number(value);
};

Game_CharacterBase.prototype.getPriority = function () {
  return this._priorityType * 500 + 1 + this._priority;
};

/**
 * Calculates how much space the object occupies
 */

Game_CharacterBase.prototype.updateDimensions = function () {
  if (this._characterName === '') {
    this._dimensions = { x: 0, y: 0, z: 0 };
    return;
  }
  if (!MightyMouse.Settings.CollisionDetection) {
    this._dimensions = { x: 1, y: 1, z: this._priorityType };
    return;
  }
  var x_factor = 0;
  var y_factor = 0;
  var bitmap = ImageManager.loadCharacter(this._characterName);
  this._isBigCharacter = ImageManager.isBigCharacter(this._characterName);
  if (this._isBigCharacter) {
    var imgWidth = bitmap.width / 3;
    var imgHeight = bitmap.height / 4;
  } else {
    var imgWidth = bitmap.width / 12;
    var imgHeight = bitmap.height / 8;
  }
  x_factor =
    Math.floor((imgWidth - $gameMap.tileWidth()) / 2 / $gameMap.tileWidth()) *
    2;
  if (MightyMouse.Settings.SmartDetection) {
    y_factor =
      Math.floor(
        (imgHeight - $gameMap.tileHeight()) / 2 / $gameMap.tileHeight()
      ) * 2;
  } else {
    y_factor = Math.floor(imgHeight / $gameMap.tileHeight()) - 1;
  }
  this._dimensions.x = x_factor + 1;
  this._dimensions.y = y_factor + 1;
  this._dimensions.z = this.getPriority();
};

Game_CharacterBase.prototype.updateCoordinates = function () {
  if (this._characterName === '') {
    this._coordinates = { x: [this._x], y: [this._y] };
    return;
  }
  this._coordinates = { x: [], y: [] };
  this.updateDimensions();
  var sizeX = this._dimensions.x;
  var sizeY = this._dimensions.y;
  if (sizeX % 2 === 0) {
    if (this.isCentered()) {
      sizeX -= 1;
    } else {
      sizeX += 1;
    }
  }
  if (sizeY % 2 === 0) {
    if (this.isCentered()) {
      sizeY -= 1;
    }
  }
  var x_factor = 0;
  var y_factor = 0;
  x_factor = -Math.floor(sizeX / 2);
  if (this.isCentered()) {
    y_factor = -Math.floor(sizeY / 2);
  } else {
    y_factor = -(sizeY - 1);
  }
  for (var i = 0; i < sizeX; i++) {
    this._coordinates.x.push(this._x + x_factor);
    x_factor++;
  }
  for (var j = 0; j < sizeY; j++) {
    this._coordinates.y.push(this._y + y_factor);
    y_factor++;
  }
};

Game_CharacterBase.prototype.estimate = function (dir) {
  if (this._characterName === '') {
    this._projCoords = {
      x: [$gameMap.roundXWithDirection(this._x, dir)],
      y: [$gameMap.roundYWithDirection(this._y, dir)],
    };
    return;
  }
  this._projCoords = { x: [], y: [] };
  this.updateDimensions();
  var sizeX = this._dimensions.x;
  var sizeY = this._dimensions.y;
  if (sizeX % 2 === 0) {
    if (this.isCentered()) {
      sizeX -= 1;
    } else {
      sizeX += 1;
    }
  }
  if (sizeY % 2 === 0) {
    if (this.isCentered()) {
      sizeY -= 1;
    }
  }
  var x_factor = 0;
  var y_factor = 0;
  x_factor = -Math.floor(sizeX / 2);
  if (this.isCentered()) {
    y_factor = -Math.floor(sizeY / 2);
  } else {
    y_factor = -(sizeY - 1);
  }
  for (var i = 0; i < sizeX; i++) {
    this._projCoords.x.push(
      $gameMap.roundXWithDirection(this._x, dir) + x_factor
    );
    x_factor++;
  }
  for (var j = 0; j < sizeY; j++) {
    this._projCoords.y.push(
      $gameMap.roundYWithDirection(this._y, dir) + y_factor
    );
    y_factor++;
  }
};

Game_CharacterBase.prototype.checkCollision = function (x, y) {
  this.updateCoordinates();
  var maxX = this._coordinates.x.length - 1;
  var maxY = this._coordinates.y.length - 1;
  return (
    x >= this._coordinates.x[0] &&
    x <= this._coordinates.x[maxX] &&
    y >= this._coordinates.y[0] &&
    y <= this._coordinates.y[maxY]
  );
};

Game_CharacterBase.prototype.isCollidedWithCharacters = function () {
  var x = this._coordinates.x;
  var y = this._coordinates.y;
  for (var i = 0; i < y.length; i++) {
    for (var j = 0; j < x.length; j++) {
      for (var k = 0; k < $gameMap.events().length; k++) {
        if ($gameMap.events()[k].checkCollision(x[j], y[i])) {
          if (
            $gameMap.events()[k] === this ||
            $gameMap.events()[k].isThrough() ||
            $gameMap.events()[k]._characterName === '' ||
            $gameMap.events()[k]._invalid
          ) {
            continue;
          }
          return true;
        }
      }
      for (var l = 0; l < $gameMap.vehicles.length; l++) {
        if ($gameMap.vehicles()[l].checkCollision(x[j], y[i])) {
          if (
            $gameMap.vehicles()[l] === this ||
            $gameMap.vehicles()[l].isThrough() ||
            $gameMap.vehicles()[l]._characterName === '' ||
            $gameMap.vehicles()[l]._invalid
          ) {
            continue;
          }
          return true;
        }
      }
      if ($gamePlayer.checkCollision(x[j], y[i])) {
        if ($gamePlayer === this) {
          return false;
        }
        return true;
      }
    }
  }
  return false;
};

Game_CharacterBase.prototype.willCollideWithCharacters = function (dir) {
  this.updateCoordinates();
  this.estimate(dir);
  var x = this._projCoords.x;
  var y = this._projCoords.y;
  for (var i = 0; i < y.length; i++) {
    for (var j = 0; j < x.length; j++) {
      for (var k = 0; k < $gameMap.events().length; k++) {
        if ($gameMap.events()[k].checkCollision(x[j], y[i])) {
          if (
            $gameMap.events()[k] === this ||
            $gameMap.events()[k].isThrough() ||
            $gameMap.events()[k]._characterName === '' ||
            $gameMap.events()[k]._invalid
          ) {
            continue;
          }
          return true;
        }
      }
      for (var l = 0; l < $gameMap.vehicles.length; l++) {
        if ($gameMap.vehicles()[l].checkCollision(x[j], y[i])) {
          if (
            $gameMap.vehicles()[l] === this ||
            $gameMap.vehicles()[l].isThrough() ||
            $gameMap.vehicles()[l]._characterName === '' ||
            $gameMap.vehicles()[l]._invalid
          ) {
            continue;
          }
          return true;
        }
      }
      if ($gamePlayer.checkCollision(x[j], y[i])) {
        if (
          $gamePlayer === this ||
          $gamePlayer.isThrough() ||
          $gamePlayer._characterName === '' ||
          $gamePlayer._invalid
        ) {
          return false;
        }
        return true;
      }
    }
  }
  return false;
};

Game_CharacterBase.prototype.canPass = function (x, y, d) {
  var x2 = $gameMap.roundXWithDirection(x, d);
  var y2 = $gameMap.roundYWithDirection(y, d);
  if (!$gameMap.isValid(x2, y2)) {
    return false;
  }
  if (this.isThrough() || this.isDebugThrough()) {
    return true;
  }
  if (!this.isMapPassable(x, y, d)) {
    return false;
  }
  if (this.willCollideWithCharacters(d)) {
    return false;
  }
  return true;
};

Game_CharacterBase.prototype.moveStraight = function (d) {
  this.setMovementSuccess(this.canPass(this._x, this._y, d));
  if (this.isMovementSucceeded()) {
    this.setDirection(d);
    this._x = $gameMap.roundXWithDirection(this._x, d);
    this._y = $gameMap.roundYWithDirection(this._y, d);
    this._realX = $gameMap.xWithDirection(this._x, this.reverseDir(d));
    this._realY = $gameMap.yWithDirection(this._y, this.reverseDir(d));
    this.increaseSteps();
    this.updateCoordinates();
  } else {
    this.setDirection(d);
    this.checkEventTriggerTouchFront(d);
  }
};

//==============================================================================
// Game_Character
//==============================================================================

/**
 * Aliases and expands Game_Character to make all children drag and drop friendly
 */

var _Game_Character_initMembers = Game_Character.prototype.initMembers;
Game_Character.prototype.initMembers = function () {
  _Game_Character_initMembers.call(this);
  this._draggable = MightyMouse.Settings.AllDraggable;
  this._centered = MightyMouse.Settings.CenterCharacters;
  this._invalid = false;
  this._priority = 0;
  this._initialX = this._x;
  this._initialY = this._y;
  this._oldDirFix = this._directionFix;
  this._oldThrough = this._through;
  this._oldOpacity = this._opacity;
  this._oldMoveSpeed = this._moveSpeed;
  this._oldStepAnime = this._stepAnime;
  if (this._moveType !== undefined) {
    this._oldMoveType = this._moveType;
  }
};

Object.defineProperties(Game_Character.prototype, {
  draggable: {
    get: function () {
      return this._draggable;
    },
    set: function (value) {
      this._draggable = value;
    },
    configurable: true,
  },
  center: {
    get: function () {
      return this._centered;
    },
    set: function (value) {
      this._centered = value;
    },
    configurable: true,
  },
  priority: {
    get: function () {
      return this._priority;
    },
    set: function (value) {
      this._priority = value;
    },
    configurable: true,
  },
});

Game_Character.prototype.isDraggable = function () {
  return this._draggable;
};

Game_Character.prototype.isCentered = function () {
  return this._centered;
};

Game_Character.prototype.screenZ = function () {
  if ($gameMap.checkLayeredTilesFlags(this._x, this._y, 0x10)) {
    return this._priorityType * 2 + 1;
  }
  return this._priorityType * 500 + 1;
};

Game_Character.prototype.checkHover = function () {
  var x = TouchInput.mapX();
  var y = TouchInput.mapY();
  this.updateCoordinates();
  return this.checkCollision(x, y);
};

Game_Character.prototype.checkLeave = function () {
  var x = TouchInput.prevX();
  var y = TouchInput.prevY();
  this.updateCoordinates();
  return this.checkCollision(x, y) && !this.checkHover();
};

Game_Character.prototype.drag = function () {
  this.setPosition(TouchInput.mapX(), TouchInput.mapY());
  this.refresh();
  if (this === $gamePlayer) {
    this.followers().synchronize(this._x, this._y);
    this.followers().update();
    this.followers().refresh();
  }
};

Game_Character.prototype.drop = function () {
  var dz = TouchInput.getTargetZone();
  if (dz && dz.check()) {
    TouchInput.getTargetZone().catch(this);
    this.refresh();
    return;
  } else {
    this.setPosition(this._initialX, this._initialY);
    this._directionFix = this._oldDirFix;
    this._through = this._oldThrough;
    this._opacity = this._oldOpacity;
    this._moveSpeed = this._oldMoveSpeed;
    this._stepAnime = this._oldStepAnime;
    if (this._moveType !== undefined) {
      this._moveType = this._oldMoveType;
      this.updateRoutineMove();
    }
    TouchInput._target = null;
    this.refresh();
    if (this === $gamePlayer) {
      this.followers().synchronize(this._x, this._y);
      this.followers().update();
      this.followers().refresh();
    }
  }
};

//==============================================================================
// Game_Player
//==============================================================================

var _Game_Player_initMembers = Game_Player.prototype.initMembers;
Game_Player.prototype.initMembers = function () {
  _Game_Player_initMembers.call(this);
  this._invalid = MightyMouse.Settings.PlayerDrag;
};

Game_Player.prototype.isInRange = function (object) {
  this.updateCoordinates();
  this.estimate(this.direction());
  var x = this._projCoords.x;
  var y = this._projCoords.y;
  for (var i = 0; i < y.length; i++) {
    for (var j = 0; j < x.length; j++) {
      if (object.checkCollision(x[j], y[i])) {
        if (object.isThrough() || object._characterName === '') {
          return false;
        }
        return true;
      }
    }
  }
};

Game_Player.prototype.isCollided = function (x, y) {
  if (this.isThrough()) {
    return false;
  } else {
    return (
      this.isCollidedWithCharacters() || this._followers.isSomeoneCollided(x, y)
    );
  }
};

//==============================================================================
// Game_Vehicle
//==============================================================================

var _Game_Vehicle_initMembers = Game_Vehicle.prototype.initMembers;
Game_Vehicle.prototype.initMembers = function () {
  _Game_Vehicle_initMembers.call(this);
  this._invalid = MightyMouse.Settings.VehiclesDrag;
};

//==============================================================================
// Game_Event
//==============================================================================

var _Game_Event_initMembers = Game_Event.prototype.initMembers;
Game_Event.prototype.initMembers = function () {
  _Game_Event_initMembers.call(this);
  this._hoverStart = false;
  this._leaveStart = false;
  this._triggered = false;
};

Object.defineProperties(Game_Event.prototype, {
  hoverStart: {
    get: function () {
      return this._hoverStart;
    },
    set: function (value) {
      this._hoverStart = value;
    },
    configurable: true,
  },
  leaveStart: {
    get: function () {
      return this._leaveStart;
    },
    set: function (value) {
      this._leaveStart = value;
    },
    configurable: true,
  },
});

var _Game_Event_setupPage = Game_Event.prototype.setupPage;
Game_Event.prototype.setupPage = function () {
  _Game_Event_setupPage.call(this);
  this.checkTags();
};

Game_Event.prototype.checkTags = function () {
  if (!this.page()) {
    return;
  }
  MightyMouse.eventReader(this, MightyMouse.HoverTag, function () {
    this._hoverStart = true;
    this._trigger = 5;
    return;
  });
  MightyMouse.eventReader(this, MightyMouse.LeaveTag, function () {
    this._leaveStart = true;
    this._trigger = 6;
    return;
  });
  MightyMouse.eventReader(this, MightyMouse.DragTag, function () {
    this._draggable = true;
    return;
  });
  MightyMouse.eventReader(this, MightyMouse.CenterTag, function () {
    this._centered = true;
    return;
  });
  MightyMouse.eventReader(this, MightyMouse.PlayerClickTag, function () {
    this._trigger = 7;
    return;
  });
  MightyMouse.eventReader(this, MightyMouse.InvalidTag, function () {
    this._invalid = true;
    return;
  });
  MightyMouse.eventReader(this, MightyMouse.ClickableTag, function () {
    this._clickable = true;
    return;
  });
};

//==============================================================================
// Game_Map
//==============================================================================

/**
 * Aliases and expands Game_Map for automated and custom dropzone creation
 */

var _Game_Map_initialize = Game_Map.prototype.initialize;
Game_Map.prototype.initialize = function () {
  _Game_Map_initialize.call(this);
  this._dropzones = [];
};

Game_Map.prototype.setup = function (mapId) {
  if (!$dataMap) {
    throw new Error('The map data is not available');
  }
  this._mapId = mapId;
  this._tilesetId = $dataMap.tilesetId;
  this._displayX = 0;
  this._displayY = 0;
  if (MightyMouse.Settings.DragAndDrop) {
    this.setupDropzones();
  }
  this.refereshVehicles();
  this.setupEvents();
  this.setupScroll();
  this.setupParallax();
  this.setupBattleback();
  this._needsRefresh = false;
};

/**
 * [read-only] Direct reference to the dropzone container.
 *
 * @static
 * @property dropzones
 * @type Array
 */
Object.defineProperty(Game_Map.prototype, 'dropzones', {
  get: function () {
    return this._dropzones;
  },
  configurable: true,
});

/**
 * This used by default to create 48x48 pixel dropzones across the entire map
 */

Game_Map.prototype.setupDropzones = function () {
  this._dropzones = [];
  var dimensionsX = this.screenTileX();
  var dimensionsY = this.screenTileY();
  for (var y = 0; y < dimensionsY; y++) {
    for (var x = 0; x < dimensionsX; x++) {
      var id = y * dimensionsX + x;
      this._dropzones.push(new Game_Dropzone(this._mapId, id, x, y, 1, 1));
    }
  }
};

/**
 * Use this to create individual customized dropzones anywhere on the map. It
 * returns a reference to that zone as well.
 *
 * @method createDropzone
 * @param id {string} Unique reference ID i.e. AttackZone1, SafeZone6, or 001
 * @param x {number} horizontal tile position
 * @param y {number} vertical tile position
 * @param width {number} max width in 48x48 tiles
 * @param length {number} max length in 48x48 tiles
 * @param stackable {bool} whether objects can stack in this zone or not
 */

Game_Map.prototype.createDropzone = function (
  id,
  x,
  y,
  width,
  length,
  stackable
) {
  var sx = Math.round(x);
  var sy = Math.round(y);
  var w = Math.round(width);
  var h = Math.round(length);
  var dz = new Game_Dropzone(this._mapId, id, sx, sy, w, h, stackable);
  this._dropzones.push(dz);
  if (SceneManager._scene) {
    dz._sprite = new Sprite_Character(dz);
    SceneManager._scene.addChild(dz._sprite);
  }
  return dz;
};

Game_Map.prototype.findDropzone = function (x, y) {
  return this._dropzones.find(function (zone) {
    return zone.pos(x, y);
  });
};

Game_Map.prototype.updateDropzones = function () {
  this._dropzones.forEach(function (zone) {
    zone.update();
  });
};

var _Game_Map_update = Game_Map.prototype.update;
Game_Map.prototype.update = function (sceneActive) {
  _Game_Map_update.call(this, sceneActive);
  this.updateDropzones();
};

//==============================================================================
// Game_Dropzone
//==============================================================================

/**
 * The container class for handing drops
 */

function Game_Dropzone() {
  this.initialize.apply(this, arguments);
}

Game_Dropzone.prototype = Object.create(Game_CharacterBase.prototype);
Game_Dropzone.prototype.constructor = Game_Dropzone;

Object.defineProperties(Game_Dropzone.prototype, {
  mapId: {
    get: function () {
      return this._mapId;
    },
    set: function (value) {
      this._mapId = value;
    },
    configurable: true,
  },
  id: {
    get: function () {
      return this._id;
    },
    set: function (value) {
      this._id = value;
    },
    configurable: true,
  },
  width: {
    get: function () {
      return this._width;
    },
    set: function (value) {
      this._width = value;
    },
    configurable: true,
  },
  length: {
    get: function () {
      return this._length;
    },
    set: function (value) {
      this._length = value;
    },
    configurable: true,
  },
  blocked: {
    get: function () {
      return this._blocked;
    },
    set: function (value) {
      this._blocked = value;
    },
    configurable: true,
  },
  triggered: {
    get: function () {
      return this._triggered;
    },
    set: function (value) {
      this._triggered = value;
    },
    configurable: true,
  },
  stackable: {
    get: function () {
      return this._stackable;
    },
    set: function (value) {
      this._stackable = value;
    },
    configurable: true,
  },
  objects: {
    get: function () {
      return this._objects;
    },
    set: function (value) {
      this._objects = value;
    },
    configurable: true,
  },
  sprite: {
    get: function () {
      return this._sprite;
    },
    set: function (value) {
      this._sprite = value;
    },
    configurable: true,
  },
});

Game_Dropzone.prototype.initialize = function (
  mapId,
  id,
  x,
  y,
  width,
  length,
  stackable
) {
  this.initMembers(mapId, id, x, y, width, length, stackable);
};

Game_Dropzone.prototype.initMembers = function (
  mapId,
  id,
  x,
  y,
  width,
  length,
  stackable
) {
  Game_CharacterBase.prototype.initMembers.call(this);
  this._mapId = mapId;
  this._id = String(id);
  this._x = x;
  this._y = y;
  this._width = width;
  this._length = length;
  this._dimensions = { x: 0, y: 0, z: 0 };
  this._coordinates = { x: [], y: [] }; //used to keep track of large/custom dropzones
  this._stackable = stackable || MightyMouse.Settings.AllStackable;
  this._priorityType = 0;
  this._moveType = 0;
  this._directionFix = true;
  this._through = true;
  this._walkAnime = false;
  this._stepAnime = false;
  this._blocked = false;
  this._triggered = false; //reserved flag for animations
  this._objects = []; //any objects currently occupying this dropzone
  this._todolist = [];
  this._reacting = false;
  this.setPosition(x, y);
  this.updateCoordinates();
};

Game_Dropzone.prototype.object = function (index) {
  var i = index || 0;
  return this._objects[i];
};

Game_Dropzone.prototype.updateCoordinates = function () {
  this._coordinates = { x: [], y: [] };
  for (var i = 0; i < this._width; i++) {
    this._coordinates.x.push(this._x + i);
  }
  for (var j = 0; j < this._length; j++) {
    this._coordinates.y.push(this._y + j);
  }
};

Game_Dropzone.prototype.centerX = function () {
  var i = Math.round(this._width / 2) - 1;
  return this._coordinates.x[i];
};

Game_Dropzone.prototype.centerY = function () {
  var i = Math.round(this._length / 2) - 1;
  return this._coordinates.y[i];
};

/**
 * Checks whether the drag target can be placed within this dropzone
 */

Game_Dropzone.prototype.check = function () {
  if (!TouchInput._target) {
    return false;
  }
  TouchInput._target.updateCoordinates();
  var x = TouchInput._target._coordinates.x;
  var y = TouchInput._target._coordinates.y;
  for (var i = 0; i < y.length; i++) {
    for (var j = 0; j < x.length; j++) {
      if (this.checkCoordinates(x[j], y[i])) {
        if (!$gameMap.checkPassage(x[j], y[i], 0x0f)) {
          this._blocked = true;
          return false;
        }
        if (
          this.isOccupied() ||
          TouchInput._target.isCollidedWithCharacters()
        ) {
          if (this._stackable) {
            this._blocked = false;
            return true;
          } else {
            this._blocked = true;
            return false;
          }
        } else {
          this._blocked = false;
          return true;
        }
      }
    }
  }
};

/**
 * Checks whether given coordinates are within dropzone bounds
 */

Game_Dropzone.prototype.checkCoordinates = function (x, y) {
  var maxX = this._coordinates.x.length - 1;
  var maxY = this._coordinates.y.length - 1;
  return (
    x >= this._coordinates.x[0] &&
    x <= this._coordinates.x[maxX] &&
    y >= this._coordinates.y[0] &&
    y <= this._coordinates.y[maxY]
  );
};

/**
 * Checks whether any Game_Character objects are currently occupying this dropzone.
 */

Game_Dropzone.prototype.isOccupied = function () {
  this.updateCoordinates();
  var x = [];
  var y = [];
  var objects = [];
  for (var i = 0; i < $gameMap.screenTileY(); i++) {
    for (var j = 0; j < $gameMap.screenTileX(); j++) {
      for (var k = 0; k < $gameMap.events().length; k++) {
        $gameMap.events()[k].updateCoordinates();
        x = $gameMap.events()[k]._coordinates.x;
        y = $gameMap.events()[k]._coordinates.y;
        if (this.checkCoordinates(x[j], y[i])) {
          if ($gameMap.events()[k] !== TouchInput._target) {
            objects.push($gameMap.events()[k]);
          }
        }
      }
      for (var l = 0; l < $gameMap.vehicles.length; l++) {
        $gameMap.vehicles()[l].updateCoordinates();
        x = $gameMap.vehicles()[l]._coordinates.x;
        y = $gameMap.vehicles()[l]._coordinates.y;
        if (this.checkCoordinates(x[j], y[i])) {
          if ($gameMap.vehicles()[l] !== TouchInput._target) {
            objects.push($gameMap.vehicles()[l]);
          }
        }
      }
      x = $gamePlayer._coordinates.x;
      y = $gamePlayer._coordinates.y;
      if (this.checkCoordinates(x[j], y[i])) {
        if ($gamePlayer !== TouchInput._target) {
          objects.push($gamePlayer);
        }
      }
    }
  }
  this._objects = objects;
  this.sortObjects();
  return this._objects.length > 0;
};

/**
 * Arranges Game_Character objects that are currently occupying this dropzone by
 * drag priority.
 */

Game_Dropzone.prototype.sortObjects = function () {
  if (!this._objects || !this._objects.length > 0) {
    return;
  }
  var objects = this._objects;
  this._objects = objects.filter(function (obj) {
    return obj.draggable && obj._characterName !== '';
  }, this);
  this._objects.sort(function (a, b) {
    return b.getPriority() - a.getPriority();
  });
};

/**
 * Records any Game_Character objects that are currently occupying this dropzone.
 */

Game_Dropzone.prototype.checkObjects = function () {
  var objects = [];
  for (var i = 0; i < $gameMap.events().length; i++) {
    if (
      $gameMap.events()[i]._x >= this._x &&
      $gameMap.events()[i]._x <= this._x * this._width
    ) {
      if (
        $gameMap.events()[i]._y >= this._y &&
        $gameMap.events()[i]._y <= this._y * this._length
      ) {
        if (TouchInput._target !== $gameMap.events()[i]) {
          objects.push($gameMap.events()[i]);
        }
      }
    }
  }
  for (var j = 0; j < $gameMap.vehicles.length; j++) {
    if (
      $gameMap.vehicles()[j]._x >= this._x &&
      $gameMap.vehicles()[j]._x <= this._x * this._width
    ) {
      if (
        $gameMap.vehicles()[j]._y >= this._y &&
        $gameMap.vehicles()[j]._y <= this._y * this._length
      ) {
        if (TouchInput._target !== $gameMap.vehicles()[j]) {
          objects.push($gameMap.vehicles()[j]);
        }
      }
    }
  }
  if ($gamePlayer.x >= this._x && $gamePlayer.x <= this._x * this._width) {
    if ($gamePlayer.y >= this._y && $gamePlayer.y <= this._y * this._length) {
      if (TouchInput._target !== $gamePlayer) {
        objects.push($gamePlayer);
      }
    }
  }
  this._objects = objects.filter(function (obj) {
    return obj.draggable && obj._characterName !== '';
  }, this);
  this._objects.sort(function (a, b) {
    return b.priority - a.priority;
  });
  this._objects.sort(function (a, b) {
    return b._priorityType - a._priorityType;
  });
};

/**
 * Handles successfull dropzone drags
 */

Game_Dropzone.prototype.catch = function (target) {
  if (this._objects.length > 0) {
    this.sortObjects();
    for (var i = 0; i < this._objects.length - 1; i++) {
      this._objects[i].setPriority(i);
    }
    target.setPriority(this._objects[this._objects.length - 1]._priority + 1);
  } else {
    target.setPriority(0);
  }
  this._objects.push(target);
  this._objects.sort(function (a, b) {
    return b.priority - a.priority;
  });
  target.setPosition(this.centerX(), this.centerY());
  target._directionFix = target._oldDirFix;
  target._through = target._oldThrough;
  target._opacity = target._oldOpacity;
  target._moveSpeed = target._oldMoveSpeed;
  target._stepAnime = target._oldStepAnime;
  if (target._moveType !== undefined) {
    target._moveType = target._oldMoveType;
    target.updateRoutineMove();
  }
  if (target === $gamePlayer) {
    target.followers().synchronize(this._x, this._y);
    target.followers().update();
    target.followers().refresh();
  }
  TouchInput._target = null;
  if (this._todolist.length > 0) {
    this._reacting = true;
  }
};

Game_Dropzone.prototype.react = function () {
  if (this._todolist.event() && this._todolist._interpreter.isRunning()) {
    this._todolist.update();
  }
  this._reacting = false;
};

Game_Dropzone.prototype.setReaction = function (commonEventId) {
  if (commonEventId <= 0) {
    this._todolist = [];
    return;
  }
  var action = new Game_CommonEvent(commonEventId);
  action._interpreter = new Game_Interpreter();
  action._interpreter.setup(action.list());
  this._todolist = action;
};

Game_Dropzone.prototype.getSprite = function () {
  var sprite = SceneManager._scene._spriteset._characterSprites.find(function (
    sprite
  ) {
    return sprite._character === this;
  },
  this);
  if (!sprite) {
    sprite = SceneManager._scene.children.find(function (sprite) {
      return sprite._character === this;
    }, this);
  }
  return sprite;
};

Game_Dropzone.prototype.update = function () {
  Game_CharacterBase.prototype.update.call(this);
  if (this._animationId === 0) {
    this._triggered = false;
  }
};

//==============================================================================
// Sprite_Character
//==============================================================================

/**
 * Center event images to event
 */

Sprite_Character.prototype.update = function () {
  Sprite_Base.prototype.update.call(this);
  if (
    this._character &&
    this._character._centered &&
    this._character._isBigCharacter
  ) {
    this.anchor.y = 0.75;
  } else {
    this.anchor.y = 1;
  }
  this.updateBitmap();
  this.updateFrame();
  this.updatePosition();
  this.updateAnimation();
  this.updateBalloon();
  this.updateOther();
};

//==============================================================================
// Spriteset_Map
//==============================================================================

/**
 * Added sprites for dropzone images and animations
 */

Spriteset_Map.prototype.createCharacters = function () {
  this._characterSprites = [];
  this._eventSprites = [];
  $gameMap.dropzones.forEach(function (dropzone) {
    this._characterSprites.push(new Sprite_Character(dropzone));
  }, this);
  $gameMap.events().forEach(function (event) {
    this._characterSprites.push(new Sprite_Character(event));
  }, this);
  $gameMap.vehicles().forEach(function (vehicle) {
    this._characterSprites.push(new Sprite_Character(vehicle));
  }, this);
  $gamePlayer.followers().reverseEach(function (follower) {
    this._characterSprites.push(new Sprite_Character(follower));
  }, this);
  this._characterSprites.push(new Sprite_Character($gamePlayer));
  for (var i = 0; i < this._characterSprites.length; i++) {
    if (
      this._characterSprites[i]._character &&
      this._characterSprites[i]._character._centered &&
      this._characterSprites[i]._character._isBigCharacter
    ) {
      this._characterSprites[i].anchor.y = 0.75;
    } else {
      this._characterSprites[i].anchor.y = 1;
    }
    this._tilemap.addChild(this._characterSprites[i]);
  }
};

//==============================================================================
// Scene Changes
//==============================================================================

/**
 * This restricts player click/touch movement to only occurring when clicking or
 * touching unoccupied map areas only & only when not holding an object.
 */

Scene_Map.prototype.isMapTouchOk = function () {
  if (TouchInput.overObject() || TouchInput.isHolding()) {
    return false;
  }
  return this.isActive() && $gamePlayer.canMove();
};
