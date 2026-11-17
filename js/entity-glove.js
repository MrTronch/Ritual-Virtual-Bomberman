// The glove lifts campaign enemies and opposing battle players as well as items.
const EntityGlove={
 all(g){return [...g.players,...g.enemies];},
 spots(g,near,ignore){
  const out=[];for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(g.grid[y][x]===TILE_EMPTY&&!g.bombAt(x,y)&&!g.portalZone?.(x,y)&&!this.all(g).some(e=>e!==ignore&&e.alive&&!e.carriedBy&&!e.gloveFlight&&e.tx===x&&e.ty===y))out.push({x,y});
  return out.sort((a,b)=>Math.abs(a.x-near.x)+Math.abs(a.y-near.y)-Math.abs(b.x-near.x)-Math.abs(b.y-near.y));
 },
 land(g,e,near){
  const spot=this.spots(g,near,e)[0];if(!spot)return false;
  e.x=centerOf(spot.x);e.y=centerOf(spot.y);e.carriedBy=null;e.gloveFlight=null;e.target=null;e.moveTarget=null;e.originTile=null;e.origin={x:spot.x,y:spot.y};
  if(e instanceof Player){e.gloveStun=.5;e.shield=Math.max(e.shield||0,650);e.bot?.reset();}else e.wait=.7;
  return true;
 },
 release(g,p){
  if(p.held?.kind!=='entity')return;const e=p.held.object;p.held=null;e.carriedBy=null;
  if(!e.alive)return;if(!this.land(g,e,{x:p.tx,y:p.ty})){e.gloveFlight={sx:p.x,sy:p.y,tx:p.tx,ty:p.ty,age:0,duration:.4};}
 },
 paint(ctx,e,g,x,y){
  ctx.save();if(e instanceof Player){const f=(typeof Deathmatch!=='undefined'&&Deathmatch.active(g)?DeathmatchSprites.frame(e.character,e.facing||'down'):null)||RitualSprites.walkFrame(e.character,e.facing||'down',0);if(f){const [sx,sy,sw,sh]=f.rect,k=Math.min(39/sw,42/sh);ctx.drawImage(f.source,sx,sy,sw,sh,x-sw*k/2,y-sh*k,sw*k,sh*k);}}
  else{ctx.translate(x-e.x,y-18-e.y);PixelEnemies.draw(ctx,e,g);}ctx.restore();
 }
};
const gloveBeforeEntities=Game.prototype.useGlove;
Game.prototype.useGlove=function(p){
 if(!p.alive||!p.canPunch||p.carriedBy||p.gloveFlight)return false;
 const v=DIRS[p.facing]||DIRS.down;
 if(p.held?.kind==='entity'){
  const e=p.held.object,near={x:Math.max(1,Math.min(COLS-2,p.tx+v.dx*3)),y:Math.max(1,Math.min(ROWS-2,p.ty+v.dy*3))};
  const target=EntityGlove.spots(this,near,e)[0];if(!target)return false;
  p.held=null;e.carriedBy=null;e.gloveFlight={sx:p.x,sy:p.y-30,tx:target.x,ty:target.y,age:0,duration:.5};this.sfx.placeBomb();return true;
 }
 if(p.held)return gloveBeforeEntities.call(this,p);
 const candidates=(this.mode===1?this.enemies:this.players.filter(e=>e!==p&&!(this.settings.battle.formation==='teams'&&e.team===p.team))).filter(e=>e.alive&&!e.dying&&!e.carriedBy&&!e.gloveFlight&&!e.portalTransit&&!e.held);
 const target=candidates.filter(e=>{const dx=e.x-p.x,dy=e.y-p.y;return Math.hypot(dx,dy)<=TILE*1.35&&dx*v.dx+dy*v.dy>0&&Math.abs(dx*v.dy-dy*v.dx)<TILE*.65;}).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(!target)return gloveBeforeEntities.call(this,p);
 target.carriedBy=p;target.target=null;target.moveTarget=null;target.moving=false;p.held={kind:'entity',object:target};this.sfx.placeBomb();return true;
};
const hazardsBeforeGlove=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){
 hazardsBeforeGlove.call(this,dt);
 for(const p of this.players)if(p.held?.kind==='entity'){
  if(!p.alive){EntityGlove.release(this,p);continue;}const e=p.held.object;e.x=p.x;e.y=p.y;e.facing=p.facing;
 }
 for(const e of EntityGlove.all(this))if(e.gloveFlight){const f=e.gloveFlight;f.age+=dt;if(f.age>=f.duration&&!EntityGlove.land(this,e,{x:f.tx,y:f.ty})){
  e.gloveFlight=null;if(e instanceof Player)this.killPlayer(e,true);else this.killEnemy(e,null);
 }}
};
const killBeforeEntityRelease=Game.prototype.killPlayer;
Game.prototype.killPlayer=function(p,...args){killBeforeEntityRelease.call(this,p,...args);if(!p.alive){EntityGlove.release(this,p);if(p.carriedBy){p.carriedBy.held=null;p.carriedBy=null;}p.gloveFlight=null;}};
const setupBeforeEntityClear=Game.prototype.setupLevel;
Game.prototype.setupLevel=function(){for(const e of EntityGlove.all(this)){e.carriedBy=null;e.gloveFlight=null;e.gloveStun=0;}return setupBeforeEntityClear.call(this);};
const airborneBeforeEntities=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){airborneBeforeEntities.call(this,ctx,g);for(const p of g.players)if(p.alive&&p.held?.kind==='entity')EntityGlove.paint(ctx,p.held.object,g,p.x,p.y-58);for(const e of EntityGlove.all(g))if(e.gloveFlight){const at=this.flightPoint(e.gloveFlight);EntityGlove.paint(ctx,e,g,at.x,at.y);}};

const enemyKillBeforeRelease=Game.prototype.killEnemy;
Game.prototype.killEnemy=function(e,...args){enemyKillBeforeRelease.call(this,e,...args);if(!e.alive){if(e.carriedBy)e.carriedBy.held=null;e.carriedBy=null;e.gloveFlight=null;}};
