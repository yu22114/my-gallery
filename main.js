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

      // 始点にコダック画像（透明度変えない・ずっとくっきり）
      if(kodakImg.complete){
        const s = 70;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.shadowColor = bolt.color;
        ctx.shadowBlur  = 24;
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
      const imgSize  = fontSize * 5.5;

      // 文字の裏に薄いコダック
      if(kodakImg.complete){
        ctx.save();
        ctx.globalAlpha = textAlpha * 0.75;
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
// 4. 暗い画面をコダックがゆっくり横切る
// ========================================
function launchFlash(done){
  const W = canvas.width, H = canvas.height;
  const imgH = H * 0.45;
  const imgW = imgH * (kodakImg.naturalWidth / kodakImg.naturalHeight || 1);
  const y    = (H - imgH) / 2;
  const speed = W / 120;   // 約2秒で横断（60fps想定）
  let x = -imgW;           // 左端の外からスタート

  (function loop(){
    ctx.clearRect(0, 0, W, H);

    // 暗幕（コダックが通り過ぎるまでずっと暗い）
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);

    // コダック
    x += speed;
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur  = 20;
    ctx.drawImage(kodakImg, x, y, imgW, imgH);
    ctx.restore();

    if(x < W){
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      done?.();
    }
  })();
}

// ========================================
// 5. 【レア】コダックが画面を一周
// ========================================
function launchRareOrbit(done){
  const W = canvas.width, H = canvas.height;
  const s   = Math.min(W, H) * 0.22;   // 画像サイズ
  const m   = s * 0.5;                  // 画面端からの余白（画像半分＝はみ出さない）

  // 画像の中心が通るウェイポイント（左上→右上→右下→左下→左上で一周）
  const pts = [
    { x: m,   y: m   },   // 左上
    { x: W-m, y: m   },   // 右上
    { x: W-m, y: H-m },   // 右下
    { x: m,   y: H-m },   // 左下
    { x: m,   y: m   },   // 左上（一周して戻る）
  ];

  const speed = 3;   // px/frame
  let seg = 0;
  let cx  = pts[0].x;
  let cy  = pts[0].y;

  (function loop(){
    ctx.clearRect(0, 0, W, H);

    // 暗幕
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, W, H);

    // ★ RARE ★
    ctx.save();
    ctx.font         = `900 ${Math.min(W*0.1, 52)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#ffd700';
    ctx.shadowColor  = '#ff8800';
    ctx.shadowBlur   = 30;
    ctx.fillText('★ RARE ★', W/2, H/2);
    ctx.restore();

    // ルート点線
    ctx.save();
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 8]);
    ctx.strokeRect(m, m, W - m*2, H - m*2);
    ctx.restore();

    // コダック
    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur  = 25;
    ctx.drawImage(kodakImg, cx - s/2, cy - s/2, s, s);
    ctx.restore();

    // 次のウェイポイントへ向かって進む
    const target = pts[seg + 1];
    const dx = target.x - cx;
    const dy = target.y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if(dist <= speed){
      // ウェイポイントに到達 → ぴったり合わせて次のセグメントへ
      cx = target.x;
      cy = target.y;
      seg++;
      if(seg >= pts.length - 1){
        ctx.clearRect(0, 0, W, H);
        done?.();
        return;
      }
    } else {
      cx += (dx / dist) * speed;
      cy += (dy / dist) * speed;
    }

    requestAnimationFrame(loop);
  })();
}

// ========================================
// 6. 【超レア】コダック大量バウンド
// ========================================
function launchUltraRare(done){
  const W = canvas.width, H = canvas.height;
  const COUNT   = 28;
  const s       = Math.min(W, H) * 0.18;
  const DURATION = 280;  // フレーム数

  const balls = Array.from({length: COUNT}, () => {
    const angle = rnd(0, Math.PI * 2);
    const spd   = rnd(4, 11);
    return {
      x:  rnd(s/2, W - s/2),
      y:  rnd(s/2, H - s/2),
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      rot: rnd(0, Math.PI * 2),
      rotV: rnd(-0.08, 0.08),
    };
  });

  let frame = 0;

  (function loop(){
    // 残像でスピード感
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);

    // うおおおおおお！テキスト（点滅）
    if(frame % 10 < 6){
      ctx.save();
      ctx.font         = `900 ${Math.min(W*0.09, 48)}px sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = `hsl(${frame*8 % 360},100%,65%)`;
      ctx.shadowColor  = 'white';
      ctx.shadowBlur   = 20;
      ctx.fillText('うおおおおおお！', W/2, H/2);
      ctx.restore();
    }

    balls.forEach(b => {
      b.x  += b.vx;
      b.y  += b.vy;
      b.rot += b.rotV;

      // 壁で跳ね返る
      if(b.x - s/2 < 0)    { b.x = s/2;    b.vx = Math.abs(b.vx); }
      if(b.x + s/2 > W)    { b.x = W-s/2;  b.vx = -Math.abs(b.vx); }
      if(b.y - s/2 < 0)    { b.y = s/2;    b.vy = Math.abs(b.vy); }
      if(b.y + s/2 > H)    { b.y = H-s/2;  b.vy = -Math.abs(b.vy); }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.shadowColor = `hsl(${Math.random()*360|0},100%,70%)`;
      ctx.shadowBlur  = 15;
      ctx.drawImage(kodakImg, -s/2, -s/2, s, s);
      ctx.restore();
    });

    frame++;
    if(frame < DURATION){
      requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, W, H);
      done?.();
    }
  })();
}

// ---- ランダム発動（レアは1/10、超レアは1/20） ----
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
  a.addEventListener('click', (e) => {
    e.preventDefault();  // ブラウザのダウンロード/プレビューを先に止める

    if(isPlaying) return;
    setPlaying(true);

    const href = a.href;
    const filename = a.getAttribute('download') || 'image';

    // 最大15秒で強制終了
    const safetyTimer = setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPlaying(false);
      triggerDownload(href, filename);
    }, 15000);

    const done = () => {
      clearTimeout(safetyTimer);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPlaying(false);
      triggerDownload(href, filename);
    };

    const r = Math.random();
    const fn = r < 0.05  ? launchUltraRare
             : r < 0.15  ? launchRareOrbit
             : effects[rndInt(0, effects.length)];
    fn(done);
  });
});

function triggerDownload(href, filename){
  const a = document.createElement('a');
  a.href     = href;
  a.download = filename;
  a.click();
}
