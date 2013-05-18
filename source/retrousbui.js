/**
 * An implmentation of UI that expects RetroUSB controllers.
 */


/**
 * @param {JSNES} nes
 * @constructor
 */
JSNES.RetroUsbUi = function(nes) {
  /** @type {!JSNES} */
  this.nes = nes;

  this.dynamicaudio = new DynamicAudio({
    swf: nes.opts.swfPath + 'dynamicaudio.swf',
  });

  /** @type {!HTMLCanvasElement} */
  this.canvas = this.nes.opts['canvasElement'];

  /** @type {!CanvasRenderingContext2D} */
  this.canvasContext = this.canvas.getContext('2d');

  /** @type {!ImageData} */
  this.canvasImageData = this.canvasContext.getImageData(0, 0, 256, 240);

  this.resetCanvas();
};


JSNES.RetroUsbUi.prototype.getController1 = function() {
  return JSNES.RetroUsbController.getController(1);
};


JSNES.RetroUsbUi.prototype.getController2 = function() {
  return JSNES.RetroUsbController.getController(2);
};


JSNES.RetroUsbUi.prototype.updateStatus = function(str) {
  // For now, exclude the "Running: 40.70 FPS" log messages.  
  if (str.substring(0, 'Running:'.length) == 'Running:') {
    return;
  }

  console.log(str);
};


JSNES.RetroUsbUi.prototype.writeAudio = function(samples) {
  return this.dynamicaudio.writeInt(samples);
};


JSNES.RetroUsbUi.prototype.writeFrame = function(buffer, prevBuffer) {
  var imageData = this.canvasImageData.data;
  var pixel, i, j;

  for (i = 0; i < 256 * 240; i++) {
    pixel = buffer[i];

    if (pixel != prevBuffer[i]) {
      j = i * 4;
      imageData[j] = pixel & 0xFF;
      imageData[j + 1] = (pixel >> 8) & 0xFF;
      imageData[j + 2] = (pixel >> 16) & 0xFF;
      prevBuffer[i] = pixel;
    }
  }

  this.canvasContext.putImageData(this.canvasImageData, 0, 0);
};


JSNES.RetroUsbUi.prototype.resetCanvas = function() {
  this.canvasContext.fillStyle = 'black';
  // set alpha to opaque
  this.canvasContext.fillRect(0, 0, 256, 240);

  // Set alpha
  for (var i = 3; i < this.canvasImageData.data.length - 3; i += 4) {
    this.canvasImageData.data[i] = 0xFF;
  }
};
