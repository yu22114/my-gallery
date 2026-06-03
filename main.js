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

// ---- フラッシュ用オーバーレイ ----
const overlay = document.createElement('div');
Object.assign(overlay.style, {
  position:'fixed', inset:0, background:'#000',
  opacity:0, pointerEvents:'none', zIndex:9998,
  transition:'opacity 0s',
});
document.body.appendChild(overlay);

// ---- パーティクル ----
const particles = [];
let animating = false;
function loop(){
  if(!particles.length){ animating=false; ctx.clearRect(0,0,canvas.width,canvas.height); return; }
  animating = true;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.update(); p.draw(ctx);
    if(p.dead()) particles.splice(i,1);
  }
  requestAnimationFrame(loop);
}
function kick(){ if(!animating){ animating=true; loop(); } }

function rnd(a,b){ return a+Math.random()*(b-a); }
function rndInt(a,b){ return rnd(a,b)|0; }
function rndColor(){ return `hsl(${rnd(0,360)|0},100%,65%)`; }
function rndBright(){ return `hsl(${rnd(0,360)|0},100%,80%)`; }

// ========== 1. 花火（超ド派手版） ==========
function launchFireworks(){
  const shotCount = 8;
  for(let s=0;s<shotCount;s++){
    setTimeout(()=>{
      const x = canvas.width  * rnd(0.1,0.9);
      const y = canvas.height * rnd(0.05,0.5);
      const color1 = rndColor(), color2 = rndColor();
      const n = rndInt(120,180);
      // メイン爆発
      for(let i=0;i<n;i++){
        const angle = (Math.PI*2/n)*i + rnd(-0.15,0.15);
        const spd   = rnd(4,14);
        particles.push({
          x,y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
          alpha:1, color:Math.random()<0.5?color1:color2,
          size:rnd(3,8), grav:rnd(0.06,0.14), decay:rnd(0.008,0.016),
          trail:[],
          update(){ this.trail.push({x:this.x,y:this.y,a:this.alpha}); if(this.trail.length>8)this.trail.shift(); this.x+=this.vx; this.y+=this.vy; this.vy+=this.grav; this.vx*=0.97; this.alpha-=this.decay; },
          draw(c){ this.trail.forEach((t,i)=>{ c.globalAlpha=t.a*(i/this.trail.length)*0.4; c.fillStyle=this.color; c.beginPath(); c.arc(t.x,t.y,this.size*0.6,0,Math.PI*2); c.fill(); }); c.globalAlpha=this.alpha; c.fillStyle=this.color; c.beginPath(); c.arc(this.x,this.y,this.size,0,Math.PI*2); c.fill(); c.globalAlpha=1; },
          dead(){ return this.alpha<=0; },
        });
      }
      // キラキラ小粒
      for(let i=0;i<60;i++){
        const angle=rnd(0,Math.PI*2), spd=rnd(1,6);
        particles.push({
          x,y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
          alpha:1, color:'#fff', size:rnd(1,3),
          grav:rnd(0.02,0.08), decay:rnd(0.02,0.04),
          update(){ this.x+=this.vx; this.y+=this.vy; this.vy+=this.grav; this.alpha-=this.decay; },
          draw(c){ c.globalAlpha=this.alpha; c.fillStyle=this.color; c.beginPath(); c.arc(this.x,this.y,this.size,0,Math.PI*2); c.fill(); c.globalAlpha=1; },
          dead(){ return this.alpha<=0; },
        });
      }
      kick();
    }, s * rndInt(80,200));
  }
}

// ========== 2. 紙吹雪（超大量） ==========
function launchConfetti(){
  const shapes = ['rect','circle','strip'];
  for(let i=0;i<300;i++){
    setTimeout(()=>{
      const color=rndColor(), shape=shapes[rndInt(0,3)];
      const w=rnd(6,18), h=rnd(4,12);
      particles.push({
        x:rnd(0,canvas.width), y:-20,
        vx:rnd(-4,4), vy:rnd(3,10),
        rot:rnd(0,Math.PI*2), rotV:rnd(-0.2,0.2),
        alpha:1, color, w, h, shape,
        wobble:rnd(0,Math.PI*2), wobbleSpd:rnd(0.05,0.15),
        life:rnd(100,200), age:0,
        update(){ this.wobble+=this.wobbleSpd; this.x+=this.vx+Math.sin(this.wobble)*1.5; this.y+=this.vy; this.rot+=this.rotV; this.age++; if(this.age>this.life*0.65) this.alpha-=0.022; },
        draw(c){
          c.save(); c.globalAlpha=this.alpha; c.fillStyle=this.color;
          c.translate(this.x,this.y); c.rotate(this.rot);
          if(this.shape==='rect') c.fillRect(-this.w/2,-this.h/2,this.w,this.h);
          else if(this.shape==='circle'){ c.beginPath(); c.ellipse(0,0,this.w/2,this.h/2,0,0,Math.PI*2); c.fill(); }
          else c.fillRect(-this.w/2,-this.h/4,this.w,this.h/2);
          c.restore();
        },
        dead(){ return this.alpha<=0||this.y>canvas.height+30; },
      });
      kick();
    }, i*5);
  }
}

// ========== 3. ハート（大量・デカい） ==========
function heartPath(c,x,y,size){
  c.beginPath();
  c.moveTo(x,y+size*0.3);
  c.bezierCurveTo(x,y,x-size*0.5,y,x-size*0.5,y+size*0.3);
  c.bezierCurveTo(x-size*0.5,y+size*0.65,x,y+size*0.9,x,y+size*1.1);
  c.bezierCurveTo(x,y+size*0.9,x+size*0.5,y+size*0.65,x+size*0.5,y+size*0.3);
  c.bezierCurveTo(x+size*0.5,y,x,y,x,y+size*0.3);
  c.closePath();
}
function launchHearts(){
  const colors=['#ff1493','#ff69b4','#ff6b9d','#ff0066','#ff85b3','#fff0f5','#ff4da6','#ffb3d9'];
  for(let i=0;i<60;i++){
    setTimeout(()=>{
      const size=rnd(24,70), color=colors[rndInt(0,colors.length)];
      particles.push({
        x:rnd(0,canvas.width), y:canvas.height+size,
        vx:rnd(-2.5,2.5), vy:rnd(-5,-12),
        alpha:rnd(0.7,1), color, size,
        wobble:rnd(0,Math.PI*2), wobbleSpd:rnd(0.03,0.09),
        rotV:rnd(-0.04,0.04), rot:rnd(-0.3,0.3),
        decay:rnd(0.005,0.012),
        update(){ this.wobble+=this.wobbleSpd; this.x+=this.vx+Math.sin(this.wobble)*1.2; this.y+=this.vy; this.vy*=0.995; this.rot+=this.rotV; this.alpha-=this.decay; },
        draw(c){ c.save(); c.globalAlpha=this.alpha; c.fillStyle=this.color; c.translate(this.x,this.y); c.rotate(this.rot); heartPath(c,-this.size/2,-this.size/2,this.size); c.fill(); c.shadowColor=this.color; c.shadowBlur=20; c.fill(); c.restore(); },
        dead(){ return this.alpha<=0||this.y<-size*2; },
      });
      kick();
    }, i*30);
  }
}

// ========== 4. 星屑（デカい・爆散） ==========
function drawStar(c,x,y,r,points=5){
  c.beginPath();
  for(let i=0;i<points*2;i++){
    const angle=(Math.PI/points)*i-Math.PI/2;
    const radius=i%2===0?r:r*0.4;
    i===0?c.moveTo(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius)
         :c.lineTo(x+Math.cos(angle)*radius,y+Math.sin(angle)*radius);
  }
  c.closePath();
}
function launchStars(){
  // 3箇所から同時爆発
  [[0.2,0.3],[0.5,0.2],[0.8,0.3]].forEach(([fx,fy],bi)=>{
    setTimeout(()=>{
      const cx=canvas.width*fx, cy=canvas.height*fy;
      const n=80;
      for(let i=0;i<n;i++){
        const angle=rnd(0,Math.PI*2), spd=rnd(3,14);
        particles.push({
          x:cx, y:cy,
          vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
          alpha:1, color:rndBright(),
          size:rnd(10,30), rot:rnd(0,Math.PI*2), rotV:rnd(-0.15,0.15),
          decay:rnd(0.007,0.015), grav:rnd(0.03,0.09),
          trail:[],
          update(){ this.trail.push({x:this.x,y:this.y,a:this.alpha}); if(this.trail.length>6)this.trail.shift(); this.x+=this.vx; this.y+=this.vy; this.vy+=this.grav; this.vx*=0.98; this.rot+=this.rotV; this.alpha-=this.decay; },
          draw(c){ this.trail.forEach((t,i)=>{ c.save(); c.globalAlpha=t.a*(i/this.trail.length)*0.3; c.fillStyle=this.color; c.translate(t.x,t.y); c.rotate(this.rot); drawStar(c,0,0,this.size*0.7); c.fill(); c.restore(); }); c.save(); c.globalAlpha=this.alpha; c.fillStyle=this.color; c.shadowColor=this.color; c.shadowBlur=15; c.translate(this.x,this.y); c.rotate(this.rot); drawStar(c,0,0,this.size); c.fill(); c.restore(); },
          dead(){ return this.alpha<=0; },
        });
      }
      kick();
    }, bi*150);
  });
}

// ========== 5. シャボン玉（超大量・デカい） ==========
function launchBubbles(){
  for(let i=0;i<50;i++){
    setTimeout(()=>{
      const r=rnd(20,80), hue=rndInt(0,360);
      particles.push({
        x:rnd(r,canvas.width-r), y:canvas.height+r,
        vx:rnd(-1.5,1.5), vy:rnd(-2,-5),
        alpha:rnd(0.5,0.9), r, hue,
        wobble:rnd(0,Math.PI*2), wobbleSpd:rnd(0.02,0.07),
        decay:rnd(0.003,0.008),
        update(){ this.wobble+=this.wobbleSpd; this.x+=this.vx+Math.sin(this.wobble)*0.8; this.y+=this.vy; this.alpha-=this.decay; },
        draw(c){
          c.save(); c.globalAlpha=this.alpha;
          const g=c.createRadialGradient(this.x-this.r*0.35,this.y-this.r*0.35,this.r*0.05,this.x,this.y,this.r);
          g.addColorStop(0,`hsla(${this.hue},90%,98%,0.95)`);
          g.addColorStop(0.4,`hsla(${this.hue},80%,75%,0.15)`);
          g.addColorStop(1,`hsla(${this.hue},90%,65%,0.7)`);
          c.fillStyle=g; c.beginPath(); c.arc(this.x,this.y,this.r,0,Math.PI*2); c.fill();
          c.strokeStyle=`hsla(${this.hue},80%,85%,0.6)`; c.lineWidth=2; c.stroke();
          c.fillStyle='rgba(255,255,255,0.7)'; c.beginPath();
          c.ellipse(this.x-this.r*0.3,this.y-this.r*0.32,this.r*0.22,this.r*0.13,-Math.PI/4,0,Math.PI*2); c.fill();
          c.restore();
        },
        dead(){ return this.alpha<=0||this.y<-this.r*2; },
      });
      kick();
    }, i*50);
  }
}

// ========== 6. 画面フラッシュ（黒→白い光がピキーん） ==========
function launchFlash(){
  const W = canvas.width, H = canvas.height;
  const DARK_FRAMES  = 8;   // 暗くなるフレーム数
  const HOLD_FRAMES  = 6;   // 暗いまま維持
  const FADE_FRAMES  = 25;  // 明るさが戻るフレーム数

  // 光の線
  const lines = [];
  for(let i = 0; i < rndInt(2,4); i++){
    lines.push({ y:H*rnd(0.1,0.9), x:-250, halfW:rnd(80,200), speed:rnd(30,65), thickness:rnd(2,8) });
  }
  lines.push({ y:H*rnd(0.3,0.7), x:-500, halfW:rnd(280,500), speed:rnd(85,130), thickness:rnd(12,26) });

  let frame = 0;
  const total = DARK_FRAMES + HOLD_FRAMES + FADE_FRAMES + 40;

  (function flashLoop(){
    ctx.clearRect(0, 0, W, H);

    // --- 暗幕アルファを計算 ---
    let darkAlpha = 0;
    if(frame < DARK_FRAMES){
      darkAlpha = frame / DARK_FRAMES;                          // 0→1
    } else if(frame < DARK_FRAMES + HOLD_FRAMES){
      darkAlpha = 1;                                            // 真っ暗
    } else {
      const t = frame - DARK_FRAMES - HOLD_FRAMES;
      darkAlpha = Math.max(0, 1 - t / FADE_FRAMES);            // 1→0
    }

    // 暗幕を描く
    if(darkAlpha > 0){
      ctx.fillStyle = `rgba(0,0,0,${darkAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // --- 光の線（暗幕が消え始めるタイミングで走る）---
    const lineStart = DARK_FRAMES + HOLD_FRAMES - 4;
    if(frame >= lineStart){
      const lineFade = Math.max(0, 1 - (frame - lineStart) / 35);
      lines.forEach(l => {
        l.x += l.speed;
        if(l.x < W + l.halfW){
          const a = lineFade;
          const grad = ctx.createLinearGradient(l.x - l.halfW, 0, l.x + l.halfW, 0);
          grad.addColorStop(0,    `rgba(255,255,255,0)`);
          grad.addColorStop(0.35, `rgba(255,255,255,${(a*0.3).toFixed(3)})`);
          grad.addColorStop(0.5,  `rgba(255,255,255,${a.toFixed(3)})`);
          grad.addColorStop(0.65, `rgba(255,255,255,${(a*0.3).toFixed(3)})`);
          grad.addColorStop(1,    `rgba(255,255,255,0)`);

          ctx.save();
          ctx.shadowColor = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.shadowBlur  = 60;
          ctx.fillStyle   = grad;
          ctx.fillRect(l.x - l.halfW, l.y - l.thickness*5, l.halfW*2, l.thickness*10);
          ctx.shadowBlur  = 0;
          ctx.fillStyle   = `rgba(255,255,255,${a.toFixed(3)})`;
          ctx.fillRect(l.x - l.halfW, l.y - l.thickness/2, l.halfW*2, l.thickness);
          ctx.restore();
        }
      });
    }

    frame++;
    if(frame < total) requestAnimationFrame(flashLoop);
    else ctx.clearRect(0, 0, W, H);
  })();
}

// ---- ランダム発動（フラッシュは毎回追加で走る） ----
const effects = [launchFireworks, launchConfetti, launchHearts, launchStars, launchBubbles, launchFlash];

document.querySelectorAll('.dl').forEach(a=>{
  a.addEventListener('click', ()=>{
    const fn = effects[rndInt(0, effects.length)];
    fn();
  });
});
