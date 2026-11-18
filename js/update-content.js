// Supplied November update: item atlas, arena rules and the two battle arenas.
const UpdateContent = {
 chargeImage:Object.assign(new Image(),{src:'assets/objetos/charges-transparent.webp'}),
 chargeRects:{"tnt": [222, 114, 476, 664], "napalm": [1054, 182, 539, 585]},
 itemImage:Object.assign(new Image(),{src:'assets/objetos/items.webp'}),
 itemRects:{"bomb": [38, 19, 318, 313], "fire": [390, 19, 317, 313], "speed": [740, 19, 318, 313], "kick": [1091, 19, 319, 312], "wallpass": [39, 376, 317, 314], "life": [390, 377, 317, 312], "skull": [740, 377, 318, 312], "glove": [1092, 377, 318, 313], "random": [39, 735, 317, 317], "tnt": [390, 735, 317, 317], "napalm": [740, 735, 318, 317], "snail": [1092, 735, 318, 317]},
 loadImage(src){return Object.assign(new Image(),{src});}
};
const itemDetails=[
 ['bomb','Bomba extra','Una bomba simultánea más'],['fire','Más fuego','Aumenta el alcance'],['speed','Patín','Velocidad gradual, máximo 168 px/s'],['kick','Patada','Empuja bombas al caminar'],
 ['wallpass','Fantasma','Atraviesa ladrillos; visible con transparencia'],['life','Protección','Una burbuja protectora, sin acumulación'],['skull','Calavera','Maldición durante 10 segundos'],['glove','Guante','N: levanta y lanza bombas, ítems y enemigos'],
 ['spike','Bomba de púas','Azul: atraviesa ladrillos hasta el alcance de fuego'],['random','Azar','Entrega otro ítem al azar'],['tnt','TNT','Coloca TNT con explosión cuadrada'],['napalm','Napalm','Deja fuego peligroso durante 4 segundos'],['snail','Caracol','Reduce velocidad durante 5 segundos']
];
PixelItems.info=itemDetails;
for(const [type,name] of itemDetails){if(!PixelItems.patterns[type])PixelItems.patterns[type]=[];POWERUP_INFO[type]={name,color:'#e7d9ff'};}
POWERUP_TABLE.splice(0,POWERUP_TABLE.length,...[['bomb',30],['fire',30],['kick',10],['glove',10],['speed',6],['wallpass',4],['life',2],['random',2],['tnt',2],['napalm',2],['spike',5],['skull',1],['snail',1]]);
const oldItemPainter={...PixelItems,badgeCache:new Map()};
const oldItemBadge=oldItemPainter.badge.bind(oldItemPainter);
PixelItems.badge=function(ctx,type,x,y,size=36){
 if(type==='spike'){
  ctx.save();ctx.translate(x,y);ctx.scale(size/48,size/48);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#142547';ctx.fillRect(0,0,48,48);ctx.strokeStyle='#7cddff';ctx.lineWidth=2;ctx.strokeRect(1,1,46,46);
  PixelFX.spikeBomb(ctx,24,26);ctx.restore();return;
 }
 const img=UpdateContent.itemImage,r=UpdateContent.itemRects[type];
 if(!img.complete||!img.naturalWidth||!r){oldItemBadge(ctx,type,x,y,size);if(!img.complete)img.addEventListener('load',()=>this.badge(ctx,type,x,y,size),{once:true});return;}
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,...r,x,y,size,size);ctx.restore();
};
PixelItems.icon=function(ctx,type,x,y,size=24){this.badge(ctx,type,x,y,size);};
PixelItems.guide=function(){
 const c=document.createElement('canvas');c.width=1440;c.height=100+Math.ceil(this.info.length/3)*275+25;const ctx=c.getContext('2d');ctx.fillStyle='#160f25';ctx.fillRect(0,0,c.width,c.height);
 ctx.fillStyle='#c3ff85';ctx.font='28px "Ritual Pixel"';ctx.fillText('RITUAL VIRTUAL / ITEMS',50,60);
 this.info.forEach(([type,name,desc],i)=>{const x=40+(i%3)*465,y=100+Math.floor(i/3)*275;ctx.fillStyle='#302044';ctx.fillRect(x,y,445,255);this.badge(ctx,type,x+153,y+12,128);ctx.fillStyle='#f4edff';ctx.font='19px "Ritual Pixel"';ctx.textAlign='center';ctx.fillText(name,x+222,y+170);ctx.font='11px "Ritual Pixel"';const words=desc.split(' ');let line='',lines=[];for(const word of words){if((line+' '+word).length>42){lines.push(line);line=word;}else line+=(line?' ':'')+word;}lines.push(line);lines.forEach((l,j)=>ctx.fillText(l,x+222,y+204+j*18));});return c;
};

// One blast description drives actual damage, the danger map and bot planning.
Game.prototype.blastCells=function(tx,ty,range,kind='normal'){
 if(tx<=0||ty<=0||tx>=COLS-1||ty>=ROWS-1)return [];
 if(kind==='tnt'){
  const radius=Math.min(2,Math.max(1,range)),out=[];
  // TNT is a complete square, not a flood-fill stopped by adjacent crates.
  // Permanent walls leave holes; all other cells and crates in the square ignite.
  for(let y=Math.max(1,ty-radius);y<=Math.min(ROWS-2,ty+radius);y++)
   for(let x=Math.max(1,tx-radius);x<=Math.min(COLS-2,tx+radius);x++)
    if(this.grid[y][x]!==TILE_WALL)out.push({x,y,dir:null,end:false});
  return out;
 }
 const out=[{x:tx,y:ty,dir:null,end:false}];
 for(const dir of DIR_LIST){const v=DIRS[dir];for(let i=1;i<=range;i++){const x=tx+v.dx*i,y=ty+v.dy*i;if(x<=0||y<=0||x>=COLS-1||y>=ROWS-1||this.grid[y][x]===TILE_WALL)break;const stop=(this.grid[y][x]===TILE_BRICK&&kind!=='spike')||this.bombAt(x,y);out.push({x,y,dir,end:!!stop||i===range});if(stop)break;}}
 return out;
};
Game.prototype.explodeBomb=function(bomb){
 if(bomb.exploded)return;bomb.exploded=true;this.bombs=this.bombs.filter(b=>b!==bomb);if(!bomb.orphan)bomb.owner.bombsActive=Math.max(0,bomb.owner.bombsActive-1);
 const previous=this.powerups.slice(),cells=this.blastCells(bomb.tx,bomb.ty,bomb.range,bomb.kind),chain=[];
 for(const c of cells){if(this.grid[c.y][c.x]===TILE_BRICK)this.destroyBrick(c.x,c.y);const other=this.bombAt(c.x,c.y);if(other&&!chain.includes(other))chain.push(other);}
 const ex=new Explosion(cells,bomb.owner);ex.revengeOwner=bomb.revengeOwner;ex.revengeToken=bomb.revengeToken;ex.kind=bomb.kind||'normal';ex.duration=ex.kind==='napalm'?SPECIAL_FLAME_MS.napalm:ex.kind==='tnt'?SPECIAL_FLAME_MS.tnt:EXPLOSION_DURATION;ex.timer=ex.duration;this.explosions.push(ex);this.sfx.explosion();this.addShake(3+bomb.range);
 this.powerups=this.powerups.filter(p=>!(previous.includes(p)&&ex.covers(p.tx,p.ty)));
 for(const b of chain){if(bomb.revengeOwner&&!b.revengeOwner){b.revengeOwner=bomb.revengeOwner;b.revengeToken=bomb.revengeToken;}this.explodeBomb(b);}
};
const baseResetPowers=Player.prototype.resetPowers;
Player.prototype.resetPowers=function(){baseResetPowers.call(this);this.snailTimer=0;this.bombKind='normal';this.canPunch=false;};
const baseSpeed=Object.getOwnPropertyDescriptor(Player.prototype,'speed').get;
Object.defineProperty(Player.prototype,'speed',{get(){return (this.snailTimer>0)?Math.min(BASE_SPEED*.6,baseSpeed.call(this)):baseSpeed.call(this);}});
const basePlayerUpdate=Player.prototype.update;
Player.prototype.update=function(dt,game,input){
 this.snailTimer=Math.max(0,(this.snailTimer||0)-dt*1000);
 if(!this.isBot&&input.wasPressed(this.keys.glove||[]))game.useGlove(this);
 if(this.portalTransit){game.updatePortalTransit(this,dt);return;}
 game.tryPortal(this,dt,input);if(this.portalTransit)return;basePlayerUpdate.call(this,dt,game,input);game.tryPortal(this,0,input);
};
const basePlaceBomb=Game.prototype.tryPlaceBomb;
Game.prototype.tryPlaceBomb=function(p){
 if(p.held)return false;
 const old=this.bombs.slice(),ok=basePlaceBomb.call(this,p);if(ok){const b=this.bombs.find(b=>!old.includes(b));if(b)b.kind=p.bombKind||'normal';}return ok;
};
Game.prototype.useGlove=function(p){
 if(!p.alive||!p.canPunch)return false;
 const v=DIRS[p.facing]||DIRS.down;
 if(p.held){
  let target=null;for(let distance=3;distance>=1;distance--){const x=p.tx+v.dx*distance,y=p.ty+v.dy*distance;if(x>0&&y>0&&x<COLS-1&&y<ROWS-1&&this.grid[y][x]===TILE_EMPTY&&!this.bombAt(x,y)&&!this.portalZone(x,y)){target={x,y};break;}}
  if(!target)return false;
  const held=p.held;p.held=null;
  const flight={sx:p.x,sy:p.y,tx:target.x,ty:target.y,age:0,duration:.45};
  if(held.kind==='bomb'){const b=held.object;b.inHand=null;b.flight=flight;b.x=centerOf(target.x);b.y=centerOf(target.y);b.walkers.clear();}
  else this.thrownItems.push({object:held.object,flight});
  this.sfx.placeBomb();return true;
 }
 const spots=[{x:p.tx,y:p.ty},{x:p.tx+v.dx,y:p.ty+v.dy}];
 for(const spot of spots){const b=this.bombAt(spot.x,spot.y);if(b){b.inHand=p;b.slideDir=null;b.slideTarget=null;b.x=p.x;b.y=p.y;p.held={kind:'bomb',object:b};return true;}}
 for(const spot of spots){const item=this.powerups.find(a=>a.tx===spot.x&&a.ty===spot.y);if(item){this.powerups=this.powerups.filter(a=>a!==item);p.held={kind:'item',object:item};return true;}}
 return false;
};
const baseBombAt=Game.prototype.bombAt;
Game.prototype.bombAt=function(x,y){return this.bombs.find(b=>!b.inHand&&!b.flight&&b.tx===x&&b.ty===y)||null;};
const baseUpdateBombs=Game.prototype.updateBombs;
Game.prototype.updateBombs=function(dt){
 this.thrownItems=this.thrownItems||[];
 for(const p of this.players)if(p.held&&!p.alive&&p.held.kind!=='entity'){const held=p.held;p.held=null;if(held.kind==='bomb'){held.object.inHand=null;held.object.x=p.x;held.object.y=p.y;}else{held.object.tx=p.tx;held.object.ty=p.ty;if(this.grid[p.ty]?.[p.tx]===TILE_EMPTY)this.powerups.push(held.object);}}
 for(const b of this.bombs){
  if(b.inHand){b.x=b.inHand.x;b.y=b.inHand.y;}
  if(b.flight){b.flight.age+=dt;if(b.flight.age>=b.flight.duration){const f=b.flight;b.flight=null;let spot={x:f.tx,y:f.ty};if(this.grid[spot.y]?.[spot.x]!==TILE_EMPTY||this.bombs.some(o=>o!==b&&!o.inHand&&!o.flight&&o.tx===spot.x&&o.ty===spot.y)){const choices=tilesOfType(this.grid,TILE_EMPTY).filter(c=>!this.bombAt(c.x,c.y)&&!this.portalZone(c.x,c.y));choices.sort((a,c)=>manhattan(a,spot)-manhattan(c,spot));spot=choices[0]||spot;}b.x=centerOf(spot.x);b.y=centerOf(spot.y);for(const p of this.players)if(p.alive&&p.tx===spot.x&&p.ty===spot.y)b.walkers.add(p);}}
 }
 for(const t of this.thrownItems){t.flight.age+=dt;if(t.flight.age>=t.flight.duration){const f=t.flight;if(this.grid[f.ty]?.[f.tx]===TILE_EMPTY){t.object.tx=f.tx;t.object.ty=f.ty;this.powerups.push(t.object);}t.done=true;}}
 this.thrownItems=this.thrownItems.filter(t=>!t.done);
 baseUpdateBombs.call(this,dt);
};
const explodeHeldBomb=Game.prototype.explodeBomb;
Game.prototype.explodeBomb=function(b){
 if(b.inHand){const p=b.inHand;b.x=p.x;b.y=p.y;p.held=null;b.inHand=null;}
 if(b.flight){const f=b.flight,t=Math.min(1,f.age/f.duration);b.x=f.sx+(centerOf(f.tx)-f.sx)*t;b.y=f.sy+(centerOf(f.ty)-f.sy)*t;b.flight=null;}
 return explodeHeldBomb.call(this,b);
};

const baseCollect=Game.prototype.collectPowerUp;
Game.prototype.collectPowerUp=function(p,pu){
 if(pu.type==='random'){const type=randomItem(itemDetails.map(a=>a[0]).filter(t=>t!=='random'));pu.type=type;return this.collectPowerUp(p,pu);}
 if(['snail','glove','tnt','napalm','spike'].includes(pu.type)){
  this.powerups=this.powerups.filter(v=>v!==pu);
  if(pu.type==='snail')p.snailTimer=5000;else if(pu.type==='glove')p.canPunch=true;else p.bombKind=pu.type;
  p.score+=50;this.floaters.push(new Floater(POWERUP_INFO[pu.type].name,p.x,p.y-30,'#f4edff',13));this.sfx.powerup();return;
 }return baseCollect.call(this,p,pu);
};
Game.prototype.buildDangerMap=function(){
 this.danger.fill(0);for(const b of this.bombs)for(const c of this.blastCells(b.tx,b.ty,b.range,b.kind))this.danger[c.y*COLS+c.x]=1;
 for(const ex of this.explosions)for(const c of ex.cells)this.danger[c.y*COLS+c.x]=2;
 for(const c of this.lavaThreats())if(this.danger[c.y*COLS+c.x]!==2)this.danger[c.y*COLS+c.x]=1;
};

Game.prototype.configureArenaContent=function(){
 const s=this.mode===1?this.campaignStage():null;
 this.arenaStyle=this.mode===2?(this.settings.battle.stage||'ritual'):s.world===0?'ritual':s.world===1?'jurassic':null;
 this.portals=[];this.volcano=null;this.lavaShots=[];this.thrownItems=[];this.portalFlashes=[];for(const p of this.players){p.portalLatch=false;p.portalCooldown=0;p.portalTransit=null;p.held=null;}
 if(this.arenaStyle==='ritual'){
  const cy=Math.floor((ROWS-1)/2),cx=Math.floor((COLS-1)/2);
  const endpoints=[{x:0,y:cy,pair:1,dir:'left'},{x:COLS-1,y:cy,pair:0,dir:'right'},{x:cx,y:0,pair:3,dir:'up'},{x:cx,y:ROWS-1,pair:2,dir:'down'}];
  for(const p of endpoints){this.grid[p.y][p.x]=TILE_EMPTY;const v=DIRS[p.dir];const x=p.x-v.dx,y=p.y-v.dy;this.grid[y][x]=TILE_EMPTY;
   if(this.mode===2)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const gx=x+dx,gy=y+dy;if(gx>0&&gy>0&&gx<COLS-1&&gy<ROWS-1&&this.grid[gy][gx]!==TILE_WALL)this.grid[gy][gx]=TILE_BRICK;}
   // A destructible gate separates each initial quarter from the portal lane.
   const gx=x-v.dx,gy=y-v.dy;if(this.grid[gy]?.[gx]!==undefined&&this.grid[gy][gx]!==TILE_WALL)this.grid[gy][gx]=TILE_BRICK;
  }this.portals=endpoints;
 }else if(this.arenaStyle==='jurassic'){
  const cx=Math.floor(COLS/2),cy=Math.floor(ROWS/2);this.volcano={x:cx,y:cy,until:12,eruptions:0,targets:[]};
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)this.grid[y][x]=TILE_WALL;
  // An open ring provides room to read and dodge the periodic eruption.
  for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++)if(Math.max(Math.abs(x-cx),Math.abs(y-cy))===2&&!(this.mode===2&&(x===cx||y===cy))&&this.grid[y][x]===TILE_BRICK)this.grid[y][x]=TILE_EMPTY;
 }
 this.enemies=this.enemies.filter(e=>this.grid[e.ty]?.[e.tx]!==TILE_WALL&&!this.portalZone(e.tx,e.ty));
};
// Arena dressing can clear an exit brick or replace it with the volcano.
// Reconcile the exit after the final arena layout, and reveal it on completion.
Game.prototype.ensureCampaignExit=function(open=false){
 if(this.mode!==1)return;
 const valid=e=>e&&e.tx>0&&e.ty>0&&e.tx<COLS-1&&e.ty<ROWS-1&&this.grid[e.ty]?.[e.tx]!==TILE_WALL&&!this.portalZone(e.tx,e.ty);
 if(!valid(this.exit)){
  if(this.isBossLevel()&&!open&&!this.exit)return;
  const start=this.players[0]?.spawn||{x:1,y:1},seen=new Set(),q=[start],spots=[];
  for(let i=0;i<q.length;i++){const c=q[i],key=tileKey(c.x,c.y);if(seen.has(key)||c.x<=0||c.y<=0||c.x>=COLS-1||c.y>=ROWS-1||this.grid[c.y]?.[c.x]===TILE_WALL)continue;seen.add(key);if(!this.portalZone(c.x,c.y))spots.push(c);for(const d of DIR_LIST)q.push({x:c.x+DIRS[d].dx,y:c.y+DIRS[d].dy});}
  spots.sort((a,b)=>manhattan(b,start)-manhattan(a,start));const spot=spots[0];if(!spot)return;this.exit={tx:spot.x,ty:spot.y,revealed:false};
 }
 const e=this.exit;
 if(open&&this.grid[e.ty][e.tx]===TILE_BRICK)this.destroyBrick(e.tx,e.ty);
 if(this.grid[e.ty][e.tx]===TILE_EMPTY)e.revealed=true;
 if(open)this.powerups=this.powerups.filter(p=>p.tx!==e.tx||p.ty!==e.ty);
};
Game.prototype.portalZone=function(x,y){return (this.portals||[]).find(a=>{const d=DIRS[a.dir];return (a.x===x&&a.y===y)||(a.x-d.dx===x&&a.y-d.dy===y);})||null;};
Game.prototype.tryPortal=function(p,dt,input=null){
 p.portalCooldown=Math.max(0,(p.portalCooldown||0)-dt*1000);if(p.portalTransit||p.isBot||!p.alive||!this.portals?.length)return false;
 const entry=this.portalZone(p.tx,p.ty);if(!entry||p.portalCooldown>0)return false;
 const held=dir=>!!input?.isDown(p.keys[p.hasCurse('reverse')?OPPOSITE[dir]:dir]);
 const toward=held(entry.dir)||(!input&&p.facing===entry.dir);
 if(!toward)return false;
 const dest=this.portals[entry.pair],d=DIRS[dest.dir],landing={x:dest.x-d.dx,y:dest.y-d.dy};
 // A bomb on either receiving threshold blocks this entrance; never bypass it.
 if(this.bombAt(dest.x,dest.y)||this.bombAt(landing.x,landing.y)||this.grid[landing.y][landing.x]!==TILE_EMPTY)return false;
 if(!p.canStand(this,centerOf(landing.x),centerOf(landing.y)))return false;
 if(this.explosions.some(ex=>ex.covers(landing.x,landing.y)))return false;
 p.portalTransit={entry,exit:dest,landing,age:0,duration:.6,sx:p.x,sy:p.y};p.moving=false;p.moveTarget=null;p.originTile=null;p.shield=Math.max(p.shield,900);
 this.portalFlashes.push({entry,exit:dest,age:0,duration:.6});
 return true;
};
Game.prototype.updatePortalTransit=function(p,dt){
 const t=p.portalTransit;if(!t)return;t.age+=dt;
 if(t.age>=t.duration/2&&!t.arrived){const a=t.landing;if(this.bombAt(a.x,a.y)||this.bombAt(t.exit.x,t.exit.y)||this.grid[a.y][a.x]!==TILE_EMPTY||!p.canStand(this,centerOf(a.x),centerOf(a.y))||this.explosions.some(ex=>ex.covers(a.x,a.y))){p.portalTransit=null;p.portalCooldown=500;return;}p.x=centerOf(a.x);p.y=centerOf(a.y);p.facing=t.entry.dir;t.arrived=true;}
 if(p.held?.kind==='bomb'){p.held.object.x=p.x;p.held.object.y=p.y;}
 if(t.age>=t.duration){p.portalTransit=null;p.portalCooldown=650;p.shield=Math.max(p.shield,650);}
};
const baseSolidFor=Game.prototype.isSolidFor;
Game.prototype.isSolidFor=function(x,y,e){if(this.portalZone(x,y)&&(!(e instanceof Player)||e.isBot))return true;return baseSolidFor.call(this,x,y,e);};
const baseCanStand=Player.prototype.canStand;
Player.prototype.canStand=function(g,x,y){
 const zone=g.portalZone?.(tileOf(x),tileOf(y));if(zone&&this.isBot)return false;
 for(const gate of g.portals||[])if(Math.abs(x-centerOf(gate.x))<this.half+TILE/2&&Math.abs(y-centerOf(gate.y))<this.half+TILE/2)return false;
 return baseCanStand.call(this,g,x,y);
};

Game.prototype.volcanoCells=function(){
 if(!this.volcano)return [];const v=this.volcano,cells=[];
 for(let y=v.y-3;y<=v.y+3;y++)for(let x=v.x-3;x<=v.x+3;x++)if(x>0&&y>0&&x<COLS-1&&y<ROWS-1&&Math.max(Math.abs(x-v.x),Math.abs(y-v.y))>=2&&this.grid[y][x]===TILE_EMPTY)cells.push({x,y,dir:null,end:false});
 return cells;
};
Game.prototype.lavaThreats=function(){
 const out=(this.lavaShots||[]).map(s=>({x:s.target.x,y:s.target.y,hitAt:Math.max(0,(s.duration-s.age)*1000),clearAt:Math.max(0,(s.duration-s.age)*1000)+2000}));
 if(this.volcano&&this.volcano.until<=1.5)for(const t of this.volcano.targets||[])out.push({x:t.x,y:t.y,hitAt:(this.volcano.until+t.duration)*1000,clearAt:(this.volcano.until+t.duration)*1000+2000});
 return out;
};
Game.prototype.updateArenaHazards=function(dt){
 for(const flash of this.portalFlashes||[])flash.age+=dt;this.portalFlashes=(this.portalFlashes||[]).filter(f=>f.age<f.duration);
 for(const shot of this.lavaShots||[]){shot.age+=dt;if(shot.age>=shot.duration){shot.done=true;const c=shot.target;if(this.grid[c.y]?.[c.x]===TILE_EMPTY){const ex=new Explosion([{...c,dir:null,end:false}],null);ex.kind='volcano';ex.duration=ex.timer=2000;this.explosions.push(ex);this.spawnParticles(centerOf(c.x),centerOf(c.y),6,['#ff7338','#ffd65b'],65);}}}
 this.lavaShots=(this.lavaShots||[]).filter(s=>!s.done);
 if(!this.volcano)return;const v=this.volcano;v.until-=dt;v.heat=Math.max(0,(v.heat||0)-dt);
 if(v.until<=1.5&&!v.targets.length){const pool=this.volcanoCells().slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}v.targets=pool.slice(0,3).map((c,i)=>({...c,duration:.9+i*.18}));}
 if(v.until<=1e-8){for(const t of v.targets)this.lavaShots.push({sx:centerOf(v.x),sy:(v.y-1)*TILE+TILE*.32,target:{x:t.x,y:t.y},age:0,duration:t.duration,peak:75+Math.random()*28});v.targets=[];v.until+=12;v.heat=.8;v.eruptions++;this.sfx.explosion();this.addShake(3);}
};

const baseSetupLevel=Game.prototype.setupLevel;
Game.prototype.setupLevel=function(){this.settings.battle.map='small';baseSetupLevel.call(this);this.configureArenaContent();this.ensureCampaignExit();};

const baseSaveDefaults=Save.defaults.bind(Save);Save.defaults=function(){const s=baseSaveDefaults();s.battle.stage='ritual';s.battle.duration=90;s.battle.extreme=true;s.battle.extremeDefaultsVersion=1;s.battle.cpuDefaultsVersion=1;s.battle.combat='classic';s.campaignCombat='classic';s.battle.format='cup';s.battle.formation='free';s.battle.teams=[0,1,0,1];return s;};
const baseSanitize=Save.sanitize.bind(Save);Save.sanitize=function(s){baseSanitize(s);s.battle.map='small';if(!['classic','deathmatch'].includes(s.campaignCombat))s.campaignCombat='classic';if(!['classic','deathmatch'].includes(s.battle.combat))s.battle.combat='classic';if(s.battle.combat==='deathmatch'&&s.battle.stage==='overdrive')s.battle.stage='ritual';if(typeof s.battle.extreme!=='boolean')s.battle.extreme=true;if(![90,120,150,180].includes(s.battle.duration))s.battle.duration=90;if(!['ritual','jurassic','overdrive','inca'].includes(s.battle.stage))s.battle.stage='ritual';if(!['single','cup'].includes(s.battle.format))s.battle.format='cup';if(!['free','teams'].includes(s.battle.formation))s.battle.formation='free';if(!Array.isArray(s.battle.teams)||s.battle.teams.length!==4||s.battle.teams.filter(t=>t===0).length!==2||s.battle.teams.filter(t=>t===1).length!==2)s.battle.teams=[0,1,0,1];return s;};
Game.prototype.showBattleSetup=function(){
 this.state='setup';const b=this.settings.battle,teams=b.formation==='teams',minBots=Math.max(0,2-b.humans),maxBots=4-b.humans;
 b.bots=teams?maxBots:Math.min(maxBots,Math.max(minBots,b.bots));b.map='small';
 const cycle=()=>{const focus=this.ui.focusIndex;this.saveSettings();this.showBattleSetup();this.ui.focusButton(focus);};
 const move=(key,values,delta)=>{b[key]=values[(Math.max(0,values.indexOf(b[key]))+delta+values.length)%values.length];};
 const option=(label,change,disabled=false)=>({label,cycle:true,disabled,adjust:d=>{change(d);cycle();},action:()=>{change(1);cycle();}});
 const settings=[
 option(`FORMATO: ${b.format==='single'?'UNA RONDA':'COPA · 3 VICTORIAS'}`,d=>move('format',['single','cup'],d)),
 option(`MODO: ${teams?'DOS EQUIPOS':'TODOS CONTRA TODOS'}`,d=>move('formation',['free','teams'],d)),
 option(`HUMANOS: ${b.humans}`,d=>move('humans',[1,2,3,4],d)),
 option(`CPU: ${b.bots}${teams?' · 2 VS 2':''}`,d=>move('bots',Array.from({length:maxBots-minBots+1},(_,i)=>i+minBots),d),teams),
 option(`TIEMPO: ${Math.floor((b.duration||120)/60)}:${String((b.duration||120)%60).padStart(2,'0')}`,d=>move('duration',[90,120,150,180],d)),
 option(`DIFICULTAD CPU: ${BOT_TIERS[b.skill].label.toUpperCase()}`,d=>move('skill',DIFFICULTY_ORDER,d)),
 option(`MODO EXTREMO: ${b.extreme?'ON · 3 BOMBAS':'OFF'}`,()=>b.extreme=!b.extreme,b.combat==='deathmatch'),
 option(`COMBATE: ${b.combat==='deathmatch'?'DEATHMATCH':'BOMBAS'}`,d=>{move('combat',['classic','deathmatch'],d);if(b.combat==='deathmatch'&&b.stage==='overdrive')b.stage='ritual';})
 ];
 if(teams)for(let i=0;i<4;i++)settings.push(option(`${i<b.humans?'J'+(i+1):'CPU'+(i-b.humans+1)}: EQUIPO ${b.teams[i]===0?'A':'B'}`,()=>{const other=b.teams.findIndex((t,j)=>j!==i&&t!==b.teams[i]);[b.teams[i],b.teams[other]]=[b.teams[other],b.teams[i]];}));
 this.ui.showOverlay({title:'BATALLA',text:'CONFIGURA LA PARTIDA · PASO 1 DE 2',buttons:[...settings,
 {label:'CONTINUAR',action:()=>{this.saveSettings();this.showBattleMaps();}},
 {label:'VOLVER',back:true,action:()=>this.showTitle()}],help:'Elige las reglas; después selecciona el mapa.'});
 this.ui.overlayButtons.classList.add('battle-rules');
 this.ui.buttons.forEach((entry,i)=>entry.el.classList.add(i<settings.length?'battle-setting':i===settings.length?'battle-continue':'battle-back'));
};
Game.prototype.showBattleMaps=function(){
 this.state='setup';const b=this.settings.battle,stages=['ritual','jurassic','overdrive','inca'],labels=['RITUAL VIRTUAL','JURÁSICO','UKU PACHA','SANTUARIO DEL INTI'];
 this.ui.showOverlay({title:'MAPAS DE BATALLA',text:'PASO 2 DE 2 · '+b.humans+' HUMANO'+(b.humans>1?'S':'')+' · '+b.bots+' CPU',buttons:[
 ...stages.map((stage,i)=>({label:labels[i]+(b.stage===stage?' ✓':''),disabled:b.combat==='deathmatch'&&stage==='overdrive',action:()=>{b.stage=stage;this.saveSettings();this.showBattleMaps();this.ui.focusButton(i);}})),
 {label:this.controllersReady()?'▶ JUGAR':'CONECTA '+this.requiredControllers()+' MANDO'+(this.requiredControllers()>1?'S':'')+' · START',disabled:!this.controllersReady(),action:()=>this.startBattle()},
 {label:'VOLVER A LAS REGLAS',back:true,action:()=>this.showBattleSetup()}],help:b.combat==='deathmatch'?'Uku Pacha no está disponible en Deathmatch.':'Selecciona el escenario y pulsa Jugar.'});
 this.ui.overlayButtons.classList.add('battle-maps');
 this.ui.buttons.forEach((entry,i)=>{const btn=entry.el;if(i<stages.length){const stage=stages[i];btn.classList.add('map-card');btn.setAttribute('aria-pressed',String(stage===b.stage));const c=document.createElement('canvas');c.width=384;c.height=192;btn.prepend(c);const paint=()=>ArenaArt.worldPreview(c.getContext('2d'),stage,384,192);paint();if(ArenaArt[stage]&&!ArenaArt[stage].complete)ArenaArt[stage].addEventListener('load',paint,{once:true});}else btn.classList.add(i===stages.length?'battle-play':'battle-back');});
};
Game.prototype.roundOver=function(winner){
 this.state='roundover';this.music.stop();const b=this.settings.battle,teams=b.formation==='teams',target=b.format==='single'?1:3;
 const winners=winner?(teams?this.players.filter(p=>p.team===winner.team):[winner]):[];
 if(winner){if(teams){this.teamWins[winner.team]++;for(const p of winners)p.wins=this.teamWins[winner.team];}else winner.wins++;}
 this.ui.updateHud(this);
 const label=winner?(teams?'EQUIPO '+['A','B'][winner.team]:winner.name):'';
 const standings=teams?`EQUIPO A: ${this.teamWins[0]} · EQUIPO B: ${this.teamWins[1]}`:this.players.map(p=>`${p.name}: ${p.wins}`).join(' · ');
 const complete=winner&&winner.wins>=target;
 if(complete){if(winners.some(p=>!p.isBot)){this.settings.battleWins++;this.saveSettings();}this.sfx.victory();}else this.sfx.levelClear();
 this.ui.showOverlay({title:winner?`${label} GANA ${complete?'LA PARTIDA':'LA RONDA'}`:'RONDA EMPATADA',text:`${b.format==='single'?'SINGLE':'COPA · OBJETIVO: 3 VICTORIAS'}\n${standings}`,buttons:[{label:complete?'REVANCHA':winner?'SIGUIENTE RONDA':'REPETIR RONDA',action:()=>{if(complete)this.startBattle();else{this.level++;this.startLevel();}}},{label:'MENÚ PRINCIPAL',back:true,action:()=>this.showTitle()}]});
 document.body.classList.add('round-results');
 if(winners.length)VictoryArt.show(this.ui,winners);
};


Bot.prototype.inBlast=function(game,bx,by,range,tx,ty){return game.blastCells(bx,by,range,this.player.bombKind).some(c=>c.x===tx&&c.y===ty);};

Game.prototype.showHelp=function(){this.state='setup';this.ui.showOverlay({title:'CÓMO JUGAR',text:'DEATHMATCH: M dispara (J2: Enter), cada 0,5 s; mantener 1,5 s carga daño 4 y soltar dispara. 10 PV; láser 1, napalm 2, púas 4, bomba de nave 3. Corazón +5 PV. TNT: área 3×3. Los bloques resisten 3 impactos. NPC: 2 PV. Velocidad inicial 4. Bombas solo desde la nave: dos simultáneas, fuego 2. Sin ítem de fuego ni mapa Uku Pacha.\n\nJ1: flechas / WASD · M: bomba · N: recoger/lanzar con guante.\nJ2: I J K L · Enter: bomba · O: guante.\nEspacio: pausa · Mandos: Start une J1/J2; X/cruz pone bomba; cuadrado recoge y lanza.\n\nTNT: cuadrado compacto (3×3, mejorado hasta 5×5); Napalm: fuego durante 4 s; TNT: fuego durante 1,5 s.\nCaracol: lentitud 5 s; Calavera: maldición 10 s.\nFantasma cruza ladrillos; el corazón protege de un golpe.\n\nBatalla: Single (una ronda) o Copa (3 victorias). Todos contra todos o equipos 2 vs 2 con fuego amigo; elige Ritual o Jurásico.\nPortales: izquierda ↔ derecha, arriba ↔ abajo.\nVolcán: lanza tres fuegos en arco a puntos aleatorios cada 12 s.\nRevancha: al morir pilotas una nave por los cuatro bordes con las flechas y mantienes M para cargar y sueltas para lanzar más lejos (J2: IJKL y Enter; mando: cruceta y X). Hasta dos bombas simultáneas por nave, fuego 2. Movimiento rápido y carga completa en 1,8 s. Una baja rival permite regresar antes de la caída de bloques.',buttons:[{label:'VOLVER',back:true,action:()=>this.showTitle()}]});};

// Apply the requested default once to existing saves; later manual choices remain saved.
const loadBeforeExtremeDefault=Save.load.bind(Save);Save.load=function(){let needsDefault=false;try{const raw=JSON.parse(window.localStorage.getItem(this.KEY)||"null");needsDefault=!!raw&&raw.battle?.extremeDefaultsVersion!==1;}catch{}const s=loadBeforeExtremeDefault();if(needsDefault){s.battle.extreme=true;s.battle.extremeDefaultsVersion=1;this.save(s);}return s;};

// Fill the four battle slots once when upgrading; subsequent CPU choices are remembered.
const loadBeforeCpuDefault=Save.load.bind(Save);Save.load=function(){let needsDefault=false;try{const raw=JSON.parse(window.localStorage.getItem(this.KEY)||"null");needsDefault=!!raw&&raw.battle?.cpuDefaultsVersion!==1;}catch{}const s=loadBeforeCpuDefault();if(needsDefault){s.battle.bots=Math.max(0,4-s.battle.humans);s.battle.cpuDefaultsVersion=1;this.save(s);}return s;};

const durationDefaults=Save.defaults.bind(Save);Save.defaults=function(){const s=durationDefaults();s.battle.durationDefaultsVersion=1;return s;};
const loadShortRounds=Save.load.bind(Save);Save.load=function(){const s=loadShortRounds();try{const old=JSON.parse(localStorage.getItem(this.KEY)||'null');if(old&&old.battle?.durationDefaultsVersion!==1){s.battle.duration=90;s.battle.durationDefaultsVersion=1;this.save(s);}}catch(e){}return s;};
