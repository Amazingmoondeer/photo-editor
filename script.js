const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const brightness = document.getElementById("brightness");
const contrast = document.getElementById("contrast");
const grayscale = document.getElementById("grayscale");
const sepia = document.getElementById("sepia");
const blur = document.getElementById("blur");

const downloadBtn = document.getElementById("download");

let originalImage = new Image();

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    originalImage.src = reader.result;
  };
  reader.readAsDataURL(file);
});

originalImage.onload = () => {
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  applyFilters();
};

function applyFilters() {
  ctx.filter = `
    brightness(${brightness.value}%)
    contrast(${contrast.value}%)
    grayscale(${grayscale.value}%)
    sepia(${sepia.value}%)
    blur(${blur.value}px)
  `;
  ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
}

[brightness, contrast, grayscale, sepia, blur].forEach(control => {
  control.addEventListener("input", applyFilters);
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "edited-photo.png";
  link.href = canvas.toDataURL();
  link.click();
});
