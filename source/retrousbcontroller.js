/**
 * Use the W3C Gamepad interface to implement a JSNES.Controller.
 * 
 * Much inspiration taken from:
 * http://www.html5rocks.com/en/tutorials/doodles/gamepad/gamepad-tester/gamepad.js
 */


/**
 * @param {number} controllerId
 * @constructor
 */
JSNES.RetroUsbController = function(controllerId) {
  if (controllerId == 1) {
    this.gamepadIndex = 0;
  } else if (controllerId == 2) {
    this.gamepadIndex = 1;
  } else {
    throw Error('Unrecognized controllerId: ' + controllerId);
  }
};


/** @override */
JSNES.RetroUsbController.prototype.getButtonState = function(button) {
  // We'll assume V8 will inline these.
  var PRESSED = 0x41;
  var NOT_PRESSED = 0x40;
  
  var gamepad = JSNES.RetroUsbController.gamepads[this.gamepadIndex];
  if (!gamepad) {
    return NOT_PRESSED;
  }

  if (button == 0) {
    // A button.
    return gamepad.buttons[1] == 0.0 ? NOT_PRESSED : PRESSED;
  } else if (button == 1) {
    // B button.
    return gamepad.buttons[0] == 0.0 ? NOT_PRESSED : PRESSED;
  } else if (button == 2) {
    // SELECT button.
    return gamepad.buttons[2] == 0.0 ? NOT_PRESSED : PRESSED;
  } else if (button == 3) {
    // START button.
    return gamepad.buttons[3] == 0.0 ? NOT_PRESSED : PRESSED;
  } else if (button == 4) {
    // UP button.
    return gamepad.axes[1] == -1.0 ? PRESSED : NOT_PRESSED; 
  } else if (button == 5) {
    // DOWN button.
    return gamepad.axes[1] == 1.0 ? PRESSED : NOT_PRESSED;
  } else if (button == 6) {
    // LEFT button.
    return gamepad.axes[0] == -1.0 ? PRESSED : NOT_PRESSED;
  } else if (button == 7) {
    // RIGHT button.
    return gamepad.axes[0] == 1.0 ? PRESSED : NOT_PRESSED;
  }
};


/**
 * @param {number} controllerId
 * @return {JSNES.Controller}
 */
JSNES.RetroUsbController.getController = function(controllerId) {
  JSNES.RetroUsbController.init();
  return new JSNES.RetroUsbController(controllerId);
};


/**
 * Whether we're requestAnimationFrameing like it's 1999.
 * @type {boolean}
 */
JSNES.RetroUsbController.ticking = false;


/**
 * The canonical list of attached gamepads, without "holes" (always
 * starting at [0]) and unified between Firefox and Chrome.
 * @type {Array.<Gamepad}
 */
JSNES.RetroUsbController.gamepads = [];


/**
 * Whether {@code JSNES.RetroUsbController.init} has completed successfully.
 * @type {boolean}
 */
JSNES.RetroUsbController.initialized = false;


/**
 * Remembers the connected gamepads at the last check; used in Chrome
 * to figure out when gamepads get connected or disconnected, since no
 * events are fired.
 */
JSNES.RetroUsbController.prevRawGamepadTypes = [];


/**
 * Previous timestamps for gamepad state; used in Chrome to not bother with
 * analyzing the polled data if nothing changed (timestamp is the same
 * as last time).
 */
JSNES.RetroUsbController.prevTimestamps = [];


/**
 * Verifies browser has Gamepad support.
 * This function is idempotent.
 */
JSNES.RetroUsbController.init = function() {
  // As of writing, it seems impossible to detect Gamepad API support
  // in Firefox, hence we need to hardcode it in the third clause.
  // (The preceding two clauses are for Chrome.)
  var gamepadSupportAvailable = !!navigator.webkitGetGamepads ||
      !!navigator.webkitGamepads ||
      (navigator.userAgent.indexOf('Firefox/') != -1);

  if (!gamepadSupportAvailable) {
    throw Error('No gamepad support detected!');
  } else {
    if (JSNES.RetroUsbController.initialized) {
      return;
    }
    JSNES.RetroUsbController.initialized = true;

    // Firefox supports the connect/disconnect event, so we attach event
    // handlers to those.
    window.addEventListener('MozGamepadConnected',
                            JSNES.RetroUsbController.onGamepadConnect,
                            false);
    window.addEventListener('MozGamepadDisconnected',
                            JSNES.RetroUsbController.onGamepadDisconnect,
                            false);

    // Since Chrome only supports polling, we initiate polling loop straight
    // away. For Firefox, we will only do it if we get a connect event.
    if (!!navigator.webkitGamepads || !!navigator.webkitGetGamepads) {
      JSNES.RetroUsbController.startPolling();
    }
  }
};


/**
 * React to the gamepad being connected. Today, this will only be executed
 * on Firefox.
 */
JSNES.RetroUsbController.onGamepadConnect = function(event) {
  // Add the new gamepad on the list of gamepads to look after.
  JSNES.RetroUsbController.gamepads.push(event.gamepad);

  // Start the polling loop to monitor button changes.
  JSNES.RetroUsbController.startPolling();
};


/**
 * This will only be executed on Firefox.
 * @param {Event} event
 */
JSNES.RetroUsbController.onGamepadDisconnect = function(event) {
  // Remove the gamepad from the list of gamepads to monitor.
  var gamepads = JSNES.RetroUsbController.gamepads;
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i].index == event.gamepad.index) {
      gamepads.splice(i, 1);
      break;
    }
  }

  // If no gamepads are left, stop the polling loop.
  if (gamepads.length == 0) {
    JSNES.RetroUsbController.stopPolling();
  }
};


/**
 * Starts a polling loop to check for gamepad state.
 */
JSNES.RetroUsbController.startPolling = function() {
  // Don't accidentally start a second loop, man.
  if (!JSNES.RetroUsbController.ticking) {
    JSNES.RetroUsbController.ticking = true;
    JSNES.RetroUsbController.tick();
  }
};


/**
 * Stops a polling loop by setting a flag which will prevent the next
 * requestAnimationFrame() from being scheduled.
 */
JSNES.RetroUsbController.stopPolling = function() {
  JSNES.RetroUsbController.ticking = false;
};


/**
 * A function called with each requestAnimationFrame(). Polls the gamepad
 * status and schedules another poll.
 */
JSNES.RetroUsbController.tick = function() {
  JSNES.RetroUsbController.pollStatus();
  JSNES.RetroUsbController.scheduleNextTick();
};


/**
 * Checks for the gamepad status. Monitors the necessary data and notices
 * the differences from previous state (buttons for Chrome/Firefox,
 * new connects/disconnects for Chrome). If differences are noticed, asks
 * to update the display accordingly. Should run as close to 60 frames per
 * second as possible.
 */
JSNES.RetroUsbController.pollStatus = function() {
  // Poll to see if gamepads are connected or disconnected. Necessary
  // only on Chrome.
  JSNES.RetroUsbController.pollGamepads();

  for (var i = 0; i < JSNES.RetroUsbController.gamepads.length; i++) {
    var gamepad = JSNES.RetroUsbController.gamepads[i];

    // Don't do anything if the current timestamp is the same as previous
    // one, which means that the state of the gamepad hasn't changed.
    // This is only supported by Chrome right now, so the first check
    // makes sure we're not doing anything if the timestamps are empty
    // or undefined.
    if (gamepad.timestamp &&
        (gamepad.timestamp == JSNES.RetroUsbController.prevTimestamps[i])) {
      continue;
    }
    JSNES.RetroUsbController.prevTimestamps[i] = gamepad.timestamp;
  }
};


/**
 * 
 */
JSNES.RetroUsbController.scheduleNextTick = function() {
  // Only schedule the next frame if we haven't decided to stop via
  // stopPolling() before.
  if (JSNES.RetroUsbController.ticking) {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(JSNES.RetroUsbController.tick);
    } else if (window.mozRequestAnimationFrame) {
      window.mozRequestAnimationFrame(JSNES.RetroUsbController.tick);
    } else if (window.webkitRequestAnimationFrame) {
      window.webkitRequestAnimationFrame(JSNES.RetroUsbController.tick);
    }
    // Note lack of setTimeout since all the browsers that support
    // Gamepad API are already supporting requestAnimationFrame().
  }
};


/**
 * This function is called only on Chrome, which does not yet support
 * connection/disconnection events, but requires you to monitor
 * an array for changes.
 */
JSNES.RetroUsbController.pollGamepads = function() {
  // Get the array of gamepads: the first method (function call)
  // is the most modern one, the second is there for compatibility with
  // slightly older versions of Chrome, but it shouldn't be necessary
  // for long.
  var rawGamepads =
      (navigator.webkitGetGamepads && navigator.webkitGetGamepads()) ||
      navigator.webkitGamepads;

  if (rawGamepads) {
    // We don't want to use rawGamepads coming straight from the browser,
    // since it can have "holes" (e.g. if you plug two gamepads, and then
    // unplug the first one, the remaining one will be at index [1]).
    JSNES.RetroUsbController.gamepads = [];

    // We only refresh the display when we detect some gamepads are new
    // or removed; we do it by comparing raw gamepad table entries to
    // undefined.
    var gamepadsChanged = false;

    for (var i = 0; i < rawGamepads.length; i++) {
      if (typeof rawGamepads[i] != JSNES.RetroUsbController.prevRawGamepadTypes[i]) {
        gamepadsChanged = true;
        JSNES.RetroUsbController.prevRawGamepadTypes[i] = typeof rawGamepads[i];
      }

      if (rawGamepads[i]) {
        JSNES.RetroUsbController.gamepads.push(rawGamepads[i]);
      }
    }
  }
};
