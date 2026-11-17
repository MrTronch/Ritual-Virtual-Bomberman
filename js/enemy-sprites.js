// Pixel creatures for the existing enemy behaviours. Player designs are untouched.
const PixelEnemies={
 cache:new Map(),
 frame(e){
  const step=Math.floor(e.animTime*8)%4,key=e.type+':'+step+':'+e.dir+':'+e.color;
  if(this.cache.has(key))return this.cache.get(key);
  const c=document.createElement('canvas');c.width=24;c.height=24;const ctx=c.getContext('2d');
  const shape=e.cfg.shape,mask=Array.from({length:24},()=>new Uint8Array(24));
  for(let y=3;y<20;y++)for(let x=3;x<21;x++){
   const dx=Math.abs(x-11.5),dy=Math.abs(y-11);
   const inside=shape==='square'||shape==='boss'?(dx<9&&dy<8):shape==='diamond'?(dx+dy<12):shape==='star'?(dx+dy<10||dx<3||dy<3):(dx*dx/81+dy*dy/73<1);
   if(inside)mask[y][x]=1;
  }
  const dot=(x,y,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,1,1);};
  for(let y=1;y<23;y++)for(let x=1;x<23;x++)if(mask[y][x]){
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(!mask[y+dy]?.[x+dx])dot(x+dx,y+dy,'#20142f');
  }
  for(let y=1;y<23;y++)for(let x=1;x<23;x++)if(mask[y][x])dot(x,y,y>15?'#493453':e.color);
  // Head silhouette, pointed tufts, and a contrasting digital face.
  ctx.fillStyle='#20142f';ctx.fillRect(5,1,3,4);ctx.fillRect(17,1,3,4);
  ctx.fillStyle='#b7ff70';ctx.fillRect(6,2,1,3);ctx.fillRect(18,2,1,3);
  ctx.fillStyle='#f2d9ff';ctx.fillRect(6,5,4,1);ctx.fillRect(5,6,2,2);
  ctx.fillStyle='#281a40';ctx.fillRect(5,8,15,7);
  ctx.fillStyle=e.cfg.smart?'#c7ff8e':'#dcf7fa';
  const blink=step===3;
  ctx.fillRect(7,blink?11:10,4,blink?1:3);ctx.fillRect(14,blink?11:10,4,blink?1:3);
  if(!blink){const d=DIRS[e.dir]||{dx:0,dy:0};ctx.fillStyle='#3c305b';ctx.fillRect(9+d.dx,11+d.dy,1,1);ctx.fillRect(16+d.dx,11+d.dy,1,1);}
  ctx.fillStyle='#1a1229';ctx.fillRect(10,17,5,1);ctx.fillStyle='#d3a8ef';ctx.fillRect(11,18,3,1);
  const swing=step%2;ctx.fillStyle='#20142f';ctx.fillRect(5+swing,20,5,2);ctx.fillRect(15-swing,20,5,2);
  ctx.fillStyle=e.cfg.passBricks?'#cfa2ff':'#9af086';ctx.fillRect(6+swing,20,3,1);ctx.fillRect(16-swing,20,3,1);
  this.cache.set(key,c);return c;
 },
 deathPhase(e){
  const duration=ENEMY_DEATH_DURATION*(e.isBoss?2:1);
  return Math.min(7,Math.max(0,Math.floor((1-e.deathTimer/duration)*8)));
 },
 deathFrame(e,phase=this.deathPhase(e)){
  const key='death:'+e.type+':'+e.cfg.shape+':'+e.color+':'+phase;
  if(this.cache.has(key))return this.cache.get(key);
  const c=document.createElement('canvas');c.width=c.height=32;
  const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  if(phase<4){
   const body=this.frame({...e,dying:false,animTime:0,dir:'down'});
   const widths=[24,27,30,30],heights=[24,21,27,27];
   const w=widths[phase],h=heights[phase];ctx.drawImage(body,(32-w)/2,29-h,w,h);
   // Shocked cross eyes, then a clean silhouette flash before the burst.
   if(phase<3){ctx.fillStyle='#fff1d9';for(const x of [10,19]){ctx.fillRect(x,13,3,1);ctx.fillRect(x+1,12,1,3);}}
   else {ctx.globalCompositeOperation='source-in';ctx.fillStyle='#fff1d9';ctx.fillRect(0,0,32,32);}
  }else{
   const phaseRadius=[0,0,0,0,13,14,12,14][phase];
   for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const dx=x-15.5,dy=y-15.5,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    const edge=phaseRadius+1.5*Math.sin(angle*8);
    let color=null;
    if(phase===4&&r<edge)color=r<5?'#fff4cd':r<9?'#ffda64':r<11?'#ff9c32':'#ed5937';
    if(phase===5&&r>edge-5&&r<edge)color=r<edge-2?'#ffcd58':'#e66b36';
    if(phase===6&&r>edge-3&&r<edge&&Math.sin(angle*9)>.15)color=r>edge-1?'#795c68':'#c7a4a0';
    if(phase===7&&r>10&&r<14&&Math.cos(angle*8)>.88&&((x+y)%3!==0))color='#ffad49';
    if(color){ctx.fillStyle=color;ctx.fillRect(x,y,1,1);}
   }
  }
  this.cache.set(key,c);return c;
 },
 draw(ctx,e,game){
  ctx.save();
  
  if(!e.dying){ctx.fillStyle='rgba(0,0,0,.24)';ctx.fillRect(e.x-13,e.y+19,26,4);}
  if(e.isBoss&&e.iframes>0&&Math.floor(e.iframes/80)%2===0)ctx.globalAlpha*=.45;
  ctx.imageSmoothingEnabled=false;const size=e.dying?(e.isBoss?80:64):(e.isBoss?56:46);
  ctx.drawImage(e.dying?this.deathFrame(e):this.frame(e),e.x-size/2,e.y-size/2,size,size);ctx.restore();
 }
};
