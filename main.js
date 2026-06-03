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
function makeBolt(x1, y1, x2, y2, depth){
  if(depth === 0) return [[x1,y1,x2,y2]];
  const spread = rnd(60, 160) * (depth / 5);
  const mx = (x1+x2)/2 + rnd(-1,1) * spread;
  const my = (y1+y2)/2 + rnd(-1,1) * spread * 0.3;
  const segs = [
    ...makeBolt(x1,y1,mx,my,depth-1),
    ...makeBolt(mx,my,x2,y2,depth-1),
  ];
  if(depth >= 3 && Math.random() < 0.6){
    const bx = mx + rnd(-1,1)*rnd(80,200);
    const by = my + rnd(60,200);
    segs.push(...makeBolt(mx,my,bx,by,depth-2));
  }
  if(depth >= 2 && Math.random() < 0.4){
    const bx = mx + rnd(-1,1)*rnd(40,120);
    const by = my + rnd(40,120);
    segs.push(...makeBolt(mx,my,bx,by,depth-2));
  }
  return segs;
}

function drawBolt(segs, alpha, width, glowColor){
  segs.forEach(([x1,y1,x2,y2]) => {
    ctx.save();
    // 外側グロー（超太め）
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 60;
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.6})`;
    ctx.lineWidth   = width * 4;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // 中グロー
    ctx.shadowBlur  = 25;
    ctx.strokeStyle = glowColor.replace('1)', `${alpha})`);
    ctx.lineWidth   = width * 2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // 芯（白・細い）
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth   = width * 0.6;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  });
}

function launchLightning(){
  const W = canvas.width, H = canvas.height;

  // 5〜7本、複数の色で
  const colors = [
    'rgba(150,200,255,1)',  // 青白
    'rgba(220,150,255,1)',  // 紫
    'rgba(255,255,150,1)',  // 黄
    'rgba(150,255,220,1)',  // 緑
  ];
  const bolts = [];
  const count = rndInt(5, 8);
  for(let b = 0; b < count; b++){
    const x1 = rnd(W*0.05, W*0.95);
    bolts.push({
      segs: makeBolt(x1, 0, x1 + rnd(-200,200), H * rnd(0.7,1.1), 5),
      delay: b * rndInt(30, 80),
      alpha: 1,
      width: rnd(1.5, 4),
      color: colors[rndInt(0, colors.length)],
    });
  }

  let frame = 0;
  (function loop(){
    ctx.clearRect(0, 0, W, H);
    let alive = false;

    // 落雷ごとの全画面フラッシュ
    bolts.forEach(bolt => {
      if(frame < bolt.delay) return;
      const age = frame - bolt.delay;
      if(age < 4){
        const fi = (4 - age) / 4;
        ctx.fillStyle = `rgba(200,220,255,${fi * 0.55})`;
        ctx.fillRect(0, 0, W, H);
      }
    });

    bolts.forEach(bolt => {
      if(frame < bolt.delay) return;
      const age = frame - bolt.delay;
      bolt.alpha = Math.max(0, 1 - age / 22);
      if(bolt.alpha <= 0) return;
      alive = true;
      drawBolt(bolt.segs, bolt.alpha, bolt.width, bolt.color);
    });

    frame++;
    if(alive || frame < 8) requestAnimationFrame(loop);
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
