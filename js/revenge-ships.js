// Revancha: eliminated battle players circle the arena and throw ordinary bombs.
const RevengeShips={
 margin(game){return game.mode===2&&!game.demo?TILE+8:0;},
 viewport(game){
  const rail=this.margin(game),outerWidth=CANVAS_W+2*rail,outerHeight=CANVAS_H+2*rail;
  const width=Math.max(outerWidth,outerHeight*16/9),height=Math.max(outerHeight,outerWidth*9/16);
  return {width,height,x:(width-CANVAS_W)/2,y:(height-CANVAS_H)/2};
 },
 point(distance){
  const w=COLS,h=ROWS,total=2*(w+h),s=((distance%total)+total)%total;
  if(s<w)return {x:s,y:0,side:0};
  if(s<w+h)return {x:COLS,y:s-w,side:1};
  if(s<2*w+h)return {x:COLS-(s-w-h),y:ROWS,side:2};
  return {x:0,y:ROWS-(s-2*w-h),side:3};
 },
 rail(ctx,game){
  if(!this.margin(game))return;
  for(let y=-1;y<=ROWS;y++)for(let x=-1;x<=COLS;x++){
   if(x!==-1&&y!==-1&&x!==COLS&&y!==ROWS)continue;
   if(!ArenaArt.solid(ctx,game,x,y,TILE_WALL)){ctx.fillStyle='#4d3c62';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);ctx.strokeStyle='#9b87b0';ctx.strokeRect(x*TILE+2,y*TILE+2,TILE-4,TILE-4);}
  }
 },
 open(game){return game.mode===2&&!game.demo&&game.state==='playing'&&!game.suddenDeath&&game.timeLeft>SUDDEN_DEATH_AT;},
 moveSpeed:6.5,chargeSeconds:1.8,
 activeBombs(g,p){return g.bombs.filter(b=>b.revengeOwner===p&&!b.exploded).length;},
 colors:['#72df67','#b879ff','#ffc252','#5cdbff'],
 image:Object.assign(new Image(),{src:'assets/naves/cometa-travieso.webp'}),
 rects:{up:[123,85,442,504],down:[706,77,441,513],left:[72,727,518,345],right:[681,727,515,345]},
 skins:new Map(),
 skin(facing,index){
  if(!this.image.complete||!this.image.naturalWidth)return null;const key=facing+':'+index;if(this.skins.has(key))return this.skins.get(key);
  const [x,y,w,h]=this.rects[facing],c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(this.image,x,y,w,h,0,0,w,h);ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.42;ctx.fillStyle=this.colors[index%4];ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';this.skins.set(key,c);return c;
 },
 draw(ctx,game){
  if(!this.open(game))return;
  for(const p of game.players){const s=p.revengeShip;if(!s||p.alive)continue;
   const at=this.point(s.distance),x=at.x*TILE,y=at.y*TILE,facing=['down','left','up','right'][at.side],rect=this.rects[facing];
   ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(1.2,1.2);ctx.imageSmoothingEnabled=false;
   const hull=this.skin(facing,game.players.indexOf(p));if(hull){const sw=hull.width,sh=hull.height,k=Math.min(88/sw,88/sh);ctx.drawImage(hull,-sw*k/2,-sh*k/2,sw*k,sh*k);}
   const frame=(typeof Deathmatch!=='undefined'&&Deathmatch.active(game)?DeathmatchSprites.frame(p.character,facing):null)||RitualSprites.walkFrame(p.character,facing,0);
   if(frame){const [sx,sy,sw,sh]=frame.rect,k=Math.min(44/sw,58/sh),seatY=facing==='up'?12:facing==='down'?10:5;
    ctx.drawImage(frame.source,sx,sy,sw,sh,-sw*k/2,seatY-sh*k,sw*k,sh*k);
    // The cockpit rim is in front of the passenger's feet.
    ctx.fillStyle=this.colors[game.players.indexOf(p)%4];ctx.beginPath();ctx.moveTo(-20,seatY-8);ctx.lineTo(20,seatY-8);ctx.lineTo(16,seatY+1);ctx.lineTo(-16,seatY+1);ctx.closePath();ctx.fill();ctx.fillStyle='#392347';ctx.fillRect(-15,seatY+1,30,3);
   }
   if(s.charging){ctx.fillStyle='#24112f';ctx.fillRect(-26,36,52,6);ctx.fillStyle='#b7ff70';ctx.fillRect(-25,37,50*Math.min(1,s.charge/this.chargeSeconds),4);}
   ctx.restore();
  }
 },
 cacheHeads(){} // Kept for compatibility with the renderer hook.

};
const revengeRoundStart=Game.prototype.startLevel;
Game.prototype.startLevel=function(){for(const p of this.players)p.revengeShip=null;return revengeRoundStart.call(this);};
const revengeDeadUpdate=Game.prototype.updateDeadPlayer;
Game.prototype.updateDeadPlayer=function(p,dt){
 revengeDeadUpdate.call(this,p,dt);
 if(!p.alive&&!p.dying&&!p.revengeShip&&RevengeShips.open(this)){
  const i=this.players.indexOf(p),row=Math.max(1,Math.min(ROWS-2,p.ty));
  p.revengeGeneration=(p.revengeGeneration||0)+1;
  p.revengeShip={distance:i%2?COLS+row:2*COLS+ROWS+(ROWS-row),cooldown:.5,depth:1,charge:0,charging:false,token:p.revengeGeneration};
  this.floaters.push(new Floater('NAVE DE REVANCHA',CANVAS_W/2,45,p.color,12));
 }
};
Game.prototype.updateRevengeShips=function(dt){
 if(!RevengeShips.open(this)){for(const p of this.players)p.revengeShip=null;return;}
 for(const p of this.players){const s=p.revengeShip;if(!s||p.alive)continue;
  s.cooldown=Math.max(0,s.cooldown-dt);const at=RevengeShips.point(s.distance);let move=0,fire=false;
  if(p.isBot){
   const targets=this.players.filter(o=>o.alive&&o!==p&&!(this.settings.battle.formation==='teams'&&o.team===p.team));
   const target=targets.sort((a,b)=>Math.abs(a.tx-at.x)+Math.abs(a.ty-at.y)-Math.abs(b.tx-at.x)-Math.abs(b.ty-at.y))[0];
   if(target){const difference=(at.side===0?target.tx-at.x:at.side===1?target.ty-at.y:at.side===2?at.x-target.tx:at.y-target.ty);move=Math.abs(difference)>.35?Math.sign(difference):0;s.depth=at.side===0?target.ty:at.side===1?COLS-1-target.tx:at.side===2?ROWS-1-target.ty:target.tx;fire=Math.abs(difference)<.65;}
  }else{
   const k=p.keys,dx=(this.input.isDown(k.right)?1:0)-(this.input.isDown(k.left)?1:0),dy=(this.input.isDown(k.down)?1:0)-(this.input.isDown(k.up)?1:0);
   move=at.side===0?dx:at.side===1?dy:at.side===2?-dx:-dy;
   // At corners either arrow along the next border turns the craft naturally.
   if(!move){if(at.y<1&&dx)move=dx;else if(at.y>ROWS-1&&dx)move=-dx;else if(at.x<1&&dy)move=-dy;else if(at.x>COLS-1&&dy)move=dy;}
   const held=this.input.isDown(k.bomb),pressed=this.input.wasPressed(k.bomb);
   if((held||pressed)&&!s.charging&&s.cooldown<=0&&RevengeShips.activeBombs(this,p)<2){s.charging=true;s.charge=0;}
   if(s.charging){
    if(held)s.charge=Math.min(RevengeShips.chargeSeconds,s.charge+dt);
    else {const vertical=at.side===0||at.side===2,maxDepth=(vertical?ROWS:COLS)-2;s.depth=1+Math.round((maxDepth-1)*Math.min(1,s.charge/RevengeShips.chargeSeconds));s.charging=false;s.charge=0;fire=true;}
   }
  }
  s.distance+=move*RevengeShips.moveSpeed*dt;
  if(fire&&s.cooldown<=0)this.launchRevengeBomb(p);
 }
};
Game.prototype.launchRevengeBomb=function(p){
 const s=p.revengeShip;if(!s||!RevengeShips.open(this)||s.cooldown>0||RevengeShips.activeBombs(this,p)>=MobileBalance.shipLimit(this,p))return false;
 const at=RevengeShips.point(s.distance),vertical=at.side===0||at.side===2,max=vertical?ROWS-2:COLS-2,depth=Math.max(1,Math.min(max,Math.round(s.depth)));
 let target={x:Math.max(1,Math.min(COLS-2,Math.floor(at.x))),y:Math.max(1,Math.min(ROWS-2,Math.floor(at.y)))};
 if(at.side===0)target.y=depth;else if(at.side===1)target.x=COLS-1-depth;else if(at.side===2)target.y=ROWS-1-depth;else target.x=depth;
 const choices=[];
 for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(this.grid[y][x]===TILE_EMPTY&&!this.bombAt(x,y)&&!this.portalZone?.(x,y))choices.push({x,y});
 choices.sort((a,b)=>Math.abs(a.x-target.x)+Math.abs(a.y-target.y)-Math.abs(b.x-target.x)-Math.abs(b.y-target.y));
 if(!choices.length)return false;target=choices[0];
 const b=new Bomb(target.x,target.y,p,2,BOMB_FUSE);b.kind='normal';b.orphan=true;b.revengeOwner=p;b.revengeToken=s.token;
 b.flight={sx:at.x*TILE,sy:at.y*TILE,tx:target.x,ty:target.y,age:0,duration:.6};this.bombs.push(b);s.cooldown=MobileBalance.shipCooldown(this,p);this.sfx.placeBomb();return true;
};
Game.prototype.returnFromShip=function(p,near){
 if(!p.revengeShip||!RevengeShips.open(this))return false;
 const choices=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(this.grid[y][x]===TILE_EMPTY&&!this.bombAt(x,y)&&!this.players.some(o=>o.alive&&o.tx===x&&o.ty===y)&&!this.portalZone?.(x,y))choices.push({x,y});
 choices.sort((a,b)=>Math.abs(a.x-near.tx)+Math.abs(a.y-near.ty)-Math.abs(b.x-near.tx)-Math.abs(b.y-near.ty));if(!choices.length)return false;
 for(const b of this.bombs)if(b.owner===p)b.orphan=true;
 p.revengeShip=null;p.held=null;p.portalTransit=null;p.resetPowers();p.bombDropBase=1;p.bombsActive=0;p.lives=1;
 const spawn=p.spawn;p.spawn=choices[0];p.respawn(1800);p.spawn=spawn;
 this.floaters.push(new Floater('REGRESA A LA ARENA',p.x,p.y-30,p.color,12));this.sfx.powerup();return true;
};
const revengeKill=Game.prototype.killPlayer;
Game.prototype.killPlayer=function(p,force=false,explosion=null){
 const wasAlive=p.alive;revengeKill.call(this,p,force);
 if(!wasAlive||p.alive||!explosion)return;
 const attacker=explosion.revengeOwner;
 if(attacker&&attacker!==p&&!attacker.alive&&attacker.revengeShip?.token===explosion.revengeToken&&!(this.settings.battle.formation==='teams'&&attacker.team===p.team))this.returnFromShip(attacker,p);
};
const drawArenaWithShips=Renderer.draw;
Renderer.draw=function(game){drawArenaWithShips(game);RevengeShips.cacheHeads();const ctx=game.ctx;ctx.save();ctx.imageSmoothingEnabled=false;RevengeShips.draw(ctx,game);ctx.restore();};

const spectateWithoutShip=Game.prototype.isSpectating;
Game.prototype.isSpectating=function(){return !this.players.some(p=>!p.isBot&&p.revengeShip)&&spectateWithoutShip.call(this);};
