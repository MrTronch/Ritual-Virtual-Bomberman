// ---------------------------------------------------------------------------
// Core game: menus, level setup, simulation, and rules.
// ---------------------------------------------------------------------------

class Game {
  constructor(canvas, input, sfx, music, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.sfx = sfx;
    this.music = music;
    this.ui = ui;

    this.settings = Save.load();
    if(this.settings.audioRecoveryVersion<16){this.settings.muted=false;this.settings.sfxVolume=Math.max(.8,this.settings.sfxVolume);this.settings.audioRecoveryVersion=16;Save.save(this.settings);}
    this.sfx.muted = !!this.settings.muted;
    this.sfx.volume = this.settings.sfxVolume;
    this.music.setVolume(this.settings.musicVolume);
    this.ui.setMuted(this.sfx.muted);
    this.ui.onActivate = () => this.sfx.menu();

    // title | setup | intro | playing | paused | levelclear | roundover | gameover
    this.state = 'title';
    this.mode = 1; // 1 = campaign, 2 = battle
    this.level = 1;
    this.difficulty = this.settings.difficulty || 'normal';
    this.diff = DIFFICULTY[this.difficulty];
    this.theme = 'grass';
    this.elapsed = 0;
    this.timeLeft = LEVEL_TIME;
    this.lastTickSecond = -1;
    this.freeze = 0;
    this.demo = false;
    this.demoRestart = 0;
    this.intro = null;
    this.results = null;
    this.resetArmed = false;

    this.players = [];
    this.enemies = [];
    this.bombs = [];
    this.explosions = [];
    this.powerups = [];
    this.breaking = [];
    this.falling = [];
    this.particles = [];
    this.floaters = [];
    this.exit = null;
    this.boss = null;
    this.shake = { t: 0, mag: 0 };
    this.spiral = null;
    this.spiralIndex = 0;
    this.spiralTimer = 0;
    this.suddenDeath = false;
    this.timedOut = false;
    this.danger = new Uint8Array(COLS * ROWS);

    this.onArenaResize = null;
    this.setArena(BASE_COLS, BASE_ROWS);
    this.grid = buildLevel('classic', 0.55).grid;
    Renderer.setTheme(this.theme);
    this.showTitle();
  }

  setArena(cols, rows) {
    if (cols !== COLS || rows !== ROWS || this.danger.length !== cols * rows) {
      setArenaSize(cols, rows);
      this.danger = new Uint8Array(COLS * ROWS);
    }
    if (this.onArenaResize) this.onArenaResize();
  }

  // Scale factor for timers and enemy counts relative to the classic 15x13 arena.
  areaScale() {
    return (COLS * ROWS) / (BASE_COLS * BASE_ROWS);
  }

  saveSettings() {
    Save.save(this.settings);
  }

  keyHint(keyboardText) {
    return this.ui.isTouch() ? 'Tap a button to choose' : keyboardText;
  }

  isMenu() {
    return this.state === 'title' || this.state === 'setup' || this.state === 'levelclear' || this.state === 'roundover' || this.state === 'gameover' || this.state === 'paused';
  }

  // ------------------------------------------------------------------
  // Menus
  // ------------------------------------------------------------------
  showTitle() {
    this.lobby=null;
    this.state = 'title';
    this.ui.buildHud([], 1);
    this.music.setDuck(1);
    this.music.play('title');
    if (!this.demo) this.startDemo();
    const hs = this.settings.highScores;
    this.ui.showOverlay({
      title: 'BOMBERMAN',
      text: 'Destruye bloques, derrota a los enemigos y encuentra la salida.\nPsicogato · Bunnylicious · Perrotech · Sazonix · Sr. Mr.',
      buttons: [
        { label: 'CAMPAÑA', action: () => this.showCharacterSelect(() => this.showCampaignSetup()) },
        { label: 'BATALLA', action: () => this.showCharacterSelect(() => this.showBattleSetup(), true) },
        { label: 'AJUSTES', action: () => this.showOptions() },
        { label: 'CÓMO JUGAR', action: () => this.showHelp() },
      ],
      help:
        `High scores  Easy ${hs.easy}  ·  Normal ${hs.normal}  ·  Hard ${hs.hard}\n` +
        `Battle matches won: ${this.settings.battleWins}\n` +
        this.keyHint('Press 1-4 to choose · Enter to confirm'),
    });
  }

  showCharacterSelect(next, battle = false, slot = 0) {
    this.state='setup';
    if(!this.lobby||this.lobby.next!==next){
      if(battle){const joined=window.gamepads?.joined||[];this.settings.battle.humans=Math.max(this.settings.battle.humans,...joined.map((p,i)=>p==null?1:i+1));}
      this.lobby={next,battle,active:slot,ready:Array(4).fill(false)};
    }
    const lobby=this.lobby,humans=battle?this.settings.battle.humans:1;
    const selected=new Set();for(let i=0;i<humans;i++){const key='p'+(i+1);if(!CHARACTERS.some(c=>c.id===this.settings.characters[key])||selected.has(this.settings.characters[key]))this.settings.characters[key]=CHARACTERS.find(c=>!selected.has(c.id)).id;selected.add(this.settings.characters[key]);}
    this.ui.showOverlay({title:'ELIGE TU PERSONAJE',text:battle?'2 JUGADORES: J1 MANDO · J2 TECLADO O MANDO · 3–4: TODOS CON MANDO':'',buttons:[
      ...CHARACTERS.map(c=>({label:c.name,character:c,action:()=>this.chooseLobbyCharacter(lobby.active,c.id)})),
      {label:'CONTINUAR',action:()=>{this.lobby=null;this.saveSettings();next();}},
      {label:'VOLVER',back:true,action:()=>{this.lobby=null;this.showTitle();}}
    ],help:'J2 con teclado: flechas/WASD · M bomba · N guante · cada mando se une con Start',focus:7});
    this.ui.overlayButtons.classList.add('character-grid');
    document.body.classList.toggle('campaign-select', !battle);
    const slots=document.createElement('div');slots.className='lobby-slots';
    for(let i=0;i<(battle?4:1);i++){
      const human=i<humans,c=human?CHARACTERS.find(c=>c.id===this.settings.characters['p'+(i+1)]):null;
      const panel=document.createElement('button');panel.className='lobby-slot '+(human?'human':'cpu');panel.style.setProperty('--slot-color',['#39df52','#cb45e5','#e7bd39','#04c9ee'][i]);
      panel.type='button';panel.innerHTML='<strong>'+ (human?'PLAYER '+(i+1):'CPU · UNIR J'+(i+1))+'</strong>';
      if(c){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=360;canvas.className='lobby-full-body';const paint=()=>SelectionArt.preview(canvas.getContext('2d'),c.id,320,360);if(!paint())RitualSprites.walkSheets[c.id].addEventListener('load',paint,{once:true});if(!RitualSprites.detailSheet.complete)RitualSprites.detailSheet.addEventListener('load',paint,{once:true});SelectionArt.ready.then(paint);panel.append(canvas);}
      else{const mark=document.createElement('span');mark.className='random-character';mark.textContent='?';panel.append(mark);}
      const name=document.createElement('span');name.className='selected-character-name';name.textContent=c?c.name:'';panel.append(name);if(c){const phrase=document.createElement('span');phrase.className='character-tagline';phrase.textContent=CHARACTER_TAGLINES[c.id];panel.append(phrase);}
      panel.classList.toggle('active',human&&i===lobby.active);panel.onclick=()=>{if(!human&&battle){this.settings.battle.humans=i+1;this.settings.battle.bots=Math.min(this.settings.battle.bots,3-i);}lobby.active=i;this.showCharacterSelect(next,battle,i);};slots.append(panel);
    }
    this.ui.overlayButtons.prepend(slots);
    CHARACTERS.forEach((c,i)=>{const owners=[0,1,2,3].filter(n=>n<humans&&this.settings.characters['p'+(n+1)]===c.id);const el=this.ui.buttons[i].el;el.dataset.players=owners.map(n=>'J'+(n+1)).join(' · ');el.classList.toggle('claimed',owners.length>0);});
  }
  chooseLobbyCharacter(slot,id){
    const l=this.lobby;if(!l||slot>=(l.battle?this.settings.battle.humans:1))return;
    const key='p'+(slot+1);
    if(l.battle&&Array.from({length:this.settings.battle.humans},(_,i)=>i).some(i=>i!==slot&&this.settings.characters['p'+(i+1)]===id))return;
    this.settings.characters[key]=id;l.active=slot;this.saveSettings();this.showCharacterSelect(l.next,l.battle,slot);
  }
  lobbyInput(slot,code){
    const l=this.lobby;if(!l)return false;
    if(code==='Backspace'){this.lobby=null;this.showTitle();return true;}
    if(code==='Enter'){if(slot===0)this.ui.activateButton(7);return true;}
    const step = !this.ui.isTouch() && window.innerWidth > 600 ? 1 : 3;
    const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-step,ArrowDown:step}[code];
    if(delta){const current=CHARACTERS.findIndex(c=>c.id===this.settings.characters['p'+(slot+1)]);for(let n=1;n<=7;n++){const c=CHARACTERS[(current+delta*n+70)%7];if(l.battle&&Array.from({length:this.settings.battle.humans},(_,i)=>i).some(i=>i!==slot&&this.settings.characters['p'+(i+1)]===c.id))continue;this.chooseLobbyCharacter(slot,c.id);break;}}
    return true;
  }

  requiresControllers(){return !this.demo&&this.mode===2&&this.settings.battle.humans>1;}
  requiredControllers(){return this.settings.battle.humans===2?1:this.settings.battle.humans;}
  controllersReady(){return this.settings.battle.humans===1||!!window.gamepads?.ready(this.requiredControllers());}
  controllerMessage(){return this.settings.battle.humans===2?'J1: mando (pulsa Start). J2: flechas/WASD, M bomba y N guante. También puedes conectar un segundo mando.':'Conecta '+this.requiredControllers()+' mandos y pulsa Start en cada uno.';}
  playerKeys(index){if(!this.requiresControllers())return PLAYER_CONFIGS[index].keys;if(this.settings.battle.humans===2&&index===1)return Object.fromEntries(Object.entries(CONTROLLER_KEYS[1]).map(([action,codes])=>[action,[...codes,...PLAYER_CONFIGS[0].keys[action]]]));return CONTROLLER_KEYS[index];}

  playerConfig(index,used=new Set()) {
    const roster=CHARACTERS.filter(c=>c.enabled);
    const preferred=index<(this.mode===2?this.settings.battle.humans:1)?this.settings.characters['p'+(index+1)]:null;
    const c=roster.find(c=>c.id===preferred&&!used.has(c.id))||(()=>{const available=roster.filter(c=>!used.has(c.id));return available[Math.floor(Math.random()*available.length)];})();
    used.add(c.id);
    return {...PLAYER_CONFIGS[index],keys:this.playerKeys(index),character:c.id,name:c.name,color:c.color};
  }

  isSpectating(){
    const humans=this.players.filter(p=>!p.isBot);
    return this.mode===2&&!this.demo&&this.state==='playing'&&humans.length>0&&humans.every(p=>!p.alive&&!p.dying)&&this.players.filter(p=>p.alive).length>1;
  }
  toggleSpectatorSpeed(){if(!this.isSpectating())return false;this.spectatorFast=!this.spectatorFast;this.ui.updateHud(this);return true;}

  joinController(slot){
    if(slot<0||slot>3)return false;
    if(slot===0)return true;
    if(!this.demo&&this.mode===1&&['playing','intro','paused'].includes(this.state))return false;
    const live=!this.demo&&this.mode===2&&['playing','intro','paused'].includes(this.state);
    if(live&&!this.players[slot])return false;
    this.settings.battle.humans=Math.max(slot+1,this.settings.battle.humans);
    this.settings.battle.bots=Math.min(4-this.settings.battle.humans,this.settings.battle.bots);this.saveSettings();
    if(live){for(let i=0;i<=slot;i++){const p=this.players[i];if(p){p.bot=null;p.keys=this.playerKeys(i);p.name=CHARACTERS.find(c=>c.id===p.character).name;}}this.ui.buildHud(this.players,2);this.ui.updateHud(this);}
    else if(this.lobby?.battle)this.showCharacterSelect(this.lobby.next,true,slot);
    else if(this.ui.overlayTitle.textContent==='MAPAS DE BATALLA')this.showBattleMaps();else if(['BATTLE','BATALLA'].includes(this.ui.overlayTitle.textContent))this.showBattleSetup();
    return true;
  }

  showCampaignSetup() {
    this.state = 'setup';
    const current = this.settings.difficulty;
    const buttons = DIFFICULTY_ORDER.map((key) => ({
      label: `${({easy:'FÁCIL',normal:'NORMAL',hard:'DIFÍCIL'})[key]}${key === current ? '  ✓' : ''}`,
      action: () => {
        this.settings.difficulty = key;
        this.saveSettings();
        if ((this.settings.progress[key] || 1) > 1) this.showWorldSelect(key);
        else this.startCampaign(key, 0);
      },
    }));
    buttons.push({label:`COMBATE: ${this.settings.campaignCombat==='deathmatch'?'DEATHMATCH':'BOMBAS'}`,cycle:true,action:()=>{this.settings.campaignCombat=this.settings.campaignCombat==='deathmatch'?'classic':'deathmatch';this.saveSettings();this.showCampaignSetup();this.ui.focusButton(3);}});
    buttons.push({ label: 'VOLVER', action: () => this.showTitle(), back: true });
    this.ui.showOverlay({
      title: 'CAMPAÑA',
      text:
        'Fácil: 5 vidas · Normal: 3 vidas · Difícil: 2 vidas.\nCinco mundos con jefes y progreso guardado.\n'+(this.settings.campaignCombat==='deathmatch'?'Deathmatch: 10 PV, disparos con M; mantener 1,5 s carga daño 4.':'Bombas: campaña clásica.'),
      buttons,
      help: this.keyHint('↑ ↓ Elegir · ← → Cambiar combate · A / X Confirmar · B / ○ Volver'),
      focus: DIFFICULTY_ORDER.indexOf(current),
    });
    this.ui.overlayButtons.classList.add('campaign-options');
  }

  showWorldSelect(difficulty) {
    this.state = 'setup';
    const unlocked = Math.min(WORLD_ORDER.length, this.settings.progress[difficulty] || 1);
    const buttons = [];
    for (let w = 0; w < unlocked; w++) {
      const theme = THEMES[WORLD_ORDER[w]];
      buttons.push({ label: `WORLD ${w + 1} · ${theme.name.toUpperCase()}`, action: () => this.startCampaign(difficulty, w) });
    }
    buttons.push({ label: 'BACK', action: () => this.showCampaignSetup(), back: true });
    const best = this.settings.bestLevel[difficulty] || 0;
    this.ui.showOverlay({
      title: 'SELECT WORLD',
      text: `${DIFFICULTY[difficulty].label} · ${unlocked} of ${WORLD_ORDER.length} worlds unlocked\nBest stage reached: ${best ? `${Math.floor((best - 1) / LEVELS_PER_WORLD) + 1}-${((best - 1) % LEVELS_PER_WORLD) + 1}` : '-'}`,
      buttons,
      help: this.keyHint(`Press 1-${unlocked} to choose · Esc to go back`),
      focus: unlocked - 1,
    });
    this.ui.overlayButtons.classList.add('campaign-worlds');
    for(let world=0;world<unlocked;world++){
      const button=this.ui.buttons[world].el,canvas=document.createElement('canvas');canvas.width=320;canvas.height=144;canvas.setAttribute('aria-label','Vista previa del mundo '+(world+1));button.prepend(canvas);button.classList.add('campaign-world-card');
      const paint=()=>paintCampaignPreview(canvas.getContext('2d'),world,320,144);paint();Promise.all([ArenaArt.ritual.decode().catch(()=>{}),ArenaArt.jurassic.decode().catch(()=>{})]).then(paint);
    }
  }

  showBattleSetup() {
    this.state = 'setup';
    const b = this.settings.battle;
    const maxBots = 4 - b.humans;
    const minBots = Math.max(0, 2 - b.humans);
    b.bots = Math.min(Math.max(b.bots, minBots), maxBots);

    // Re-render after cycling an option, keeping keyboard focus where it was
    // so Enter still starts the match unless the user navigated with arrows.
    const rerender = () => {
      const focus = this.ui.focusIndex;
      this.saveSettings();
      this.showBattleSetup();
      this.ui.focusButton(focus);
    };

    this.ui.showOverlay({
      title: 'BATTLE',
      text: `${b.humans} human${b.humans > 1 ? 's' : ''} vs ${b.bots} bot${b.bots === 1 ? '' : 's'}  ·  first to ${ROUNDS_TO_WIN} rounds\nTodos empiezan con una bomba y alcance uno; recoge ítems para mejorarlos. The arena closes in when time runs low.`,
      buttons: [
        { label: 'START', action: () => this.startBattle() },
        {
          cycle: true,
          label: `HUMANS: ${b.humans}`,
          action: () => {
            b.humans = b.humans === 1 ? 2 : 1;
            rerender();
          },
        },
        {
          cycle: true,
          label: `BOTS: ${b.bots}`,
          action: () => {
            b.bots = b.bots + 1 > maxBots ? minBots : b.bots + 1;
            rerender();
          },
        },
        {
          cycle: true,
          label: `BOT SKILL: ${BOT_TIERS[b.skill].label.toUpperCase()}`,
          action: () => {
            const i = DIFFICULTY_ORDER.indexOf(b.skill);
            b.skill = DIFFICULTY_ORDER[(i + 1) % DIFFICULTY_ORDER.length];
            rerender();
          },
        },
        {
          cycle: true,
          label: `MAP: ${MAP_SIZES[b.map || 'small'].label.toUpperCase()}`,
          action: () => {
            const i = MAP_SIZE_ORDER.indexOf(b.map || 'small');
            b.map = MAP_SIZE_ORDER[(i + 1) % MAP_SIZE_ORDER.length];
            rerender();
          },
        },
        { label: 'BACK', action: () => this.showTitle(), back: true },
      ],
      help: this.keyHint('Press 1-6 to choose · Enter to start · Esc to go back\nJ2: I J K L y Enter · Segundo mando: pulsa Start'),
    });
  }

  showOptions(returnTo = 'title') {
    // Reachable from the title and from the pause menu; state stays a menu
    // state either way so the game underneath does not advance.
    this.state = returnTo === 'pause' ? 'paused' : 'setup';
    const s = this.settings;
    const pct = (v) => `${Math.round(v * 100)}%`;
    const cycleVolume = (v) => (v >= 1 ? 0 : Math.min(1, v + 0.25));
    const goBack = () => {
      this.resetArmed = false;
      if (returnTo === 'pause') this.showPauseMenu();
      else this.showTitle();
    };
    const rerender = () => {
      const focus = this.ui.focusIndex;
      this.saveSettings();
      this.showOptions(returnTo);
      this.ui.focusButton(focus);
    };
    const touchLabel = s.touchUI === null || s.touchUI === undefined ? 'AUTO' : s.touchUI ? 'ON' : 'OFF';

    this.ui.showOverlay({
      title: 'AJUSTES',
      text: 'Settings are saved in this browser.',
      buttons: [
        {
          cycle: true,
          disabled: true,
          label: 'MÚSICA · PRÓXIMAMENTE',
          action: () => {
            s.musicVolume = cycleVolume(s.musicVolume);
            this.music.setVolume(s.musicVolume);
            rerender();
          },
        },
        {
          cycle: true,
          label: `SOUND: ${pct(s.sfxVolume)}`,
          action: () => {
            s.sfxVolume = cycleVolume(s.sfxVolume);
            this.sfx.volume = s.sfxVolume;
            rerender();
          },
        },
        {
          cycle: true,
          label: `SCREEN SHAKE: ${s.shake ? 'ON' : 'OFF'}`,
          action: () => {
            s.shake = !s.shake;
            rerender();
          },
        },
        {
          cycle: true,
          label: `TOUCH CONTROLS: ${touchLabel}`,
          action: () => {
            s.touchUI = s.touchUI === null || s.touchUI === undefined ? true : s.touchUI ? false : null;
            this.ui.setTouchUI(s.touchUI === null ? this.ui.coarse : s.touchUI);
            rerender();
          },
        },
        { label: 'CONTROLS', action: () => this.showControls(returnTo) },
        {
          label: this.resetArmed ? 'CONFIRM RESET?' : 'RESET PROGRESS',
          action: () => {
            if (!this.resetArmed) {
              this.resetArmed = true;
            } else {
              this.resetArmed = false;
              s.highScores = { easy: 0, normal: 0, hard: 0 };
              s.bestLevel = { easy: 0, normal: 0, hard: 0 };
              s.progress = { easy: 1, normal: 1, hard: 1 };
              s.battleWins = 0;
            }
            rerender();
          },
        },
        { label: 'BACK', action: goBack, back: true },
      ],
      help: this.keyHint('Press 1-7 to choose · Esc to go back · N mutes everything'),
    });
  }

  showControls(returnTo = 'title') {
    this.state = returnTo === 'pause' ? 'paused' : 'setup';
    this.ui.showOverlay({
      title: 'CONTROLS',
      text:
        'Player 1:  W A S D or arrow keys move  ·  M coloca bomba · N recoge/lanza con guante · Espacio pausa\n' +
        'Player 2:  I J K L move  ·  Enter coloca bomba · O recoge/lanza con guante\n' +
        'Mandos: Start une J1 / J2 · Cruceta o stick mueve · X pone bomba · B usa guante · Start pausa\n\n' +
        'Espacio, P o Esc pausa  ·  V silencia los efectos  ·  R returns to the menu\n' +
        'Menus: number keys pick a button, arrows move, Enter confirms, Esc goes back\n' +
        (this.ui.isTouch() ? '\nTouch: D-pad moves, the big button drops a bomb, los botones pequeños pausan y usan el guante.' : ''),
      buttons: [{ label: 'BACK', action: () => this.showOptions(returnTo), back: true }],
      help: this.keyHint('Esc or Enter to go back'),
    });
  }

  showHelp() {
    this.state = 'setup';
    const touch = this.ui.isTouch();
    const text = touch
      ? 'Move with the D-pad, drop bombs with the big button.\n' +
        'Campaign: clear the enemies, then find the exit under a brick. Every fifth stage is a boss.\n' +
        'Battle: last one standing wins the round.\nJ2 con teclado: flechas/WASD, M bomba, N guante. El táctil es para una persona.\n\n' +
        '💣 extra bomb   🔥 bigger flames   ⚡ speed   👟 kick bombs\n' +
        '' +
        '👻 walk through bricks   ❤ protección de un golpe   💀 random curse'
      : 'Move with W A S D or the arrow keys, coloca bombas con M; Espacio pausa.\n' +
        '2 jugadores: J1 mando, J2 teclado o mando. Con 3–4: todos con mando. X: bomba/disparo; cuadrado: guante.\n' +
        'Bombs explode in a cross and destroy bricks, enemies and players.\n' +
        'Campaign: defeat every enemy, then find the exit hidden under a brick.\n' +
        'Every fifth stage is a boss: hit it with flames until its health bar is empty.\n' +
        'Battle: last one standing wins the round.\nJ2 con teclado: flechas/WASD, M bomba, N guante. El táctil es para una persona.\n\n' +
        'Power-ups:  💣 extra bomb   🔥 bigger flames   ⚡ speed\n' +
        '👟 kick bombs   \n' +
        '👻 walk through bricks   ❤ protección de un golpe   💀 a random curse for 15 s';
    this.ui.showOverlay({
      title: 'CÓMO JUGAR',
      text,
      buttons: [{ label: 'BACK', action: () => this.showTitle(), back: true }],
      help: this.keyHint('Esc or Enter to go back'),
    });
  }

  // ------------------------------------------------------------------
  // Game setup
  // ------------------------------------------------------------------
  startCampaign(difficulty, worldIdx = 0) {
    this.lobby=null;
    this.stopDemo();
    this.mode = 1;
    this.difficulty = difficulty;
    this.diff = DIFFICULTY[difficulty];
    this.level = worldIdx * LEVELS_PER_WORLD + 1;
    const p = new Player(this.playerConfig(0), spawnCorners()[0]);
    p.lives = this.diff.lives;
    this.players = [p];
    this.startLevel();
  }

  startBattle() {
    if(!this.controllersReady()){this.showBattleSetup();this.ui.overlayText.textContent=this.controllerMessage();return false;}
    this.lobby=null;
    this.stopDemo();
    this.mode = 2;
    this.level = 1;
    const setup = this.settings.battle;
    this.teamWins = [0, 0];
    if (setup.formation === 'teams') setup.bots = 4 - setup.humans;
    const total = Math.min(4, Math.max(2, setup.humans + setup.bots));
    const corners = spawnCorners();
    const usedCharacters=new Set();
    this.players = [];
    for (let i = 0; i < total; i++) {
      const p = new Player(this.playerConfig(i,usedCharacters), corners[i]);
      if (i >= setup.humans) {
        p.bot = new Bot(p, setup.skill);
        p.name = `CPU${i - setup.humans + 1}`;
      }
      p.team = setup.formation === 'teams' ? setup.teams[i] : null;
      this.players.push(p);
    }
    this.startLevel();
  }

  // Attract mode: four hard bots fight behind the title menu.
  startDemo() {
    this.demo = true;
    this.demoRestart = 0;
    this.mode = 2;
    this.level = 1 + Math.floor(Math.random() * WORLD_ORDER.length);
    const usedCharacters=new Set();
    this.players = PLAYER_CONFIGS.map((cfg, i) => {
      const p = new Player(this.playerConfig(i,usedCharacters), spawnCorners()[i]);
      p.bot = new Bot(p, 'hard');
      p.name = `CPU${i + 1}`;
      return p;
    });
    this.sfx.suppressed = true;
    this.setupLevel();
  }

  stopDemo() {
    this.demo = false;
    this.sfx.suppressed = false;
  }

  campaignStage() {
    const idx = this.level - 1;
    const worldIdx = Math.floor(idx / LEVELS_PER_WORLD);
    return {
      world: worldIdx,
      stage: idx % LEVELS_PER_WORLD,
      loop: Math.floor(worldIdx / WORLD_ORDER.length),
      theme: WORLD_ORDER[worldIdx % WORLD_ORDER.length],
      boss: idx % LEVELS_PER_WORLD === LEVELS_PER_WORLD - 1,
    };
  }

  isBossLevel() {
    return this.mode === 1 && this.campaignStage().boss;
  }

  // Build the arena, spawn everything, reset timers. Does not touch UI state.
  setupLevel() {
    const battle = this.mode === 2;
    let templateName;
    let density;
    let boss = false;

    if (battle) {
      const size = this.demo ? MAP_SIZES.small : MAP_SIZES.battleWide;
      this.setArena(size.cols, size.rows);
      this.theme = WORLD_ORDER[(this.level - 1) % WORLD_ORDER.length];
      templateName = randomItem(TEMPLATE_NAMES);
      density = 0.6;
      this.levelLabel = `ROUND ${this.level}`;
    } else {
      const s = this.campaignStage();
      const size = MAP_SIZES[WORLD_SIZES[s.world % WORLD_SIZES.length]] || MAP_SIZES.small;
      this.setArena(size.cols, size.rows);
      boss = s.boss;
      this.theme = s.theme;
      templateName = s.boss ? 'arena' : WORLD_TEMPLATES[s.theme][s.stage];
      density = s.boss
        ? Math.min(0.5, Math.max(0.2, 0.32 + this.diff.densityMod))
        : Math.min(0.75, Math.max(0.3, 0.45 + s.stage * 0.05 + s.loop * 0.05 + this.diff.densityMod));
      this.levelLabel = `${THEMES[s.theme].name.toUpperCase()}  ${s.world + 1}-${s.stage + 1}`;
      if (s.boss) this.levelLabel += '  ·  BOSS';
    }
    Renderer.setTheme(this.theme);

    const built = buildLevel(templateName, density, {
      symmetric: battle,
      plaza: boss,
      blocks: this.areaScale() > 1 ? Math.round(3 * this.areaScale()) : 0,
    });
    this.grid = built.grid;
    const spawns = [];
    this.players.forEach((p, i) => {
      p.spawn = built.spawns[i] || spawnCorners()[i];
      spawns.push(p.spawn);
      p.resetForLevel(battle ? BATTLE_SHIELD : SPAWN_SHIELD);
      p.levelKills = 0;
      if (battle) {
        p.resetPowers();
        p.bombDropBase=this.settings.battle.extreme&&!this.demo?3:1;
        p.maxBombs = p.bombDropBase;
        p.range = 1;
      }
    });

    this.bombs = [];
    this.explosions = [];
    this.powerups = [];
    this.breaking = [];
    this.falling = [];
    this.particles = [];
    this.floaters = [];
    this.enemies = [];
    this.exit = null;
    this.boss = null;
    this.timedOut = false;
    this.suddenDeath = false;
    this.spiral = null;
    this.spiralIndex = 0;
    this.spiralTimer = 0;
    this.shake = { t: 0, mag: 0 };
    this.freeze = 0;
    this.exitAnnounced = false;

    // Enemies
    const roster = battle ? this.battleRoster() : this.campaignRoster();
    const bossHome = { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
    const rosterSpawns = !battle && this.isBossLevel() ? [...spawns, bossHome] : spawns;
    for (const type of roster) this.spawnEnemy(type, rosterSpawns, battle ? 1 : this.diff.speedMult);

    if (!battle && this.isBossLevel()) {
      const s = this.campaignStage();
      const cx = Math.floor(COLS / 2);
      const cy = Math.floor(ROWS / 2);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (this.grid[cy + dy][cx + dx] === TILE_BRICK) this.grid[cy + dy][cx + dx] = TILE_EMPTY;
      }
      this.boss = new Boss(s.theme, cx, cy, s.world + 1, this.diff.speedMult);
      this.enemies.push(this.boss);
    } else if (!battle) {
      // Hidden exit under a brick
      const bricks = tilesOfType(this.grid, TILE_BRICK);
      const far = bricks.filter((t) => manhattan(t, spawns[0]) >= 6);
      const spot = randomItem(far.length ? far : bricks);
      if (spot) this.exit = { tx: spot.x, ty: spot.y, revealed: false };
    }

    // Bigger arenas get proportionally more time.
    const timeScale = Math.sqrt(this.areaScale());
    this.timeLeft = battle ? (this.settings.battle.duration || BATTLE_TIME) : Math.round(this.diff.levelTime * timeScale);
    this.levelTime = this.timeLeft;
    this.lastTickSecond = -1;
  }

  startLevel() {
    this.spectatorFast=false;
    this.setupLevel();
    this.state = 'intro';
    this.intro = { t: 0, ready: false, go: false };
    this.ui.hideOverlay();
    this.ui.buildHud(this.players, this.mode);
    this.ui.updateHud(this);
    this.updateMusic();
    if (this.boss) this.sfx.bossRoar();
  }

  spawnEnemy(type, spawns, speedMult) {
    const cfg = ENEMY_TYPES[type];
    const safeStart=protectedTiles(spawns);
    const usable = (t) => !(this.portalZone?.(t.x,t.y)) && !safeStart.has(tileKey(t.x,t.y)) && (this.grid[t.y][t.x] === TILE_EMPTY || (cfg.passBricks && this.grid[t.y][t.x] === TILE_BRICK));
    const all = [...tilesOfType(this.grid, TILE_EMPTY), ...(cfg.passBricks ? tilesOfType(this.grid, TILE_BRICK) : [])].filter(usable);
    const taken = (t) => this.enemies.some((e) => e.tx === t.x && e.ty === t.y);
    let candidates = all.filter((t) => !taken(t) && spawns.every((s) => manhattan(t, s) >= 6));
    if (!candidates.length) candidates = all.filter((t) => !taken(t) && spawns.every((s) => manhattan(t, s) >= 4));
    if (!candidates.length) candidates = all.filter((t) => spawns.every((s) => manhattan(t, s) >= 3));
    if (!candidates.length) return null;
    // Spread the initial population across the arena while preserving spawn safety.
    if(this.enemies.length){
      const spacing=t=>Math.min(...this.enemies.map(e=>manhattan(t,{x:e.tx,y:e.ty})));
      const best=Math.max(...candidates.map(spacing));
      candidates=candidates.filter(t=>spacing(t)>=Math.min(5,best));
    }
    const spot = randomItem(candidates);
    const e = new Enemy(type, spot.x, spot.y, speedMult);
    this.enemies.push(e);
    return e;
  }

  pacingPool() {
    const pacing = PACING[this.difficulty];
    let entry = pacing[0];
    for (const e of pacing) if (e.from <= this.level) entry = e;
    return entry;
  }

  campaignRoster() {
    const loop = Math.floor((this.level - 1) / (LEVELS_PER_WORLD * WORLD_ORDER.length));
    const boss = this.isBossLevel();
    const scaled = Math.ceil(this.diff.enemyCount(this.level) * this.areaScale() * 1.35);
    const count = boss ? 4 : Math.min(24, Math.max(Math.ceil(this.areaScale() * 8), scaled + loop * 2));
    const entry = this.pacingPool();
    // Boss stages keep the fast wall-passing Pontans out so the boss is the threat.
    const pool = boss ? entry.pool.filter((t) => t !== 'pontan') : entry.pool;
    if (!pool.length) pool.push('balloom');
    const smartPool = pool.filter((t) => ENEMY_TYPES[t].smart);
    const list = [];
    for (let i = 0; i < count; i++) {
      let type = randomItem(pool);
      if (!ENEMY_TYPES[type].smart && smartPool.length && Math.random() < this.diff.smartChance) {
        type = randomItem(smartPool);
      }
      list.push(type);
    }
    if (!boss && entry.from === this.level && list.length) list[0] = pool[pool.length - 1];
    return list;
  }

  battleRoster() {
    return []; // Battle contains only human and CPU contestants.
  }

  // ------------------------------------------------------------------
  // State transitions
  // ------------------------------------------------------------------
  pause() {
    if (this.state !== 'playing' && this.state !== 'intro') return;
    this.pausedFrom = this.state;
    this.music.setDuck(0.3);
    this.showPauseMenu();
  }

  showPauseMenu() {
    for(const p of this.players){p.shotCharging=false;p.shotCharge=0;}
    this.state = 'paused';
    this.ui.showOverlay({
      title: 'PAUSA',
      text: '',
      buttons: [
        { label: 'CONTINUAR', action: () => this.resume() },
        { label: 'AJUSTES', action: () => this.showOptions('pause') },
        { label: 'MENÚ PRINCIPAL', action: () => this.showTitle(), back: true },
      ],
      help: this.keyHint('Espacio para continuar'),
    });
  }

  resume() {
    if (this.state !== 'paused') return;
    if(this.requiresControllers()&&!this.controllersReady()){this.ui.overlayText.textContent=this.controllerMessage();return;}
    this.state = this.pausedFrom === 'intro' && this.intro ? 'intro' : 'playing';
    this.music.setDuck(1);
    this.ui.hideOverlay();
  }

  recordCampaign() {
    const p = this.players[0];
    const hs = this.settings.highScores;
    let newBest = false;
    if (p.score > (hs[this.difficulty] || 0)) {
      hs[this.difficulty] = p.score;
      newBest = true;
    }
    const bl = this.settings.bestLevel;
    if (this.level > (bl[this.difficulty] || 0)) bl[this.difficulty] = this.level;
    this.saveSettings();
    return newBest;
  }

  levelClear() {
    this.state = 'levelclear';
    this.music.stop();
    const p = this.players[0];
    const mult = this.diff.scoreMult;
    const timeFrac = this.timeLeft / (this.levelTime || this.diff.levelTime);
    const stars = timeFrac >= 0.5 ? 3 : timeFrac >= 0.25 ? 2 : 1;
    const items = [
      { label: this.boss ? 'Boss defeated' : 'Stage clear', value: Math.round((this.boss ? 1500 : 500) * mult) },
      { label: 'Time bonus', value: Math.round(Math.floor(this.timeLeft) * 5 * mult) },
      { label: `Enemies defeated x${p.levelKills}`, value: Math.round(p.levelKills * 50 * mult) },
    ];
    const total = items.reduce((a, b) => a + b.value, 0);
    p.score += total;

    // Unlock the next world after a boss.
    let unlockedText = '';
    if (this.campaignStage().boss) {
      const nextWorld = Math.floor(this.level / LEVELS_PER_WORLD) + 1; // 1-based
      if (nextWorld <= WORLD_ORDER.length && (this.settings.progress[this.difficulty] || 1) < nextWorld) {
        this.settings.progress[this.difficulty] = nextWorld;
        unlockedText = `\n★ World ${nextWorld} unlocked: ${THEMES[WORLD_ORDER[nextWorld - 1]].name}`;
      }
    }
    const newBest = this.recordCampaign();
    if (this.boss) this.sfx.victory();
    else this.sfx.levelClear();
    this.ui.updateHud(this);

    const next = this.level + 1;
    const nextIdx = next - 1;
    const nextWorldIdx = Math.floor(nextIdx / LEVELS_PER_WORLD);
    const nextTheme = WORLD_ORDER[nextWorldIdx % WORLD_ORDER.length];
    this.results = {
      t: 0,
      items,
      total,
      stars,
      done: false,
      footer:
        `\nScore: ${p.score}` +
        (newBest ? '\n★ New high score!' : '') +
        unlockedText +
        `\n\nNext: ${THEMES[nextTheme].name} ${nextWorldIdx + 1}-${(nextIdx % LEVELS_PER_WORLD) + 1}`,
    };
    this.ui.showOverlay({
      title: this.boss ? 'JEFE DERROTADO' : 'NIVEL COMPLETADO',
      text: '',
      buttons: [
        {
          label: 'SIGUIENTE NIVEL',
          action: () => {
            this.level += 1;
            this.startLevel();
          },
        },
        { label: 'MENÚ PRINCIPAL', action: () => this.showTitle(), back: true },
      ],
      help: this.keyHint('Press Enter or Space to continue'),
    });
    this.renderResults();
  }

  // Animated score tally on the stage-clear screen.
  updateResults(dt) {
    const r = this.results;
    if (!r || r.done) return;
    r.t += dt * 1000;
    const totalTime = r.items.length * 450 + 400;
    if (r.t >= totalTime) r.done = true;
    else if (Math.floor(r.t / 60) !== Math.floor((r.t - dt * 1000) / 60)) this.sfx.tally();
    this.renderResults();
  }

  finishResults() {
    if (this.results) {
      this.results.done = true;
      this.renderResults();
    }
  }

  renderResults() {
    const r = this.results;
    if (!r) return;
    const lines = [];
    r.items.forEach((item, i) => {
      const start = i * 450;
      if (!r.done && r.t < start) return;
      const f = r.done ? 1 : Math.min(1, (r.t - start) / 400);
      lines.push(`${item.label}  ·  +${Math.round(item.value * f)}`);
    });
    if (r.done) {
      lines.push('', '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars), r.footer.trim());
    }
    this.ui.setOverlayText(lines.join('\n'));
  }

  gameOver() {
    this.state = 'gameover';
    this.music.stop();
    this.sfx.gameOverJingle();
    const p = this.players[0];
    const newBest = this.recordCampaign();
    const s = this.campaignStage();
    this.ui.showOverlay({
      title: 'GAME OVER',
      text: `Final score: ${p.score}\nReached ${THEMES[s.theme].name} ${s.world + 1}-${s.stage + 1} (${DIFFICULTY[this.difficulty].label})` + (newBest ? '\n★ New high score!' : ''),
      buttons: [
        { label: 'CONTINUAR NIVEL '+(s.world+1)+'-'+(s.stage+1), action: () => { p.resetPowers();p.held=null;p.portalTransit=null;p.lives=this.diff.lives;p.bombsActive=0;this.startLevel(); } },
        { label: 'MENÚ PRINCIPAL', action: () => this.showTitle(), back: true },
      ],
      help: this.keyHint('Press Enter or Space to retry'),
    });
  }

  roundOver(winner) {
    this.state = 'roundover';
    this.music.stop();
    if (winner) winner.wins += 1;
    this.ui.updateHud(this);

    const standings = this.players.map((p) => `${p.name}: ${p.wins}`).join('   ');
    if (winner && winner.wins >= ROUNDS_TO_WIN) {
      if (!winner.isBot) {
        this.settings.battleWins += 1;
        this.saveSettings();
      }
      this.sfx.victory();
      this.ui.showOverlay({
        title: `${winner.name} WINS THE MATCH!`,
        text: `First to ${ROUNDS_TO_WIN} rounds\n${standings}`,
        buttons: [
          { label: 'REMATCH', action: () => this.startBattle() },
          { label: 'MENÚ PRINCIPAL', action: () => this.showTitle(), back: true },
        ],
        help: this.keyHint('Press Enter or Space for a rematch'),
      });
      return;
    }

    this.sfx.levelClear();
    this.ui.showOverlay({
      title: winner ? `${winner.name} WINS THE ROUND` : 'DRAW',
      text: standings,
      buttons: [
        {
          label: 'NEXT ROUND',
          action: () => {
            this.level += 1;
            this.startLevel();
          },
        },
        { label: 'MENÚ PRINCIPAL', action: () => this.showTitle(), back: true },
      ],
      help: this.keyHint('Press Enter or Space to continue'),
    });
  }

  updateMusic() {
    if (this.demo || this.isMenu()) return;
    const hurry = (this.mode === 1 && !this.timedOut && this.timeLeft > 0 && this.timeLeft < 30) || this.suddenDeath;
    if (hurry) this.music.play('hurry');
    else if (this.boss) this.music.play('boss');
    else this.music.play(this.theme);
  }

  // ------------------------------------------------------------------
  // Main update
  // ------------------------------------------------------------------
  update(dt) {
    if(this.requiresControllers()&&['playing','intro'].includes(this.state)&&!this.controllersReady()){this.pause();this.ui.overlayText.textContent=this.controllerMessage();return;}
    this.elapsed += dt;
    if (this.handleGlobalKeys()) return;

    if (this.state === 'levelclear') this.updateResults(dt);
    if (this.state === 'levelclear' || this.state === 'roundover' || this.state === 'gameover' || this.state === 'paused') {
      this.updateEffects(dt);
    }
    if (this.state === 'intro') {
      this.updateIntro(dt);
      this.updateEffects(dt);
      return;
    }

    const simulating = this.state === 'playing' || (this.demo && (this.state === 'title' || this.state === 'setup'));
    if (!simulating) return;

    if (this.freeze > 0) {
      this.freeze -= dt * 1000;
      dt *= 0.15;
    }

    this.updateTimer(dt);
    this.updateArenaHazards?.(dt);
    this.buildDangerMap();

    for (const p of this.players) {
      if (p.alive && !p.carriedBy && !p.gloveFlight) {
        if(p.gloveStun>0){p.gloveStun=Math.max(0,p.gloveStun-dt);continue;}
        if (p.bot) p.bot.think(dt, this);
        p.update(dt, this, p.bot ? p.bot.input : this.input);
      } else if (p.dying) {
        this.updateDeadPlayer(p, dt);
      }
    }

    this.updateRevengeShips(dt);
    this.updateBombs(dt);

    for (const ex of this.explosions) {
      ex.age += dt * 1000;
      ex.timer -= dt * 1000;
    }
    this.explosions = this.explosions.filter((ex) => ex.timer > 0);
    for (const br of this.breaking) br.timer -= dt * 1000;
    this.breaking = this.breaking.filter((br) => br.timer > 0);
    for (const fb of this.falling) fb.timer -= dt * 1000;
    this.falling = this.falling.filter((fb) => fb.timer > 0);

    for (const e of this.enemies) {
      if (e.alive&&!e.carriedBy&&!e.gloveFlight) e.update(dt, this);
      else if (e.dying) {
        e.deathTimer -= dt * 1000;
        if (e.deathTimer <= 0) e.dying = false;
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive || e.dying);
    if (this.boss && this.boss.alive&&!this.boss.carriedBy&&!this.boss.gloveFlight) this.updateBoss(dt);

    for (const pu of this.powerups) pu.age += dt;
    this.updateEffects(dt);

    this.resolveCollisions();
    this.checkEndConditions();
    if (!this.demo) {
      this.updateMusic();
      this.ui.updateHud(this);
    }
  }

  updateIntro(dt) {
    const it = this.intro;
    it.t += dt * 1000;
    if (!it.ready && it.t > 300) {
      it.ready = true;
      this.sfx.countdown();
    }
    if (!it.go && it.t > INTRO_DURATION - 800) {
      it.go = true;
      this.sfx.go();
    }
    if (it.t >= INTRO_DURATION) {
      this.state = 'playing';
      this.intro = null;
    }
  }

  updateBoss(dt) {
    const b = this.boss;
    b.minionTimer -= dt * 1000;
    if (b.minionTimer <= 0) {
      b.minionTimer = BOSS_MINION_INTERVAL;
      if (this.enemiesRemaining() < 5) {
        const pool = this.pacingPool().pool.filter((t) => !ENEMY_TYPES[t].passBricks && t !== 'pontan');
        const spawns = this.players.map((p) => ({ x: p.tx, y: p.ty }));
        const e = this.spawnEnemy(randomItem(pool.length ? pool : ['balloom']), spawns, this.diff.speedMult);
        if (e) {
          this.spawnParticles(e.x, e.y, 10, [b.color, b.accent], 120);
          this.sfx.curse();
        }
      }
    }
  }

  updateTimer(dt) {
    if (this.mode === 1) {
      if (this.timedOut) return;
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      const whole = Math.ceil(this.timeLeft);
      if (this.timeLeft <= 10 && whole !== this.lastTickSecond) {
        this.lastTickSecond = whole;
        if (this.timeLeft > 0) this.sfx.tick();
      }
      if (this.timeLeft <= 0) {
        this.timedOut = true;
        this.announce('TIME UP!', '#ef5350');
        this.sfx.alarm();
        const spawns = this.players.map((p) => ({ x: p.tx, y: p.ty }));
        for (let i = 0; i < this.diff.timeoutPontans; i++) this.spawnEnemy('pontan', spawns, this.diff.speedMult);
      }
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= SUDDEN_DEATH_AT) this.updateSuddenDeath(dt);
    if (this.timeLeft <= 0) {
      for (const p of this.players) if (p.alive) this.killPlayer(p, true);
    }
  }

  updateSuddenDeath(dt) {
    if (!this.suddenDeath) {
      this.suddenDeath = true;
      this.spiral = spiralOrder();
      this.spiralIndex = 0;
      this.spiralTimer = 0;
      this.announce('SUDDEN DEATH!', '#ef5350');
      this.sfx.alarm();
    }
    const interval = Math.min(SUDDEN_DEATH_INTERVAL, ((SUDDEN_DEATH_AT - 3) * 1000) / Math.max(1, this.spiral.length));
    this.spiralTimer += dt * 1000;
    while (this.spiralTimer >= interval && this.spiralIndex < this.spiral.length - 2) {
      this.spiralTimer -= interval;
      this.dropBlock(this.spiral[this.spiralIndex++]);
    }
  }

  nextSpiralTiles(n) {
    if (!this.spiral) return [];
    return this.spiral.slice(this.spiralIndex, Math.min(this.spiralIndex + n, this.spiral.length - 2));
  }

  dropBlock({ x, y }) {
    if (this.grid[y][x] === TILE_WALL) return;
    this.grid[y][x] = TILE_WALL;
    this.falling.push(new FallingBlock(x, y));
    for (const p of this.players) {
      if (p.alive && !p.carriedBy && !p.gloveFlight && p.tx === x && p.ty === y) this.killPlayer(p, true);
    }
    for (const e of this.enemies) {
      if (e.alive && !e.carriedBy && !e.gloveFlight && e.tx === x && e.ty === y) this.killEnemy(e, null);
    }
    for (const b of this.bombs.slice()) {
      if (b.tx === x && b.ty === y) {
        this.bombs = this.bombs.filter((o) => o !== b);
        if (!b.orphan) b.owner.bombsActive = Math.max(0, b.owner.bombsActive - 1);
      }
    }
    this.powerups = this.powerups.filter((pu) => !(pu.tx === x && pu.ty === y));
    this.addShake(3);
    this.sfx.thud();
  }

  // Cheap per-frame danger map used by fleeing enemies: 0 safe, 1 in a blast
  // line, 2 currently burning.
  buildDangerMap() {
    this.danger.fill(0);
    for (const b of this.bombs) {
      this.danger[b.ty * COLS + b.tx] = 1;
      for (const dir of DIR_LIST) {
        const v = DIRS[dir];
        for (let i = 1; i <= b.range; i++) {
          const x = b.tx + v.dx * i;
          const y = b.ty + v.dy * i;
          if (x < 0 || y < 0 || x >= COLS || y >= ROWS) break;
          const t = this.grid[y][x];
          if (t === TILE_WALL) break;
          this.danger[y * COLS + x] = 1;
          if (t === TILE_BRICK) break;
        }
      }
    }
    for (const ex of this.explosions) {
      for (const c of ex.cells) this.danger[c.y * COLS + c.x] = 2;
    }
  }

  dangerAt(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return 0;
    return this.danger[y * COLS + x];
  }

  updateBombs(dt) {
    for (const b of this.bombs) {
      b.age += dt;
      if (Number.isFinite(b.timer)) b.timer -= dt * 1000;
      for (const w of b.walkers) {
        if (w.tx!==b.tx || w.ty!==b.ty) b.walkers.delete(w);
      }
      if (b.slideDir) this.slideBomb(b, dt);
    }
    for (const b of this.bombs.slice()) {
      if (b.exploded) continue;
      if (b.timer <= 0 || (!b.flight && this.explosions.some((ex) => ex.covers(b.tx, b.ty)))) {
        this.explodeBomb(b);
      }
    }
  }

  slideBomb(b, dt) {
    const v = DIRS[b.slideDir];
    const ttx = tileOf(b.slideTarget.x);
    const tty = tileOf(b.slideTarget.y);
    if (this.grid[tty][ttx] !== TILE_EMPTY) {
      // A sudden-death block landed ahead of us: settle back on the current tile.
      b.x = centerOf(b.tx);
      b.y = centerOf(b.ty);
      b.slideDir = null;
      b.slideTarget = null;
      return;
    }
    const step = KICK_SPEED * dt;
    const dx = b.slideTarget.x - b.x;
    const dy = b.slideTarget.y - b.y;
    if (Math.abs(dx) + Math.abs(dy) <= step) {
      b.x = b.slideTarget.x;
      b.y = b.slideTarget.y;
      // Anyone who stepped onto this tile mid-slide may walk off it, and the
      // bomb stops here rather than dragging them along.
      let occupied = false;
      for (const e of [...this.players, ...this.enemies]) {
        if (e.alive && this.overlapsTile(e, b.tx, b.ty)) {
          b.walkers.add(e);
          occupied = true;
        }
      }
      const nx = b.tx + v.dx;
      const ny = b.ty + v.dy;
      if (!occupied && this.canBombEnter(nx, ny, b)) {
        b.slideTarget = { x: centerOf(nx), y: centerOf(ny) };
      } else {
        b.slideDir = null;
        b.slideTarget = null;
      }
    } else {
      b.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
      b.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
    }
  }

  canBombEnter(x, y, bomb) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    if (this.grid[y][x] !== TILE_EMPTY) return false;
    const other = this.bombAt(x, y);
    if (other && other !== bomb) return false;
    if (this.powerups.some((pu) => pu.tx === x && pu.ty === y)) return false;
    if (this.exit && this.exit.revealed && this.exit.tx === x && this.exit.ty === y) return false;
    for (const e of [...this.players, ...this.enemies]) {
      if (e.alive && this.overlapsTile(e, x, y)) return false;
    }
    return true;
  }

  kickBomb(bomb, dir) {
    const v = DIRS[dir];
    const nx = bomb.tx + v.dx;
    const ny = bomb.ty + v.dy;
    if (!this.canBombEnter(nx, ny, bomb)) return false;
    bomb.slideDir = dir;
    bomb.slideTarget = { x: centerOf(nx), y: centerOf(ny) };
    this.sfx.kick();
    return true;
  }

  updateEffects(dt) {
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 500 * dt;
      pt.life -= dt * 1000;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    for (const f of this.floaters) {
      f.y -= 28 * dt;
      f.life -= dt * 1000;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
    if (this.shake.t > 0) {
      this.shake.t -= dt * 1000;
      if (this.shake.t <= 0) this.shake.mag = 0;
    }
  }

  handleGlobalKeys() {
    const inp = this.input;
    if(this.lobby&&this.state==='setup'){for(let slot=0;slot<(this.lobby.battle?this.settings.battle.humans:1);slot++){if(this.lobby.battle&&this.settings.battle.humans===2&&slot===0)continue;const keys=this.lobby.battle&&this.settings.battle.humans===2?PLAYER_CONFIGS[0].keys:PLAYER_CONFIGS[slot].keys;for(const dir of ['left','right','up','down'])if(inp.wasPressed(keys[dir]))this.lobbyInput(slot,'Arrow'+dir[0].toUpperCase()+dir.slice(1));}if(inp.wasPressed(['Enter','Space']))this.lobbyInput(0,'Enter');if(inp.wasPressed(['Escape','Backspace']))this.lobbyInput(0,'Backspace');return true;}
    if(this.isSpectating()&&inp.wasPressed(['KeyF','KeyM','Enter'])){this.toggleSpectatorSpeed();return true;}
    if (inp.wasPressed('KeyV')) this.toggleMute();

    const digits = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
    const numpad = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6'];
    const pressedDigit = () => {
      for (let i = 0; i < digits.length; i++) {
        if (inp.wasPressed([digits[i], numpad[i]])) return i;
      }
      return -1;
    };

    switch (this.state) {
      case 'title':
      case 'setup':
      case 'levelclear':
      case 'roundover':
      case 'gameover': {
        // On touch devices the bomb button emits KeyM; it should not double as menu confirm.
        const confirm = inp.wasPressed(['Enter', 'NumpadEnter']) || (!this.ui.isTouch() && inp.wasPressed('Space'));
        if (this.state === 'levelclear' && this.results && !this.results.done && (confirm || pressedDigit() >= 0)) {
          this.finishResults();
          return true;
        }
        const d = pressedDigit();
        if (d >= 0) return this.ui.activateButton(d);
        if (confirm) return this.ui.activateFocused();
        if (inp.wasPressed(['Escape', 'Backspace'])) return this.ui.backAction();
        const vertical = inp.wasPressed(['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS']);
        if (inp.wasPressed(['ArrowUp', 'KeyW'])) this.ui.focusMove(-1);
        if (inp.wasPressed(['ArrowDown', 'KeyS'])) this.ui.focusMove(1);
        if(!vertical&&inp.wasPressed(['ArrowLeft','KeyA']))return this.ui.activateFocused(true,-1);
        if(!vertical&&inp.wasPressed(['ArrowRight','KeyD']))return this.ui.activateFocused(true,1);
        if (this.state !== 'title' && this.state !== 'setup' && inp.wasPressed('KeyR')) {
          this.showTitle();
          return true;
        }
        return false;
      }
      case 'intro':
        if (inp.wasPressed(['Enter', 'NumpadEnter'])) {
          this.state = 'playing';
          this.intro = null;
          return true;
        }
        if (inp.wasPressed(['Space', 'KeyP', 'Escape'])) {
          this.pause();
          return true;
        }
        return false;
      case 'playing':
        if (inp.wasPressed(['Space', 'KeyP', 'Escape'])) {
          this.pause();
          return true;
        }
        if (inp.wasPressed('KeyR')) {
          this.showTitle();
          return true;
        }
        return false;
      case 'paused': {
        const onPauseMenu = this.ui.overlayTitle.textContent === 'PAUSA';
        if (inp.wasPressed(['Space', 'KeyP']) || (onPauseMenu && inp.wasPressed(['Escape','Backspace']))) {
          this.resume();
          return true;
        }
        if (!onPauseMenu && inp.wasPressed(['Escape', 'Backspace'])) return this.ui.backAction();
        const d = pressedDigit();
        if (d >= 0) return this.ui.activateButton(d);
        if (inp.wasPressed(['Enter', 'NumpadEnter', 'Space'])) return this.ui.activateFocused();
        if (inp.wasPressed(['ArrowUp', 'KeyW'])) this.ui.focusMove(-1);
        if (inp.wasPressed(['ArrowDown', 'KeyS'])) this.ui.focusMove(1);
        if (inp.wasPressed('KeyR')) {
          this.showTitle();
          return true;
        }
        return false;
      }
      default:
        return false;
    }
  }

  toggleMute() {
    this.settings.muted = this.sfx.toggleMute();
    this.music.refreshMute();
    this.ui.setMuted(this.settings.muted);
    this.saveSettings();
  }

  updateDeadPlayer(p, dt) {
    p.deathTimer -= dt * 1000;
    if (p.deathTimer > 0) return;
    p.dying = false;
    if (this.mode === 1 && p.lives > 0) {
      p.respawn();
      const onBomb = this.bombAt(p.tx, p.ty);
      if (onBomb) onBomb.walkers.add(p);
    }
  }

  checkEndConditions() {
    if (this.demo) {
      const alive = this.players.filter((p) => p.alive);
      const dying = this.players.some((p) => p.dying);
      if (alive.length <= 1 && !dying) {
        this.demoRestart += 1;
        if (this.demoRestart > 90) this.startDemo();
      }
      return;
    }
    if (this.state !== 'playing') return;

    if (this.mode === 1) {
      const p = this.players[0];
      if (!p.alive && !p.dying && p.lives <= 0) {
        this.gameOver();
        return;
      }
      if(this.enemiesRemaining()===0)this.ensureCampaignExit(true);
      if (this.exit && this.exit.revealed && this.enemiesRemaining() === 0) {
        if (!this.exitAnnounced) {
          this.exitAnnounced = true;
          this.sfx.exitOpen();
          this.announce('SALIDA ABIERTA', '#b7ff70');
        }
        if (p.alive && p.tx === this.exit.tx && p.ty === this.exit.ty) {
          this.levelClear();
        }
      }
      return;
    }

    // Battle: round ends once at most one player is left and death animations finished.
    const alive = this.players.filter((p) => p.alive);
    const dying = this.players.some((p) => p.dying);
    const survivors = this.settings.battle.formation === 'teams' ? new Set(alive.map(p => p.team)).size : alive.length;
    if (survivors <= 1 && !dying) {
      this.roundOver(alive[0] || null);
    }
  }

  // ------------------------------------------------------------------
  // Rules
  // ------------------------------------------------------------------
  enemiesRemaining() {
    return this.enemies.filter((e) => e.alive).length;
  }

  bombAt(tx, ty) {
    return this.bombs.find((b) => b.tx === tx && b.ty === ty) || null;
  }

  // Whether an entity's collision box touches a tile.
  overlapsTile(entity, tx, ty) {
    const h = entity.half;
    return (
      entity.x + h > tx * TILE &&
      entity.x - h < (tx + 1) * TILE &&
      entity.y + h > ty * TILE &&
      entity.y - h < (ty + 1) * TILE
    );
  }

  isSolidFor(tx, ty, entity) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
    const t = this.grid[ty][tx];
    if (t === TILE_WALL) return true;
    if (t === TILE_BRICK) return !(entity.wallPass || (entity.cfg && entity.cfg.passBricks));
    const b = this.bombAt(tx, ty);
    if (b && !b.walkers.has(entity)) return !(entity.cfg && entity.cfg.passBombs);
    // One player per tile: another player's current or claimed tile is blocked.
    if (entity instanceof Player) {
      for (const o of this.players) {
        if (o !== entity && o.alive && !o.carriedBy && !o.gloveFlight && o.occupies(tx, ty)) return true;
      }
    }
    return false;
  }

  tryPlaceBomb(p) {
    if (!p.alive || p.hasCurse('constipation')) return false;
    if (p.bombsActive >= p.maxBombs) return false;
    const tx = p.tx;
    const ty = p.ty;
    if (this.grid[ty][tx] !== TILE_EMPTY || this.bombAt(tx, ty)) return false;

    // Bombs dropped by the diarrhea curse always use a normal fuse; a trail of
    // remote bombs would box the cursed player (or bot) in.
    const fuse = this.mode === 1 ? this.diff.bombFuse : BOMB_FUSE;
    const bomb = new Bomb(tx, ty, p, p.range, fuse);
    for (const e of [...this.players, ...this.enemies]) {
      if (e.alive && this.overlapsTile(e, tx, ty)) bomb.walkers.add(e);
    }
    this.bombs.push(bomb);
    p.bombsActive += 1;
    this.sfx.placeBomb();
    return true;
  }

  detonate(p) {
    const bomb = this.bombs.find((b) => b.owner === p && b.remote && !b.exploded);
    if (bomb) this.explodeBomb(bomb);
  }

  explodeBomb(bomb) {
    if (bomb.exploded) return;
    bomb.exploded = true;
    this.bombs = this.bombs.filter((b) => b !== bomb);
    if (!bomb.orphan) bomb.owner.bombsActive = Math.max(0, bomb.owner.bombsActive - 1);

    const powerupsBefore = this.powerups.slice();
    const cells = [{ x: bomb.tx, y: bomb.ty, dir: null, end: false }];
    const chain = [];

    for (const dir of DIR_LIST) {
      const v = DIRS[dir];
      for (let i = 1; i <= bomb.range; i++) {
        const x = bomb.tx + v.dx * i;
        const y = bomb.ty + v.dy * i;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) break;
        const t = this.grid[y][x];
        if (t === TILE_WALL) break;
        if (t === TILE_BRICK) {
          cells.push({ x, y, dir, end: true });
          this.destroyBrick(x, y);
          break;
        }
        const other = this.bombAt(x, y);
        if (other) {
          cells.push({ x, y, dir, end: true });
          chain.push(other);
          break;
        }
        cells.push({ x, y, dir, end: i === bomb.range });
      }
    }

    const explosion = new Explosion(cells, bomb.owner);
    this.explosions.push(explosion);
    this.sfx.explosion();
    this.addShake(3 + bomb.range);
    for (const c of cells) {
      if (c.end) this.spawnParticles(centerOf(c.x), centerOf(c.y), 4, ['#ffb300', '#fff59d', '#ff6d00'], 140);
    }

    // Flames burn power-ups that were already lying around.
    this.powerups = this.powerups.filter((pu) => !(powerupsBefore.includes(pu) && explosion.covers(pu.tx, pu.ty)));

    for (const other of chain) this.explodeBomb(other);
  }

  destroyBrick(x, y) {
    this.grid[y][x] = TILE_EMPTY;
    this.breaking.push(new BreakingBrick(x, y));
    const theme = THEMES[this.theme];
    this.spawnParticles(centerOf(x), centerOf(y), 6, [theme.brick, theme.brickDark, theme.brickLight], 120);
    if (this.exit && this.exit.tx === x && this.exit.ty === y) {
      this.exit.revealed = true;
      return;
    }
    const chance = this.mode === 1 ? this.diff.powerupChance : POWERUP_CHANCE;
    if (Math.random() < chance) {
      let type = weightedPick(POWERUP_TABLE);

      this.powerups.push(new PowerUp(x, y, type));
    }
  }

  collectPowerUp(p, pu) {
    this.powerups = this.powerups.filter((x) => x !== pu);
    const info = POWERUP_INFO[pu.type];
    switch (pu.type) {
      case 'bomb':
        p.maxBombs = Math.min(MAX_BOMBS, p.maxBombs + 1);
        break;
      case 'fire':
        p.range = Math.min(MAX_RANGE, p.range + 1);
        break;
      case 'speed':
        p.speedLevel = Math.min(MAX_SPEED_LEVEL, p.speedLevel + 1);
        break;
      case 'kick':
        p.canKick = true;
        break;
      case 'remote':
        return; // Retired item: old/debug objects cannot grant remote bombs.
      case 'wallpass':
        p.wallPass = true;
        break;
      case 'life':
        p.heartGuard = true; // A single hit shield; collecting again never stacks.
        break;
      case 'skull':
        this.applyCurse(p);
        return;
      default:
        break;
    }
    p.score += Math.round(50 * (this.mode === 1 ? this.diff.scoreMult : 1));
    this.floaters.push(new Floater(info.name, p.x, p.y - 30, '#f4edff', 13));
    this.spawnParticles(p.x, p.y, 8, ['#fff8e1', '#ffb300', p.color], 90);
    this.sfx.powerup();
  }

  applyCurse(p, type = null) {
    p.curse = { type: type || randomItem(CURSE_TYPES), timer: CURSE_DURATION };
    this.floaters.push(new Floater(CURSE_NAMES[p.curse.type], p.x, p.y - 30, '#ce93d8', 13, 1400));
    this.sfx.curse();
  }

  killPlayer(p, force = false) {
    if (!p.alive) return;
    if (!force && p.shield > 0) return;
    if (!force && p.heartGuard) {
      p.heartGuard=false;
      p.shield=900; // prevents one flame/enemy overlap from immediately hitting twice
      this.spawnParticles(p.x,p.y,12,['#b7ff70','#bcb0ff','#ffffff'],100);
      this.floaters.push(new Floater('PROTECCIÓN',p.x,p.y-35,'#b7ff70',13));
      this.sfx.powerup();
      return;
    }
    p.alive = false;
    p.dying = true;
    p.deathTimer = RESPAWN_DELAY;
    p.lives = Math.max(0, p.lives - 1);
    p.curse = null;
    const resetPowers = this.mode === 1 && this.diff.losePowersOnDeath;
    if (resetPowers) p.resetPowers();
    for (const b of this.bombs) {
      if (b.owner !== p) continue;
      // Remote bombs left behind get a normal fuse.
      if (b.remote) {
        b.remote = false;
        b.timer = 1000;
      }
      // Bombs from before a power reset no longer count against the new limit.
      if (resetPowers) b.orphan = true;
    }
    if (resetPowers) p.bombsActive = 0;
    this.spawnParticles(p.x, p.y, 14, ['#ffffff', p.color, '#eceff1'], 160);
    this.addShake(6);
    this.freeze = 90;
    this.sfx.death();
  }

  damageBoss(b, killer) {
    if (b.iframes > 0) return;
    b.hp -= 1;
    if (b.hp <= 0) {
      this.killEnemy(b, killer);
      return;
    }
    b.iframes = BOSS_IFRAMES;
    this.floaters.push(new Floater('HIT!', b.x, b.y - 40, '#b7ff70', 16));
    this.spawnParticles(b.x, b.y, 12, [b.color, b.accent, '#ffffff'], 150);
    this.addShake(5);
    this.sfx.bossHit();
  }

  killEnemy(e, killer) {
    if (!e.alive) return;
    e.alive = false;
    e.dying = true;
    e.deathTimer = e.isBoss ? ENEMY_DEATH_DURATION * 2 : ENEMY_DEATH_DURATION;
    const mult = this.mode === 1 ? this.diff.scoreMult : 1;
    const points = Math.round(e.cfg.score * mult);
    if (killer) {
      killer.score += points;
      killer.kills += 1;
      killer.levelKills = (killer.levelKills || 0) + 1;
      this.floaters.push(new Floater(`+${points}`, e.x, e.y - 20, '#b7ff70', 14));
    }
    this.spawnParticles(e.x, e.y, e.isBoss ? 40 : 10, [e.color, '#ffffff'], e.isBoss ? 220 : 130);
    if (e.isBoss) {
      this.exit = { tx: e.tx, ty: e.ty, revealed: true };
      this.announce(`${e.name} DEFEATED!`, '#b7ff70');
      this.addShake(10);
      this.freeze = 200;
      this.sfx.bossRoar();
    } else {
      this.sfx.enemyDie();
    }
  }

  // Damage uses the central body, independently of the generous movement box.
  // Ten pixels of flame-edge inset and a seven-pixel body radius give a small
  // safe margin at tile boundaries, including around corners.
  flameHitsPlayer(p,cell){
    const inset=10,radius=7;
    const left=cell.x*TILE+inset,top=cell.y*TILE+inset;
    const right=(cell.x+1)*TILE-inset,bottom=(cell.y+1)*TILE-inset;
    const dx=p.x-Math.max(left,Math.min(right,p.x));
    const dy=p.y-Math.max(top,Math.min(bottom,p.y));
    return dx*dx+dy*dy<radius*radius;
  }

  resolveCollisions() {
    // Flames vs players and enemies
    for (const ex of this.explosions) {
      for (const p of this.players) {
        if (p.alive && !p.carriedBy && !p.gloveFlight && p.shield <= 0 && ex.cells.some(c => this.flameHitsPlayer(p,c))) this.killPlayer(p,false,ex);
      }
      for (const e of this.enemies) {
        if (!e.alive || e.carriedBy || e.gloveFlight || !ex.covers(e.tx, e.ty)) continue;
        if (e.isBoss) this.damageBoss(e, ex.owner);
        else this.killEnemy(e, ex.owner);
      }
    }

    // Enemies touching players
    for (const e of this.enemies) {
      if (!e.alive||e.carriedBy||e.gloveFlight) continue;
      const reach = TILE * 0.6 * (e.isBoss ? 1.35 : 1);
      for (const p of this.players) {
        if (!p.alive || p.carriedBy || p.gloveFlight || p.shield > 0) continue;
        if (Math.abs(p.x - e.x) < reach && Math.abs(p.y - e.y) < reach) {
          this.killPlayer(p);
        }
      }
    }

    // Power-ups
    for (const p of this.players) {
      if (!p.alive||p.carriedBy||p.gloveFlight) continue;
      const pu = this.powerups.find((u) => u.tx === p.tx && u.ty === p.ty);
      if (pu) this.collectPowerUp(p, pu);
    }

    // Curses spread by touch in battle mode
    if (this.mode === 2) {
      for (const a of this.players) {
        if (!a.alive || a.carriedBy || a.gloveFlight || !a.curse) continue;
        for (const b of this.players) {
          if (b === a || !b.alive || b.carriedBy || b.gloveFlight || b.curse || b.curseImmune > 0) continue;
          if (Math.abs(a.x - b.x) < TILE * 0.6 && Math.abs(a.y - b.y) < TILE * 0.6) {
            b.curse = { type: a.curse.type, timer: a.curse.timer };
            a.curse = null;
            a.curseImmune = 1500;
            this.floaters.push(new Floater('Curse passed on!', b.x, b.y - 30, '#ce93d8', 13));
            this.sfx.curse();
            break;
          }
        }
      }
    }
  }

  // Direction from (tx, ty) toward a visible player in the same row/column,
  // or null. Used by "smart" enemies.
  findPlayerDirection(tx, ty, maxDist) {
    for (const p of this.players) {
      if (!p.alive) continue;
      const px = p.tx;
      const py = p.ty;
      if (py === ty && px !== tx) {
        const sx = Math.sign(px - tx);
        const dist = Math.abs(px - tx);
        if (dist <= maxDist && this.clearLine(tx, ty, sx, 0, dist)) return sx > 0 ? 'right' : 'left';
      }
      if (px === tx && py !== ty) {
        const sy = Math.sign(py - ty);
        const dist = Math.abs(py - ty);
        if (dist <= maxDist && this.clearLine(tx, ty, 0, sy, dist)) return sy > 0 ? 'down' : 'up';
      }
    }
    return null;
  }

  clearLine(tx, ty, sx, sy, dist) {
    for (let i = 1; i < dist; i++) {
      const x = tx + sx * i;
      const y = ty + sy * i;
      if (this.grid[y][x] !== TILE_EMPTY || this.bombAt(x, y)) return false;
    }
    return true;
  }

  // ------------------------------------------------------------------
  // Effects
  // ------------------------------------------------------------------
  addShake(mag) {
    if (this.settings.shake === false) return;
    this.shake.mag = Math.max(this.shake.mag, mag);
    this.shake.t = 180;
  }

  spawnParticles(x, y, count, colors, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random());
      this.particles.push(new Particle(x, y, Math.cos(a) * v, Math.sin(a) * v - 60, 350 + Math.random() * 350, randomItem(colors), 2 + Math.random() * 3));
    }
    if (this.particles.length > 320) this.particles.splice(0, this.particles.length - 320);
  }

  announce(text, color = '#b7ff70') {
    if (this.demo) return;
    this.floaters.push(new Floater(text, CANVAS_W / 2, CANVAS_H / 2 - 30, color, 34, 1800));
  }

  render() {
    Renderer.draw(this);
  }
}
