// .galleryにliが1つ以上あれば .empty を非表示にする
const gallery = document.querySelector('.gallery');
const empty = document.querySelector('.empty');
if (gallery && gallery.children.length > 0) {
  empty.style.display = 'none';
}

// ---- Canvas セットアップ ----
const canvas = document.createElement('canvas');
canvas.id = 'fx';
Object.assign(canvas.style, {
  position: 'fixed', top: 0, left: 0,
  width: '100%', height: '100%',
  pointerEvents: 'none',
  zIndex: 9999,
});
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
window.addEventListener('resize', resize);

// ---- パーティクル共通 ----
const particles = [];
let animating = false;

function loop() {
  if (!particles.length) { animating = false; ctx.clearRect(0,0,canvas.width,canvas.height); return; }
  animating = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(ctx);
    if (p.dead()) particles.splice(i, 1);
  }
  requestAnimationFrame(loop);
}

function kick() { if (!animating) { animating = true; loop(); } }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndColor() { return `hsl(${rnd(0,360)|0},100%,65%)`; }
function rndInt(a, b) { return (rnd(a, b)) | 0; }

// ---- 1. 花火 ----
function launchFireworks() {
  [0, 220, 440].forEach(delay => {
    setTimeout(() => {
      const x = canvas.width  * rnd(0.2, 0.8);
      const y = canvas.height * rnd(0.1, 0.4);
      const color = rndColor();
      const n = rndInt(70, 110);
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 / n) * i + rnd(-0.2, 0.2);
        const spd   = rnd(2, 7);
        particles.push({
          x, y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          alpha: 1, color,
          size: rnd(2, 5),
          grav: rnd(0.07, 0.12),
          decay: rnd(0.01, 0.018),
          update() { this.x+=this.vx; this.y+=this.vy; this.vy+=this.grav; this.vx*=0.98; this.alpha-=this.decay; },
          draw(c) { c.globalAlpha=this.alpha; c.fillStyle=this.color; c.beginPath(); c.arc(this.x,this.y,this.size,0,Math.PI*2); c.fill(); c.globalAlpha=1; },
          dead() { return this.alpha <= 0; },
        });
      }
      kick();
    }, delay);
  });
}

// ---- 2. 紙吹雪 ----
function launchConfetti() {
  const n = 180;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const color = rndColor();
      const w = rnd(6, 14), h = rnd(4, 9);
      particles.push({
        x: rnd(0, canvas.width),
        y: -20,
        vx: rnd(-2, 2),
        vy: rnd(2, 6),
        rot: rnd(0, Math.PI * 2),
        rotV: rnd(-0.15, 0.15),
        alpha: 1, color, w, h,
        life: rnd(120, 200), age: 0,
        update() { this.x+=this.vx; this.y+=this.vy; this.vx*=0.99; this.rot+=this.rotV; this.age++; if(this.age>this.life*0.7) this.alpha-=0.018; },
        draw(c) {
          c.save(); c.globalAlpha=this.alpha; c.fillStyle=this.color;
          c.translate(this.x,this.y); c.rotate(this.rot);
          c.fillRect(-this.w/2, -this.h/2, this.w, this.h);
          c.restore();
        },
        dead() { return this.alpha <= 0 || this.y > canvas.height + 20; },
      });
      kick();
    }, i * 8);
  }
}

// ---- 3. ハート ----
function heartPath(c, x, y, size) {
  c.beginPath();
  c.moveTo(x, y + size * 0.3);
  c.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
  c.bezierCurveTo(x - size * 0.5, y + size * 0.65, x, y + size * 0.9, x, y + size * 1.1);
  c.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.65, x + size * 0.5, y + size * 0.3);
  c.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
  c.closePath();
}

function launchHearts() {
  const colors = ['#ff6b9d','#ff4f81','#ff85b3','#ffb3cc','#ff1a6e','#ff69b4'];
  const n = 30;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const color = colors[rndInt(0, colors.length)];
      const size  = rnd(16, 40);
      particles.push({
        x: rnd(canvas.width * 0.1, canvas.width * 0.9),
        y: canvas.height + 20,
        vx: rnd(-1.5, 1.5),
        vy: rnd(-4, -8),
        alpha: 1, color, size,
        wobble: rnd(0, Math.PI * 2),
        wobbleSpeed: rnd(0.04, 0.1),
        update() { this.wobble+=this.wobbleSpeed; this.x+=this.vx+Math.sin(this.wobble)*0.8; this.y+=this.vy; this.vy*=0.99; this.alpha-=0.008; },
        draw(c) { c.save(); c.globalAlpha=this.alpha; c.fillStyle=this.color; heartPath(c,this.x,this.y,this.size); c.fill(); c.restore(); },
        dead() { return this.alpha <= 0 || this.y < -60; },
      });
      kick();
    }, i * 40);
  }
}

// ---- 4. 星屑 ----
function drawStar(c, x, y, r, points=5) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    i === 0 ? c.moveTo(x + Math.cos(angle)*radius, y + Math.sin(angle)*radius)
             : c.lineTo(x + Math.cos(angle)*radius, y + Math.sin(angle)*radius);
  }
  c.closePath();
}

function launchStars() {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const n = 60;
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i;
    const spd   = rnd(3, 10);
    const color = rndColor();
    const size  = rnd(8, 20);
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      alpha: 1, color, size,
      rot: rnd(0, Math.PI * 2),
      rotV: rnd(-0.1, 0.1),
      decay: rnd(0.008, 0.016),
      update() { this.x+=this.vx; this.y+=this.vy; this.vx*=0.97; this.vy*=0.97; this.vy+=0.05; this.rot+=this.rotV; this.alpha-=this.decay; },
      draw(c) { c.save(); c.globalAlpha=this.alpha; c.fillStyle=this.color; c.translate(this.x,this.y); c.rotate(this.rot); drawStar(c,0,0,this.size); c.fill(); c.restore(); },
      dead() { return this.alpha <= 0; },
    });
  }
  kick();
}

// ---- 5. シャボン玉 ----
function launchBubbles() {
  const n = 25;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const r = rnd(18, 50);
      const hue = rnd(0, 360) | 0;
      particles.push({
        x: rnd(r, canvas.width - r),
        y: canvas.height + r,
        vx: rnd(-1, 1),
        vy: rnd(-1.5, -3.5),
        alpha: rnd(0.4, 0.7),
        r, hue,
        wobble: rnd(0, Math.PI * 2),
        wobbleSpeed: rnd(0.02, 0.06),
        update() { this.wobble+=this.wobbleSpeed; this.x+=this.vx+Math.sin(this.wobble)*0.5; this.y+=this.vy; this.alpha-=0.004; },
        draw(c) {
          c.save(); c.globalAlpha = this.alpha;
          // 本体
          const grad = c.createRadialGradient(this.x - this.r*0.3, this.y - this.r*0.3, this.r*0.05, this.x, this.y, this.r);
          grad.addColorStop(0, `hsla(${this.hue},80%,95%,0.9)`);
          grad.addColorStop(0.5, `hsla(${this.hue},70%,70%,0.2)`);
          grad.addColorStop(1, `hsla(${this.hue},80%,60%,0.6)`);
          c.fillStyle = grad;
          c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI*2); c.fill();
          // 輪郭
          c.strokeStyle = `hsla(${this.hue},80%,80%,0.5)`;
          c.lineWidth = 1.5;
          c.stroke();
          // ハイライト
          c.fillStyle = 'rgba(255,255,255,0.6)';
          c.beginPath(); c.ellipse(this.x - this.r*0.3, this.y - this.r*0.3, this.r*0.2, this.r*0.12, -Math.PI/4, 0, Math.PI*2); c.fill();
          c.restore();
        },
        dead() { return this.alpha <= 0 || this.y < -this.r * 2; },
      });
      kick();
    }, i * 60);
  }
}

// ---- ランダムで発動 ----
const effects = [launchFireworks, launchConfetti, launchHearts, launchStars, launchBubbles];

document.querySelectorAll('.dl').forEach(a => {
  a.addEventListener('click', () => {
    const fn = effects[rndInt(0, effects.length)];
    fn();
  });
});
