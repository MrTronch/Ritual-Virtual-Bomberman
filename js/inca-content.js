THEMES.inca={...THEMES.grass,name:'Santuario del Inti',floorA:'#71894d',floorB:'#657b46',brick:'#87917d',brickDark:'#48564e',brickLight:'#b4b99e'};
WORLD_ORDER.push('inca');WORLD_TEMPLATES.inca=['classic','rooms','cross','arena','arena'];BOSSES.inca={...BOSSES.grass,name:'Guardián del Inti',color:'#c5a046',accent:'#ffe291'};
// Inti arena and the next combat rules. All scenery uses the game's crisp 48px grid.
const Inca={
 drops:[['thunder',28],['tnt',12],['napalm',12],['spike',12],['life',8],['kick',4],['wallpass',4],['speed',2],['skull',9],['snail',9]],
 tiles:new Map(),
 tile(kind,variant=0){const key=kind+variant;if(this.tiles.has(key))return this.tiles.get(key);const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d'),r=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  if(kind==='floor'){r('#657b46',0,0,48,48);r('#71894d',1,1,46,46);r('#7f9555',4,6,17,3);r('#52693c',29,30,13,3);if(variant){r('#899185',9,10,28,27);r('#a5ab96',10,10,25,3);r('#535f53',10,34,27,3);r('#697466',23,13,2,21);}else{r('#97ac61',14,25,3,6);r('#97ac61',10,28,11,2);}}
  else{r('#252c2b',3,7,42,39);r('#747f78',3,3,42,37);r('#b2b8a2',4,3,39,4);r('#48564e',3,37,42,6);r('#8e9989',6,9,36,25);r('#3f4c46',6,20,36,3);r('#3f4c46',20,8,3,14);r('#3f4c46',30,23,3,12);r('#afbaa3',7,10,11,2);if(kind==='brick'){r('#343d35',24,5,3,9);r('#343d35',20,13,6,3);r('#343d35',18,16,3,11);r('#c4a652',9,27,8,3);r('#c4a652',12,24,3,9);}else if(kind==='border'){r('#c9ac54',3,8,42,5);r('#f0d27a',6,8,35,2);for(let x=6;x<42;x+=12){r('#746037',x,13,6,6);r('#d6b95e',x+2,13,3,3);}}}
  this.tiles.set(key,c);return c;
 },
 sun(ctx,x,y,size,charge=0){ctx.save();ctx.translate(x,y);ctx.scale(size/96,size/96);ctx.imageSmoothingEnabled=false;
  const rect=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  for(let i=0;i<12;i++){ctx.save();ctx.rotate(i*Math.PI/6);rect('#52402c',-6,-48,12,18);rect('#e4b942',-4,-46,8,15);rect('#ffde72',-3,-44,3,10);ctx.restore();}
  ctx.fillStyle='#4a382c';ctx.beginPath();ctx.arc(0,0,37,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d6a938';ctx.beginPath();ctx.arc(0,0,33,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffdf77';ctx.lineWidth=3;ctx.stroke();
  rect('#8c682f',-25,-18,50,5);const red=Math.round(199+56*charge),green=Math.round(174*(1-charge)+26*charge);const eye=`rgb(${red},${green},35)`;
  for(const ex of [-18,7]){rect('#56402c',ex-2,-12,15,16);rect(eye,ex,-10,11,11);rect(charge>.7?'#ffe998':'#ffe58b',ex+2,-9,3,3);}
  rect('#74512a',-3,-3,6,13);const mouth=5+Math.floor(charge*17);rect('#72532a',-21,11,42,mouth+5);rect('#2b2630',-18,13,36,mouth);for(let i=0;i<5;i++)rect('#f7d675',-16+i*7,13,4,4);rect('#f3ca5b',-8,31,16,3);ctx.restore();
 },
 bolt(ctx,x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size/32,size/32);ctx.fillStyle='#24233c';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(3,19);ctx.lineTo(13,19);ctx.lineTo(8,32);ctx.lineTo(29,11);ctx.lineTo(19,11);ctx.lineTo(24,0);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe467';ctx.beginPath();ctx.moveTo(17,3);ctx.lineTo(7,16);ctx.lineTo(17,16);ctx.lineTo(13,25);ctx.lineTo(24,14);ctx.lineTo(15,14);ctx.lineTo(20,3);ctx.closePath();ctx.fill();ctx.restore();},
 gun(ctx,x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size/48,size/48);const r=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};r('#101a31',3,12,39,18);r('#175675',6,15,32,12);r('#8bdbeb',8,15,23,5);r('#dcffff',9,15,16,2);r('#0e213b',34,11,10,20);r('#47e9ed',37,14,5,14);r('#0b3858',38,17,3,8);r('#182540',12,28,11,14);r('#63799a',15,29,6,10);ctx.restore();}
};
POWERUP_INFO.thunder={name:'Trueno · cadencia',color:'#fff276'};
const iconBeforeInca=PixelItems.icon,badgeBeforeInca=PixelItems.badge;
PixelItems.badge=function(ctx,type,x,y,size=36){if(type==='thunder'||type==='bomb'&&window.game&&Deathmatch.active(window.game)){Inca.bolt(ctx,x,y,size);return;}return badgeBeforeInca.call(this,ctx,type,x,y,size);};
PixelItems.icon=function(ctx,type,x,y,size=24){if(type==='thunder'||type==='bomb'&&window.game&&Deathmatch.active(window.game)){Inca.bolt(ctx,x,y,size);return;}return iconBeforeInca.call(this,ctx,type,x,y,size);};
// Exactly 2.5x the former cadence at every upgrade level; projectile speed is unchanged.
Deathmatch.fireInterval=function(p){return Math.max(.2,.5-(p.fireRateLevel||0)*.1)/2.5;};
const collectBeforeThunder=Game.prototype.collectPowerUp;
Game.prototype.collectPowerUp=function(p,pu){if(Deathmatch.active(this)&&pu.type==='thunder')pu.type='bomb';return collectBeforeThunder.call(this,p,pu);};
const brickBeforeInca=Game.prototype.destroyBrick;
Game.prototype.destroyBrick=function(x,y){const was=this.grid[y]?.[x]===TILE_BRICK;brickBeforeInca.call(this,x,y);if(!was||!Deathmatch.active(this)||this.exit?.tx===x&&this.exit?.ty===y)return;this.powerups=this.powerups.filter(u=>u.tx!==x||u.ty!==y);if(Math.random()<.7)this.powerups.push(new PowerUp(x,y,weightedPick(Inca.drops)));};
const configureBeforeInca=Game.prototype.configureArenaContent;
Game.prototype.configureArenaContent=function(){configureBeforeInca.call(this);this.inti=null;this.intiStrikes=[];this.bossShots=[];this.thrownBlocks=[];
 if(this.mode===2&&this.settings.battle.stage==='inca'||this.mode===1&&this.campaignStage().theme==='inca'){this.arenaStyle='inca';this.portals=[];this.volcano=null;const x=Math.floor(COLS/2),y=Math.floor(ROWS/2);this.inti={x,y,until:10,targets:[]};
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)this.grid[y+dy][x+dx]=Math.max(Math.abs(dx),Math.abs(dy))<=1?TILE_WALL:TILE_EMPTY;
  for(const e of this.enemies)if(e.isBoss&&this.grid[e.ty]?.[e.tx]===TILE_WALL){this.grid[y-3][x]=TILE_EMPTY;e.x=centerOf(x);e.y=centerOf(y-3);e.target=null;e.origin={x,y:y-3};}this.enemies=this.enemies.filter(e=>this.grid[e.ty]?.[e.tx]!==TILE_WALL);
 }
};
const setupBeforeInca=Game.prototype.setupLevel;
Game.prototype.setupLevel=function(){setupBeforeInca.call(this);if(this.mode===1&&Deathmatch.active(this))for(const e of this.enemies)if(!e.incaSpeedBoosted){e.speed*=1.18;e.incaSpeedBoosted=true;}if(this.mode===1&&!Deathmatch.active(this))for(const p of this.players){p.speedLevel=Math.max(3,p.speedLevel);p.speedDropBase=3;}else if(this.arenaStyle==='inca'||Deathmatch.active(this))for(const p of this.players){p.speedLevel=4;p.speedDropBase=4;}else if(this.mode===2)for(const p of this.players){p.speedLevel=1;p.speedDropBase=1;}if(Deathmatch.active(this))for(const pu of this.powerups)if(pu.type==='bomb')pu.type='thunder';};
const spawnBeforeInca=Game.prototype.spawnEnemy;
Game.prototype.spawnEnemy=function(...a){const e=spawnBeforeInca.apply(this,a);if(e&&this.mode===1&&Deathmatch.active(this)&&this.state==='playing'){e.speed*=1.18;e.incaSpeedBoosted=true;}return e;};
const resetBeforeInca=Player.prototype.resetPowers;
Player.prototype.resetPowers=function(){resetBeforeInca.call(this);if(this.speedDropBase===4||this.speedDropBase===3)this.speedLevel=this.speedDropBase;};
const floorBeforeInca=ArenaArt.floor,solidBeforeInca=ArenaArt.solid,overlayBeforeInca=ArenaArt.overlays,previewBeforeInca=ArenaArt.worldPreview;
ArenaArt.floor=function(ctx,g,x,y){if(g.arenaStyle!=='inca')return floorBeforeInca.call(this,ctx,g,x,y);ctx.drawImage(Inca.tile('floor',(x*7+y*3)%7),x*TILE,y*TILE,TILE,TILE);return true;};
ArenaArt.solid=function(ctx,g,x,y,t){if(g.arenaStyle!=='inca')return solidBeforeInca.call(this,ctx,g,x,y,t);const border=x<=0||y<=0||x>=COLS-1||y>=ROWS-1;ctx.drawImage(Inca.tile(t===TILE_BRICK?'brick':border?'border':'wall',border?((x<=0||x>=COLS-1)&&(y<=0||y>=ROWS-1)?3+(x>0?1:0)+(y>0?2:0):x<=0||x>=COLS-1?2:(x%6===0?7:1)):(x*7+y*3)%4),x*TILE,y*TILE,TILE,TILE);return true;};
ArenaArt.overlays=function(ctx,g){overlayBeforeInca.call(this,ctx,g);if(!g.inti)return;const v=g.inti,charge=Math.max(0,Math.min(1,(2.2-v.until)/2.2));
 for(const t of v.targets){const x=t.x*TILE,y=t.y*TILE,pulse=.52+.18*Math.sin(g.elapsed*14);
  ctx.save();ctx.fillStyle=`rgba(22,117,255,${pulse})`;ctx.fillRect(x+2,y+2,TILE-4,TILE-4);
ctx.restore();
 }

 for(const t of g.intiStrikes||[]){const x=centerOf(t.x),y=centerOf(t.y),frame=Math.min(6,Math.floor(t.age/.1));
  ctx.save();ctx.globalAlpha=1-t.age*.9;
  // Seven flickering shapes, branching leaders, impact and expanding shock ring.
  const pts=Array.from({length:7},(_,i)=>[x+(i===6?0:Math.sin((i+1)*2.7+frame*3.1)*13),y-126+i*21]);
  for(const [color,width] of [['#1766e8',13],['#50d9ff',7],['#efffff',3]]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();}
  ctx.strokeStyle='#80ecff';ctx.lineWidth=2;for(let i=2;i<6;i+=2){ctx.beginPath();ctx.moveTo(...pts[i]);ctx.lineTo(pts[i][0]+(frame%2?18:-18),pts[i][1]+10);ctx.lineTo(pts[i][0]+(frame%2?13:-13),pts[i][1]+22);ctx.stroke();}
  Inca.sprite(ctx,5,frame<2?4:5,x-28,y-24,56,44);
  ctx.strokeStyle='#7deaff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+5,9+frame*4,4+frame*2,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }

};
ArenaArt.worldPreview=function(ctx,stage,w,h){if(stage!=='inca')return previewBeforeInca.call(this,ctx,stage,w,h);ctx.save();ctx.scale(w/(10*TILE),h/(5*TILE));for(let y=0;y<5;y++)for(let x=0;x<10;x++){this.floor(ctx,{arenaStyle:'inca'},x,y);if(x===0||y===0||x===9||y===4||x%2===0&&y%2===0)this.solid(ctx,{arenaStyle:'inca'},x,y,TILE_WALL);}Inca.sun(ctx,5*TILE,2.5*TILE,2.8*TILE,0);ctx.restore();};
Game.prototype.blockDamage=function(e,owner){if(Deathmatch.active(this))return Deathmatch.hit(this,e,3,owner);if(!e.alive||e.isBoss&&e.iframes>0)return false;e.hp=(e.hp??1)-3;if(e.hp<=0)this.killEnemy(e,owner);else if(e.isBoss)e.iframes=BOSS_IFRAMES;return true;};
const gloveBeforeBlocks=Game.prototype.useGlove;
Game.prototype.useGlove=function(p){if(!p.alive||!p.canPunch||p.carriedBy||p.gloveFlight)return false;const d=DIRS[p.facing]||DIRS.down;
 if(p.held?.kind==='block'){let target=null;for(let n=1;n<=3;n++){const x=p.tx+d.dx*n,y=p.ty+d.dy*n;if(x<1||y<1||x>=COLS-1||y>=ROWS-1||this.grid[y][x]===TILE_WALL)break;target={x,y};if(this.grid[y][x]===TILE_BRICK||this.enemies.some(e=>e.alive&&e.tx===x&&e.ty===y))break;}if(!target)return false;p.held=null;(this.thrownBlocks||(this.thrownBlocks=[])).push({owner:p,flight:{sx:p.x,sy:p.y-40,tx:target.x,ty:target.y,age:0,duration:.4}});this.sfx.placeBomb();return true;}
 if(!p.held){const x=p.tx+d.dx,y=p.ty+d.dy;if(this.grid[y]?.[x]===TILE_BRICK){this.grid[y][x]=TILE_EMPTY;this.brickHp?.delete(tileKey(x,y));p.held={kind:'block',object:{tx:x,ty:y,variant:(x*7+y*3)%4}};this.sfx.placeBomb();return true;}}
 return gloveBeforeBlocks.call(this,p);
};
const killBeforeBlocks=Game.prototype.killPlayer;
Game.prototype.killPlayer=function(p,...args){const block=p.held?.kind==='block'?p.held:null;if(block)p.held=null;const result=killBeforeBlocks.call(this,p,...args);if(block&&p.alive)p.held=block;return result;};
Sfx.prototype.chargePulse=function(p){if(!this.ctx||this.ctx.state!=='running'||this.muted)return;const q=Math.min(1,p.shotCharge/Deathmatch.chargeSeconds),phase=Math.floor(p.shotCharge/.12);if(p.chargePulsePhase===phase)return;p.chargePulsePhase=phase;const f=340+q*780;this.tone(f,.075,{type:'square',volume:.035,slideTo:f*1.2});this.tone(f*2,.05,{type:'triangle',volume:.025,delay:.035});};
const updateBeforeCharge=Player.prototype.update;
Player.prototype.update=function(dt,g,input){updateBeforeCharge.call(this,dt,g,input);if(Deathmatch.active(g)&&this.shotCharging&&!this.isBot)g.sfx.chargePulse?.(this);else this.chargePulsePhase=-1;};
const hazardsBeforeInca=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){hazardsBeforeInca.call(this,dt);
 for(const b of this.thrownBlocks||[]){b.flight.age+=dt;if(b.flight.age<b.flight.duration)continue;b.done=true;const x=b.flight.tx,y=b.flight.ty,targets=this.enemies.filter(e=>e.alive&&!e.carriedBy&&Math.hypot(e.x-centerOf(x),e.y-centerOf(y))<TILE*.85);if(targets.length)for(const e of targets)this.blockDamage(e,b.owner);else if(this.grid[y][x]===TILE_EMPTY&&!this.players.some(p=>p.alive&&p.tx===x&&p.ty===y)&&!this.bombAt(x,y)&&!this.portalZone(x,y)){this.grid[y][x]=TILE_BRICK;if(Deathmatch.active(this))this.brickHp.set(tileKey(x,y),3);}this.spawnParticles(centerOf(x),centerOf(y),8,['#a1aa94','#5e6b63'],100);}
 this.thrownBlocks=(this.thrownBlocks||[]).filter(b=>!b.done);
 if(this.inti){const v=this.inti;v.until-=dt;if(v.until<=2.2&&!v.targets.length){const pool=[];for(let y=v.y-3;y<=v.y+3;y++)for(let x=v.x-3;x<=v.x+3;x++)if(this.grid[y]?.[x]===TILE_EMPTY&&Math.max(Math.abs(x-v.x),Math.abs(y-v.y))>=2)pool.push({x,y});v.targets=pool.sort(()=>Math.random()-.5).slice(0,3);}if(v.until<=0){for(const t of v.targets){this.intiStrikes.push({...t,age:0});const ex=new Explosion([{...t,dir:null,end:false}],null);ex.duration=ex.timer=700;ex.dmDamage=3;this.explosions.push(ex);}this.sfx.explosion();v.until=9+Math.random()*3;v.targets=[];}}
 this.intiStrikes=(this.intiStrikes||[]).filter(t=>(t.age+=dt)<.7);
 if(this.mode===1){for(const boss of this.enemies.filter(e=>e.isBoss&&Deathmatch.eligible(e))){boss.intiShotTimer=(boss.intiShotTimer??2.8)-dt;if(boss.intiShotTimer<=0){const p=this.players.find(p=>p.alive);if(p){const length=Math.hypot(p.x-boss.x,p.y-boss.y)||1;this.bossShots.push({x:boss.x,y:boss.y,dx:(p.x-boss.x)/length,dy:(p.y-boss.y)/length,age:0});this.sfx.tone?.(180,.12,{slideTo:420,volume:.06});}boss.intiShotTimer=2.8;}}
  for(const s of this.bossShots||[]){s.age+=dt;const steps=Math.ceil(dt*250/6);for(let n=0;n<steps&&!s.done;n++){s.x+=s.dx*250*dt/steps;s.y+=s.dy*250*dt/steps;if(this.grid[tileOf(s.y)]?.[tileOf(s.x)]!==TILE_EMPTY){s.done=true;break;}const p=this.players.find(p=>p.alive&&p.shield<=0&&!p.carriedBy&&Math.hypot(p.x-s.x,p.y-s.y)<22);if(p){this.killPlayer(p);if(p.alive)p.shield=Math.max(p.shield,650);s.done=true;}}}this.bossShots=(this.bossShots||[]).filter(s=>!s.done&&s.age<5);
 }
};
const airBeforeInca=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){airBeforeInca.call(this,ctx,g);for(const p of g.players)if(p.alive&&p.held?.kind==='block')ctx.drawImage(Inca.tile('brick',p.held.object.variant||0),p.x-21,p.y-94,42,42);for(const b of g.thrownBlocks||[]){const t=this.flightPoint(b.flight);ctx.drawImage(Inca.tile('brick',b.variant||0),t.x-21,t.y-21,42,42);}for(const s of g.bossShots||[]){ctx.fillStyle='#f96189';ctx.fillRect(s.x-7,s.y-11,14,14);ctx.fillStyle='#fff0a2';ctx.fillRect(s.x-3,s.y-7,6,6);}for(const b of g.enemies)if(b.isBoss&&b.intiShotTimer<.65){ctx.strokeStyle='#ff9b99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y-14,24,0,Math.PI*2);ctx.stroke();}};
const dangerBeforeInca=Game.prototype.buildDangerMap;
Game.prototype.buildDangerMap=function(...a){const out=dangerBeforeInca?.apply(this,a);for(const t of this.inti?.targets||[])if(this.danger&&this.danger[t.y*COLS+t.x]!==2)this.danger[t.y*COLS+t.x]=1;return out;};

// Actual tiles from the user's preferred atlas. Rectangles follow complete alpha components.
Inca.sheet=Object.assign(new Image(),{src:'assets/mapas/santuario/inti-tileset.webp'});ArenaArt.inca=Inca.sheet;
Inca.art={"0:0":[24,23,131,131],"0:1":[179,23,131,131],"0:3":[489,23,131,131],"0:4":[644,23,131,131],"0:5":[799,23,131,131],"0:2":[334,24,130,130],"0:6":[955,24,130,130],"0:7":[1110,24,131,130],"1:2":[334,174,131,133],"1:3":[490,174,130,133],"1:4":[644,174,130,133],"1:5":[799,174,131,133],"1:7":[1110,174,132,134],"1:0":[24,175,131,133],"1:1":[179,175,131,132],"1:6":[955,175,130,132],"2:7":[1117,338,115,117],"2:3":[502,339,102,120],"2:0":[40,341,101,113],"2:1":[195,341,101,113],"2:6":[966,341,106,114],"2:4":[663,346,100,92],"2:5":[804,348,121,103],"2:2":[339,354,116,94],"3:0":[46,481,86,139],"3:1":[201,481,85,139],"3:2":[355,481,86,139],"3:6":[972,488,93,130],"3:4":[644,493,132,125],"3:3":[483,494,138,126],"3:7":[1099,508,145,99],"3:5":[801,524,132,81],"4:0":[19,641,144,147],"4:1":[174,641,143,147],"4:2":[329,641,143,147],"4:3":[482,641,143,147],"4:4":[647,645,122,138],"4:5":[805,645,124,138],"4:6":[959,645,126,138],"4:7":[1117,645,124,138],"5:3":[524,800,65,117],"5:4":[655,807,105,107],"5:1":[193,868,47,39],"5:2":[402,828,57,81],"5:5":[806,836,121,70],"5:6":[1023,839,43,24],"5:7":[1131,856,88,49],"6:0":[19,945,140,124],"6:1":[180,945,130,123],"6:2":[333,950,131,114],"6:5":[801,952,129,114],"6:4":[644,954,131,112],"6:3":[484,956,135,111],"6:6":[973,956,109,103],"6:7":[1123,965,104,89],"7:7":[1130,1090,99,115],"7:4":[676,1092,66,108],"7:6":[973,1095,78,107],"7:5":[824,1098,87,102],"7:2":[362,1137,41,43],"7:3":[533,1128,65,50],"7:1":[222,1132,33,39],"5:0":[2,781,154,152],"7:0":[2,1092,154,152]};
Inca.sprite=function(ctx,row,col,x,y,w,h){if(!this.sheet.complete||!this.sheet.naturalWidth)return false;const r=this.art[row+':'+col];if(!r)return false;const k=Math.min(w/r[2],h/r[3]);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.sheet,...r,x+(w-r[2]*k)/2,y+h-r[3]*k,r[2]*k,r[3]*k);ctx.restore();return true;};
const nativeIntiTile=Inca.tile,nativeIntiSun=Inca.sun;
Inca.tile=function(kind,variant=0){if(!this.sheet.complete||!this.sheet.naturalWidth)return nativeIntiTile.call(this,kind,variant);const key='atlas:'+kind+variant;if(this.tiles.has(key))return this.tiles.get(key);const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
 if(kind==='floor'){
  const r=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  r('#477b3e',0,0,48,48);r('#508744',1,1,46,46);
  // Quiet grass clusters preserve clear silhouettes for cover, items and actors.
  const seeds=[[7,14],[31,34],[36,9],[15,38]];
  for(let i=0;i<3;i++){const [x,y]=seeds[(i+variant)%4];r('#61984a',x,y,5,2);r('#6b9f50',x+2,y-3,2,4);r('#3f7238',x-2,y+2,8,1);}
  if(variant===5){r('#69944d',23,19,9,5);r('#79a258',25,19,5,1);}

 }
 else if(kind==='border'){const r=this.art['1:'+(variant%8)];ctx.drawImage(this.sheet,r[0]+3,r[1]+3,r[2]-6,r[3]-6,0,0,48,48);}
 else if(kind==='brick'){
  ctx.fillStyle='#263a27';ctx.fillRect(7,41,34,5);
  if(variant%4===0)this.sprite(ctx,6,3,2,1,44,45); // The user's fern on a rock.
  else if(variant%4===1)this.sprite(ctx,2,3,3,1,42,44);
  else if(variant%4===2)this.sprite(ctx,2,5,2,3,44,42);
  else {
   // Broken gold stone with a restrained stepped Inca inlay.
   ctx.save();ctx.filter='sepia(1) saturate(1.45)';this.sprite(ctx,2,2,2,4,44,41);ctx.restore();
   ctx.fillStyle='#8c682d';ctx.fillRect(14,23,20,3);ctx.fillRect(14,18,3,7);ctx.fillRect(31,23,3,7);
   ctx.fillStyle='#eed380';ctx.fillRect(17,20,3,6);ctx.fillRect(20,23,11,2);
  }

 }
 else this.sprite(ctx,3,variant%3,3,1,42,46);
 this.tiles.set(key,c);return c;};
Inca.sun=function(ctx,x,y,size,charge=0){
 const scale=size/144;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 const stone=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 // The altar occupies the existing solid shrine footprint; no extra collision cells.
 stone('#26342f',-72,49,144,20);stone('#6c786f',-70,45,140,18);stone('#bbc0a7',-70,45,140,4);
 stone('#45584d',-61,26,122,19);stone('#929e8b',-61,26,122,4);stone('#d1ae57',-60,39,120,3);
 stone('#53655c',-60,-57,120,83);stone('#9da790',-60,-57,120,6);stone('#35493e',-60,-51,10,77);stone('#35493e',50,-51,10,77);
 for(let col=-54;col<60;col+=27){stone('#b9a05b',col,50,12,7);stone('#43564a',col+3,51,6,3);}
 for(let row=-40;row<22;row+=20){stone('#7e8d7b',-59,row,9,2);stone('#7e8d7b',50,row,9,2);}
 ctx.restore();y-=size*.14;size*=.99;
 const clock=window.game?.elapsed||0,breathe=1+Math.sin(clock*2.1)*.018;
 size*=breathe;y+=Math.sin(clock*1.7)*2;
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=charge>0?'#78dfff':'#e8c759';ctx.globalAlpha=.2+charge*.35;ctx.lineWidth=2;
 ctx.beginPath();ctx.arc(0,0,size*.51,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<12;i++){const a=i*Math.PI/6+Math.sin(clock*.6)*.035,r=size*(.51+.015*Math.sin(clock*3+i));ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+5+charge*7),Math.sin(a)*(r+5+charge*7));ctx.stroke();}ctx.restore();
 if(!this.sheet.complete||!this.sheet.naturalWidth)return nativeIntiSun.call(this,ctx,x,y,size,charge);const t=Math.max(0,Math.min(3,charge*3)),lo=Math.floor(t),hi=Math.min(3,lo+1);ctx.save();if(charge<=0&&this.idleFrames){const phase=(window.game?.elapsed||0)%5,index=phase<4.4?0:phase<4.5?1:phase<4.62?2:phase<4.74?3:0;const bob=Math.sin((window.game?.elapsed||0)*1.7)*1.2;ctx.drawImage(this.idleFrames[index],x-size/2,y-size/2+bob,size,size);ctx.restore();return;}this.sprite(ctx,4,lo,x-size/2,y-size/2,size,size);if(hi!==lo){ctx.globalAlpha=t-lo;this.sprite(ctx,4,hi,x-size/2,y-size/2,size,size);}ctx.restore();};
Inca.sheet.addEventListener('load',()=>{Inca.tiles.clear();Renderer.forceRebuild();});
// Keep menu music through selections, and the map's music throughout combat.
Game.prototype.updateMusic=function(){if(this.demo||['title','setup'].includes(this.state)){this.music.setDuck(1);this.music.play('title');}else if(['playing','intro'].includes(this.state))this.music.play(this.arenaStyle||this.theme);};
const updateBeforeSoundtrack=Game.prototype.update;
Game.prototype.update=function(dt){this.updateMusic();return updateBeforeSoundtrack.call(this,dt);};

// Four registered idle frames derived from the selected sun artwork: open, half-blink, blink, reopen.
Inca.buildIdleFrames=function(){if(!this.sheet.complete||!this.sheet.naturalWidth)return;this.idleFrames=Array.from({length:4},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=192;const ctx=c.getContext('2d');this.sprite(ctx,4,0,0,0,192,192);if(i){ctx.save();ctx.scale(192/144,192/147);for(const x of [34,82]){ctx.fillStyle='#d9b22b';ctx.fillRect(x,44,24,i===2?16:8);ctx.strokeStyle='#73511e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x, i===2?54:51);ctx.lineTo(x+24,i===2?54:51);ctx.stroke();}ctx.restore();}return c;});};
Inca.sheet.addEventListener('load',()=>Inca.buildIdleFrames());if(Inca.sheet.complete)Inca.buildIdleFrames();
const hitBeforeNpcHearts=Deathmatch.hit;
Deathmatch.hit=function(g,e,...args){const was=e.alive,ok=hitBeforeNpcHearts.call(this,g,e,...args);if(ok&&was&&!e.alive&&!(e instanceof Player)&&!e.isBoss&&!e.dmHeartDropped&&this.active(g)){e.dmHeartDropped=true;const cells=EntityGlove.spots(g,{x:e.tx,y:e.ty},e).filter(c=>!g.powerups.some(u=>u.tx===c.x&&u.ty===c.y)),cell=cells[0];if(cell)g.powerups.push(new PowerUp(cell.x,cell.y,'life'));}return ok;};
const upgradesBeforeDefaultGlove=BattleDrops.upgrades;
BattleDrops.upgrades=function(p){const items=upgradesBeforeDefaultGlove.call(this,p);return p.deathmatchArmed?items.filter(t=>t!=='glove').map(t=>t==='bomb'?'thunder':t):items;};
Game.prototype.normalizeDeathmatchItems=function(){if(!Deathmatch.active(this))return;for(const u of this.powerups||[]){if(u.type==='bomb')u.type='thunder';else if(u.type==='glove')u.type=weightedPick(Inca.drops);}if(this.pendingDeathDrops)this.pendingDeathDrops=this.pendingDeathDrops.filter(t=>t!=='glove').map(t=>t==='bomb'?'thunder':t);};
const collectBeforeDefaultGlove=Game.prototype.collectPowerUp;
Game.prototype.collectPowerUp=function(p,pu){if(Deathmatch.active(this)&&pu.type==='glove')pu.type=weightedPick(Inca.drops);return collectBeforeDefaultGlove.call(this,p,pu);};
const updateBeforeItemCleanup=Game.prototype.update;
Game.prototype.update=function(dt){this.normalizeDeathmatchItems();const out=updateBeforeItemCleanup.call(this,dt);this.normalizeDeathmatchItems();return out;};
// CPU glove actions share the same collision, pickup and throw rules as human actions.
Game.prototype.updateCpuGloves=function(dt){for(const p of this.players){if(!p.isBot||!p.alive||!p.canPunch||p.carriedBy||p.gloveFlight||p.portalTransit)continue;p.cpuGloveWait=Math.max(0,(p.cpuGloveWait||0)-dt);if(p.cpuGloveWait>0)continue;
 const opponents=[...this.players.filter(e=>e!==p&&!(this.settings.battle.formation==='teams'&&e.team===p.team)),...this.enemies].filter(e=>e.alive&&!e.carriedBy);
 const target=opponents.sort((a,b)=>Math.abs(a.x-p.x)+Math.abs(a.y-p.y)-Math.abs(b.x-p.x)-Math.abs(b.y-p.y))[0];
 const aim=target?(Math.abs(target.x-p.x)>Math.abs(target.y-p.y)?target.x<p.x?'left':'right':target.y<p.y?'up':'down'):p.facing;
 if(p.held){p.facing=aim;let used=this.useGlove(p);if(!used)for(const dir of DIR_LIST){p.facing=dir;if(this.useGlove(p)){used=true;break;}}p.cpuGloveWait=used?.65:.2;continue;}
 const bomb=this.bombs.find(b=>!b.inHand&&!b.flight&&Math.abs(b.tx-p.tx)+Math.abs(b.ty-p.ty)<=1);
 if(bomb){p.facing=bomb.tx===p.tx&&bomb.ty===p.ty?aim:bomb.tx<p.tx?'left':bomb.tx>p.tx?'right':bomb.ty<p.ty?'up':'down';if(this.useGlove(p))p.cpuGloveWait=.28;continue;}
 const dir=DIRS[aim];if(dir&&this.grid[p.ty+dir.dy]?.[p.tx+dir.dx]===TILE_BRICK){p.facing=aim;if(this.useGlove(p))p.cpuGloveWait=.35;}
 }};
const hazardsBeforeCpuGloves=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){hazardsBeforeCpuGloves.call(this,dt);if(this.state==='playing')this.updateCpuGloves(dt);this.normalizeDeathmatchItems();};

Inca.altarFront=function(ctx,x,y,size){const k=size/144;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle='#26342f';ctx.fillRect(-72,49,144,20);ctx.fillStyle='#788a77';ctx.fillRect(-70,45,140,18);ctx.fillStyle='#d3c49a';ctx.fillRect(-70,45,140,4);ctx.fillStyle='#c0a353';for(let x=-56;x<60;x+=27)ctx.fillRect(x,52,12,5);ctx.restore();};
const intiFrontBefore=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){intiFrontBefore.call(this,ctx,g);};
// Four clear current lanes around the shrine; their logical direction reverses every 15s.
Inca.currentAt=function(g,x,y){if(!g.inti)return null;const c=g.inti;let dir=null;if(y===c.y-4&&Math.abs(x-c.x)<=1)dir='right';else if(y===c.y+3&&Math.abs(x-c.x)<=1)dir='left';else if(x===c.x-8&&Math.abs(y-c.y)<=1)dir='up';else if(x===c.x+6&&Math.abs(y-c.y)<=1)dir='down';return dir&&Math.floor((g.currentClock||0)/15)%2?OPPOSITE[dir]:dir;};
const currentsConfigure=Game.prototype.configureArenaContent;
Game.prototype.configureArenaContent=function(){currentsConfigure.call(this);this.currentClock=0;if(this.inti)for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(Inca.currentAt(this,x,y)){this.grid[y][x]=TILE_EMPTY;this.brickHp?.delete(tileKey(x,y));}};
const currentsOverlay=ArenaArt.overlays;
ArenaArt.currents=function(ctx,g){if(g.inti)for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const dir=Inca.currentAt(g,x,y);if(!dir)continue;const t=g.currentClock||0;ctx.save();ctx.translate(centerOf(x),centerOf(y));ctx.fillStyle='#344f46';ctx.fillRect(-23,-23,46,46);ctx.fillStyle='#255d64';ctx.fillRect(-20,-19,40,39);ctx.fillStyle=`rgba(72,194,201,${.12+.06*Math.sin(t*3)})`;ctx.fillRect(-19,-18,38,36);ctx.strokeStyle='#98a178';ctx.lineWidth=2;ctx.strokeRect(-22,-22,44,44);ctx.rotate(({right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2})[dir]);ctx.beginPath();ctx.rect(-21,-21,42,42);ctx.clip();const offset=(t*17)%18;for(let n=-2;n<=2;n++){const at=n*18+offset;ctx.strokeStyle=n%2?'#126f9e':'#51d8ee';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(at-6,-9);ctx.lineTo(at+2,0);ctx.lineTo(at-6,9);ctx.stroke();}ctx.restore();}};
const currentMove=Player.prototype.moveGrid;
Player.prototype.moveGrid=function(g,dirs,dist){const dir=Inca.currentAt(g,this.tx,this.ty);if(dir&&dirs.length){this.currentMoved=true;dist*=dirs[0]===dir?1.45:dirs[0]===OPPOSITE[dir]?0.55:1;}return currentMove.call(this,g,dirs,dist);};
const currentHazards=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){currentHazards.call(this,dt);if(this.state!=='playing')return;this.currentClock=(this.currentClock||0)+dt;for(const p of this.players){const dir=Inca.currentAt(this,p.tx,p.ty);if(dir&&p.alive&&!p.carriedBy&&!p.gloveFlight&&!p.portalTransit&&!p.currentMoved){if(p.isBot)currentMove.call(p,this,[dir],p.speed*.65*dt);else currentFree.call(p,this,[dir],p.speed*.65*dt);}p.currentMoved=false;}};
// Projected border shadows and lit capstones replace repeated mismatched corner motifs.
const depthSolid=ArenaArt.solid;
ArenaArt.solid=function(ctx,g,x,y,t){if(g.arenaStyle!=='inca'||t===TILE_BRICK||x>0&&y>0&&x<COLS-1&&y<ROWS-1)return depthSolid.call(this,ctx,g,x,y,t);ctx.save();ctx.translate(x*TILE,y*TILE);const r=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};r('#303b33',0,0,48,48);r('#66695c',0,3,48,37);r('#939181',1,3,46,5);r('#464e43',0,37,48,11);r('#b5ac8d',0,0,48,3);r('#3b4339',0,22,48,2);r('#3b4339',23,4,2,18);r('#3b4339',10,24,2,13);r('#a88b42',0,8,48,4);r('#e1c470',0,8,48,1);for(let i=4;i<48;i+=12){r('#514c32',i,12,7,6);r('#bd9b47',i+2,12,4,3);}r('#252f28',0,45,48,3);ctx.restore();return true;};

// Human controls stay continuous: no grid snap can capture a lateral turn.
const currentFree=Player.prototype.moveFree;
Player.prototype.moveFree=function(g,dirs,dist){const dir=Inca.currentAt(g,this.tx,this.ty);if(dirs.length)this.currentMoved=true;if(dir&&dirs.length)dist*=dirs[0]===dir?1.45:dirs[0]===OPPOSITE[dir]?0.55:1;return currentFree.call(this,g,dirs,dist);};
// Register the user's new atlases; source coordinates keep every full sprite.
Inca.newArt={};
for(const [key,file] of Object.entries({sun:'assets/mapas/santuario/inti-animacion.webp',altar:'assets/mapas/santuario/inti-soporte.webp',fire:'assets/mapas/santuario/inti-muros-fuego.webp',wall:'assets/mapas/santuario/inti-muros-verdes.webp'})){const img=new Image();img.onload=()=>{Inca.newArt[key]=img;Renderer.forceRebuild();};img.src=file;}
Inca.crop=function(ctx,key,rect,x,y,w,h){const img=this.newArt[key];if(!img)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,...rect,x,y,w,h);ctx.restore();return true;};
Inca.sun=function(ctx,x,y,size,charge=0){if(!this.newArt.sun)return nativeIntiSun.call(this,ctx,x,y,size,charge);const time=window.game?.elapsed||0,frame=charge>0?Math.min(8,3+Math.floor(charge*5)):Math.floor(time*2)%4;
 const col=frame%4,row=Math.floor(frame/4),img=this.newArt.sun,cw=img.width/4,ch=img.height/3;
 const k=1+Math.sin(time*2)*.012,w=size*.97;this.crop(ctx,'sun',[col*cw,row*ch,cw,ch],x-w*k/2,y-size*.7,w*k,w*k);
};
Inca.altarFront=function(ctx,x,y,size){const img=this.newArt.altar;if(!img)return;const frame=Math.floor((window.game?.elapsed||0)*3)%4,cw=img.width/2,ch=img.height/2;
 this.crop(ctx,'altar',[frame%2*cw,Math.floor(frame/2)*ch,cw,ch],x-size*.55,y-size*.12,size*1.1,size*.9);
};
const newWallSolid=ArenaArt.solid;
ArenaArt.solid=function(ctx,g,x,y,t){if(g.arenaStyle!=='inca'||t!==TILE_WALL||x>0&&y>0&&x<COLS-1&&y<ROWS-1||!Inca.newArt.wall)return newWallSolid.call(this,ctx,g,x,y,t);
 const px=x*TILE,py=y*TILE,vertical=x===0||x===COLS-1;
 ctx.fillStyle='#253a30';ctx.fillRect(px,py,TILE,TILE);
 const rect=vertical?[1620,552,130,158]:x%7===0?[929,743,127,120]:[828,552,130,158];
 Inca.crop(ctx,'wall',rect,px,py,TILE,TILE);
 return true;};
const fireFront=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){fireFront.call(this,ctx,g);if(true)return;const f=Math.floor(g.elapsed*7)%5;
 for(const [x,y] of [[0,0],[COLS-1,0],[0,ROWS-1],[COLS-1,ROWS-1]])Inca.crop(ctx,'fire',[924+f*119,20,118,183],x*TILE-2,y*TILE-17,52,65);
};

// Dedicated, transparent, equally spaced wall pieces for both playable arenas.
const TemplePieces={images:{},draw(ctx,name,index,x,y,w,h){const im=this.images[name];if(!im)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,index%8*192,Math.floor(index/8)*192,192,192,x,y,w,h);ctx.restore();return true;}};
for(const name of ['santuario','uku-pacha']){const im=new Image();im.onload=()=>{TemplePieces.images[name]=im;Renderer.forceRebuild();};im.src=({santuario:'assets/mapas/santuario/santuario-piezas.webp','uku-pacha':'assets/mapas/uku-pacha/uku-pacha-piezas.webp'})[name];}
const templeFloor=ArenaArt.floor,templeSolid=ArenaArt.solid;
ArenaArt.floor=function(ctx,g,x,y){if(g.arenaStyle!=='overdrive')return templeFloor.call(this,ctx,g,x,y);ctx.fillStyle='#342539';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);TemplePieces.draw(ctx,'uku-pacha',5+(x*7+y*3)%3,x*TILE,y*TILE,TILE,TILE);return true;};
ArenaArt.solid=function(ctx,g,x,y,type){if(!['inca','overdrive'].includes(g.arenaStyle))return templeSolid.call(this,ctx,g,x,y,type);const uku=g.arenaStyle==='overdrive',border=x===0||y===0||x===COLS-1||y===ROWS-1;if(type===TILE_BRICK)return templeSolid.call(this,ctx,g,x,y,type);if(!border&&!uku)return templeSolid.call(this,ctx,g,x,y,type);const name=uku?'uku-pacha':'santuario';if(!TemplePieces.images[name])return templeSolid.call(this,ctx,g,x,y,type);
 const corner=(x===0||x===COLS-1)&&(y===0||y===ROWS-1);let i;
 if(uku)i=!border?1:corner?3:x%7===0?2:(x===0||x===COLS-1)?18:0;
 else i=corner?(x===0?3:4):(x===0||x===COLS-1)?1:x%7===0?2:0;
 ctx.fillStyle=uku?'#201b2a':'#233d31';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);TemplePieces.draw(ctx,name,i,x*TILE,y*TILE,TILE,TILE);return true;};
const templeAir=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){templeAir.call(this,ctx,g);};

// Build the walls as a single architectural frame, with no extra row of repeated pillars.
const UkuAtlas=new Image();UkuAtlas.src='assets/mapas/uku-pacha/uku-pacha-atlas.webp';
const continuousSolid=ArenaArt.solid;
ArenaArt.solid=function(ctx,g,x,y,t){if(['inca','overdrive'].includes(g.arenaStyle)&&t===TILE_WALL&&(x<=0||y<=0||x>=COLS-1||y>=ROWS-1)){ctx.fillStyle=g.arenaStyle==='inca'?'#22382d':'#241a2d';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);return true;}return continuousSolid.call(this,ctx,g,x,y,t);};
ArenaArt.templePerimeter=function(ctx,g){if(!['inca','overdrive'].includes(g.arenaStyle))return;const uku=g.arenaStyle==='overdrive',im=uku?UkuAtlas:Inca.newArt.wall;if(!im||!(im.naturalWidth||im.width))return;
 const W=CANVAS_W,H=CANVAS_H,L=-TILE,R=W+TILE,T=-TILE,B=H+TILE,depth=TILE*2;
 const patch=(r,x,y,w,h)=>{ctx.save();if(!uku)ctx.filter='hue-rotate(-32deg)';ctx.drawImage(im,...r,x,y,w,h);ctx.restore();};
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle=uku?'#201829':'#1d342a';ctx.fillRect(L,T,R-L,depth);ctx.fillRect(L,H-TILE,R-L,depth);ctx.fillRect(L,T,depth,B-T);ctx.fillRect(W-TILE,T,depth,B-T);
 const face=uku?[432,48,190,175]:[283,63,289,183];
 // Wide wall spans retain the capstone, face and base as one piece.
 const count=uku?6:5,step=(W-2*TILE)/count;
 for(let x=TILE;x<W-TILE;x+=step){const w=Math.min(step,W-TILE-x);patch(face,x,T,w,depth);patch(face,x,H-TILE,w,depth);}
 // The vertical spans use vertical wall art, never a front-facing block turned into a column.
 const side=uku?[1040,124,98,67]:[1169,355,88,135];
 for(let y=TILE;y<H-TILE;y+=96){const h=Math.min(96,H-TILE-y);patch(side,L,y,depth,h);ctx.save();ctx.translate(W+TILE,y);ctx.scale(-1,1);patch(side,0,0,depth,h);ctx.restore();}
 const corner=uku?[30,445,165,192]:[26,25,184,242];
 for(const [x,y,flip] of [[L,T,false],[W-TILE,T,true],[L,H-TILE,false],[W-TILE,H-TILE,true]]){ctx.save();ctx.translate(x+(flip?depth:0),y);if(flip)ctx.scale(-1,1);patch(corner,0,0,depth,depth);ctx.restore();}
 // One principal mask in each horizontal wall; detail stays secondary to the arena.
 const mask=uku?[795,454,138,177]:[785,28,210,225];patch(mask,W/2-42,T,84,depth);patch(mask,W/2-42,H-TILE,84,depth);
 ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(TILE,TILE,W-2*TILE,5);ctx.fillRect(TILE,TILE,5,H-2*TILE);
 ctx.restore();
};
const architecturalCurrents=ArenaArt.currents;
ArenaArt.currents=function(ctx,g){architecturalCurrents?.call(this,ctx,g);ArenaArt.templePerimeter(ctx,g);};
const architecturalRail=RevengeShips.rail;
RevengeShips.rail=function(ctx,g){if(['inca','overdrive'].includes(g.arenaStyle))return;return architecturalRail.call(this,ctx,g);};

// Fire and hanging lamps have their own transparent frames, without duplicated braziers.
const TempleEffects=new Image();TempleEffects.src='assets/mapas/compartidos/templo-fuegos-lamparas.webp';
const cleanTempleAir=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){cleanTempleAir.call(this,ctx,g);if(!['inca','overdrive'].includes(g.arenaStyle)||!TempleEffects.complete||!TempleEffects.naturalWidth)return;
 const uku=g.arenaStyle==='overdrive',frame=Math.floor(g.elapsed*8)%6,row=uku?0:2;
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const [x,y] of [[0,0],[CANVAS_W,0],[0,CANVAS_H],[CANVAS_W,CANVAS_H]]){ctx.drawImage(TempleEffects,frame*96,row*96,96,96,x-25,y-75,44,52);}
 if(uku)for(const x of [CANVAS_W*.27,CANVAS_W*.73]){const f=Math.floor(g.elapsed*5)%4;ctx.drawImage(TempleEffects,f*96,96,96,96,x-13,-29,26,51);}
 ctx.restore();
};

// Quiet earthen paving and purple, bevelled 16-bit permanent blocks.
const earthFloor=ArenaArt.floor;
ArenaArt.floor=function(ctx,g,x,y){if(g.arenaStyle!=='inca')return earthFloor.call(this,ctx,g,x,y);const px=x*TILE,py=y*TILE;ctx.fillStyle='#886744';ctx.fillRect(px,py,TILE,TILE);ctx.fillStyle='#916f4a';ctx.fillRect(px+1,py+1,46,46);ctx.fillStyle='#795c40';ctx.fillRect(px,py+47,48,1);ctx.fillRect(px+47,py,1,48);ctx.fillStyle='#a07c53';for(let i=0;i<3;i++){const a=(x*11+y*7+i*13)%39,b=(x*3+y*17+i*11)%39;ctx.fillRect(px+4+a,py+4+b,3,1);}return true;};
Inca.purpleBlock=function(ctx,x,y){ctx.save();ctx.translate(x,y);const r=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};r('#292236',5,41,39,6);r('#46334f',5,12,38,30);r('#72597b',7,13,33,24);r('#9d82aa',7,8,33,7);r('#c4afd0',10,6,26,4);r('#4c365e',5,34,38,8);r('#aa8abb',8,15,3,18);r('#382b48',37,15,4,23);r('#8b709b',13,18,18,3);r('#503a62',13,21,3,9);r('#b098ba',16,26,15,3);r('#715183',28,21,3,7);r('#b8a1c6',8,35,26,2);ctx.restore();};
const purpleSolid=ArenaArt.solid;
ArenaArt.solid=function(ctx,g,x,y,t){if(g.arenaStyle==='inca'&&t===TILE_WALL&&x>0&&y>0&&x<COLS-1&&y<ROWS-1){if(g.inti&&Math.abs(x-g.inti.x)<=1&&Math.abs(y-g.inti.y)<=1)return true;Inca.purpleBlock(ctx,x*TILE,y*TILE);return true;}return purpleSolid.call(this,ctx,g,x,y,t);};
// Preserve the edited sun and add a fine rotating gold ring with stepped inlays.
const detailedSun=Inca.sun;
Inca.sun=function(ctx,x,y,size,charge){const time=window.game?.elapsed||0;ctx.save();ctx.strokeStyle='#a16c20';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-size*.215,size*.495,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#ffe69c';ctx.lineWidth=1;for(let i=0;i<24;i++){const a=i*Math.PI/12+Math.sin(time*.8)*.012,r=size*.5;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y-size*.215+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*(r+3),y-size*.215+Math.sin(a)*(r+3));ctx.stroke();}ctx.restore();detailedSun.call(this,ctx,x,y,size,charge);};
Game.prototype.updateCurrentBombs=function(dt){if(!this.inti)return;for(const b of this.bombs){if(b.exploded||b.inHand||b.flight||b.slideDir){b.currentTarget=null;continue;}let t=b.currentTarget;if(!t){const dir=Inca.currentAt(this,b.tx,b.ty);if(!dir)continue;const d=DIRS[dir],tx=b.tx+d.dx,ty=b.ty+d.dy;if(!this.canBombEnter(tx,ty,b))continue;t=b.currentTarget={x:tx,y:ty};}if(!this.canBombEnter(t.x,t.y,b)){b.currentTarget=null;continue;}const x=centerOf(t.x),y=centerOf(t.y),dist=Math.hypot(x-b.x,y-b.y),step=95*dt;if(dist<=step){b.x=x;b.y=y;b.currentTarget=null;}else{b.x+=(x-b.x)/dist*step;b.y+=(y-b.y)/dist*step;}for(const e of this.players)if(e.alive&&e.tx===b.tx&&e.ty===b.ty)b.walkers.add(e);}};
const currentBombHazards=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){currentBombHazards.call(this,dt);if(this.state==='playing')this.updateCurrentBombs(dt);};

// The central stepped seal is floor artwork, never a solid obstacle or an actor overlay.
const UkuSeal=new Image();UkuSeal.src='assets/mapas/uku-pacha/uku-pacha-sello-central.webp';
const sealFloor=ArenaArt.floor;
ArenaArt.floor=function(ctx,g,x,y){const out=sealFloor.call(this,ctx,g,x,y);if(g.arenaStyle!=='overdrive'||!UkuSeal.complete||!UkuSeal.naturalWidth)return out;const w=TILE*7,h=TILE*4,left=CANVAS_W/2-w/2,top=CANVAS_H/2-h/2;ctx.save();ctx.beginPath();ctx.rect(x*TILE,y*TILE,TILE,TILE);ctx.clip();ctx.imageSmoothingEnabled=false;ctx.drawImage(UkuSeal,left,top,w,h);ctx.restore();return true;};

// Keep the floor seal unobstructed; columns beyond the seal retain the reference layout.
const openSealConfigure=Game.prototype.configureArenaContent;
Game.prototype.configureArenaContent=function(){openSealConfigure.call(this);if(this.arenaStyle==='overdrive'){const cx=Math.floor(COLS/2),cy=Math.floor(ROWS/2);for(let y=cy-2;y<=cy+1;y++)for(let x=cx-3;x<=cx+3;x++){this.grid[y][x]=TILE_EMPTY;this.brickHp?.delete(tileKey(x,y));}}};
const texturedEarth=ArenaArt.floor;
ArenaArt.floor=function(ctx,g,x,y){const out=texturedEarth.call(this,ctx,g,x,y);if(g.arenaStyle!=='inca')return out;const px=x*TILE,py=y*TILE;ctx.save();for(let i=0;i<22;i++){const a=(x*17+y*11+i*23)%44,b=(x*13+y*19+i*17)%44;ctx.fillStyle=i%3===0?'#a17c53':i%3===1?'#7d603f':'#97734c';ctx.fillRect(px+2+a,py+2+b,i%4===0?3:2,1);}if((x+y)%4===0){ctx.strokeStyle='#80613e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+13,py+11);ctx.lineTo(px+17,py+16);ctx.lineTo(px+15,py+21);ctx.stroke();}ctx.restore();return true;};
const engravedPurple=Inca.purpleBlock;
Inca.purpleBlock=function(ctx,x,y){engravedPurple.call(this,ctx,x,y);ctx.save();ctx.translate(x,y);const r=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};for(let i=0;i<7;i++){r(i%2?'#82658f':'#ad91ba',10+i*4,10+(i%2),2,1);r('#60466d',8+i*4,31+(i%2),2,1);}r('#e0c5de',11,7,23,1);r('#52365e',17,14,1,5);r('#50345e',18,17,5,1);r('#c2a6ca',12,22,1,8);r('#3a2948',33,21,1,10);r('#9371a1',9,39,25,1);r('#d7b777',20,23,3,2);r('#c79c53',22,25,3,2);ctx.restore();};

// Cache static art: colour conversion and masonry details are drawn once, not every frame.
const bakedPerimeter=ArenaArt.templePerimeter,templeWallCache=new Map();
ArenaArt.templePerimeter=function(ctx,g){if(!['inca','overdrive'].includes(g.arenaStyle))return;const im=g.arenaStyle==='inca'?Inca.newArt.wall:UkuAtlas;if(!im||!(im.naturalWidth||im.width))return;const key=g.arenaStyle+CANVAS_W+':'+CANVAS_H;let c=templeWallCache.get(key);if(!c){c=document.createElement('canvas');c.width=CANVAS_W+TILE*2;c.height=CANVAS_H+TILE*2;const paint=c.getContext('2d');paint.translate(TILE,TILE);bakedPerimeter.call(this,paint,g);templeWallCache.set(key,c);}ctx.drawImage(c,-TILE,-TILE);};
const slabFloor=ArenaArt.floor,earthenSlabs=new Map();
ArenaArt.floor=function(ctx,g,x,y){if(g.arenaStyle!=='inca')return slabFloor.call(this,ctx,g,x,y);const variant=(x*7+y*3)%3;let c=earthenSlabs.get(variant);if(!c&&TemplePieces.images['uku-pacha']){c=document.createElement('canvas');c.width=c.height=48;const a=c.getContext('2d');a.fillStyle='#73543d';a.fillRect(0,0,48,48);a.filter='sepia(1) saturate(.65) brightness(1.65)';TemplePieces.draw(a,'uku-pacha',5+variant,0,0,48,48);a.filter='none';a.fillStyle='rgba(115,77,42,.16)';a.fillRect(0,0,48,48);earthenSlabs.set(variant,c);}if(c){ctx.drawImage(c,x*TILE,y*TILE,TILE,TILE);return true;}return slabFloor.call(this,ctx,g,x,y);};
const carvedBlock=Inca.purpleBlock;let purpleBlockCache=null;
Inca.purpleBlock=function(ctx,x,y){if(!purpleBlockCache){purpleBlockCache=document.createElement('canvas');purpleBlockCache.width=purpleBlockCache.height=48;carvedBlock.call(this,purpleBlockCache.getContext('2d'),0,0);}ctx.drawImage(purpleBlockCache,x,y);};

// Paint the compact shrine in the terrain pass: no player, bomb or pickup is hidden by it.
const compactShrineTerrain=ArenaArt.currents;
ArenaArt.currents=function(ctx,g){compactShrineTerrain.call(this,ctx,g);if(g.inti){const v=g.inti,size=TILE*2.5,x=centerOf(v.x),y=centerOf(v.y)-25,charge=Math.max(0,Math.min(1,(2.2-v.until)/2.2));Inca.sun(ctx,x,y,size,charge);Inca.altarFront(ctx,x,y,size);}};
// Hold the glove action while carrying, then release to throw up to eight tiles.
const chargeGloveUse=Game.prototype.useGlove;
Game.prototype.useGlove=function(p){if(p.held&&!p.isBot&&!p.releaseGlove){p.gloveCharging=true;p.gloveCharge=0;return true;}return chargeGloveUse.call(this,p);};
Game.prototype.throwChargedGlove=function(p){const held=p.held;if(!held||!p.alive)return false;const charge=Math.min(1,(p.gloveCharge||0)/1.4),distance=3+Math.floor(charge*5);let d=DIRS[p.facing]||DIRS.down,x=p.tx,y=p.ty;const path=[{x:p.x,y:p.y-52}];let bounces=0;
 for(let i=0;i<distance;i++){let nx=x+d.dx,ny=y+d.dy;if(nx<=0||ny<=0||nx>=COLS-1||ny>=ROWS-1||this.grid[ny][nx]===TILE_WALL){d={dx:-d.dx,dy:-d.dy};bounces++;nx=x+d.dx;ny=y+d.dy;}if(nx<=0||ny<=0||nx>=COLS-1||ny>=ROWS-1||this.grid[ny][nx]===TILE_WALL)break;x=nx;y=ny;path.push({x:centerOf(x),y:centerOf(y)});}
 // Reflect away from an occupied landing cell, retaining the same visible arc.
 if(this.bombAt(x,y)||(held.kind!=='block'&&this.grid[y][x]!==TILE_EMPTY)){let free=null;for(let n=path.length-2;n>=0;n--){const a={x:tileOf(path[n].x),y:tileOf(path[n].y)};if(this.grid[a.y]?.[a.x]===TILE_EMPTY&&!this.bombAt(a.x,a.y)){free=a;break;}}if(!free)return false;x=free.x;y=free.y;path.push({x:centerOf(x),y:centerOf(y)});bounces++;}
 if(path.length<2)return false;const flight={sx:p.x,sy:p.y-52,tx:x,ty:y,age:0,duration:.4+distance*.055,path,bounces};p.held=null;p.gloveCharging=false;p.gloveCharge=0;
 if(held.kind==='entity'){held.object.carriedBy=null;held.object.gloveFlight=flight;}
 else if(held.kind==='bomb'){const b=held.object;b.inHand=null;b.currentTarget=null;b.flight=flight;b.x=centerOf(x);b.y=centerOf(y);b.walkers.clear();}
 else if(held.kind==='block')this.thrownBlocks.push({owner:p,variant:held.object.variant||0,flight});
 else this.thrownItems.push({object:held.object,flight});this.sfx.placeBomb();return true;};
const chargeGloveUpdate=Player.prototype.update;
Player.prototype.update=function(dt,g,input){chargeGloveUpdate.call(this,dt,g,input);if(!this.held||!this.alive){this.gloveCharging=false;this.gloveCharge=0;return;}if(this.gloveCharging&&!this.isBot){if(input.isDown(this.keys.glove||[]))this.gloveCharge=Math.min(1.4,(this.gloveCharge||0)+dt);else{g.throwChargedGlove(this);this.gloveCharging=false;}}};
const gloveArc=ArenaArt.flightPoint;
ArenaArt.flightPoint=function(f){if(!f.path)return gloveArc.call(this,f);const t=Math.min(1,f.age/f.duration),v=t*(f.path.length-1),i=Math.min(f.path.length-2,Math.floor(v)),q=v-i,a=f.path[i],b=f.path[i+1];return {x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q-Math.abs(Math.sin(v*Math.PI))*18-Math.sin(t*Math.PI)*32};};
const gloveChargePaint=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){gloveChargePaint.call(this,ctx,g);for(const p of g.players)if(p.alive&&p.held&&p.gloveCharging){const q=Math.min(1,(p.gloveCharge||0)/1.4);ctx.fillStyle='#1c2034';ctx.fillRect(p.x-20,p.y-108,40,6);ctx.fillStyle=q>=1?'#fff4a0':'#5be8ef';ctx.fillRect(p.x-19,p.y-107,38*q,4);}};
