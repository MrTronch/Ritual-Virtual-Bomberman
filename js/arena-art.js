// Atlas crops from the supplied art. No full-map image is used as a fake level.
const ArenaArt={
 ritual:UpdateContent.loadImage('assets/update-v10/ritual-tileset.webp'),
 jurassic:UpdateContent.loadImage('assets/update-v10/jurassic-tileset.webp'),
 ready(img){return img.complete&&img.naturalWidth>0;},
 patch(ctx,img,r,x,y,w=TILE,h=TILE){if(!this.ready(img))return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,...r,x,y,w,h);ctx.restore();return true;},
 floor(ctx,g,x,y){
  if(!g.arenaStyle)return false;
  if(g.arenaStyle==='ritual'){
   const rects=[[62,70,210,204],[382,70,204,204],[681,70,203,204],[985,70,204,204]];
   if(!this.patch(ctx,this.ritual,rects[(x*7+y*11)%4],x*TILE,y*TILE)){ctx.fillStyle='#3d526b';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);}
   ctx.strokeStyle='rgba(15,24,45,.38)';ctx.lineWidth=1;ctx.strokeRect(x*TILE+.5,y*TILE+.5,TILE-1,TILE-1);
  }else{
   // Crop the interior of a supplied terrain tile: no dark outline between floor squares.
   this.patch(ctx,this.jurassic,[100+(x*13+y*7)%4*235,100,115,115],x*TILE,y*TILE);
   if(!this.ready(this.jurassic)){ctx.fillStyle='#667c3c';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);}
   if((x*7+y*13)%9===0){ctx.fillStyle='#81994b';ctx.fillRect(x*TILE+12,y*TILE+25,15,5);ctx.fillRect(x*TILE+17,y*TILE+21,6,4);}
  }return true;
 },
 solid(ctx,g,x,y,t){
  if(!g.arenaStyle)return false;const px=x*TILE,py=y*TILE,border=x===0||y===0||x===COLS-1||y===ROWS-1;
  if(g.arenaStyle==='ritual'){
   if(t===TILE_WALL){if(border){ctx.fillStyle='#27133b';ctx.fillRect(px,py,TILE,TILE);this.patch(ctx,this.ritual,[349,715,248,171],px,py,TILE,TILE);ctx.fillStyle='#b5f336';ctx.fillRect(px+TILE/2-2,py+TILE-6,4,2);}else this.patch(ctx,this.ritual,[68,685,204,205],px+2,py+2,TILE-4,TILE-4);}
   else{const rs=[[68,384,204,209],[372,381,212,210],[672,381,212,210],[982,366,218,224]];this.patch(ctx,this.ritual,rs[(x*13+y*7)%4],px+2,py+2,TILE-4,TILE-4);}
  }else{
   const v=g.volcano;if(v&&Math.abs(x-v.x)<=1&&Math.abs(y-v.y)<=1)return true;
   const rect=t===TILE_WALL?((x+y)%7===0?[311,315,168,165]:[76,315,163,165]):[[549,315,165,166],[784,315,166,166],[77,566,166,146],[311,588,168,116]][(x*5+y*3)%4];
   if(border){ctx.fillStyle='#394635';ctx.fillRect(px,py,TILE,TILE);}
   ctx.save();ctx.beginPath();const inset=border?0:2;ctx.roundRect(px+inset,py+inset,TILE-inset*2,TILE-inset*2,8);ctx.clip();this.patch(ctx,this.jurassic,rect,px+inset,py+inset,TILE-inset*2,TILE-inset*2);ctx.restore();
   if(border&&(x*5+y*3)%5===0){ctx.fillStyle='#7f9d3d';ctx.fillRect(px+3,py+2,20,5);ctx.fillRect(px+12,py+6,7,5);}
  }return true;
 },
 overlays(ctx,g){

  if(g.volcano){const v=g.volcano,warning=v.until<=1.5;
   ctx.save();for(const c of g.lavaThreats()){ctx.globalAlpha=.68+.12*Math.sin(g.elapsed*14);ctx.fillStyle='#ef542d';ctx.fillRect(c.x*TILE+3,c.y*TILE+3,TILE-6,TILE-6);ctx.globalAlpha=1;ctx.strokeStyle='#ffe299';ctx.lineWidth=2;ctx.strokeRect(c.x*TILE+4,c.y*TILE+4,TILE-8,TILE-8);ctx.fillStyle='#ffe299';ctx.fillRect(c.x*TILE+22,c.y*TILE+15,4,12);ctx.fillRect(c.x*TILE+22,c.y*TILE+30,4,4);}ctx.restore();
   const x=(v.x-1)*TILE,y=(v.y-1)*TILE,w=3*TILE;
   // Clip off the original sheet backdrop around the volcano silhouette.
   ctx.save();ctx.beginPath();ctx.moveTo(x,y+w);ctx.lineTo(x,y+w*.55);ctx.lineTo(x+w*.13,y+w*.3);ctx.lineTo(x+w*.2,y+w*.03);ctx.lineTo(x+w*.73,y+w*.03);ctx.lineTo(x+w*.85,y+w*.32);ctx.lineTo(x+w,y+w*.57);ctx.lineTo(x+w,y+w);ctx.closePath();ctx.clip();const split=60,contract=warning?(1-Math.cos(g.elapsed*18))*3:0;this.patch(ctx,this.jurassic,[268,1200.33,487,235.67],x,y+split,w,w-split);this.patch(ctx,this.jurassic,[268,1032,487,168.33],x,y+contract,w,split-contract);if(warning||v.heat>0){ctx.globalAlpha=warning?.2+.15*Math.sin(g.elapsed*18)**2:Math.min(.6,v.heat);ctx.fillStyle='#ff3524';ctx.beginPath();ctx.ellipse(x+w*.49,y+w*.28+contract,w*.22,w*.1,0,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
 }
};
const baseBombPaint=PixelFX.bomb.bind(PixelFX);
PixelFX.bomb=function(ctx,b){
 const bounce=Math.abs(Math.sin(b.age*7))*3,squash=1+Math.sin(b.age*9)*.045;
 ctx.save();ctx.translate(b.x,b.y-bounce);ctx.scale(squash,1/squash);
 if(b.kind==='spike'){
  PixelFX.spikeBomb(ctx,0,0);
 }else if(b.kind==='tnt'||b.kind==='napalm'){
  const source=UpdateContent.chargeImage,r=UpdateContent.chargeRects?.[b.kind];
  if(source?.complete&&source.naturalWidth&&r){const scale=Math.min(37/r[2],40/r[3]),w=r[2]*scale,h=r[3]*scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(source,...r,-w/2,20-h,w,h);}
  else {ctx.fillStyle=b.kind==='tnt'?'#db4937':'#d86427';ctx.fillRect(-12,-13,24,29);ctx.fillStyle='#f4e0ad';ctx.fillRect(-12,2,24,7);}
  const spark=Math.floor(b.age*12)%2;ctx.fillStyle=spark?'#fff0af':'#ff8238';ctx.fillRect(8,-20,3,3);
 }else baseBombPaint(ctx,{...b,x:0,y:0});
 ctx.restore();
};

const baseExplosionPaint=PixelFX.explosion.bind(PixelFX);
PixelFX.explosion=function(ctx,ex){
 if(!ex.kind||ex.kind==='normal'||ex.kind==='spike')return baseExplosionPaint(ctx,ex);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=Math.min(1,Math.max(0,ex.timer/160));
 if(ex.kind==='tnt'){
  const set=new Set(ex.cells.map(c=>tileKey(c.x,c.y))),phase=Math.floor(ex.age/75)%6;
  for(const c of ex.cells){for(let y=0;y<12;y++)for(let x=0;x<12;x++){
   const border=Math.min(set.has(tileKey(c.x-1,c.y))?12:x,set.has(tileKey(c.x+1,c.y))?12:11-x,set.has(tileKey(c.x,c.y-1))?12:y,set.has(tileKey(c.x,c.y+1))?12:11-y);
   const wave=Math.sin((c.x*12+x+phase*2)*.55)+Math.cos((c.y*12+y-phase)*.65);ctx.fillStyle=border<1?'#e33c29':border<2?'#ff752c':border<3?'#ffc454':wave>1.25?'#ffe8ad':'#fff8e5';ctx.fillRect(c.x*TILE+x*4,c.y*TILE+y*4,4,4);
  }}
 }else{
  const phase=Math.floor(ex.age/100)%4;for(const c of ex.cells){
   const x=c.x*TILE+3,y=c.y*TILE+4,unit=42,h=38+(phase%2)*3;
   ctx.fillStyle='#71332c';ctx.fillRect(x+4,y+36,34,6);
   ctx.save();ctx.beginPath();ctx.moveTo(x+5,y+h);ctx.lineTo(x+1,y+h*.72);ctx.lineTo(x+6,y+h*.4);ctx.lineTo(x+13,y+h*.56);ctx.lineTo(x+19,y);ctx.lineTo(x+26,y+h*.23);ctx.lineTo(x+25,y+h*.53);ctx.lineTo(x+34,y+h*.32);ctx.lineTo(x+41,y+h*.7);ctx.lineTo(x+37,y+h);ctx.closePath();ctx.clip();
   if(!ArenaArt.patch(ctx,ArenaArt.jurassic,[784,553,163,178],x,y,unit,h)){ctx.fillStyle='#ffad39';ctx.fillRect(x,y,unit,h);}
   ctx.restore();
  }
 }ctx.restore();
};

ArenaArt.worldPreview=function(ctx,stage,w,h){
 ctx.imageSmoothingEnabled=false;ctx.fillStyle=stage==='ritual'?'#304660':'#647c3b';ctx.fillRect(0,0,w,h);
 for(let y=0;y<4;y++)for(let x=0;x<8;x++){
  if(stage==='ritual')this.patch(ctx,this.ritual,[62,70,210,204],x*w/8,y*h/4,w/8,h/4);
  if(x%2===1&&y%2===1)this.patch(ctx,this[stage],stage==='ritual'?[68,685,204,205]:[76,315,163,165],x*w/8,y*h/4,w/8,h/4);
 }
 if(stage==='ritual'){this.patch(ctx,this.ritual,[43,970,245,249],0,h/2-18,36,36);this.patch(ctx,this.ritual,[341,970,255,249],w-36,h/2-18,36,36);}
 else this.patch(ctx,this.jurassic,[268,1032,487,404],w/2-32,8,64,64);
};

ArenaArt.portalRects={left:[43,970,245,249],right:[341,970,255,249],up:[651,978,252,239],down:[967,979,251,238]};
ArenaArt.portalBack=function(ctx,g){for(const p of g.portals||[])this.patch(ctx,this.ritual,this.portalRects[p.dir],p.x*TILE,p.y*TILE,TILE,TILE);};
ArenaArt.portalFront=function(ctx,g){
 for(const p of g.portals||[]){const x=p.x*TILE,y=p.y*TILE,t=7;ctx.save();ctx.beginPath();
  if(p.dir==='left'||p.dir==='right'){ctx.rect(x,y,TILE,t);ctx.rect(x,y+TILE-t,TILE,t);ctx.rect(p.dir==='left'?x:x+TILE-t,y,t,TILE);}
  else{ctx.rect(x,y,t,TILE);ctx.rect(x+TILE-t,y,t,TILE);ctx.rect(x,p.dir==='up'?y:y+TILE-t,TILE,t);}
  ctx.clip();this.patch(ctx,this.ritual,this.portalRects[p.dir],x,y,TILE,TILE);ctx.restore();
 }
 for(const f of g.portalFlashes||[]){ctx.save();ctx.globalAlpha=1-f.age/f.duration;ctx.fillStyle='#cf98ff';for(const p of [f.entry,f.exit]){const d=DIRS[p.dir],x=(p.x-d.dx*.5)*TILE+TILE/2,y=(p.y-d.dy*.5)*TILE+TILE/2;ctx.fillRect(x-(d.dx?2:16),y-(d.dx?16:2),d.dx?4:32,d.dx?32:4);}ctx.restore();}
};
ArenaArt.flightPoint=function(f){const t=Math.min(1,f.age/f.duration);return {x:f.sx+(centerOf(f.tx)-f.sx)*t,y:f.sy+(centerOf(f.ty)-f.sy)*t-Math.sin(t*Math.PI)*TILE*.95};};
ArenaArt.airObjects=function(ctx,g){
 for(const p of g.players){if(!p.held||!p.alive)continue;if(p.held.kind==='bomb')PixelFX.bomb(ctx,{...p.held.object,x:p.x+(p.character==='max'?({down:9,up:-9,left:-6,right:6}[p.facing]||0):0),y:p.y-64});else if(p.held.kind==='item')PixelItems.badge(ctx,p.held.object.type,p.x-13,p.y-80,26);}
 for(const b of g.bombs)if(b.flight){const point=this.flightPoint(b.flight);PixelFX.bomb(ctx,{...b,x:point.x,y:point.y});}
 for(const t of g.thrownItems||[]){const point=this.flightPoint(t.flight);PixelItems.badge(ctx,t.object.type,point.x-13,point.y-13,26);}
 for(const shot of g.lavaShots||[]){
  const point=t=>({x:shot.sx+(centerOf(shot.target.x)-shot.sx)*t,y:shot.sy+(centerOf(shot.target.y)-shot.sy)*t-Math.sin(t*Math.PI)*shot.peak});
  const t=Math.min(1,shot.age/shot.duration),at=point(t);
  ctx.save();ctx.fillStyle='rgba(90,25,15,.27)';ctx.fillRect(centerOf(shot.target.x)-9,centerOf(shot.target.y)+12,18,4);
  for(let i=3;i>=1;i--){const tail=point(Math.max(0,t-i*.035));ctx.globalAlpha=.2+i*.12;ctx.fillStyle='#ff7b2a';ctx.fillRect(Math.round(tail.x)-3,Math.round(tail.y)-3,6,6);}
  ctx.globalAlpha=1;ctx.fillStyle='#a83022';ctx.fillRect(Math.round(at.x)-6,Math.round(at.y)-5,12,10);ctx.fillStyle='#ff7927';ctx.fillRect(Math.round(at.x)-4,Math.round(at.y)-6,8,11);ctx.fillStyle='#ffcf57';ctx.fillRect(Math.round(at.x)-3,Math.round(at.y)-3,6,6);ctx.fillStyle='#fff3bf';ctx.fillRect(Math.round(at.x)-1,Math.round(at.y)-2,3,3);ctx.restore();
 }
};

// Stepped blue sphere with eight steel spikes, shared by the pickup and bombs.
PixelFX.spikeBomb=function(ctx,x,y){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#091326';ctx.fillRect(-12,-14,24,28);ctx.fillRect(-16,-9,32,18);
 ctx.fillStyle='#1762cb';ctx.fillRect(-10,-12,20,24);ctx.fillRect(-14,-7,28,14);
 ctx.fillStyle='#399fff';ctx.fillRect(-9,-10,15,13);ctx.fillStyle='#b5f3ff';ctx.fillRect(-7,-8,5,5);
 for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);ctx.fillStyle='#132945';ctx.beginPath();ctx.moveTo(-5,-11);ctx.lineTo(0,-23);ctx.lineTo(5,-11);ctx.fill();ctx.fillStyle='#b4e9ff';ctx.beginPath();ctx.moveTo(-3,-12);ctx.lineTo(0,-20);ctx.lineTo(2,-12);ctx.fill();ctx.restore();}
 ctx.fillStyle='#ffe59a';ctx.fillRect(5,-20,3,4);ctx.fillStyle='#ff9d48';ctx.fillRect(7,-23,3,3);ctx.restore();
};

// Pulse and inward chevrons make campaign gates readable against the wall.
const portalFrontWithoutHighlight=ArenaArt.portalFront;
ArenaArt.portalFront=function(ctx,g){
 portalFrontWithoutHighlight.call(this,ctx,g);if(g.mode!==1)return;
 for(const p of g.portals||[]){const d=DIRS[p.dir],x=(p.x+.5)*TILE,y=(p.y+.5)*TILE,pulse=.65+.25*Math.sin(g.elapsed*4);
  ctx.save();ctx.strokeStyle='#caff87';ctx.lineWidth=3;ctx.globalAlpha=pulse;ctx.shadowColor='#b7ff70';ctx.shadowBlur=10;ctx.strokeRect(p.x*TILE+3,p.y*TILE+3,TILE-6,TILE-6);ctx.globalAlpha=1;ctx.fillStyle='#d7ff9f';
  for(let i=0;i<2;i++){const ax=x-d.dx*(28+i*11),ay=y-d.dy*(28+i*11);ctx.beginPath();ctx.moveTo(ax-d.dx*5,ay-d.dy*5);ctx.lineTo(ax+d.dx*3-d.dy*5,ay+d.dy*3+d.dx*5);ctx.lineTo(ax+d.dx*3+d.dy*5,ay+d.dy*3-d.dx*5);ctx.closePath();ctx.fill();}ctx.restore();
 }
};
