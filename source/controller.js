/**
 * Abstractions to represent the state of all input devices to the NES.
 */


/**
 * An array with 8 values.
 * The position in the array corresponds to a controller input button:
 * <ol>
 *   <li>A button
 *   <li>B button
 *   <li>SELECT button
 *   <li>START button
 *   <li>UP button
 *   <li>DOWN button
 *   <li>LEFT button
 *   <li>RIGHT button
 * </ol>
 * Each value in the array will be either 0x41 (if the button is pressed) or
 * 0x40 (if the button is not pressed).
 *  
 * @typedef {Array.<number>}
 */
JSNES.ControllerState;


/** @interface */
function JSNES.Controller() {};


/**
 * @param {number} button Corresponds to an index in JSNES.ControllerState.
 */
JSNES.Controller.prototype.getButtonState = function(button) {};
