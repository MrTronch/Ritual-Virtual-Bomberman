// Shared expiry animation: render it after ships close at sudden death.
const ShipExpiry={
 image:Object.assign(new Image(),{src:'assets/naves/expiry-explosion.webp'}),
 rects:[[53, 118, 359, 239], [495, 91, 359, 280], [934, 118, 358, 239], [1352, 77, 379, 299], [47, 488, 364, 334], [495, 503, 340, 299], [964, 541, 273, 245], [1443, 588, 186, 171]],duration:.9,
 drawFrame(ctx,phase){const r=this.rects[Math.min(7,Math.max(0,Math.floor(phase)))];if(!this.image.complete||!this.image.naturalWidth)return false;const [x,y,w,h]=r,k=104/Math.max(this.rects[0][2],this.rects[0][3]);ctx.imageSmoothingEnabled=false;ctx.drawImage(this.image,x,y,w,h,-w*k/2,-h*k/2,w*k,h*k);return true;},
 draw(ctx,g){for(const f of g.shipBursts||[]){ctx.save();ctx.translate(f.x,f.y);ctx.rotate([-Math.PI/2,0,Math.PI/2,Math.PI][f.side]);this.drawFrame(ctx,Math.floor(f.age/this.duration*8));ctx.restore();}}
};
if(typeof Game!=='undefined'){
 const beforeExpiryShips=Game.prototype.updateRevengeShips;
 Game.prototype.updateRevengeShips=function(dt){
  this.shipBursts=this.shipBursts||[];
  if(this.state==='playing'&&(this.suddenDeath||this.timeLeft<=SUDDEN_DEATH_AT)){
   let expired=false;for(const p of this.players)if(p.revengeShip){const at=RevengeShips.point(p.revengeShip.distance);this.shipBursts.push({x:at.x*TILE,y:at.y*TILE,side:at.side,age:0});expired=true;}
   if(expired)this.sfx.explosion();
  }
  beforeExpiryShips.call(this,dt);
 };
 const beforeExpiryEffects=Game.prototype.updateEffects;
 Game.prototype.updateEffects=function(dt){beforeExpiryEffects.call(this,dt);if(this.state==='playing')for(const f of this.shipBursts||[])f.age+=dt;this.shipBursts=(this.shipBursts||[]).filter(f=>f.age<ShipExpiry.duration);};
 const beforeExpirySetup=Game.prototype.setupLevel;
 Game.prototype.setupLevel=function(){this.shipBursts=[];return beforeExpirySetup.call(this);};
 const beforeExpiryDraw=Renderer.draw;
 Renderer.draw=function(g){beforeExpiryDraw(g);if(g.state==='playing'||g.state==='paused')ShipExpiry.draw(g.ctx,g);};
}
