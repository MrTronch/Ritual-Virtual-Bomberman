// ---------------------------------------------------------------------------
// DOM glue (HUD + overlay), device handling, and the main loop.
// ---------------------------------------------------------------------------

class UI {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.overlay = $('overlay');
    this.overlayTitle = $('overlay-title');
    this.overlayText = $('overlay-text');
    this.overlayButtons = $('overlay-buttons');
    this.overlayHelp = $('overlay-help');
    this.hudPlayers = $('hud-players');
    this.levelLabel = $('hud-level-label');
    this.level = $('hud-level');
    this.time = $('hud-time');
    this.timerStat = this.time.parentElement;
    this.touchDetonate = $('touch-detonate');
    this.buttons = [];
    this.focusIndex = 0;
    this.touch = false;
    this.coarse = false;
    this.playerRefs = [];
    this.onActivate = null;
  }

  set(el, value) {
    const text = String(value);
    if (el.textContent !== text) el.textContent = text;
  }

  isTouch() {
    return this.touch;
  }

  setTouchUI(on) {
    this.touch = !!on;
    document.body.classList.toggle('touch-ui', this.touch);
  }

  // ---------------- overlay ----------------
  showOverlay({ title, text, buttons, help, focus }) {
    document.body.classList.toggle('character-select', title.startsWith('ELIGE'));
    document.body.classList.toggle('title-screen', title === 'BOMBERMAN');
    document.body.classList.remove('victory-screen','campaign-select','round-results','campaign-results');
    this.set(this.overlayTitle, title);
    this.set(this.overlayText, text || '');
    this.set(this.overlayHelp, help || '');
    this.overlay.querySelector('.character-preview')?.remove();
    this.overlay.querySelector('.victory-lineup')?.remove();
    this.overlayButtons.innerHTML = '';
    this.overlayButtons.classList.remove('character-grid','battle-grid','battle-config','pause-actions','campaign-worlds','campaign-options');
    this.overlayButtons.classList.toggle('pause-actions',title==='PAUSA');
    document.getElementById('ritual-logo').hidden = title !== 'BOMBERMAN' && !title.startsWith('ELIGE');
    this.buttons = [];
    for (const b of buttons) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.tabIndex = -1; // keyboard handling is done by the game, not the DOM
      btn.textContent = b.label;
      btn.disabled = !!b.disabled;
      if (title === 'BOMBERMAN') {
        const head = document.createElement('canvas');
        head.width = 64; head.height = 64; head.className = 'menu-cursor';
        head.setAttribute('aria-hidden', 'true');
        const paintHead = () => RitualSprites.head(head.getContext('2d'), 'psicogato', 64, 64);
        paintHead(); SelectionArt.ready.then(paintHead);
        btn.prepend(head);
        btn.addEventListener('pointerenter', () => this.focusButton(this.buttons.findIndex(entry => entry.el === btn)));
      }
      if (b.character) {
        btn.className = 'character-card';
        const portrait = document.createElement('canvas');
        portrait.width = 160; portrait.height = 144;
        const paint = () => SelectionArt.head(portrait.getContext('2d'),b.character.id,160,144);
        if (!b.character.enabled) {const pc=portrait.getContext('2d');pc.fillStyle='#bfa6db';pc.font='56px "Ritual Pixel"';pc.textAlign='center';pc.fillText('?',80,95);}
        else if(!paint()) RitualSprites.portraitSource(b.character.id).addEventListener('load',paint,{once:true});
        if(!RitualSprites.detailSheet.complete)RitualSprites.detailSheet.addEventListener('load',paint,{once:true});
        SelectionArt.ready.then(paint);btn.setAttribute('aria-label',b.character.name);btn.title=b.character.name;
        portrait.className = 'character-portrait ' + b.character.id;
        portrait.setAttribute('aria-hidden', 'true');
        btn.prepend(portrait);
      }
      btn.addEventListener('click', () => {
        btn.blur();
        this.fire(b);
      });
      this.overlayButtons.appendChild(btn);
      this.buttons.push({ el: btn, action: b.action, disabled: !!b.disabled, back: !!b.back, cycle: !!b.cycle });
    }
    this.overlay.classList.add('visible');
    this.focusButton(typeof focus === 'number' && focus >= 0 ? focus : 0);
  }

  setOverlayText(text) {
    this.set(this.overlayText, text);
  }

  hideOverlay() {
    document.body.classList.remove('character-select', 'title-screen', 'victory-screen', 'campaign-select', 'round-results', 'campaign-results');
    this.overlay.classList.remove('visible');
    this.buttons = [];
  }

  fire(b) {
    if (b.disabled || (b.el && b.el.disabled)) return;
    if (this.onActivate) this.onActivate();
    b.action();
  }

  focusButton(i) {
    if (!this.buttons.length) return;
    this.focusIndex = Math.min(Math.max(i, 0), this.buttons.length - 1);
    if(this.buttons[this.focusIndex].disabled||this.buttons[this.focusIndex].el?.disabled){const next=this.buttons.findIndex(b=>!b.disabled&&!b.el?.disabled);if(next>=0)this.focusIndex=next;}
    this.buttons.forEach((b, idx) => {
      b.el.classList.toggle('focused', idx === this.focusIndex);
      b.el.setAttribute('aria-current', idx === this.focusIndex ? 'true' : 'false');
    });
  }

  focusMove(delta) {
    if (!this.buttons.length) return;
    for(let step=1;step<=this.buttons.length;step++){const index=(this.focusIndex+delta*step+this.buttons.length*step)%this.buttons.length;if(!this.buttons[index].disabled&&!this.buttons[index].el?.disabled){this.focusButton(index);break;}}
  }

  activateButton(i) {
    const b = this.buttons[i];
    if (!b) return false;
    this.fire(b);
    return true;
  }

  // Enter/Space activates the focused button. With `cycleOnly`, only buttons
  // flagged as option cyclers respond (used for left/right arrows).
  activateFocused(cycleOnly = false,delta=1) {
    const b = this.buttons[this.focusIndex];
    if (!b) return false;
    if (cycleOnly && !b.cycle) return false;
    if(cycleOnly&&b.adjust&&!b.disabled){b.adjust(delta);return true;}
    this.fire(b);
    return true;
  }

  primaryAction() {
    return this.activateButton(0);
  }

  backAction() {
    const b = this.buttons.find((x) => x.back);
    if (!b) return false;
    this.fire(b);
    return true;
  }

  showCharacterPreview(id) {
    const c=CHARACTERS.find(c=>c.id===id&&c.enabled)||CHARACTERS[0];
    const panel=document.createElement('div');panel.className='character-preview';
    const face=document.createElement('canvas');face.width=280;face.height=230;face.className='hero-face';
    const draw=()=>RitualSprites.portrait(face.getContext('2d'),c.id,280,230);
    if(!draw())RitualSprites.portraitSource(c.id).addEventListener('load',draw,{once:true});
    const info=document.createElement('div');info.className='character-info';
    const label=document.createElement('span');label.className='roster-eyebrow';label.textContent='RITUAL VIRTUAL / SELECCIÓN';
    const name=document.createElement('strong');name.textContent=c.name;
    const detail=document.createElement('p');detail.textContent='Elige tu identidad. Todos comparten las mismas habilidades.';
    info.append(label,name,detail);
    const body=document.createElement('canvas');body.width=144;body.height=144;body.className='hero-body';
    const bodyDraw=()=>RitualSprites.preview(body.getContext('2d'),c.id,144,144);
    if(!bodyDraw())RitualSprites.walkSheets[c.id].addEventListener('load',bodyDraw,{once:true});
    panel.append(face,info,body);this.overlayButtons.before(panel);
  }

  // ---------------- HUD: one equal half-width panel per human ----------------
  buildHud(players,mode){
    this.hudPlayers.innerHTML='';this.playerRefs=[];this.cpuRefs=[];
    const old=document.getElementById('cpu-scores');if(old)old.remove();
    const cpuBar=document.createElement('span');cpuBar.id='cpu-scores';
    document.getElementById('hud-center').append(cpuBar);
    const battle=mode===2;
    document.getElementById('hud').classList.toggle('battle-hud',battle);
    document.getElementById('hud').classList.toggle('has-players',players.length>0);
    this.hudPlayers.style.setProperty('--hud-player-count', Math.max(1,players.length));
    players.forEach((p,index)=>{

      const group=document.createElement('section');group.className='player-panel';group.style.setProperty('--player-color',p.color);
      group.setAttribute('aria-label','Jugador '+(index+1)+' '+p.name);
      const portrait=document.createElement('canvas');portrait.width=96;portrait.height=96;portrait.className='hud-portrait';
      const paint=()=>RitualSprites.head(portrait.getContext('2d'),p.character,96,96);
      paint(); SelectionArt.ready.then(paint);
      const content=document.createElement('div');content.className='player-content';
      const heading=document.createElement('div');heading.className='player-heading';
      const name=document.createElement('span');name.className='player-name';name.textContent=(p.isBot?p.name:'J'+(index+1))+(p.team!=null?' · '+['A','B'][p.team]:'');
      name.title=p.character||p.name;
      if(p.team!=null)group.style.setProperty('--player-color',p.team===0?'#86eaff':'#ff9ecf');
      const lives=document.createElement('b');lives.className='player-lives';heading.append(name,lives);
      const scoreBar=document.createElement('div');scoreBar.className='player-score';
      const scoreLabel=document.createElement('span');scoreLabel.textContent='PUNTOS';const score=document.createElement('b');score.textContent='000000';scoreBar.append(scoreLabel,score);
      const powers=document.createElement('div');powers.className='player-items';
      const refs={lives,score};
      const item=(type,key,title)=>{
        const slot=document.createElement('span');slot.className='hud-item';slot.title=title;
        const icon=document.createElement('canvas');icon.width=24;icon.height=24;PixelItems.icon(icon.getContext('2d'),type,0,0,24);
        const value=document.createElement('b');slot.append(icon,value);powers.append(slot);refs[key]=value;return slot;
      };
      item('bomb','bombs','Bombas simultáneas');item('fire','range','Alcance');item('speed','speed','Nivel de velocidad');
      refs.kickSlot=item('kick','kick','Patada');refs.wallSlot=item('wallpass','wallpass','Atravesar bloques');refs.guardSlot=item('life','guard','Protección de un golpe');
      const curse=document.createElement('span');curse.className='hud-curse';powers.append(curse);refs.curse=curse;
      content.append(heading,scoreBar,powers);group.append(portrait,content);this.hudPlayers.append(group);this.playerRefs[index]=refs;
    });
    this.set(this.levelLabel,battle?'RONDA':'NIVEL');
    this.hudPlayers.classList.toggle('two-players',players.filter(p=>!p.isBot).length===2);
    if(!players.length){this.set(this.level,'-');this.set(this.time,'-');this.timerStat.classList.remove('warning');}
  }

  updateHud(game){
    const battle=game.mode===2;
    game.players.forEach((p,i)=>{
      const refs=this.playerRefs[i];if(!refs)return;
      this.hudPlayers.children[i]?.classList.toggle('eliminated', !p.alive && battle);
      this.hudPlayers.children[i]?.classList.toggle('in-revenge-ship', !!p.revengeShip && game.state==='playing');
      this.set(refs.lives,p.revengeShip&&game.state==='playing'?'NAVE':Deathmatch.active(game)?'♥ '+(p.hp??10)+' PV'+(game.mode===1?' · '+p.lives+' VIDAS':''):(battle?'★ ':'♥ ')+(battle?p.wins:p.lives));
      for(const key of ['range'])if(refs[key]?.parentElement)refs[key].parentElement.hidden=Deathmatch.active(game);
      if(refs.guardSlot)refs.guardSlot.hidden=Deathmatch.active(game);
      this.set(refs.score,String(p.score).padStart(6,'0'));
      if(refs.bombs?.parentElement){refs.bombs.parentElement.hidden=false;refs.bombs.parentElement.title=Deathmatch.active(game)?'Cadencia de disparo':'Bombas simultáneas';}
      this.set(refs.bombs,Deathmatch.active(game)?Deathmatch.fireInterval(p).toFixed(2)+'s':p.maxBombs);this.set(refs.range,p.range);this.set(refs.speed,p.speedLevel);
      for(const [flag,slot,key] of [[p.canKick,refs.kickSlot,'kick'],[p.wallPass,refs.wallSlot,'wallpass'],[p.heartGuard,refs.guardSlot,'guard']]){
        slot.classList.toggle('inactive',!flag);this.set(refs[key],flag?'✓':'-');
      }
      this.set(refs.curse,[Deathmatch.active(game)?'LÁSER · '+(p.bombKind==='napalm'?'FUEGO 2':p.bombKind==='spike'?'PÚAS 4':p.bombKind==='tnt'?'TNT 3×3':'DAÑO 1'):'',p.curse?'CALAVERA '+Math.ceil(p.curse.timer/1000)+'s':'',p.snailTimer>0?'CARACOL '+Math.ceil(p.snailTimer/1000)+'s':'',p.bombKind&&p.bombKind!=='normal'?(p.bombKind==='spike'?'PÚAS':p.bombKind.toUpperCase()):'',p.canPunch?(p.held?'EN MANO':'GUANTE N'):''].filter(Boolean).join(' · '));
    });
    for(const ref of this.cpuRefs||[])this.set(ref.el,ref.p.name+' ★'+ref.p.wins);
    if(battle)this.set(this.level,game.level);else{const s=game.campaignStage();this.set(this.level,`${s.world+1}-${s.stage+1}`);}
    const seconds=Math.max(0,Math.ceil(game.timeLeft));
    this.set(this.time,battle?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):seconds);
    this.timerStat.classList.toggle('warning',game.state==='playing'&&((game.mode===1&&game.timeLeft<30)||game.suddenDeath));
    const fireButton=document.querySelector('.tbtn.bomb');if(fireButton){fireButton.textContent=Deathmatch.active(game)?'LÁSER':'💣';fireButton.setAttribute('aria-label',Deathmatch.active(game)?'Disparar láser':'Bomba');}
    this.touchDetonate.classList.add('hidden');
    document.body.classList.toggle('controller-only',game.requiresControllers());
    const glove=document.getElementById('touch-glove');if(glove)glove.hidden=!game.players.some(p=>!p.isBot&&p.canPunch&&p.alive);
    const speed=document.getElementById('spectator-speed');speed.hidden=!game.isSpectating();speed.textContent=game.spectatorFast?'Velocidad normal':'Acelerar ×4';
  }

  setMuted(muted) {
    document.body.classList.toggle('muted', !!muted);const b=document.getElementById('sound-button');if(b){b.textContent=muted?'SONIDO: OFF':'SONIDO: ON';b.setAttribute('aria-pressed',String(!muted));}
  }
}

(function main() {
  const canvas = document.getElementById('game');
  const stage = document.getElementById('stage');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const fullButton = document.getElementById('fullscreen-button');
  fullButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.getElementById('app').requestFullscreen();
    } catch (err) {
      document.body.classList.toggle('expanded-view');
      fullButton.textContent=document.body.classList.contains('expanded-view')?'⛶ Restaurar':'⛶ Maximizar';
      fullButton.dataset.fullscreenError=err.message;
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullButton.textContent = document.fullscreenElement ? '⛶ Restaurar' : '⛶ Maximizar';
  });
  const input = new Input();
  const sfx = new Sfx();
  const music = new Music(sfx);
  const ui = new UI();

  // Touch UI: auto-detect, unless the user forced it on/off.
  const saved = Save.load();
  // Touch capability alone also matches laptops. Use the primary input instead.
  const touchPointer = window.matchMedia('(pointer: coarse)');
  const hoverPointer = window.matchMedia('(hover: none)');
  ui.coarse = touchPointer.matches && hoverPointer.matches || /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
  ui.setTouchUI(saved.touchUI === null || saved.touchUI === undefined ? ui.coarse : saved.touchUI);

  const game = new Game(canvas, input, sfx, music, ui);
  document.getElementById('spectator-speed').addEventListener('click',()=>game.toggleSpectatorSpeed());
  document.getElementById('sound-button').addEventListener('click',()=>{sfx.ensure();if(sfx.volume<=0){sfx.volume=game.settings.sfxVolume=.8;sfx.muted=true;}game.toggleMute();if(!sfx.muted)sfx.menu();});
  window.game = game; // handy for debugging in the console

  const touch = new TouchControls(input, document.getElementById('touch'));
  touch.onAny = () => sfx.ensure();
  const gloveIcon=document.getElementById('touch-glove-icon');
  const paintGlove=()=>{const ctx=gloveIcon.getContext('2d'),img=UpdateContent.itemImage;ctx.clearRect(0,0,48,48);if(!img.complete||!img.naturalWidth)return;const runs=[[58,0,64,1],[57,1,66,1],[56,2,68,1],[55,3,69,1],[55,4,69,1],[54,5,70,1],[54,6,71,1],[42,7,94,1],[42,8,94,1],[40,9,98,1],[40,10,98,1],[40,11,98,1],[40,12,98,1],[40,13,98,1],[39,14,99,1],[33,15,112,1],[32,16,113,1],[31,17,115,1],[29,18,118,1],[29,19,118,1],[29,20,118,1],[29,21,118,1],[29,22,118,1],[29,23,118,1],[28,24,119,1],[24,25,129,1],[22,26,132,1],[20,27,135,1],[21,28,134,1],[20,29,135,1],[19,30,136,1],[19,31,136,1],[19,32,136,1],[19,33,136,1],[19,34,136,1],[19,35,136,1],[19,36,136,1],[14,37,146,1],[12,38,149,1],[12,39,149,1],[11,40,151,1],[11,41,151,1],[10,42,152,1],[10,43,152,1],[10,44,152,1],[10,45,152,1],[10,46,152,1],[10,47,152,1],[10,48,152,1],[10,49,152,1],[10,50,152,1],[10,51,152,1],[10,52,152,1],[6,53,156,1],[3,54,159,1],[2,55,160,1],[2,56,160,1],[2,57,160,1],[1,58,161,1],[0,59,162,1],[0,60,162,1],[0,61,162,1],[0,62,162,1],[0,63,162,1],[0,64,162,1],[0,65,162,1],[0,66,163,1],[0,67,163,1],[0,68,163,1],[0,69,167,1],[0,70,168,1],[0,71,169,1],[0,72,170,1],[0,73,170,1],[0,74,170,1],[0,75,171,1],[0,76,171,1],[0,77,171,1],[0,78,175,1],[0,79,176,1],[0,80,177,1],[0,81,177,1],[0,82,178,1],[0,83,178,1],[0,84,178,1],[0,85,178,1],[0,86,178,1],[0,87,178,1],[0,88,178,1],[0,89,178,1],[0,90,178,1],[0,91,178,1],[0,92,178,1],[0,93,178,1],[0,94,178,1],[0,95,178,1],[0,96,178,1],[0,97,178,1],[1,98,177,1],[1,99,177,1],[1,100,177,1],[1,101,177,1],[1,102,177,1],[2,103,176,1],[2,104,176,1],[3,105,175,1],[3,106,175,1],[10,107,168,1],[10,108,168,1],[10,109,168,1],[10,110,168,1],[10,111,168,1],[10,112,168,1],[10,113,168,1],[10,114,168,1],[10,115,167,1],[10,116,167,1],[10,117,166,1],[10,118,165,1],[11,119,159,1],[16,120,154,1],[16,121,154,1],[16,122,155,1],[16,123,154,1],[16,124,154,1],[16,125,154,1],[16,126,152,1],[16,127,152,1],[16,128,146,1],[17,129,145,1],[17,130,145,1],[17,131,145,1],[17,132,145,1],[19,133,143,1],[23,134,137,1],[24,135,132,1],[24,136,132,1],[24,137,131,1],[24,138,131,1],[24,139,131,1],[24,140,130,1],[24,141,129,1],[24,142,122,1],[24,143,122,1],[24,144,122,1],[24,145,122,1],[25,146,121,1],[26,147,116,1],[33,148,108,1],[33,149,108,1],[33,150,105,1],[34,151,104,1],[34,152,103,1],[34,153,102,1],[36,154,100,1],[37,155,99,1],[36,156,102,1],[35,157,103,1],[34,158,105,1],[33,159,107,1],[31,160,112,1],[31,161,113,1],[29,162,116,1],[29,163,116,1],[29,164,116,1],[29,165,116,1],[29,166,116,1],[29,167,116,1],[29,168,116,1],[29,169,116,1],[29,170,116,1],[29,171,116,1],[29,172,116,1],[29,173,116,1],[29,174,116,1],[29,175,116,1],[29,176,116,1],[29,177,116,1],[29,178,116,1],[29,179,116,1],[29,180,116,1],[29,181,116,1],[29,182,116,1],[29,183,116,1],[29,184,116,1],[29,185,116,1],[29,186,116,1],[29,187,116,1],[29,188,116,1],[29,189,116,1],[29,190,116,1],[29,191,116,1],[29,192,116,1],[30,193,114,1],[31,194,113,1],[32,195,110,1],[33,196,108,1],[33,197,108,1],[39,198,99,1],[39,199,98,1],[39,200,97,1],[39,201,96,1],[40,202,95,1],[41,203,93,1],[43,204,90,1]];ctx.save();const k=Math.min(44/178,44/205);ctx.translate((48-178*k)/2,(48-205*k)/2);ctx.scale(k,k);ctx.beginPath();for(const r of runs)ctx.rect(...r);ctx.clip();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,1163,436,178,205,0,0,178,205);ctx.restore();};paintGlove();UpdateContent.itemImage.addEventListener('load',paintGlove,{once:true});
  const updateInputMode = () => {
    ui.coarse = touchPointer.matches && hoverPointer.matches || /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
    const preference = game.settings.touchUI;
    ui.setTouchUI(preference == null ? ui.coarse : preference);
    if (!ui.touch) touch.releaseAll();
  };
  for (const query of [touchPointer, hoverPointer]) {
    query.addEventListener('change', updateInputMode);
  }

  const pads = new GamepadInput(input, () => game.isMenu() || game.state === 'intro');
  pads.lobbyInput=(slot,code)=>game.lobby&&game.state==='setup'?game.lobbyInput(slot,code):false;
  pads.inLobby=()=>!!game.lobby&&game.state==='setup';
  pads.menuOwner=()=>ui.overlayTitle.textContent.endsWith('J2')?1:0;
  pads.onJoin=(slot,pad)=>{const accepted=game.joinController(slot);if(accepted)game.floaters.push(new Floater('MANDO J'+(slot+1)+' LISTO',CANVAS_W/2,CANVAS_H-40,'#c3ff85',16,2000));return accepted;};
  window.gamepads=pads;
  pads.controllerOnly=()=>game.requiresControllers();
  pads.onAssignmentsChanged=()=>{if(game.state==='setup'&&['BATALLA','BATTLE'].includes(ui.overlayTitle.textContent))game.showBattleSetup();};
  pads.onConnect = (pad) => {
    game.floaters.push(new Floater('MANDO CONECTADO · PULSA START', CANVAS_W / 2, CANVAS_H - 40, '#aed581', 16, 2000));
  };

  // Browsers require a user gesture before audio can start; music waits for it.
  sfx.onReady = () => music.resume();
  input.onAny = () => sfx.ensure();
  document.addEventListener('pointerdown', () => sfx.ensure(), { passive: true });
  document.addEventListener('touchend', () => sfx.ensure(), { passive: true });

  // Sharper canvas on high-DPI screens: scale the backing store (max 2x).
  // Also keeps the CSS layout in sync with the current arena size.
  const app = document.getElementById('app');
  const lockLandscape=async()=>{if(!ui.touch)return;sfx.ensure();if(!document.fullscreenElement){try{if(app.requestFullscreen)await app.requestFullscreen();else document.body.classList.add('expanded-view');}catch{document.body.classList.add('expanded-view');}}try{if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{}requestAnimationFrame(fitCanvas);};
  document.getElementById('rotate-start').onclick=lockLandscape;
  document.addEventListener('fullscreenchange',()=>{if(ui.touch&&document.fullscreenElement&&screen.orientation?.lock)screen.orientation.lock('landscape').catch(()=>{});});

  function fitCanvas() {
    const viewHeight=window.visualViewport&&window.visualViewport.scale===1?Math.min(innerHeight,window.visualViewport.height):innerHeight;app.style.setProperty('--view-height',viewHeight+'px');
    if(ui.touch&&innerHeight>innerWidth&&game.state==='playing'&&!game.demo)game.pause();
    app.style.setProperty('--cols', COLS);
    app.style.setProperty('--rows', ROWS);
    app.style.setProperty('--board-w', `${CANVAS_W}px`);
    const expanded=!!document.fullscreenElement||document.body.classList.contains('expanded-view');
    const wideMenu = !ui.touch && innerWidth > 600 &&
      (document.body.classList.contains('title-screen') || document.body.classList.contains('character-select'));
    const viewport = RevengeShips.viewport(game);
    const renderWidth = viewport.width, renderHeight = viewport.height;
    const ratio = wideMenu ? 16 / 9 : renderWidth / renderHeight;
    stage.style.aspectRatio = String(ratio);
    if (!ui.touch || expanded || innerWidth>innerHeight) {
      const hud = document.getElementById('hud').getBoundingClientRect().height;
      const landscapeTouch=ui.touch&&innerWidth>innerHeight;
      const touchH = ui.touch&&!landscapeTouch ? document.getElementById('touch').getBoundingClientRect().height + 8 : 0;
      const padding = getComputedStyle(app);
      const vertical = parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom);
      const horizontal = parseFloat(padding.paddingLeft) + parseFloat(padding.paddingRight);
      const availableHeight = Math.max(120, viewHeight - hud - touchH - vertical - 12);
      const width = Math.floor(Math.min(1440, innerWidth - horizontal - (landscapeTouch ? 2*Math.min(150,Math.max(96,innerWidth*.16)) : 0), availableHeight * ratio));
      if (app.style.getPropertyValue('--arena-width') !== width + 'px') app.style.setProperty('--arena-width', width + 'px');
    } else app.style.removeProperty('--arena-width');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const k = Math.min(2, Math.max(1, Math.ceil((dpr * rect.width) / renderWidth)));
    if (canvas.width !== Math.round(renderWidth * k) || canvas.height !== Math.round(renderHeight * k)) {
      canvas.width = Math.round(renderWidth * k);
      canvas.height = Math.round(renderHeight * k);
      Renderer.setScale(k);
      Renderer.forceRebuild();
    }
  }
  let overlayFitPending=false;
  function scheduleOverlayFit(){if(overlayFitPending)return;overlayFitPending=true;requestAnimationFrame(()=>{overlayFitPending=false;fitOverlay();});}
  function fitOverlay(){
    const panel=ui.overlay;if(!panel.classList.contains('visible')||stage.clientWidth<=0||stage.clientHeight<=0)return;
    panel.style.setProperty('--overlay-scale','1');let factor=1;
    for(let i=0;i<4;i++){
      const naturalWidth=panel.scrollWidth*factor,naturalHeight=panel.scrollHeight*factor;
      const next=Math.min(1,stage.clientWidth/naturalWidth,stage.clientHeight/naturalHeight);
      if(next>=.998)break;factor*=next*.99;panel.style.setProperty('--overlay-scale',String(factor));
    }
  }
  new MutationObserver(scheduleOverlayFit).observe(ui.overlay,{childList:true,subtree:true,characterData:true});
  if(window.ResizeObserver)new ResizeObserver(scheduleOverlayFit).observe(stage);
  window.addEventListener('resize',scheduleOverlayFit);scheduleOverlayFit();
  game.onArenaResize = fitCanvas;
  fitCanvas();
  if (window.ResizeObserver) new ResizeObserver(fitCanvas).observe(stage);
  window.addEventListener('resize', fitCanvas);
  document.addEventListener('fullscreenchange',()=>requestAnimationFrame(fitCanvas));
  new MutationObserver(()=>requestAnimationFrame(fitCanvas)).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(window.ResizeObserver)new ResizeObserver(()=>requestAnimationFrame(fitCanvas)).observe(document.getElementById('hud'));
  window.addEventListener('orientationchange', fitCanvas);
  window.visualViewport?.addEventListener('resize',()=>{fitCanvas();scheduleOverlayFit();});
  document.addEventListener('touchstart',()=>sfx.ensure(),{passive:true});

  // Pause when the tab/app goes to the background.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (game.state === 'playing' || game.state === 'intro') game.pause();
      input.down.clear();
      music.stopTimer();
    } else {
      if (sfx.ctx && sfx.ctx.state !== 'running') sfx.ctx.resume().catch(() => {});
      music.resume();
    }
  });
  window.addEventListener('pagehide', () => {
    if (game.state === 'playing' || game.state === 'intro') game.pause();
  });

  // Offline support when served over HTTPS (or localhost).
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05; // avoid huge steps after a tab switch
    try {
      pads.poll();
      const steps=game.spectatorFast&&game.isSpectating()?4:1;
      for(let step=0;step<steps;step++){
        game.update(dt);
        if(step===0)input.endFrame();
        if(game.state!=='playing')break;
      }
      game.render();
      VictoryArt.update(now / 1000);
    } catch (err) {
      // Never let a single bad frame kill the loop.
      console.error(err);
    } finally {
      input.endFrame();
    }
  }
  requestAnimationFrame(frame);
})();
