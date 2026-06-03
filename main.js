// .galleryにliが1つ以上あれば .empty を非表示にする
const gallery = document.querySelector('.gallery');
const empty = document.querySelector('.empty');

if (gallery && gallery.children.length > 0) {
  empty.style.display = 'none';
}

// --- 花火 ---
const canvas = document.createElement('canvas');
canvas.id = 'fireworks';
Object.assign(canvas.style, {
  position: 'fixed', top: 0, left: 0,
  width: '100%', height: '100%',
  pointerEvents: 'none',
  zIndex: 9999,
});
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const particles = [];

function randomColor() {
  const h = Math.random() * 360;
  return `hsl(${h},100%,65%)`;
}

function burst(x, y) {
  const count = 80 + Math.floor(Math.random() * 40);
  const color = randomColor();
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.3;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color,
      size: 3 + Math.random() * 3,
      gravity: 0.08 + Math.random() * 0.04,
      decay: 0.012 + Math.random() * 0.008,
    });
  }
}

function launchFireworks() {
  // 3発、少しずらして打ち上げ
  const shots = [0, 200, 400];
  shots.forEach(delay => {
    setTimeout(() => {
      const x = canvas.width * (0.25 + Math.random() * 0.5);
      const y = canvas.height * (0.15 + Math.random() * 0.3);
      burst(x, y);
    }, delay);
  });
}

let animating = false;
function animate() {
  if (particles.length === 0) { animating = false; return; }
  animating = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.alpha -= p.decay;
    if (p.alpha <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(animate);
}

// ダウンロードボタンにイベント付与
document.querySelectorAll('.dl').forEach(a => {
  a.addEventListener('click', () => {
    launchFireworks();
    if (!animating) animate();
  });
});
