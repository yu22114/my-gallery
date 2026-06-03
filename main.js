// .galleryにliが1つ以上あれば .empty を非表示にする
const gallery = document.querySelector('.gallery');
const empty   = document.querySelector('.empty');
if (gallery && gallery.children.length > 0) empty.style.display = 'none';

// ---- Canvas ----
const canvas = document.createElement('canvas');
canvas.id = 'fx';
Object.assign(canvas.style, {
  position:'fixed', top:0, left:0, width:'100%', height:'100%',
  pointerEvents:'none', zIndex:9999,
});
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); window.addEventListener('resize', resize);

function rnd(a,b){ return a + Math.random()*(b-a); }
function rndInt(a,b){ return rnd(a,b)|0; }

// ========================================
// 1. ブラックホール
// ========================================
function launchBlackHole(){
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const TOTAL = 120;

  // パーティクルを画面全体にばら撒く
  const pts = Array.from({length: 300}, () => ({
    x: rnd(0, W),
    y: rnd(0, H),
    angle: Math.atan2(rnd(0,H)-cy, rnd(0,W)-cx),
    dist: rnd(80, Math.max(W,H)*0.7),
    speed: rnd(0.01, 0.03),
    size: rnd(2, 6),
    hue: rndInt(200, 320),
    alpha: 1,
  }));
  pts.forEach(p => {
    p.x = cx + Math.cos(p.angle) * p.dist;
    p.y = cy + Math.sin(p.angle) * p.dist;
  });

  let frame = 0;
  (function loop(){
    ctx.clearRect(0, 0, W, H);

    // 中心の黒い穴
    const holeR = Math.min(frame * 1.5, 60);
    if(holeR > 0){
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, holeR * 2.5);
      g.addColorStop(0,   'rgba(0,0,0,0.95)');
      g.addColorStop(0.4, 'rgba(0,0,0,0.6)');
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, holeR * 2.5, 0, Math.PI*2); ctx.fill();
    }

    pts.forEach(p => {
      const pull = Math.max(0.02, 1 - p.dist / 600);
      p.speed += pull * 0.004;
      p.angle += p.speed;
      p.dist  *= (1 - pull * 0.04);
      p.x = cx + Math.cos(p.angle) * p.dist;
      p.y = cy + Math.sin(p.angle) * p.dist;
      if(p.dist < 5) p.alpha -= 0.1;

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = `hsl(${p.hue},100%,70%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * Math.max(0.1, p.dist/200), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    frame++;
    if(frame < TOTAL) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, W, H);
  })();
}

// ========================================
// 2. 稲妻
// ========================================
function lightning(x1, y1, x2, y2, depth){
  if(depth === 0) return [[x1,y1,x2,y2]];
  const mx = (x1+x2)/2 + rnd(-1,1) * rnd(20,80) * (depth/4);
  const my = (y1+y2)/2 + rnd(-1,1) * rnd(20,80) * (depth/4);
  const segs = [
    ...lightning(x1,y1,mx,my,depth-1),
    ...lightning(mx,my,x2,y2,depth-1),
  ];
  // ランダムに枝を生やす
  if(depth >= 2 && Math.random() < 0.4){
    const bx = mx + rnd(-1,1)*100, by = my + rnd(30,120);
    segs.push(...lightning(mx,my,bx,by,depth-2));
  }
  return segs;
}

function launchLightning(){
  const W = canvas.width, H = canvas.height;
  const bolts = [];

  // 2〜4本の稲妻
  for(let b = 0; b < rndInt(2,5); b++){
    const x1 = rnd(W*0.2, W*0.8);
    const segs = lightning(x1, 0, x1 + rnd(-100,100), H, 4);
    bolts.push({ segs, delay: b * rndInt(60,120), alpha: 1 });
  }

  let frame = 0;
  (function loop(){
    ctx.clearRect(0, 0, W, H);
    let alive = false;

    bolts.forEach(bolt => {
      if(frame < bolt.delay) return;
      const age = frame - bolt.delay;

      // 最初の数フレームは全体フラッシュ
      if(age < 3){
        ctx.fillStyle = `rgba(200,220,255,${0.15 * (3-age)/3})`;
        ctx.fillRect(0, 0, W, H);
      }

      bolt.alpha = Math.max(0, 1 - age/18);
      if(bolt.alpha <= 0) return;
      alive = true;

      bolt.segs.forEach(([x1,y1,x2,y2]) => {
        // グロー
        ctx.save();
        ctx.shadowColor = 'rgba(180,220,255,1)';
        ctx.shadowBlur  = 20;
        ctx.strokeStyle = `rgba(255,255,255,${bolt.alpha})`;
        ctx.lineWidth   = rnd(1, 3);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        // 細い芯
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = `rgba(220,240,255,${bolt.alpha})`;
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        ctx.restore();
      });
    });

    frame++;
    if(alive || frame < 10) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, W, H);
  })();
}

// ========================================
// 3. NICE!! テキスト爆発
// ========================================
const WORDS = ['NICE!!', 'YOOO!!', 'GJ!!', 'FIRE🔥', 'LET\'S GO!!', 'BASED!!', 'W!!!'];

function launchTextBoom(){
  const W = canvas.width, H = canvas.height;
  const word  = WORDS[rndInt(0, WORDS.length)];
  const cx = W/2, cy = H/2;

  // 衝撃波リング
  const rings = [
    { r:0, speed:18, alpha:1, color:'255,255,255' },
    { r:0, speed:12, alpha:0.7, color:'255,200,50' },
  ];

  // スパーク
  const sparks = Array.from({length:60}, () => {
    const a = rnd(0, Math.PI*2), s = rnd(8,22);
    return { x:cx, y:cy, vx:Math.cos(a)*s, vy:Math.sin(a)*s, alpha:1, size:rnd(2,6), hue:rndInt(30,60) };
  });

  let frame = 0;
  const TOTAL = 70;

  (function loop(){
    ctx.clearRect(0, 0, W, H);
    const t = frame / TOTAL;

    // テキスト
    const scale = frame < 8 ? frame/8 : 1 + (frame-8)*0.005;
    const textAlpha = frame < 5 ? frame/5 : Math.max(0, 1 - (frame-5)/35);
    if(textAlpha > 0){
      const size = Math.min(W*0.22, 120) * scale;
      ctx.save();
      ctx.globalAlpha  = textAlpha;
      ctx.font         = `900 ${size}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#fff';
      ctx.shadowColor  = '#ffdd00';
      ctx.shadowBlur   = 40;
      ctx.fillText(word, cx, cy);
      ctx.shadowBlur   = 0;
      ctx.strokeStyle  = '#ffaa00';
      ctx.lineWidth    = size * 0.04;
      ctx.strokeText(word, cx, cy);
      ctx.restore();
    }

    // 衝撃波
    rings.forEach(ring => {
      ring.r += ring.speed;
      ring.alpha = Math.max(0, ring.alpha - 0.04);
      if(ring.alpha > 0){
        ctx.save();
        ctx.globalAlpha  = ring.alpha;
        ctx.strokeStyle  = `rgba(${ring.color},1)`;
        ctx.lineWidth    = Math.max(1, 8*(1-ring.r/(W*0.8)));
        ctx.shadowColor  = `rgba(${ring.color},0.8)`;
        ctx.shadowBlur   = 20;
        ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }
    });

    // スパーク
    sparks.forEach(s => {
      s.x += s.vx; s.y += s.vy;
      s.vx *= 0.95; s.vy *= 0.95; s.vy += 0.3;
      s.alpha -= 0.022;
      if(s.alpha > 0){
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle   = `hsl(${s.hue},100%,65%)`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    frame++;
    if(frame < TOTAL) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, W, H);
  })();
}

// ========================================
// 4. 画面フラッシュ（黒→白い光がピキーん）
// ========================================
function launchFlash(){
  const W = canvas.width, H = canvas.height;
  const DARK_FRAMES = 8, HOLD_FRAMES = 6, FADE_FRAMES = 25;

  const lines = [];
  for(let i = 0; i < rndInt(2,4); i++){
    lines.push({ y:H*rnd(0.1,0.9), x:-250, halfW:rnd(80,200), speed:rnd(30,65), thickness:rnd(2,8) });
  }
  lines.push({ y:H*rnd(0.3,0.7), x:-500, halfW:rnd(280,500), speed:rnd(85,130), thickness:rnd(12,26) });

  let frame = 0;
  const total = DARK_FRAMES + HOLD_FRAMES + FADE_FRAMES + 40;

  (function flashLoop(){
    ctx.clearRect(0, 0, W, H);
    let darkAlpha = 0;
    if(frame < DARK_FRAMES){
      darkAlpha = frame / DARK_FRAMES;
    } else if(frame < DARK_FRAMES + HOLD_FRAMES){
      darkAlpha = 1;
    } else {
      darkAlpha = Math.max(0, 1 - (frame - DARK_FRAMES - HOLD_FRAMES) / FADE_FRAMES);
    }
    if(darkAlpha > 0){
      ctx.fillStyle = `rgba(0,0,0,${darkAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    const lineStart = DARK_FRAMES + HOLD_FRAMES - 4;
    if(frame >= lineStart){
      const lineFade = Math.max(0, 1 - (frame - lineStart) / 35);
      lines.forEach(l => {
        l.x += l.speed;
        if(l.x < W + l.halfW){
          const a = lineFade;
          const grad = ctx.createLinearGradient(l.x-l.halfW,0,l.x+l.halfW,0);
          grad.addColorStop(0,    'rgba(255,255,255,0)');
          grad.addColorStop(0.35, `rgba(255,255,255,${(a*0.3).toFixed(3)})`);
          grad.addColorStop(0.5,  `rgba(255,255,255,${a.toFixed(3)})`);
          grad.addColorStop(0.65, `rgba(255,255,255,${(a*0.3).toFixed(3)})`);
          grad.addColorStop(1,    'rgba(255,255,255,0)');
          ctx.save();
          ctx.shadowColor = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.shadowBlur  = 60;
          ctx.fillStyle   = grad;
          ctx.fillRect(l.x-l.halfW, l.y-l.thickness*5, l.halfW*2, l.thickness*10);
          ctx.shadowBlur  = 0;
          ctx.fillStyle   = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.fillRect(l.x-l.halfW, l.y-l.thickness/2, l.halfW*2, l.thickness);
          ctx.restore();
        }
      });
    }

    frame++;
    if(frame < total) requestAnimationFrame(flashLoop);
    else ctx.clearRect(0, 0, W, H);
  })();
}

// ---- ランダム発動 ----
const effects = [launchBlackHole, launchLightning, launchTextBoom, launchFlash];

document.querySelectorAll('.dl').forEach(a => {
  a.addEventListener('click', () => {
    effects[rndInt(0, effects.length)]();
  });
});
