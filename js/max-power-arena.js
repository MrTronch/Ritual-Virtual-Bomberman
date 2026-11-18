// Open pillar arena: maximum powers are an intrinsic rule of this map.
const MaxPowerArena={
 build(cols=COLS,rows=ROWS){
  const grid=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>x===0||y===0||x===cols-1||y===rows-1?TILE_WALL:TILE_EMPTY));
  for(let y=2;y<rows-1;y+=2)for(let x=2;x<cols-1;x+=2)grid[y][x]=TILE_WALL;
  for(const [x,y] of [[1,1],[cols-2,1],[1,rows-2],[cols-2,rows-2]])grid[y][x]=TILE_EMPTY;
  return grid;
 },
 equip(p){p.maxBombs=MAX_BOMBS;p.range=MAX_RANGE;p.bombDropBase=MAX_BOMBS;},
 active(g){return g.mode===2&&!g.demo&&g.settings.battle.stage==='overdrive';}
};
const configureBeforeMax=Game.prototype.configureArenaContent;
Game.prototype.configureArenaContent=function(){configureBeforeMax.call(this);if(!MaxPowerArena.active(this))return;this.arenaStyle='overdrive';this.grid=MaxPowerArena.build();this.portals=[];this.volcano=null;this.powerups=[];this.exit=null;for(const p of this.players)MaxPowerArena.equip(p);};
const returnBeforeMax=Game.prototype.returnFromShip;
Game.prototype.returnFromShip=function(p,...args){const ok=returnBeforeMax.call(this,p,...args);if(ok&&MaxPowerArena.active(this))MaxPowerArena.equip(p);return ok;};
const MaxPowerTiles={cache:new Map(),
 tile(kind,variant=0){const key=kind+variant;if(this.cache.has(key))return this.cache.get(key);
 const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d');
 const r=(color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const poly=(color,points)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 if(kind==='floor'){
  r('#3e361d',0,0,48,48);r(variant?'#635728':'#5c5126',1,1,46,46);
  r('#796a33',1,1,46,1);r('#433a1e',1,46,46,1);
  // Four interlocking engraved bronze panels, with fine bevels and stippled wear.
  for(let y=3;y<48;y+=12)for(let x=3;x<48;x+=12){
   r('#40391e',x,y,9,9);r('#8b763c',x+1,y+1,7,1);r('#746532',x+1,y+2,1,5);
   r('#584c26',x+2,y+2,6,6);r('#786631',x+3,y+3,3,3);r('#a18a47',x+3,y+3,2,1);
   r('#302d19',x+7,y+3,1,5);r('#726235',x+10,y+8,1,2);
  }
  for(let i=0;i<12;i++){const x=(i*17+variant*7)%46+1,y=(i*29+variant*11)%46+1;r(i%3?'#655a2d':'#8a763c',x,y,1,1);}
 }else if(kind==='wall'){
  r('#29242a',0,0,48,48);r('#715d53',1,0,46,48);r('#b3a08b',2,0,3,48);r('#dbc7ac',3,0,1,48);
  r('#3d3433',42,0,5,48);r('#96816d',6,0,34,48);r('#b49d82',7,0,1,48);
  for(let y=2;y<48;y+=6){r('#4b403b',11,y,26,3);r('#d0b79a',11,y-1,25,1);r('#756456',12,y,1,2);}
  for(const y of [5,39]){r('#342f30',3,y,5,5);r('#ddc9ae',3,y,4,1);r('#8a8176',4,y+1,3,2);r('#393538',5,y+1,1,3);}
  r('#201f26',0,0,1,48);r('#dfc3a1',40,0,1,48);r('#4b3b35',46,0,2,48);
 }else{
  r('#292626',7,34,34,9);r('#373021',11,43,27,3);
  const oct=(l,t,rr,b)=>[[l+7,t],[rr-7,t],[rr,t+7],[rr,b-7],[rr-7,b],[l+7,b],[l,b-7],[l,t+7]];
  poly('#201e28',oct(5,6,43,42));poly('#736777',oct(6,6,42,38));
  poly('#c8b6bd',oct(7,5,41,33));poly('#9b899d',oct(9,8,40,34));
  poly('#e0d3d3',oct(11,8,37,29));poly('#4d3d52',oct(12,10,36,29));
  poly('#211e29',oct(14,11,34,25));r('#100f19',17,14,14,8);r('#796178',17,23,14,2);
  r('#e7d6d1',12,9,20,2);r('#f3e6d6',9,13,2,8);r('#a694a3',8,29,3,5);
  r('#4a3e50',11,34,27,4);r('#9d8a9d',13,33,22,2);r('#c5b2ba',14,31,18,1);
  for(const x of [13,32]){r('#3b3443',x,28,3,3);r('#d7c7c7',x,28,2,1);}
 }
 this.cache.set(key,c);return c;}
};
const floorBeforeMax=ArenaArt.floor;
ArenaArt.floor=function(ctx,g,x,y){if(g.arenaStyle!=='overdrive')return floorBeforeMax.call(this,ctx,g,x,y);ctx.drawImage(MaxPowerTiles.tile('floor',(x+y)&1),x*TILE,y*TILE,TILE,TILE);return true;};
const solidBeforeMax=ArenaArt.solid;
ArenaArt.solid=function(ctx,g,x,y,t){if(g.arenaStyle!=='overdrive')return solidBeforeMax.call(this,ctx,g,x,y,t);const border=x<=0||y<=0||x>=COLS-1||y>=ROWS-1;ctx.save();ctx.translate(x*TILE,y*TILE);
 if(border){ctx.translate(TILE/2,TILE/2);if(y<=0||y>=ROWS-1)ctx.rotate(Math.PI/2);ctx.drawImage(MaxPowerTiles.tile('wall'),-TILE/2,-TILE/2,TILE,TILE);}
 else ctx.drawImage(MaxPowerTiles.tile('pillar'),0,0,TILE,TILE);ctx.restore();return true;};
const previewBeforeMax=ArenaArt.worldPreview;
ArenaArt.worldPreview=function(ctx,stage,w,h){if(stage!=='overdrive')return previewBeforeMax.call(this,ctx,stage,w,h);ctx.save();ctx.scale(w/(16*TILE),h/(8*TILE));for(let y=0;y<8;y++)for(let x=0;x<16;x++){this.floor(ctx,{arenaStyle:'overdrive'},x,y);if(x===0||y===0||x===15||y===7||x%2===0&&y%2===0)this.solid(ctx,{arenaStyle:'overdrive'},x,y,TILE_WALL);}ctx.restore();};
