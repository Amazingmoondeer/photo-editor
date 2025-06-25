const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let originalImage = null;

upload.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  img.src = URL.createObjectURL(file);
});

function applyFilter(type) {
  if (!originalImage) return;
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];

    if (type === 'grayscale') {
      const avg = (r + g + b) / 3;
      data[i] = data[i+1] = data[i+2] = avg;
    }

    if (type === 'sepia') {
      data[i]     = 0.393*r + 0.769*g + 0.189*b;
      data[i + 1] = 0.349*r + 0.686*g + 0.168*b;
      data[i + 2] = 0.272*r + 0.534*g + 0.131*b;
    }

    if (type === 'invert') {
      data[i]     = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function resetImage() {
  if (originalImage) {
    ctx.putImageData(originalImage, 0, 0);
  }
}

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'edited-image.png';
  link.href = canvas.toDataURL();
  link.click();
}
