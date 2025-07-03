<!DOCTYPE html>
<html>
<body>
  <input type="file" id="up">
  <canvas id="c"></canvas>
  <label>Brightness<input id="bright" type="range" min="-100" max="100" value="0"></label>
  <label>Contrast<input id="cont" type="range" min="-100" max="100" value="0"></label>
  <button id="sepia">Sepia</button>

  <script src="https://unpkg.com/camanjs@4.1.2/dist/caman.full.min.js"></script>
  <script>
    const file = document.getElementById('up'), canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let img = new Image();
    file.onchange = e => {
      img.onload = () => {
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        Caman(canvas, function(){ this.render(); });
      };
      img.src = URL.createObjectURL(e.target.files[0]);
    };

    ['bright','cont'].forEach(id => {
      document.getElementById(id).oninput = () => {
        Caman(canvas, function(){
          this.revert(false)
            .brightness(+document.getElementById('bright').value)
            .contrast(+document.getElementById('cont').value)
            .render();
        });
      };
    });
    document.getElementById('sepia').onclick = () => {
      Caman(canvas, function(){ this.sepia(30).render(); });
    };
  </script>
</body>
</html>
