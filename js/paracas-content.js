THEMES.paracas={...THEMES.desert,name:'Necrópolis de Paracas'};
WORLD_ORDER.push('paracas');WORLD_TEMPLATES.paracas=['classic','rooms','cross','arena','arena'];BOSSES.paracas={...BOSSES.desert,name:'Guardián de Paracas'};
// Necrópolis de Paracas: art layers and timed spikes use existing game collision/damage rules.
const Paracas={images:{},tiles:new Map(),halfCycle:2.5,period:5,warning:.6,
 rects:{mummy:[42,17,173,240],mummy2:[224,17,170,240],stone:[792,80,143,142],stone2:[951,80,143,142],stone3:[1109,80,143,142],floor:[894,280,148,148],floor2:[1061,280,148,148],floor3:[1228,280,148,148],seal:[482,270,371,330],plant:[947,465,84,67],spikes:[106,364,107,65],retracted:[283,364,107,65]},
 patch(ctx,key,r,x,y,w,h){const im=this.images[key];if(!im)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,...r,x,y,w,h);ctx.restore();return true;},
 sprite(ctx,name,x,y,w,h){return this.patch(ctx,'tiles',this.rects[name],x,y,w,h);},
 phase(g,offset=0){return ((g.paracas?.clock||0)+offset)%this.period;},
 state(g){const t=this.phase(g);return t>=this.halfCycle?'extended':t>=this.halfCycle-this.warning?'warning':'retracted';},
 safe(g,x,y,start,end){if(!g.paracas?.trapKeys.has(tileKey(x,y)))return true;const t=g.paracas.clock+start/1000,u=g.paracas.clock+end/1000;return Math.floor(t/this.period)===Math.floor(u/this.period)&&t%this.period<this.halfCycle&&u%this.period<this.halfCycle;},
 frame(ctx,g){if(!this.images.walls)return;const w=CANVAS_W,h=CANVAS_H,im=this.images.walls,S=1448,H=1086,edge=96;
  const xs=[0,196,1250,S],ys=[0,285,815,H],dx=[-TILE,TILE,w-TILE,w+TILE],dy=[-TILE,TILE,h-TILE,h+TILE];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){if(row===1&&col===1)continue;this.patch(ctx,'walls',[xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row]],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);}
 },
 traps(ctx,g){if(!g.paracas)return;const t=this.phase(g),state=this.state(g),lift=state==='extended'?Math.min(1,(t-this.halfCycle)/.16,(this.period-t)/.16):0;
  for(const a of g.paracas.traps){const x=a.x*TILE,y=a.y*TILE;ctx.fillStyle='#143b43';ctx.fillRect(x+3,y+2,42,44);this.sprite(ctx,'retracted',x+5,y+4,38,40);if(state==='warning'){ctx.fillStyle=`rgba(64,239,238,${.22+.2*Math.sin(g.paracas.clock*40)**2})`;ctx.fillRect(x+2,y+2,44,44);}if(lift>0){ctx.save();ctx.beginPath();ctx.rect(x+3,y+3,42,43);ctx.clip();this.sprite(ctx,'spikes',x+5,y+4+(1-lift)*15,38,40);ctx.restore();}}
 }
};
for(const [key,name] of Object.entries({tiles:'tiles',walls:'muros',background:'desierto'})){const im=new Image();im.onload=()=>{Paracas.images[key]=im;Paracas.tiles.clear();Renderer.forceRebuild();};im.src='assets/mapas/paracas/'+name+'.webp';}
const paracasConfigure=Game.prototype.configureArenaContent;
Game.prototype.configureArenaContent=function(){paracasConfigure.call(this);this.paracas=null;if(!(this.mode===2&&this.settings.battle.stage==='paracas'||this.mode===1&&this.campaignStage().theme==='paracas'))return;
 this.arenaStyle='paracas';this.inti=null;this.portals=[];this.volcano=null;this.exit=null;this.powerups=[];this.grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1?TILE_WALL:TILE_EMPTY));
 const cx=Math.floor(COLS/2),cy=Math.floor(ROWS/2),traps=[];
 for(const x of [4,COLS-5])for(let y=5;y<=8;y++)traps.push({x,y});
 const mummy=[[4,3],[7,3],[COLS-8,3],[COLS-5,3],[9,5],[COLS-10,5],[6,6],[COLS-7,6],[6,ROWS-5],[COLS-7,ROWS-5],[9,ROWS-4],[COLS-10,ROWS-4],[4,ROWS-3],[7,ROWS-3],[COLS-8,ROWS-3],[COLS-5,ROWS-3]];
 for(const [x,y] of mummy)if(x>1&&y>1&&x<COLS-2&&y<ROWS-2)this.grid[y][x]=TILE_WALL;
 const trapKeys=new Set(traps.map(t=>tileKey(t.x,t.y)));
 for(let y=2;y<ROWS-2;y++)for(let x=3;x<COLS-3;x++){if(this.grid[y][x]!==TILE_EMPTY||trapKeys.has(tileKey(x,y))||y===cy||x===cx||x===cx-1||Math.abs(x-cx)<=1&&Math.abs(y-cy)<=1)continue;if((x*17+y*11)%13<8)this.grid[y][x]=TILE_BRICK;}
 // Interrupt the perimeter highways, leaving each initial escape pocket clear.
 for(let x=3;x<COLS-3;x+=3)for(const y of [1,ROWS-2])if(this.grid[y][x]===TILE_EMPTY)this.grid[y][x]=TILE_BRICK;
 for(let y=3;y<ROWS-3;y+=3)for(const x of [1,COLS-2])if(this.grid[y][x]===TILE_EMPTY)this.grid[y][x]=TILE_BRICK;
 for(const p of this.players)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=p.spawn.x+dx,y=p.spawn.y+dy;if(x>0&&y>0&&x<COLS-1&&y<ROWS-1)this.grid[y][x]=TILE_EMPTY;}
 this.paracas={clock:0,traps,trapKeys,mummyKeys:new Set(mummy.filter(([x,y])=>this.grid[y]?.[x]===TILE_WALL&&x>0&&y>0&&x<COLS-1&&y<ROWS-1).map(([x,y])=>tileKey(x,y)))};for(const e of [...this.players,...this.enemies])e.paracasHitUntil=0;this.enemies=this.enemies.filter(e=>this.grid[e.ty]?.[e.tx]===TILE_EMPTY&&!trapKeys.has(tileKey(e.tx,e.ty)));this.brickHp?.clear();if(Deathmatch.active(this))for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(this.grid[y][x]===TILE_BRICK)this.brickHp.set(tileKey(x,y),3);if(this.mode===1)this.ensureCampaignExit();
};
const paracasFloor=ArenaArt.floor,paracasSolid=ArenaArt.solid;
ArenaArt.floor=function(ctx,g,x,y){if(g.arenaStyle!=='paracas')return paracasFloor.call(this,ctx,g,x,y);const seed=(x*7+y*3)%8,v=seed<6?0:seed-5;let tile=Paracas.tiles.get(v);if(!tile&&Paracas.images.tiles){tile=document.createElement('canvas');tile.width=tile.height=TILE;const c=tile.getContext('2d');c.fillStyle='#c67338';c.fillRect(0,0,TILE,TILE);Paracas.sprite(c,['floor','floor2','floor3'][v],0,0,TILE,TILE);Paracas.tiles.set(v,tile);}if(tile)ctx.drawImage(tile,x*TILE,y*TILE);else{ctx.fillStyle='#c67338';ctx.fillRect(x*TILE,y*TILE,TILE,TILE);}return true;};
ArenaArt.solid=function(ctx,g,x,y,t){if(g.arenaStyle!=='paracas')return paracasSolid.call(this,ctx,g,x,y,t);if(x<=0||y<=0||x>=COLS-1||y>=ROWS-1)return true;if(t===TILE_WALL){Paracas.sprite(ctx,(x+y)%2?'mummy':'mummy2',x*TILE+4,y*TILE-19,40,65);ctx.save();ctx.globalAlpha=.18+.12*Math.sin(g.paracas.clock*2+x);ctx.fillStyle='#8cffff';ctx.fillRect(x*TILE+17,y*TILE+8,3,2);ctx.fillRect(x*TILE+27,y*TILE+8,3,2);ctx.restore();}else if(t===TILE_BRICK)Paracas.sprite(ctx,['stone','stone2','stone3'][(x+y)%3],x*TILE+1,y*TILE+1,46,46);return true;};
// Mummies are drawn at their own foot position, so a full sarcophagus still occupies one tile.
ArenaArt.paracasMummies=function(ctx,g){for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++)if(g.grid[y][x]===TILE_WALL){Paracas.sprite(ctx,(x+y)%2?'mummy':'mummy2',x*TILE+4,y*TILE-19,40,65);ctx.save();ctx.globalAlpha=.18+.12*Math.sin(g.paracas.clock*2+x);ctx.fillStyle='#8cffff';ctx.fillRect(x*TILE+17,y*TILE+8,3,2);ctx.fillRect(x*TILE+27,y*TILE+8,3,2);ctx.restore();}};
const paracasTerrain=ArenaArt.currents;
ArenaArt.currents=function(ctx,g){paracasTerrain.call(this,ctx,g);if(!g.paracas)return;const cx=CANVAS_W/2,cy=CANVAS_H/2;Paracas.sprite(ctx,'seal',cx-64,cy-60,128,120);for(const [x,y] of [[6,2],[COLS-7,2],[8,ROWS-3],[COLS-9,ROWS-3]])if(g.grid[y]?.[x]===TILE_EMPTY)Paracas.sprite(ctx,'plant',x*TILE+8,y*TILE+16,32,27);Paracas.traps(ctx,g);};
const paracasBackdrop=ArenaArt.background;
ArenaArt.background=function(ctx,g){paracasBackdrop?.call(this,ctx,g);if(g.arenaStyle==='paracas'&&Paracas.images.background)ctx.drawImage(Paracas.images.background,-TILE,-TILE,CANVAS_W+2*TILE,CANVAS_H+2*TILE);};
const paracasFrame=RevengeShips.rail;
RevengeShips.rail=function(ctx,g){if(g.paracas){Paracas.frame(ctx,g);return;}paracasFrame.call(this,ctx,g);};
const paracasAir=ArenaArt.airObjects;
ArenaArt.airObjects=function(ctx,g){paracasAir.call(this,ctx,g);if(!g.paracas)return;const t=g.paracas.clock;ctx.save();ctx.globalAlpha=.15+.1*Math.sin(t*2);ctx.fillStyle='#81ffff';for(const x of [CANVAS_W*.2,CANVAS_W*.4,CANVAS_W*.6,CANVAS_W*.8])ctx.fillRect(x,-10,17,2);ctx.restore();};
const paracasPreview=ArenaArt.worldPreview;
ArenaArt.worldPreview=function(ctx,name,w,h){if(name!=='paracas')return paracasPreview.call(this,ctx,name,w,h);ctx.save();ctx.fillStyle='#271635';ctx.fillRect(0,0,w,h);ctx.translate(w*.08,h*.08);ctx.scale(w*.84/(8*TILE),h*.84/(4*TILE));for(let y=0;y<4;y++)for(let x=0;x<8;x++)this.floor(ctx,{arenaStyle:'paracas'},x,y);Paracas.sprite(ctx,'seal',3.3*TILE,1.2*TILE,70,70);for(const x of [1,6])for(const y of [1,3])Paracas.sprite(ctx,'mummy',x*TILE,y*TILE-28,38,60);ctx.restore();};
const paracasHazards=Game.prototype.updateArenaHazards;
Game.prototype.updateArenaHazards=function(dt){paracasHazards.call(this,dt);if(!this.paracas||this.state!=='playing')return;this.paracas.clock+=dt;const active=Paracas.state(this)==='extended';if(!active)return;
 for(const t of this.paracas.traps){for(const b of [...this.bombs])if(!b.exploded&&!b.flight&&!b.inHand&&b.tx===t.x&&b.ty===t.y)this.explodeBomb(b);
  for(const e of [...this.players,...this.enemies])if(Deathmatch.eligible(e)&&e.tx===t.x&&e.ty===t.y&&(e.paracasHitUntil||0)<=this.paracas.clock){e.paracasHitUntil=this.paracas.clock+.7;if(Deathmatch.active(this)){if(Deathmatch.hit(this,e,1,null)&&e instanceof Player)e.shield=Math.max(e.shield,650);}else if(e instanceof Player)this.killPlayer(e);else this.killEnemy(e,null);}}
};
const paracasThreats=Game.prototype.lavaThreats;
Game.prototype.lavaThreats=function(){const out=paracasThreats.call(this);if(this.paracas){const t=Paracas.phase(this),active=t>=Paracas.halfCycle;for(const a of this.paracas.traps)out.push({...a,hitAt:active?0:(Paracas.halfCycle-t)*1000,clearAt:(Paracas.period-t)*1000});}return out;};
Game.prototype.paracasSafeAt=function(x,y,start,end){return !this.paracas||Paracas.safe(this,x,y,start,end);};
// The selected arena retains the menu soundtrack until the player enters; reuse the desert track.
const paracasMusic=Game.prototype.updateMusic;
Game.prototype.updateMusic=function(){if(this.arenaStyle==='paracas'&&!this.demo&&['intro','playing'].includes(this.state))this.music.play('ritual');else paracasMusic.call(this);};

// Every destroyed Paracas stone produces one pickup, respecting each combat mode's item table.
const paracasDrop=Game.prototype.destroyBrick;
Game.prototype.destroyBrick=function(x,y){const stone=this.paracas&&this.grid[y]?.[x]===TILE_BRICK;paracasDrop.call(this,x,y);if(stone&&!this.powerups.some(p=>p.tx===x&&p.ty===y)){const type=weightedPick(Deathmatch.active(this)?Inca.drops:POWERUP_TABLE);this.powerups.push(new PowerUp(x,y,type));}};
// Reassemble wall spans at a uniform scale: large Nazca motifs retain their proportions.
Paracas.wallCache=new Map();
Paracas.frame=function(ctx,g){if(!this.images.walls||!this.images.tiles)return;const key=CANVAS_W+':'+CANVAS_H;let entry=this.wallCache.get(key);if(!entry){const c=document.createElement('canvas');c.width=CANVAS_W+96;c.height=CANVAS_H+96;const a=c.getContext('2d');a.translate(48,48);a.imageSmoothingEnabled=false;const w=CANVAS_W,h=CANVAS_H,eyes=[];
 const fit=(image,r,x,y,w,h)=>{const k=Math.min(w/r[2],h/r[3]),dx=x+(w-r[2]*k)/2,dy=y+(h-r[3]*k)/2;this.patch(a,image,r,dx,dy,r[2]*k,r[3]*k);return {x:dx,y:dy,k};};
 a.fillStyle='#5b272c';a.fillRect(-48,-48,w+96,96);a.fillRect(-48,h-48,w+96,96);a.fillRect(-48,48,96,h-96);a.fillRect(w-48,48,96,h-96);
 for(let x=48;x<w-48;x+=24){this.patch(a,'walls',[305,99,24,112],x,-48,24,96);this.patch(a,'walls',[305,99,24,112],x,h-48,24,96);}
 const top=[[32,625,444,183],[512,625,420,183],[966,625,449,183]],span=(w-96)/3;
 top.forEach((r,i)=>fit('tiles',r,48+i*span,-46,span,92));
 fit('tiles',[61,831,649,153],48,h-46,(w-96)/3,92);fit('walls',[550,875,340,136],48+span,h-46,span,92);fit('tiles',[745,831,633,153],48+span*2,h-46,span,92);
 fit('walls',[27,300,98,400],-48,48,96,h-96);fit('walls',[1320,300,98,400],w-48,48,96,h-96);
 const corners=[{r:[25,16,171,270],x:-48,y:-48,e:[[125,68],[135,62]]},{r:[1250,16,171,270],x:w-48,y:-48,e:[[53,68],[42,62]]},{r:[25,727,171,306],x:-48,y:h-96,e:[[124,60],[135,54]]},{r:[1250,727,171,306],x:w-48,y:h-96,e:[[53,60],[42,54]]}];
 for(const q of corners){const t=fit('walls',q.r,q.x,q.y,96,144);for(const e of q.e)eyes.push({x:t.x+e[0]*t.k,y:t.y+e[1]*t.k});}
 entry={canvas:c,eyes};this.wallCache.set(key,entry);}
 ctx.drawImage(entry.canvas,-48,-48);const clock=g.paracas.clock;ctx.save();for(let i=0;i<entry.eyes.length;i++){const e=entry.eyes[i],pulse=.45+.35*Math.sin(clock*2.5+i*.13)**2,glow=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,5);glow.addColorStop(0,`rgba(225,255,190,${pulse})`);glow.addColorStop(.35,`rgba(130,255,90,${pulse*.7})`);glow.addColorStop(1,'rgba(90,255,110,0)');ctx.fillStyle=glow;ctx.fillRect(e.x-5,e.y-5,10,10);}ctx.restore();
};

// Arena decoration must never remove a campaign guardian and block progression.
const setupWithCampaignMaps=Game.prototype.setupLevel;
Game.prototype.setupLevel=function(){setupWithCampaignMaps.call(this);if(this.mode===1&&this.boss&&!this.enemies.includes(this.boss)){
 const spots=EntityGlove.spots(this,{x:Math.floor(COLS/2),y:Math.floor(ROWS/2)},this.boss).filter(a=>!this.paracas?.trapKeys.has(tileKey(a.x,a.y)));
 const a=spots[0];if(a){this.boss.x=centerOf(a.x);this.boss.y=centerOf(a.y);this.boss.target=null;this.boss.origin={x:a.x,y:a.y};this.enemies.push(this.boss);}
}};

// Refill after map decoration so obstacles do not reduce the chosen NPC count.
const setupBeforeNpcRefill=Game.prototype.setupLevel;
Game.prototype.setupLevel=function(){setupBeforeNpcRefill.call(this);if(this.mode!==2||!Deathmatch.active(this))return;this.enemies=this.enemies.filter(e=>this.grid[e.ty]?.[e.tx]===TILE_EMPTY&&!this.paracas?.trapKeys.has(tileKey(e.tx,e.ty)));const count=Deathmatch.npcCount(this),spawns=this.players.map(p=>({x:p.tx,y:p.ty}));
 for(let tries=0;this.enemies.length<count&&tries<count*8;tries++){const e=this.spawnEnemy(['balloom','oneal','doll'][tries%3],spawns,1);if(!e)break;if(this.paracas?.trapKeys.has(tileKey(e.tx,e.ty))){this.enemies=this.enemies.filter(a=>a!==e);continue;}e.hp=e.maxHp=2;}
};
