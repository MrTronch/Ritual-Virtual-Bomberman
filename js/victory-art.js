// CSS sprite animation remains visible even while simulation is stopped.
const VictoryArt={
 source:'assets/personajes/celebraciones/celebraciones-corregidas.webp',
 order:['psicogato','bunnylicious','perrotech','sazonix','sr-mr','michia'],
 show(ui,players){
  ui.overlay.querySelector('.victory-lineup')?.remove();document.body.classList.add('victory-screen');
  const lineup=document.createElement('div');lineup.className='victory-lineup';
  for(const p of players){
   const index=this.order.indexOf(p.character),sprite=document.createElement(p.character==='max'?'canvas':'div');
   sprite.className='victory-sprite';sprite.dataset.character=p.character;sprite.setAttribute('role','img');sprite.setAttribute('aria-label',p.character==='max'?'Max permanece estoico':p.name+' celebra');
   if(p.character==='max'){sprite.width=256;sprite.height=256;}else{
    sprite.classList.add('animated-victory','normalized-victory');sprite.innerHTML=this.frameMarkup(p.character);
   }
   lineup.append(sprite);
  }
  ui.overlayButtons.before(lineup);this.update(0);
 },
 // Draw at a small native resolution to keep the trophy crisp on every device.
 showCup(ui){
  document.body.classList.add('cup-victory');
  const trophy=document.createElement('canvas');trophy.className='cup-trophy';trophy.width=80;trophy.height=88;
  trophy.setAttribute('role','img');trophy.setAttribute('aria-label','Copa dorada de campeón');
  const c=trophy.getContext('2d'),rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const shape=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  // Stepped handles, deep plum outlines and warm gold facets.
  rect(4,16,72,8,'#301b38');rect(4,24,9,22,'#301b38');rect(67,24,9,22,'#301b38');rect(11,40,58,10,'#301b38');
  rect(8,20,64,4,'#ffe7a0');rect(8,24,5,17,'#e59a28');rect(67,24,5,17,'#e59a28');rect(13,41,54,5,'#ffca52');
  shape([[17,8],[63,8],[63,34],[58,46],[48,54],[45,65],[55,69],[55,74],[66,74],[66,85],[14,85],[14,74],[25,74],[25,69],[35,65],[32,54],[22,46],[17,34]],'#301b38');
  shape([[21,13],[59,13],[59,33],[54,43],[44,50],[42,65],[38,65],[36,50],[26,43],[21,33]],'#e99723');
  shape([[24,15],[55,15],[55,31],[50,41],[41,47],[29,39],[24,30]],'#ffcc4d');
  rect(24,15,5,15,'#fff0ac');rect(21,10,38,5,'#fff0ac');rect(28,40,9,4,'#ffe482');rect(38,51,4,15,'#ffe482');
  rect(29,69,22,5,'#ffc948');rect(19,77,42,5,'#d68d29');rect(19,77,42,2,'#fff0ac');rect(35,76,10,7,'#573454');rect(38,77,4,4,'#63f4db');
  shape([[40,20],[43,27],[50,27],[45,32],[47,39],[40,35],[33,39],[35,32],[30,27],[37,27]],'#a65a23');
  shape([[40,21],[42,28],[48,28],[43,31],[45,36],[40,33],[35,36],[37,31],[32,28],[38,28]],'#fff3ae');
  for(const [x,y] of [[8,5],[68,57],[8,64]]){rect(x+2,y,2,10,'#fff0ac');rect(x-2,y+4,10,2,'#fff0ac');}
  const lineup=ui.overlay.querySelector('.victory-lineup');lineup.insertBefore(trophy,lineup.children[Math.ceil(lineup.children.length/2)]||null);
 },
 frameMarkup(id){return CelebrationFrames.markup(id,this.source);},
 update(time){
  for(const c of document.querySelectorAll('canvas.victory-sprite')){
   const ctx=c.getContext('2d');ctx.clearRect(0,0,256,256);ctx.imageSmoothingEnabled=false;RitualSprites.preview(ctx,'max',256,256);
  }
 }
};
const campaignClearWithVictory=Game.prototype.levelClear;
Game.prototype.levelClear=function(){campaignClearWithVictory.call(this);VictoryArt.show(this.ui,this.players.filter(p=>p.alive));document.body.classList.add('campaign-results');};

Game.prototype.renderResults=function(){
 const r=this.results;if(!r)return;const box=this.ui.overlayText;box.textContent='';
 const list=document.createElement('div');list.className='score-results';
 r.items.forEach((item,i)=>{const row=document.createElement('div');row.className='score-result-row';const label=document.createElement('span'),value=document.createElement('b');
  label.textContent=i===0?'Nivel completado':i===1?'Bono de tiempo':'Enemigos derrotados';
  const start=i*450,progress=r.done?1:Math.max(0,Math.min(1,(r.t-start)/400));value.textContent='+'+Math.round(item.value*progress);row.append(label,value);list.append(row);
 });
 const stars=document.createElement('div');stars.className='result-stars';stars.textContent='★'.repeat(r.stars)+'☆'.repeat(3-r.stars);list.append(stars);
 const total=document.createElement('div');total.className='result-total';total.textContent='PUNTOS: '+this.players[0].score;list.append(total);
 const next=document.createElement('div');next.className='result-next';next.textContent=r.footer.split('\n').map(s=>s.trim()).filter(Boolean).filter(s=>!s.startsWith('Score:')).map(s=>s.replace(/^Next:/,'Siguiente:').replace('New high score!','Nuevo récord').replace('World ','Mundo ').replace(' unlocked:',' desbloqueado:')).join(' · ');list.append(next);box.append(list);
};
