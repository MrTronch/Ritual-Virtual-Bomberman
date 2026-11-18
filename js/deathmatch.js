// Deathmatch rules stay isolated from the classic campaign and bomb battles.
const Deathmatch={
 active(g){return !g.demo&&(g.mode===1?g.settings.campaignCombat==='deathmatch':g.mode===2&&g.settings.battle.combat==='deathmatch'&&g.settings.battle.stage!=='overdrive');},
 cooldown:.5,chargeSeconds:1.5,shotSpeed:620,
 equip(p){p.hp=15;p.maxHp=15;p.canPunch=true;p.speedLevel=4;p.range=1;p.heartGuard=false;p.deathmatchArmed=true;p.speedDropBase=4;p.fireRateLevel=p.fireRateLevel||0;p.shotCooldown=0;p.shotCharge=0;p.shotCharging=false;p.bombKind='normal';},
 fireInterval(p){return Math.max(.2,this.cooldown-(p.fireRateLevel||0)*.1);},
 eligible(e){return e.alive&&!e.carriedBy&&!e.gloveFlight&&!e.portalTransit;},
 hit(g,e,amount,owner,source=null){
  if(!this.eligible(e)||(e instanceof Player&&e.shield>0))return false;
  e.hp=Math.max(0,(e.hp??(e instanceof Player?15:2))-amount);
  g.spawnParticles(e.x,e.y,5,['#a7fbff','#ffffff',e.color||'#ff80a0'],70);
  if(e.hp<=0){if(e instanceof Player)deathmatchKillPlayer.call(g,e,true,source);else deathmatchKillEnemy.call(g,e,owner);}
  return true;
 },
 hitBrick(g,x,y,damage=1){
  if(g.grid[y]?.[x]!==TILE_BRICK)return;
  const key=tileKey(x,y),left=(g.brickHp.get(key)??3)-damage;
  if(left<=0){g.brickHp.delete(key);g.destroyBrick(x,y);}else{g.brickHp.set(key,left);g.spawnParticles(centerOf(x),centerOf(y),3,['#bffaff','#fff4af'],55);}
 },
 shoot(g,p,charged=false){
  if(!this.eligible(p)||p.held||p.shotCooldown>1e-8||g.state!=='playing')return false;
  const d=DIRS[p.facing]||DIRS.down,origin=typeof DeathmatchSprites!=='undefined'?DeathmatchSprites.muzzle(p):{x:p.x+d.dx*24+d.dy*12,y:p.y-8-d.dx*0};
  (g.laserFlashes||(g.laserFlashes=[])).push({...origin,age:0});
  g.laserShots.push({x:origin.x,y:origin.y+8,origin,dx:d.dx,dy:d.dy,owner:p,kind:p.bombKind||'normal',charged,damage:charged?4:p.bombKind==='spike'?4:p.bombKind==='napalm'?2:1,age:0});p.shotCooldown=this.fireInterval(p);
  g.sfx.placeBomb();return true;
 },
 impact(g,s,x,y,target=null){
  if(s.kind==='tnt'){
   const cells=[];for(let ty=y-1;ty<=y+1;ty++)for(let tx=x-1;tx<=x+1;tx++)if(tx>0&&ty>0&&tx<COLS-1&&ty<ROWS-1&&g.grid[ty][tx]!==TILE_WALL){cells.push({x:tx,y:ty,dir:null,end:false});this.hitBrick(g,tx,ty,s.damage??1);}
   const ex=new Explosion(cells,s.owner);ex.kind='tnt';ex.dmDamage=s.damage??1;ex.duration=ex.timer=450;g.explosions.push(ex);g.sfx.explosion();
  }else{
   this.hitBrick(g,x,y,s.damage??(s.kind==='spike'?4:s.kind==='napalm'?2:1));if(target)this.hit(g,target,s.damage??(s.kind==='spike'?4:s.kind==='napalm'?2:1),s.owner);
   g.spawnParticles(s.x,s.y-8,5,s.kind==='napalm'?['#ff6a32','#ffe87c']:['#78edff','#ffffff'],65);
  }
 },
 updateShots(g,dt){
  for(const f of g.laserFlashes||[])f.age+=dt;g.laserFlashes=(g.laserFlashes||[]).filter(f=>f.age<.08);
  for(const s of g.laserShots){s.age+=dt;if(s.age>4){s.done=true;continue;}
   const steps=Math.max(1,Math.ceil(this.shotSpeed*dt/6)),distance=this.shotSpeed*dt/steps;
   for(let n=0;n<steps&&!s.done;n++){
    s.x+=s.dx*distance;s.y+=s.dy*distance;const x=tileOf(s.x),y=tileOf(s.y),cell=g.grid[y]?.[x];
    if(cell==null||cell===TILE_WALL||cell===TILE_BRICK){s.done=true;this.impact(g,s,x,y);break;}
    const target=[...g.players,...g.enemies].find(e=>e!==s.owner&&this.eligible(e)&&Math.abs(e.x-s.x)<(e.half||16)+4&&Math.abs(e.y-s.y)<(e.half||16)+4);
    if(target){s.done=true;this.impact(g,s,x,y,target);break;}
    const bomb=g.bombAt(x,y);if(bomb&&!bomb.flight&&!bomb.inHand){s.done=true;this.impact(g,s,x,y);g.explodeBomb(bomb);}
   }
  }
  g.laserShots=g.laserShots.filter(s=>!s.done);
 },
 botAim(g,p){
  const targets=[...g.players,...g.enemies].filter(e=>e!==p&&this.eligible(e));
  targets.sort((a,b)=>Math.abs(a.x-p.x)+Math.abs(a.y-p.y)-Math.abs(b.x-p.x)-Math.abs(b.y-p.y));
  for(const e of targets){if(Math.abs(e.x-p.x)<17){p.facing=e.y<p.y?'up':'down';return;}if(Math.abs(e.y-p.y)<17){p.facing=e.x<p.x?'left':'right';return;}}
 },
 bar(ctx,e){const max=e.maxHp||(e instanceof Player?15:2),hp=e.hp??max,y=e.y-(e instanceof Player?57:37);ctx.fillStyle='#100d23';ctx.fillRect(e.x-23,y,46,6);ctx.fillStyle=e instanceof Player?'#62f4d0':'#ff83a2';ctx.fillRect(e.x-22,y+1,44*Math.max(0,hp)/max,4);},
 drawBrickBars(ctx,g){
  for(const [key,hp] of g.brickHp||[]){const [x,y]=key.split(',').map(Number);if(g.grid[y]?.[x]!==TILE_BRICK)continue;ctx.fillStyle='#22182e';ctx.fillRect(x*TILE+8,y*TILE+39,32,4);ctx.fillStyle='#86f7ff';for(let i=0;i<hp;i++)ctx.fillRect(x*TILE+10+i*10,y*TILE+40,8,2);}
 },
 draw(ctx,g){
  for(const f of g.laserFlashes||[]){ctx.fillStyle='#e6ffff';ctx.fillRect(f.x-2,f.y-5,4,10);ctx.fillRect(f.x-5,f.y-2,10,4);}
  for(const s of g.laserShots||[]){ctx.save();ctx.translate(s.x,s.y-8);ctx.rotate(Math.atan2(s.dy,s.dx));if(s.charged)ctx.scale(1.6,1.6);
   if(s.kind==='spike'){ctx.fillStyle='#183260';ctx.fillRect(-6,-6,12,12);ctx.fillStyle='#83eaff';for(const [x,y,w,h] of [[-2,-9,4,18],[-9,-2,18,4],[-4,-4,8,8]])ctx.fillRect(x,y,w,h);}
   else{ctx.fillStyle=s.kind==='napalm'?'#ff6e24':s.kind==='tnt'?'#ffab64':'#42dfff';ctx.fillRect(-13,-4,20,8);ctx.fillStyle='#fff9d4';ctx.fillRect(-9,-2,17,4);}ctx.restore();
  }
  for(const e of [...g.players,...g.enemies])if(this.eligible(e)){this.bar(ctx,e);if(e instanceof Player&&e.shotCharging){ctx.fillStyle='#152336';ctx.fillRect(e.x-23,e.y-67,46,6);ctx.fillStyle=e.shotCharge>=this.chargeSeconds?'#fff4a0':'#66edff';ctx.fillRect(e.x-22,e.y-66,44*Math.min(1,e.shotCharge/this.chargeSeconds),4);}}

 }
};
const deathmatchSetup=Game.prototype.setupLevel;
Game.prototype.setupLevel=function(){deathmatchSetup.call(this);this.laserShots=[];this.laserFlashes=[];this.brickHp=new Map();for(const p of this.players){p.deathmatchArmed=Deathmatch.active(this);p.speedDropBase=p.deathmatchArmed?4:1;}if(!Deathmatch.active(this))return;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(this.grid[y][x]===TILE_BRICK)this.brickHp.set(tileKey(x,y),3);
 for(const p of this.players)Deathmatch.equip(p);
 this.powerups=this.powerups.filter(p=>p.type!=='fire');
 for(const e of this.enemies)if(!e.isBoss)e.hp=e.maxHp=2;
 const spawns=this.players.map(p=>({x:p.tx,y:p.ty}));for(let n=0;n<(this.mode===2?8:2);n++){const e=this.spawnEnemy(['balloom','oneal','doll'][n%3],spawns,1);if(e){e.hp=e.maxHp=2;}}
};
const deathmatchPlace=Game.prototype.tryPlaceBomb;
Game.prototype.tryPlaceBomb=function(p){if(Deathmatch.active(this))return false;return deathmatchPlace.call(this,p);};
const deathmatchPlayerUpdate=Player.prototype.update;
Player.prototype.update=function(dt,g,input){if(!Deathmatch.active(g))return deathmatchPlayerUpdate.call(this,dt,g,input);
 this.shotCooldown=Math.max(0,(this.shotCooldown||0)-dt);deathmatchPlayerUpdate.call(this,dt,g,input);
 if(!Deathmatch.eligible(this)||this.held){this.shotCharging=false;this.shotCharge=0;return;}
 if(this.isBot){Deathmatch.botAim(g,this);Deathmatch.shoot(g,this);return;}
 const held=input.isDown(this.keys.bomb),pressed=input.wasPressed(this.keys.bomb);
 if(held&&this.shotCooldown<=1e-8){if(!this.shotCharging){this.shotCharging=true;this.shotCharge=0;}this.shotCharge=Math.min(Deathmatch.chargeSeconds,this.shotCharge+dt);}
 if(!held&&this.shotCharging){Deathmatch.shoot(g,this,this.shotCharge>=Deathmatch.chargeSeconds-1e-8);this.shotCharging=false;this.shotCharge=0;}
 else if(pressed&&!held)Deathmatch.shoot(g,this);
};
const deathmatchHazards=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){deathmatchHazards.call(this,dt);if(Deathmatch.active(this)){for(const p of this.players)if(!Deathmatch.eligible(p)){p.shotCharging=false;p.shotCharge=0;}Deathmatch.updateShots(this,dt);}};
const deathmatchKillPlayer=Game.prototype.killPlayer;
Game.prototype.killPlayer=function(p,force=false,source=null){if(!Deathmatch.active(this)||force)return deathmatchKillPlayer.call(this,p,force,source);return Deathmatch.hit(this,p,source?3:1,source?.owner,source);};
const deathmatchKillEnemy=Game.prototype.killEnemy;
Game.prototype.killEnemy=function(e,owner){if(!Deathmatch.active(this))return deathmatchKillEnemy.call(this,e,owner);return Deathmatch.hit(this,e,2,owner);};
const deathmatchCollisions=Game.prototype.resolveCollisions;
Game.prototype.resolveCollisions=function(){if(!Deathmatch.active(this))return deathmatchCollisions.call(this);
 for(const ex of this.explosions){ex.dmHits=ex.dmHits||new Set();for(const e of [...this.players,...this.enemies]){if(ex.dmHits.has(e)||!Deathmatch.eligible(e))continue;
  const hit=e instanceof Player?ex.cells.some(c=>this.flameHitsPlayer(e,c)):ex.covers(e.tx,e.ty);
  if(hit&&Deathmatch.hit(this,e,ex.dmDamage??3,ex.owner,ex))ex.dmHits.add(e);
 }}
 for(const e of this.enemies)if(Deathmatch.eligible(e))for(const p of this.players)if(Deathmatch.eligible(p)&&p.shield<=0&&Math.abs(p.x-e.x)<TILE*.6&&Math.abs(p.y-e.y)<TILE*.6){if(Deathmatch.hit(this,p,1,null))p.shield=600;}
 for(const p of this.players)if(Deathmatch.eligible(p)){const pu=this.powerups.find(u=>u.tx===p.tx&&u.ty===p.ty);if(pu)this.collectPowerUp(p,pu);}
};
const deathmatchCollect=Game.prototype.collectPowerUp;
Game.prototype.collectPowerUp=function(p,pu){if(!Deathmatch.active(this))return deathmatchCollect.call(this,p,pu);
 if(pu.type==='random')pu.type=typeof Inca!=='undefined'?weightedPick(Inca.drops):weightedPick(POWERUP_TABLE.filter(([type])=>!['fire','random'].includes(type)));if(pu.type==='thunder')pu.type='bomb';
 if(pu.type==='bomb'){this.powerups=this.powerups.filter(u=>u!==pu);p.fireRateLevel=Math.min(3,(p.fireRateLevel||0)+1);p.shotCooldown=Math.min(p.shotCooldown||0,Deathmatch.fireInterval(p));p.score+=50;this.floaters.push(new Floater('CADENCIA '+Deathmatch.fireInterval(p).toFixed(2)+' s',p.x,p.y-40,'#7cffff',12));this.sfx.powerup();return;}
 if(pu.type==='fire'){this.powerups=this.powerups.filter(u=>u!==pu);return;}
 if(pu.type==='life'){p.hp=(p.hp??15)+5;p.maxHp=Math.max(p.maxHp||15,p.hp);this.powerups=this.powerups.filter(u=>u!==pu);this.floaters.push(new Floater('+5 PV',p.x,p.y-45,'#75ffd8',13));this.sfx.powerup();return;}
 return deathmatchCollect.call(this,p,pu);
};
const deathmatchBrick=Game.prototype.destroyBrick;
Game.prototype.destroyBrick=function(x,y){deathmatchBrick.call(this,x,y);if(Deathmatch.active(this)){this.brickHp.delete(tileKey(x,y));for(const pu of this.powerups)if(pu.type==='fire')pu.type=weightedPick(POWERUP_TABLE.filter(([type])=>!['fire','random'].includes(type)));}};
const deathmatchLaunch=Game.prototype.launchRevengeBomb;
Game.prototype.launchRevengeBomb=function(p){const old=new Set(this.bombs),ok=deathmatchLaunch.call(this,p);if(ok&&Deathmatch.active(this))for(const b of this.bombs)if(!old.has(b))b.range=2;return ok;};
const deathmatchReturn=Game.prototype.returnFromShip;
Game.prototype.returnFromShip=function(p,...args){const ok=deathmatchReturn.call(this,p,...args);if(ok&&Deathmatch.active(this))Deathmatch.equip(p);return ok;};
const deathmatchAir=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){deathmatchAir.call(this,ctx,g);if(Deathmatch.active(g))Deathmatch.draw(ctx,g);};

const deathmatchSpawn=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(...args){const e=deathmatchSpawn.apply(this,args);if(e&&Deathmatch.active(this)&&!e.isBoss)e.hp=e.maxHp=2;return e;};
const deathmatchRespawn=Game.prototype.updateDeadPlayer;
Game.prototype.updateDeadPlayer=function(p,dt){const dead=!p.alive;deathmatchRespawn.call(this,p,dt);if(dead&&p.alive&&Deathmatch.active(this))Deathmatch.equip(p);};

const resetBeforeFireRate=Player.prototype.resetPowers;
Player.prototype.resetPowers=function(){resetBeforeFireRate.call(this);this.fireRateLevel=0;};
