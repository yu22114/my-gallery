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

// ---- コダック画像プリロード ----
const kodakImg = new Image();
kodakImg.src = document.querySelector('.item img')?.src || 'images/IMG_0526.jpeg';

// ========================================
// 1. ブラックホール（エグ版）
// ========================================
function launchBlackHole(done){
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const TOTAL = 160;

  // パーティクル大量生成（画面端からも）
  const pts = Array.from({length: 500}, (_, i) => {
    const angle = rnd(0, Math.PI*2);
    const dist  = rnd(100, Math.max(W,H)*0.85);
    return {
      x: cx + Math.cos(angle)*dist,
      y: cy + Math.sin(angle)*dist,
      angle, dist,
      orbitSpeed: rnd(0.008, 0.025) * (Math.random()<0.5?1:-1),
      size: rnd(2, 7),
      hue: rndInt(180, 360),
      alpha: 1,
      prevX: 0, prevY: 0,
    };
  });

  let frame = 0;
  let shakeX = 0, shakeY = 0;

  (function loop(){
    // 画面揺れ（後半に強くなる）
    const shakeMag = Math.max(0, (frame - 60) / 100) * 14;
    shakeX = rnd(-shakeMag, shakeMag);
    shakeY = rnd(-shakeMag, shakeMag);

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.clearRect(-20, -20, W+40, H+40);

    // 背景を少しずつ暗くする
    const bgDark = Math.min(0.85, frame / TOTAL * 1.1);
    ctx.fillStyle = `rgba(0,0,0,${(bgDark * 0.18).toFixed(3)})`;
    ctx.fillRect(-20, -20, W+40, H+40);

    const holeR = Math.min(frame * 2, 90);

    // 降着円盤（回転するグロー）
    if(holeR > 10){
      for(let i = 0; i < 3; i++){
        const diskR = holeR * (1.5 + i * 0.8);
        const diskG = ctx.createRadialGradient(cx, cy, holeR*0.8, cx, cy, diskR);
        const hue = (frame * 3 + i*40) % 360;
        diskG.addColorStop(0,   `hsla(${hue},100%,80%,0.5)`);
        diskG.addColorStop(0.5, `hsla(${hue+30},100%,60%,0.15)`);
        diskG.addColorStop(1,   `hsla(${hue+60},100%,40%,0)`);
        ctx.fillStyle = diskG;
        ctx.beginPath(); ctx.arc(cx, cy, diskR, 0, Math.PI*2); ctx.fill();
      }
    }

    // パーティクル（スパゲッティ化：引き伸ばして描く）
    pts.forEach(p => {
      p.prevX = p.x; p.prevY = p.y;

      const pull = Math.pow(Math.max(0.01, 1 - p.dist / 500), 2) * 0.12 + 0.002;
      p.orbitSpeed += pull * 0.006 * Math.sign(p.orbitSpeed);
      p.angle += p.orbitSpeed;
      p.dist  *= (1 - pull * 0.055);
      p.x = cx + Math.cos(p.angle) * p.dist;
      p.y = cy + Math.sin(p.angle) * p.dist;

      if(p.dist < 8){ p.alpha -= 0.15; }

      if(p.alpha <= 0) return;

      // 距離に応じて引き伸ばす（スパゲッティ化）
      const stretch = Math.max(1, (300 - p.dist) / 30);
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.alpha * (p.dist / 80 + 0.3));
      ctx.strokeStyle = `hsl(${p.hue},100%,75%)`;
      ctx.shadowColor = `hsl(${p.hue},100%,70%)`;
      ctx.shadowBlur  = stretch > 3 ? 15 : 4;
      ctx.lineWidth   = p.size * Math.min(1, p.dist/100);
      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    });

    // 中心の黒い穴（ぐわっと広がる）
    if(holeR > 0){
      const g = ctx.createRadialGradient(cx,cy,0, cx,cy,holeR*3);
      g.addColorStop(0,    'rgba(0,0,0,1)');
      g.addColorStop(0.35, 'rgba(0,0,0,0.98)');
      g.addColorStop(0.6,  'rgba(0,0,0,0.5)');
      g.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, holeR*3, 0, Math.PI*2); ctx.fill();

      // 中心の白いリング（事象の地平線）
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.9, frame/40)})`;
      ctx.shadowColor = 'rgba(255,255,255,1)';
      ctx.shadowBlur  = 25;
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.arc(cx, cy, holeR, 0, Math.PI*2); ctx.stroke();
      ctx.restore();

      // 中心にコダック画像（穴より少し小さく・回転しながら吸い込まれる雰囲気）
      if(kodakImg.complete && holeR > 8){
        const imgR = holeR * 0.85;
        ctx.save();
        ctx.globalAlpha = Math.min(1, frame/30);
        ctx.translate(cx, cy);
        ctx.rotate(frame * 0.04);
        ctx.beginPath(); ctx.arc(0, 0, imgR, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(kodakImg, -imgR, -imgR, imgR*2, imgR*2);
        ctx.restore();
      }
    }

    ctx.restore();

    // 最後に崩壊フラッシュ
    if(frame >= TOTAL - 12){
      const fi = (frame - (TOTAL-12)) / 12;
      ctx.fillStyle = `rgba(255,255,255,${(fi * 0.9).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if(frame === TOTAL - 1){
      setTimeout(()=>{ ctx.clearRect(0,0,W,H); done?.(); }, 200);
    }

    frame++;
    if(frame < TOTAL) requestAnimationFrame(loop);
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

function launchLightning(done){
  const W = canvas.width, H = canvas.height;
  const colors = [
    'rgba(150,200,255,1)',
    'rgba(220,150,255,1)',
    'rgba(255,255,150,1)',
    'rgba(150,255,220,1)',
  ];

  // 4本を順番に落とす。1本落ちきってから次を生成
  const STRIKES = 4;
  let strikesDone = 0;
  let bolts = [];
  let frame = 0;

  function spawnBolt(){
    const x1  = rnd(W*0.05, W*0.95);
    const y1  = H * rnd(0.22, 0.28);   // 画面の上から1/4あたり
    return {
      segs: makeBolt(x1, y1, x1 + rnd(-200,200), H * rnd(0.9,1.05), 5),
      frame: 0,
      width: rnd(1.5, 4),
      color: colors[rndInt(0, colors.length)],
      alpha: 1,
      imgX: x1,
      imgY: y1,   // 始点Y
    };
  }

  bolts.push(spawnBolt());

  (function loop(){
    ctx.clearRect(0, 0, W, H);

    bolts.forEach(bolt => {
      // 登場直後フラッシュ
      if(bolt.frame < 4){
        const fi = (4 - bolt.frame) / 4;
        ctx.fillStyle = `rgba(200,220,255,${fi * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
      bolt.alpha = Math.max(0, 1 - bolt.frame / 22);
      drawBolt(bolt.segs, bolt.alpha, bolt.width, bolt.color);

      // 始点にコダック画像（四角・透明度50%・グロー付き）
      if(kodakImg.complete && bolt.alpha > 0){
        const s = 56;  // 一辺のサイズ
        ctx.save();
        ctx.globalAlpha = bolt.alpha;
        ctx.shadowColor = bolt.color;
        ctx.shadowBlur  = 20;
        ctx.drawImage(kodakImg, bolt.imgX - s/2, bolt.imgY - s/2, s, s);
        ctx.restore();
      }

      bolt.frame++;
    });

    // 今のボルトが消えたら次を生成
    if(bolts.length > 0 && bolts[bolts.length-1].alpha <= 0){
      bolts = [];
      strikesDone++;
      if(strikesDone < STRIKES){
        // 少し間を置いてから次の雷
        setTimeout(()=>{ bolts.push(spawnBolt()); }, rndInt(80,200));
      }
    }

    frame++;
    if(strikesDone < STRIKES || bolts.some(b => b.alpha > 0)){
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      done?.();
    }
  })();
}

// ========================================
// 3. NICE!! テキスト爆発（全部乗せ版）
// ========================================
const WORDS = [
  'NICE!!', 'YOOO!!', 'GJ!!', 'FIRE🔥', "LET'S GO!!",
  'さいこう！！', 'ありがとう！！', 'うれしい〜！！',
  'やばすぎ！！', 'まじか〜！！', '神！！', 'つよすぎ！！',
];

function heartPath2(c,x,y,s){
  c.beginPath();
  c.moveTo(x,y+s*0.3);
  c.bezierCurveTo(x,y,x-s*0.5,y,x-s*0.5,y+s*0.3);
  c.bezierCurveTo(x-s*0.5,y+s*0.65,x,y+s*0.9,x,y+s*1.1);
  c.bezierCurveTo(x,y+s*0.9,x+s*0.5,y+s*0.65,x+s*0.5,y+s*0.3);
  c.bezierCurveTo(x+s*0.5,y,x,y,x,y+s*0.3);
  c.closePath();
}

function launchTextBoom(done){
  const W = canvas.width, H = canvas.height;
  const word = WORDS[rndInt(0, WORDS.length)];
  const cx = W/2, cy = H/2;

  // 衝撃波リング
  const rings = [
    { r:0, speed:20, alpha:1,   color:'255,255,255' },
    { r:0, speed:13, alpha:0.8, color:'255,200,50'  },
    { r:0, speed:8,  alpha:0.6, color:'255,100,200' },
  ];

  // スパーク
  const sparks = Array.from({length:80}, () => {
    const a = rnd(0,Math.PI*2), s = rnd(8,25);
    return { x:cx, y:cy, vx:Math.cos(a)*s, vy:Math.sin(a)*s, alpha:1, size:rnd(2,7), hue:rndInt(0,360) };
  });

  // 花びら（紙吹雪）
  const petals = Array.from({length:200}, () => ({
    x:rnd(0,W), y:-20,
    vx:rnd(-3,3), vy:rnd(3,9),
    rot:rnd(0,Math.PI*2), rotV:rnd(-0.2,0.2),
    w:rnd(6,16), h:rnd(4,10),
    alpha:1, color:`hsl(${rndInt(0,360)},100%,65%)`,
    wobble:rnd(0,Math.PI*2), wobbleSpd:rnd(0.05,0.15),
    born: rndInt(0,20),
  }));

  // ハート
  const hearts = Array.from({length:40}, () => {
    const hColors = ['#ff1493','#ff69b4','#ff6b9d','#ff0066','#ffb3d9','#ff4da6'];
    return {
      x:rnd(0,W), y:H+rnd(0,80),
      vx:rnd(-2,2), vy:rnd(-6,-12),
      alpha:1, size:rnd(20,55),
      color:hColors[rndInt(0,hColors.length)],
      wobble:rnd(0,Math.PI*2), wobbleSpd:rnd(0.04,0.1),
      born: rndInt(0,30),
    };
  });

  // 花火パーティクル
  const fireParticles = [];
  [[0.2,0.25],[0.8,0.25],[0.5,0.15],[0.15,0.5],[0.85,0.5]].forEach(([fx,fy],i) => {
    const bx = W*fx, by = H*fy, color = `hsl(${rndInt(0,360)},100%,65%)`;
    const n = 80;
    for(let j=0;j<n;j++){
      const a=rnd(0,Math.PI*2), spd=rnd(3,12);
      fireParticles.push({
        x:bx, y:by, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
        alpha:1, color, size:rnd(2,6),
        grav:rnd(0.06,0.12), decay:rnd(0.008,0.018),
        born: i * 12,
      });
    }
  });

  let frame = 0;
  const TOTAL = 130;

  (function loop(){
    ctx.clearRect(0, 0, W, H);

    // 花火
    fireParticles.forEach(p => {
      if(frame < p.born) return;
      p.x+=p.vx; p.y+=p.vy; p.vy+=p.grav; p.vx*=0.97; p.alpha-=p.decay;
      if(p.alpha<=0) return;
      ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    });

    // 紙吹雪
    petals.forEach(p => {
      if(frame < p.born) return;
      p.wobble+=p.wobbleSpd; p.x+=p.vx+Math.sin(p.wobble)*1.5; p.y+=p.vy; p.rot+=p.rotV;
      if(p.y > H*0.7) p.alpha -= 0.015;
      if(p.alpha<=0) return;
      ctx.save(); ctx.globalAlpha=p.alpha; ctx.fillStyle=p.color;
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });

    // ハート
    hearts.forEach(h => {
      if(frame < h.born) return;
      h.wobble+=h.wobbleSpd; h.x+=h.vx+Math.sin(h.wobble)*1.2; h.y+=h.vy; h.vy*=0.995; h.alpha-=0.007;
      if(h.alpha<=0) return;
      ctx.save(); ctx.globalAlpha=h.alpha; ctx.fillStyle=h.color;
      ctx.shadowColor=h.color; ctx.shadowBlur=15;
      heartPath2(ctx, h.x-h.size/2, h.y-h.size/2, h.size);
      ctx.fill(); ctx.restore();
    });

    // 衝撃波
    rings.forEach(ring => {
      ring.r += ring.speed; ring.alpha = Math.max(0, ring.alpha-0.035);
      if(ring.alpha<=0) return;
      ctx.save(); ctx.globalAlpha=ring.alpha;
      ctx.strokeStyle=`rgba(${ring.color},1)`;
      ctx.lineWidth=Math.max(1, 10*(1-ring.r/(W*0.9)));
      ctx.shadowColor=`rgba(${ring.color},0.8)`; ctx.shadowBlur=25;
      ctx.beginPath(); ctx.arc(cx,cy,ring.r,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    });

    // スパーク
    sparks.forEach(s => {
      s.x+=s.vx; s.y+=s.vy; s.vx*=0.94; s.vy*=0.94; s.vy+=0.35; s.alpha-=0.018;
      if(s.alpha<=0) return;
      ctx.globalAlpha=s.alpha; ctx.fillStyle=`hsl(${s.hue},100%,65%)`;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;

    // テキスト（中央・ドーンと出て残る）
    const scale = frame < 6 ? frame/6 : Math.min(1.08, 1+(frame-6)*0.003);
    const textAlpha = frame < 4 ? frame/4 : Math.max(0, 1-(frame-40)/50);
    if(textAlpha > 0){
      const fontSize = Math.min(W*0.13, 72) * scale;
      const imgSize  = fontSize * 3.5;

      // 文字の裏に薄いコダック
      if(kodakImg.complete){
        ctx.save();
        ctx.globalAlpha = textAlpha * 0.5;
        ctx.drawImage(kodakImg, cx - imgSize/2, cy - imgSize/2, imgSize, imgSize);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha  = textAlpha;
      ctx.font         = `900 ${fontSize}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      // 影を何重にも重ねてギラギラに
      ctx.shadowColor='#ff00ff'; ctx.shadowBlur=60; ctx.fillStyle='#fff'; ctx.fillText(word,cx,cy);
      ctx.shadowColor='#ffdd00'; ctx.shadowBlur=40; ctx.fillText(word,cx,cy);
      ctx.shadowColor='#ffffff'; ctx.shadowBlur=20; ctx.fillText(word,cx,cy);
      ctx.shadowBlur=0;
      ctx.strokeStyle='#ff8800'; ctx.lineWidth=fontSize*0.045; ctx.strokeText(word,cx,cy);
      ctx.restore();
    }

    frame++;
    if(frame < TOTAL) requestAnimationFrame(loop);
    else { ctx.clearRect(0,0,W,H); done?.(); }
  })();
}

// ========================================
// 4. 画面フラッシュ（黒→白い光がピキーん）
// ========================================
function launchFlash(done){
  const W = canvas.width, H = canvas.height;
  const DARK_FRAMES = 14, HOLD_FRAMES = 18, FADE_FRAMES = 50;

  const lines = [];
  for(let i = 0; i < rndInt(2,4); i++){
    lines.push({ y:H*rnd(0.1,0.9), x:-250, halfW:rnd(80,200), speed:rnd(15,32), thickness:rnd(2,8) });
  }
  // 主役のコダックラインはゆっくり目
  lines.push({ y:H*rnd(0.3,0.7), x:-500, halfW:rnd(280,500), speed:rnd(40,65), thickness:rnd(12,26) });

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

          // グロー帯（白い光）
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
          ctx.restore();

          // コダック画像が光と一緒に走る
          if(kodakImg.complete){
            const imgH = l.thickness * 12;
            const imgW = imgH * (kodakImg.naturalWidth / kodakImg.naturalHeight || 1);
            ctx.save();
            ctx.globalAlpha = a * 0.9;
            ctx.shadowColor = 'rgba(255,255,255,0.8)';
            ctx.shadowBlur  = 30;
            ctx.drawImage(kodakImg, l.x - imgW/2, l.y - imgH/2, imgW, imgH);
            ctx.restore();
          }
        }
      });
    }

    frame++;
    if(frame < total) requestAnimationFrame(flashLoop);
    else { ctx.clearRect(0, 0, W, H); done?.(); }
  })();
}

// ---- ランダム発動 ----
const effects = [launchBlackHole, launchLightning, launchTextBoom, launchFlash];
let isPlaying = false;

function setPlaying(val){
  isPlaying = val;
  document.querySelectorAll('.dl').forEach(a => {
    a.style.pointerEvents = val ? 'none' : '';
    a.style.opacity       = val ? '0.4'  : '';
  });
}

document.querySelectorAll('.dl').forEach(a => {
  a.addEventListener('click', () => {
    if(isPlaying) return;
    setPlaying(true);
    effects[rndInt(0, effects.length)](()=> setPlaying(false));
  });
});
