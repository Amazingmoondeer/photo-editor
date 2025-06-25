const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let originalImage = null;
let currentImage = new Image();
let rotation = 0;

upload.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    currentImage.src = canvas.toDataURL();
  };
  img.src = URL.createObjectURL(file);
});

function applyFilter(type) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    if (type === 'grayscale') {
      const avg = (r + g + b) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg;
    } else if (type === 'sepia') {
      data[i]     = 0.393 * r + 0.769 * g + 0.189 * b;
      data[i + 1] = 0.349 * r + 0.686 * g + 0.168 * b;
      data[i + 2] = 0.272 * r + 0.534 * g + 0.131 * b;
    } else if (type === 'invert') {
      data[i]     = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function adjustBrightness(amount) {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = data[i] + amount;
    data[i + 1] = data[i + 1] + amount;
    data[i + 2] = data[i + 2] + amount;
  }

  ctx.putImageData(imageData, 0, 0);
}

function adjustContrast(amount) {
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;
  let factor = (259 * (amount + 255)) / (255 * (259 - amount));

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }

  ctx.putImageData(imageData, 0, 0);
}

function rotateImage() {
  rotation = (rotation + 90) % 360;
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.drawImage(canvas, 0, 0);

  if (rotation % 180 === 0) {
    canvas.width = width;
    canvas.height = height;
  } else {
    canvas.width = height;
    canvas.height = width;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(tempCanvas, -width / 2, -height / 2);
  ctx.restore();
}

function cropImage() {
  const side = Math.min(canvas.width, canvas.height);
  const x = (canvas.width - side) / 2;
  const y = (canvas.height - side) / 2;

  const imageData = ctx.getImageData(x, y, side, side);
  canvas.width = canvas.height = side;
  ctx.putImageData(imageData, 0, 0);
}

function addText() {
  const text = prompt('Enter text to add:');
  if (!text) return;

  ctx.font = '40px Arial';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  // Add text near bottom center
  const x = canvas.width / 2 - ctx.measureText(text).width / 2;
  const y = canvas.height - 40;

  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

function resetImage() {
  if (originalImage) {
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.putImageData(originalImage, 0, 0);
    rotation = 0;
  }
}

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'edited-image.png';
  link.href = canvas.toDataURL();
  link.click();
}
