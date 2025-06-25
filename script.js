<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Advanced Photo Editor v2</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f2f2f2; }
    #wrapper { position: relative; display: inline-block; }
    canvas { border: 1px solid #999; }
    .overlay {
      position: absolute; cursor: move; user-select: none;
    }
    #textOverlay { font-size: 24px; color: white; text-shadow: 1px 1px 2px black; }
    .sticker { width: 50px; height: 50px; }
    #stickersPanel img { margin: 5px; cursor: grab; }
    #cropRect {
      position: absolute; border: 2px dashed #00f;
      background: rgba(0,0,255,0.1);
      display: none;
    }
    .controls button { margin: 5px; }
  </style>
</head>
<body>
  <h1>High‑End Photo Editor</h1>
  <input type="file" id="upload" accept="image/*"><br/><br/>
  <div id="wrapper">
    <canvas id="canvas"></canvas>
    <div id="textOverlay" class="overlay" contenteditable="true">Edit me</div>
    <div id="cropRect"></div>
  </div>
  <br/>
  <div class="controls">
    <button onclick="startCrop()">Crop</button>
    <button onclick="applyCrop()">Apply Crop</button>
    <button onclick="addSticker('⭐')">Add ⭐</button>
    <button onclick="undo()">Undo</button>
    <button onclick="redo()">Redo</button>
    <button onclick="download()">Download</button>
  </div>
  <div id="stickersPanel">
    <h3>Stickers</h3>
    <img src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f60d.png" draggable="true">
    <img src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f602.png" draggable="true">
  </div>

<script>
const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
const textEl = document.getElementById('textOverlay'), cropRect = document.getElementById('cropRect');
const wrapper = document.getElementById('wrapper'), stickersPanel = document.getElementById('stickersPanel');
let img = new Image(), angle=0, scale=1, history=[], historyIndex=-1;

// Setup upload
document.getElementById('upload').onchange = e => {
  const fr = new FileReader();
  fr.onload = ev => {
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      saveState(); draw();
    }
    img.src = ev.target.result;
  }
  fr.readAsDataURL(e.target.files[0]);
}

// Draw everything
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.rotate(angle*Math.PI/180);
  ctx.scale(scale,scale);
  ctx.drawImage(img,-img.width/2,-img.height/2);
  ctx.restore();
  drawText(); drawStickers();
}

// Text overlay
function drawText() {
  const rC = canvas.getBoundingClientRect(), rT=textEl.getBoundingClientRect();
  const x = rT.left - rC.left, y = rT.top - rC.top + parseInt(getComputedStyle(textEl).fontSize);
  ctx.font = getComputedStyle(textEl).font;
  ctx.fillStyle = getComputedStyle(textEl).color;
  ctx.fillText(textEl.textContent, x,y);
}

// Stickers data
let stickers = [];
function drawStickers() {
  const rC = canvas.getBoundingClientRect();
  stickers.forEach(s => {
    ctx.drawImage(s.img, s.x - rC.left, s.y - rC.top, 50,50);
  });
}

// Undo/redo
function saveState() {
  history = history.slice(0, historyIndex+1);
  history.push(canvas.toDataURL());
  historyIndex++;
}
function undo() {
  if (historyIndex>0) { historyIndex--; loadState(); }
}
function redo() {
  if (historyIndex<history.length-1) { historyIndex++; loadState(); }
}
function loadState() {
  const im = new Image();
  im.onload = () => { canvas.width=im.width; canvas.height=im.height; ctx.drawImage(im,0,0); }
  im.src = history[historyIndex];
}

// Cropping
let cropping=false, startX, startY;
function startCrop() {
  cropRect.style.display='block';
  cropRect.style.cursor='crosshair';
  cropRect.onmousedown = e => {
    cropping=true; startX=e.offsetX; startY=e.offsetY;
    cropRect.style.left=startX+'px'; cropRect.style.top=startY+'px';
    cropRect.style.width='0px'; cropRect.style.height='0px';
  };
  wrapper.onmousemove = e => {
    if (cropping) {
      cropRect.style.width = e.offsetX - startX + 'px';
      cropRect.style.height = e.offsetY - startY + 'px';
    }
  };
  document.onmouseup = e => { cropping=false; wrapper.onmousemove=null; }
}

function applyCrop() {
  const r = cropRect.getBoundingClientRect(), w=r.width, h=r.height, cR=canvas.getBoundingClientRect();
  const imgData = ctx.getImageData(r.left - cR.left, r.top - cR.top, w, h);
  canvas.width=w; canvas.height=h;
  ctx.putImageData(imgData,0,0);
  cropRect.style.display='none';
  saveState();
}

// Add stickers or emojis
function addSticker(char) {
  const span = document.createElement('span'); span.textContent = char;
  span.className='overlay sticker';
  span.style.left='10px'; span.style.top='60px';
  wrapper.appendChild(span);
  makeDrag(span);
}
function makeDrag(el) {
  el.onmousedown = e => {
    const ox=e.offsetX, oy=e.offsetY;
    document.onmousemove = ev => {
      el.style.left = ev.pageX - wrapper.getBoundingClientRect().left - ox + 'px';
      el.style.top = ev.pageY - wrapper.getBoundingClientRect().top - oy + 'px';
    };
    document.onmouseup = () => {
      document.onmousemove=null;
      saveState();
    };
  };
}

// Sticker panel drag
stickersPanel.querySelectorAll('img').forEach(imgEl=>{
  imgEl.ondragstart = e => {
    e.dataTransfer.setData('text/plain', imgEl.src);
  };
});

wrapper.ondragover = e=>{ e.preventDefault(); }
wrapper.ondrop = e => {
  e.preventDefault();
  const src = e.dataTransfer.getData('text');
  const imgEl = new Image();
  imgEl.src = src;
  imgEl.onload = () => {
    const span=document.createElement('img');
    span.src = src;
    span.className='overlay sticker';
    span.style.left=e.offsetX+'px'; span.style.top=e.offsetY+'px';
    wrapper.appendChild(span);
    makeDrag(span);
    stickers.push({img: imgEl, x: e.pageX, y: e.pageY});
    saveState();
  };
};

// Download final image
function download(){
  saveState();
  const link = document.createElement('a');
  link.download='edited.png';
  link.href=canvas.toDataURL();
  link.click();
}

// Enable dragging of text overlay
makeDrag(textEl);
</script>
</body>
</html>
