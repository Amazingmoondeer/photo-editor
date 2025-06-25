const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const grayscale = document.getElementById("grayscale");
const sepia = document.getElementById("sepia");
const blur = document.getElementById("blur");

const rotateLeftBtn = document.getElementById("rotate-left");
const rotateRightBtn = document.getElementById("rotate-right");

const startCropBtn = document.getElementById("start-crop");
const applyCropBtn = document.getElementById("apply-crop");
const cancelCropBtn = document.getElementById("cancel-crop");

const textInput = document.getElementById("text-input");
const addTextBtn = document.getElementById("add-text-btn");

const downloadBtn = document.getElementById("download");

let img = new Image();
let imgAngle = 0;
let originalImageData = null;

let cropMode = false;
let cropStart = null;
let cropEnd = null;

let textItems = [];

function resetCanvasSize(width, height) {
  canvas.width = width;
  canvas.height = height;
}

function drawImage() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Save context to handle rotation
  ctx.save();

  // Translate to center for rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((imgAngle * Math.PI) / 180);

  // Draw image centered
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  ctx.restore();

  applyFilters();

  drawTexts();

  if (cropMode && cropStart && cropEnd) {
    drawCropRect();
  }
}

function applyFilters() {
  const filterStr = `
    brightness(${brightness.value}%)
    contrast(${contrast.value}%)
    grayscale(${grayscale.value}%)
    sepia(${sepia.value}%)
    blur(${blur.value}px)
  `;

  // Save current image data, apply filter, redraw
  ctx.filter = filterStr.trim();

  // Re-draw the image on top with filters (to make filters visible)
  // Trick: Clear and redraw filtered image

  // Save canvas as temp
  let tempCanvas = document.createElement("canvas");
  let tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Draw rotated image without filters to temp canvas
  tempCtx.save();
  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempCtx.rotate((imgAngle * Math.PI) / 180);
  tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
  tempCtx.restore();

  // Clear main canvas and apply filter, then draw temp canvas on it
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = filterStr.trim();
  ctx.drawImage(tempCanvas, 0, 0);
}

function drawTexts() {
  textItems.forEach(item => {
    ctx.font = `${item.fontSize}px Arial`;
    ctx.fillStyle = item.color;
    ctx.textBaseline = "top";
    ctx.fillText(item.text, item.x, item.y);
  });
}

function drawCropRect() {
  const rectX = Math.min(cropStart.x, cropEnd.x);
  const rectY = Math.min(cropStart.y, cropEnd.y);
  const rectW = Math.abs(cropEnd.x - cropStart.x);
  const rectH = Math.abs(cropEnd.y - cropStart.y);

  ctx.save();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.setLineDash([6]);
  ctx.strokeRect(rectX, rectY, rectW, rectH);
  ctx.restore();
}

upload.addEventListener("change", e => {
  if (!e.target.files.length) return;

  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    img = new Image();
    img.onload = () => {
      imgAngle = 0;
      resetCanvasSize(img.width, img.height);
      drawImage();
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

[brightness, contrast, grayscale, sepia, blur].forEach(input => {
  input.addEventListener("input", () => {
    drawImage();
  });
});

rotateLeftBtn.addEventListener("click", () => {
  imgAngle = (imgAngle - 90) % 360;

  // Adjust canvas size for 90° or 270° rotation
  if (imgAngle % 180 !== 0) {
    resetCanvasSize(img.height, img.width);
  } else {
    resetCanvasSize(img.width, img.height);
  }
  drawImage();
});

rotateRightBtn.addEventListener("click", () => {
  imgAngle = (imgAngle + 90) % 360;
  if (imgAngle % 180 !== 0) {
    resetCanvasSize(img.height, img.width);
  } else {
    resetCanvasSize(img.width, img.height);
  }
  drawImage();
});

startCropBtn.addEventListener("click", () => {
  if (!img.src) return alert("Upload an image first");
  cropMode = true;
  cropStart = null;
  cropEnd = null;
  applyCropBtn.disabled = false;
  cancelCropBtn.disabled = false;
  startCropBtn.disabled = true;
  canvas.style.cursor = "crosshair";
});

cancelCropBtn.addEventListener("click", () => {
  cropMode = false;
  cropStart = null;
  cropEnd = null;
  applyCropBtn.disabled = true;
  cancelCropBtn.disabled = true;
  startCropBtn.disabled = false;
  canvas.style.cursor = "default";
  drawImage();
});

applyCropBtn.addEventListener("click", () => {
  if (!cropStart || !cropEnd) {
    alert("Select crop area first");
    return;
  }

  const x = Math.min(cropStart.x, cropEnd.x);
  const y = Math.min(cropStart.y, cropEnd.y);
  const w = Math.abs(cropEnd.x - cropStart.x);
  const h = Math.abs(cropEnd.y - cropStart.y);

  if (w === 0 || h === 0) {
    alert("Invalid crop area");
    return;
  }

  // Create temp canvas and draw cropped image
  let tempCanvas = document.createElement("canvas");
  let tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = w;
  tempCanvas.height = h;

  // Copy cropped area from main canvas
  tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

  // Update main canvas size and image
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tempCanvas, 0, 0);

  // Update img with new cropped image data
  img.src = canvas.toDataURL();

  cropMode = false;
  cropStart = null;
  cropEnd = null;
  applyCropBtn.disabled = true;
  cancelCropBtn.disabled = true;
  startCropBtn.disabled = false;
  canvas.style.cursor = "default";

  // Clear text overlays after crop
  textItems = [];
});

let isDraggingText = false;
let draggedTextIndex = null;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener("mousedown", e => {
  if (cropMode) return; // disable text dragging while cropping

  const mousePos = getMousePos(canvas, e);

  // Check if clicking on any text item
  for (let i = 0; i < textItems.length; i++) {
    const text = textItems[i];
    ctx.font = `${text.fontSize}px Arial`;
    const width = ctx.measureText(text.text).width;
    const height = text.fontSize;

    if (
      mousePos.x >= text.x &&
      mousePos.x <= text.x + width &&
      mousePos.y >= text.y &&
      mousePos.y <= text.y + height
    ) {
      isDraggingText = true;
      draggedTextIndex = i;
      dragOffset.x = mousePos.x - text.x;
      dragOffset.y = mousePos.y - text.y;
      canvas.style.cursor = "move";
      break;
    }
  }
});

canvas.addEventListener("mousemove", e => {
  if (isDraggingText && draggedTextIndex !== null) {
    const mousePos = getMousePos(canvas, e);
    textItems[draggedTextIndex].x = mousePos.x - dragOffset.x;
    textItems[draggedTextIndex].y = mousePos.y - dragOffset.y;
    drawImage();
  }
});

canvas.addEventListener("mouseup", e => {
  isDraggingText = false;
  draggedTextIndex = null;
  canvas.style.cursor = cropMode ? "crosshair" : "default";
});

canvas.addEvent
