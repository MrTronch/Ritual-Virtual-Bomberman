// Battle deaths redistribute permanent upgrades, never curses, snail or hearts.
const BattleDrops={
 upgrades(p){
  const out=[];
  for(const [type,count] of [['bomb',p.deathmatchArmed?(p.fireRateLevel||0):p.maxBombs-(p.bombDropBase||1)],['fire',p.range-1],['speed',p.speedLevel-(p.speedDropBase||1)]])for(let n=0;n<Math.max(0,count);n++)out.push(type);
  for(const [type,enabled] of [['kick',p.canKick],['wallpass',p.wallPass],['glove',p.canPunch]])if(enabled)out.push(type);
  if(['tnt','napalm','spike'].includes(p.bombKind))out.push(p.bombKind);
  if(p.held?.kind==='item'&&!['life','skull','snail','random'].includes(p.held.object.type))out.push(p.held.object.type);
  return out;
 },
 flush(game){
  if(game.settings?.battle?.stage==='overdrive'){game.pendingDeathDrops=[];return;}
  if(game.settings?.battle?.combat==='deathmatch')game.pendingDeathDrops=(game.pendingDeathDrops||[]).filter(type=>type!=='fire');
  const pending=game.pendingDeathDrops;if(!pending?.length||game.state!=='playing')return;
  const cells=[];
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){
   if(game.grid[y][x]!==TILE_EMPTY||game.bombAt(x,y)||game.portalZone?.(x,y))continue;
   if(game.powerups.some(p=>p.tx===x&&p.ty===y)||game.players.some(p=>p.alive&&p.tx===x&&p.ty===y))continue;
   if(game.explosions.some(ex=>ex.timer>0&&ex.covers(x,y))||(game.falling||[]).some(b=>b.tx===x&&b.ty===y))continue;
   if(game.lavaThreats?.().some(c=>c.x===x&&c.y===y))continue;
   cells.push({x,y});
  }
  for(let i=cells.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
  while(cells.length&&pending.length){const spot=cells.pop();game.powerups.push(new PowerUp(spot.x,spot.y,pending.shift()));}
 }
};
const killBeforeBattleDrops=Game.prototype.killPlayer;
Game.prototype.killPlayer=function(p,...args){
 const alive=p.alive,enabled=this.mode===2&&!this.demo,items=enabled&&alive&&this.settings.battle.stage!=='overdrive'?BattleDrops.upgrades(p):[];
 killBeforeBattleDrops.call(this,p,...args);
 if(!enabled||!alive||p.alive)return;
 this.pendingDeathDrops=this.pendingDeathDrops||[];this.pendingDeathDrops.push(...items);
 if(p.held?.kind==='item')p.held=null;
 for(const b of this.bombs)if(b.owner===p)b.orphan=true;
 p.resetPowers();p.bombsActive=0;
 BattleDrops.flush(this);
};
const shipUpdateBeforeDrops=Game.prototype.updateRevengeShips;
Game.prototype.updateRevengeShips=function(dt){shipUpdateBeforeDrops.call(this,dt);BattleDrops.flush(this);};
const startBeforeDrops=Game.prototype.startLevel;
Game.prototype.startLevel=function(){this.pendingDeathDrops=[];return startBeforeDrops.call(this);};
