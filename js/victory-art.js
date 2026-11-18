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
