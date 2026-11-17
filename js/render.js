// ---------------------------------------------------------------------------
// Canvas renderer: cached scenery, isolated character atlases and pixel creatures.
// Static tiles are pre-rendered per theme (and per device scale) to
// offscreen canvases.
// ---------------------------------------------------------------------------

const Renderer = (() => {
  let tiles = {};
  let theme = THEMES.grass;
  let scale = 1;

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function makeTile(name, painter) {
    const c = document.createElement('canvas');
    c.width = Math.round(TILE * scale);
    c.height = Math.round(TILE * scale);
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    painter(ctx);
    tiles[name] = c;
  }

  function paintFloor(shade) {
    return (ctx) => {
      ctx.fillStyle = shade ? theme.floorA : theme.floorB;
      ctx.fillRect(0, 0, TILE, TILE);
      ctx.fillStyle = theme.tuft;
      const seeds=shade?[[6,10],[30,18],[18,36],[38,40],[9,28],[27,5]]:[[12,28],[34,8],[26,30],[8,42],[40,27],[20,13]];
      for(const [x,y] of seeds){
        ctx.fillStyle=theme.tuft;ctx.fillRect(x,y,5,2);ctx.fillRect(x+2,y-4,2,4);ctx.fillRect(x-1,y-2,2,2);
        if(theme===THEMES.grass){ctx.fillStyle='#80c85b';ctx.fillRect(x+3,y-3,1,3);ctx.fillStyle='#3e8a49';ctx.fillRect(x,y+2,4,1);}
      }
      if(theme===THEMES.grass){
        ctx.fillStyle='#b1d888';ctx.fillRect(shade?13:37,shade?22:35,2,2);
        ctx.fillStyle='#527f50';ctx.fillRect(shade?37:17,shade?7:41,3,1);
      }
    };
  }

  function paintWall(ctx) {
    ctx.fillStyle = theme.wall;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = theme.wallLight;
    ctx.fillRect(0, 0, TILE, 4);
    ctx.fillRect(0, 0, 4, TILE);
    ctx.fillStyle = theme.wallDark;
    ctx.fillRect(0, TILE - 4, TILE, 4);
    ctx.fillRect(TILE - 4, 0, 4, TILE);
    ctx.fillStyle = theme.wallInner;
    ctx.fillRect(10, 10, TILE - 20, TILE - 20);
    ctx.fillStyle = theme.wallLight;
    ctx.fillRect(10, 10, TILE - 20, 3);
    ctx.fillRect(10, 10, 3, TILE - 20);
    ctx.fillStyle = theme.wallDark;
    ctx.fillRect(10, TILE - 13, TILE - 20, 3);
    ctx.fillRect(TILE - 13, 10, 3, TILE - 20);
  }

  function paintBrick(ctx) {
    ctx.fillStyle = theme.mortar;
    ctx.fillRect(0, 0, TILE, TILE);
    const rowH = 12;
    const brickW = 24;
    for (let r = 0; r < TILE / rowH; r++) {
      const offset = r % 2 === 0 ? 0 : brickW / 2;
      for (let x = -brickW; x < TILE + brickW; x += brickW) {
        const bx = x + offset;
        ctx.fillStyle = theme.brick;
        ctx.fillRect(bx + 1, r * rowH + 1, brickW - 2, rowH - 2);
        ctx.fillStyle = theme.brickLight;
        ctx.fillRect(bx + 1, r * rowH + 1, brickW - 2, 2);
        ctx.fillStyle = theme.brickDark;
        ctx.fillRect(bx + 1, r * rowH + rowH - 3, brickW - 2, 2);
      }
    }
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.globalCompositeOperation = 'source-over';
  }

  function rebuild() {
    tiles = {};
    makeTile('floor0', paintFloor(false));
    makeTile('floor1', paintFloor(true));
    makeTile('wall', paintWall);
    makeTile('brick', paintBrick);
  }

  function setTheme(name) {
    theme = THEMES[name] || THEMES.grass;
    rebuild();
  }

  function setScale(k) {
    if (k === scale) return;
    scale = k;
    rebuild();
  }

  function drawTile(ctx, name, px, py) {
    ctx.drawImage(tiles[name], px, py, TILE, TILE);
  }

  // ---------------------------------------------------------------------
  function drawExit(ctx, exit, open, time) {
    const x=exit.tx*TILE,y=exit.ty*TILE;
    ctx.save();
    // Bright cyan-white gate is distinct from the purple walls and green side portals.
    const pulse=.65+.2*Math.sin(time*5);
    ctx.fillStyle='#061c36';ctx.fillRect(x+3,y,42,48);
    ctx.fillStyle=open?'#00dfff':'#557ad3';ctx.fillRect(x+6,y+3,36,41);
    ctx.fillStyle=open?'#d9ffff':'#b6cfff';ctx.fillRect(x+9,y+1,30,6);ctx.fillRect(x+5,y+7,6,33);ctx.fillRect(x+37,y+7,6,33);
    ctx.fillStyle='#ffffff';ctx.fillRect(x+11,y+2,26,2);
    ctx.fillStyle='#091d42';ctx.fillRect(x+13,y+9,22,31);
    if(open){
      ctx.globalAlpha=pulse;ctx.fillStyle='#3cf4ff';ctx.fillRect(x+15,y+11,18,29);ctx.globalAlpha=1;
      ctx.fillStyle='#147ac5';ctx.fillRect(x+18,y+13,12,25);
      ctx.fillStyle='#ffffff';for(let i=0;i<6;i++){const sy=y+13+((i*7+Math.floor(time*10))%24);ctx.fillRect(x+16+(i*5)%15,sy,2,3);}
      ctx.fillStyle='#ffffff';ctx.fillRect(x+22,y+23,4,11);ctx.fillRect(x+19,y+25,10,3);ctx.fillRect(x+22,y+21,4,2);
      ctx.globalAlpha=pulse;ctx.fillStyle='#9effff';ctx.fillRect(x+2,y+18,2,7);ctx.fillRect(x+44,y+18,2,7);ctx.globalAlpha=1;
    }else{ctx.fillStyle='#86a6e6';ctx.fillRect(x+15,y+15,18,3);ctx.fillRect(x+15,y+24,18,3);ctx.fillRect(x+15,y+33,18,3);}
    ctx.fillStyle=open?'#eaffff':'#a0b7e6';ctx.fillRect(x+7,y+40,34,5);ctx.fillStyle='#20b9ed';ctx.fillRect(x+4,y+45,40,3);ctx.restore();
  }

  function drawPowerUp(ctx,pu){PixelItems.draw(ctx,pu);}

  function drawBomb(ctx,b){PixelFX.bomb(ctx,b);}

  function drawExplosion(ctx,ex){PixelFX.explosion(ctx,ex);}

  function drawBreakingBrick(ctx, br) {
    const t = 1 - br.timer / BRICK_BREAK_DURATION;
    const px = br.tx * TILE;
    const py = br.ty * TILE;
    const half = TILE / 2;
    const src = tiles.brick;
    const sh = src.width / 2;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    for (let qx = 0; qx < 2; qx++) {
      for (let qy = 0; qy < 2; qy++) {
        const ox = (qx ? 1 : -1) * t * 14;
        const oy = (qy ? 1 : -1) * t * 14 + t * t * 20;
        ctx.drawImage(src, qx * sh, qy * sh, sh, sh, px + qx * half + ox, py + qy * half + oy, half, half);
      }
    }
    ctx.restore();
  }

  function drawFallingBlock(ctx, fb) {
    const t = 1 - fb.timer / FALLING_BLOCK_DURATION;
    const px = fb.tx * TILE;
    const py = fb.ty * TILE;
    const drop = (1 - t) * (1 - t) * 90;
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.5 * t;
    ctx.fillStyle = '#000';
    ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.globalAlpha = 1;
    ctx.drawImage(tiles.wall, px, py - drop, TILE, TILE);
    ctx.restore();
  }

  function drawSpiralWarning(ctx, game) {
    const next = game.nextSpiralTiles(3);
    if (!next.length) return;
    const pulse = 0.25 + 0.2 * Math.sin(game.elapsed * 12);
    next.forEach((t, i) => {
      ctx.save();
      ctx.globalAlpha = pulse * (1 - i * 0.25);
      ctx.fillStyle = '#d50000';
      ctx.fillRect(t.x * TILE, t.y * TILE, TILE, TILE);
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------------
  function drawBossBar(ctx, e) {
    const w = TILE * 1.6;
    const x = e.x - w / 2;
    const y = e.y - TILE * 0.95;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, x - 2, y - 2, w + 4, 10, 4);
    ctx.fill();
    const f = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = f > 0.5 ? '#66bb6a' : f > 0.25 ? '#ffa726' : '#ef5350';
    ctx.fillRect(x, y, w * f, 6);
    ctx.font = 'bold 10px "Ritual Pixel", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(e.name, e.x, y - 5);
  }

  function drawEnemy(ctx,e,game){PixelEnemies.draw(ctx,e,game);if(e.isBoss&&e.alive)drawBossBar(ctx,e);}

  function drawPlayer(ctx,p,game){
    if(game.mode===2&&!game.demo&&p.team!=null&&p.alive){ctx.save();ctx.strokeStyle=p.team===0?'#86eaff':'#ff9ecf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+16,17,6,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
    RitualSprites.draw(ctx,p,game);
  }

  function drawParticles(ctx, particles) {
    for (const pt of particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters(ctx, floaters) {
    ctx.textAlign = 'center';
    for (const f of floaters) {
      const t = f.life / f.maxLife;
      ctx.globalAlpha = t < 0.4 ? t / 0.4 : 1;
      ctx.font = `bold ${f.size}px "Ritual Pixel", monospace`;
      ctx.lineWidth = Math.max(2, f.size / 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawIntro(ctx, game) {
    const it = game.intro;
    if (!it) return;
    const t = it.t;
    const slide = Math.min(1, t / 350);
    const ease = 1 - Math.pow(1 - slide, 3);
    const fadeOut = t > INTRO_DURATION - 250 ? (INTRO_DURATION - t) / 250 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fadeOut);
    const h = 120;
    const y = CANVAS_H / 2 - h / 2;
    ctx.fillStyle = 'rgba(10, 12, 20, 0.82)';
    ctx.fillRect(0, y, CANVAS_W, h);
    ctx.fillStyle = '#9564cc';
    ctx.fillRect(0, y, CANVAS_W * ease, 4);
    ctx.fillRect(CANVAS_W * (1 - ease), y + h - 4, CANVAS_W * ease, 4);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#b7ff70';
    ctx.font = '900 26px "Ritual Pixel", monospace';
    ctx.fillText(game.levelLabel, CANVAS_W / 2 + (1 - ease) * 300, y + 46);

    const goPhase = t > INTRO_DURATION - 800;
    const word = goPhase ? 'GO!' : 'READY';
    const pulse = goPhase ? 1 + Math.min(0.5, (t - (INTRO_DURATION - 800)) / 600) : 1;
    ctx.fillStyle = goPhase ? '#b7ff70' : '#f3edff';
    ctx.font = `bold ${Math.round(40 * pulse)}px "Ritual Pixel", monospace`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeText(word, CANVAS_W / 2, y + 100);
    ctx.fillText(word, CANVAS_W / 2, y + 100);
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  function draw(game) {
    const ctx = game.ctx;
    const grid = game.grid;
    const viewport=RevengeShips.viewport(game);
    ctx.setTransform(scale,0,0,scale,viewport.x*scale,viewport.y*scale);
    ctx.clearRect(-viewport.x,-viewport.y,viewport.width,viewport.height);
    ctx.fillStyle='#110b1c';ctx.fillRect(-viewport.x,-viewport.y,viewport.width,viewport.height);
    ctx.save();

    if (game.shake.mag > 0) {
      ctx.translate((Math.random() - 0.5) * 2 * game.shake.mag, (Math.random() - 0.5) * 2 * game.shake.mag);
    }

    const fallingKeys = new Set(game.falling.map((fb) => fb.ty * COLS + fb.tx));
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * TILE;
        const py = y * TILE;
        if(!ArenaArt.floor(ctx,game,x,y))drawTile(ctx, (x + y) % 2 ? 'floor1' : 'floor0', px, py);
        const t = grid[y][x];
        if (t === TILE_WALL && !fallingKeys.has(y * COLS + x)){if(!ArenaArt.solid(ctx,game,x,y,t))drawTile(ctx,'wall',px,py);}
        else if(t===TILE_BRICK){if(!ArenaArt.solid(ctx,game,x,y,t))drawTile(ctx,'brick',px,py);}
      }
    }

    ArenaArt.portalBack(ctx,game);
    if (game.suddenDeath) drawSpiralWarning(ctx, game);
    if (game.exit && game.exit.revealed) drawExit(ctx, game.exit, game.enemiesRemaining() === 0, game.elapsed);

    for (const pu of game.powerups) drawPowerUp(ctx, pu);
    for (const b of game.bombs) if(!b.inHand&&!b.flight)drawBomb(ctx, b);
    for (const br of game.breaking) drawBreakingBrick(ctx, br);
    for (const fb of game.falling) drawFallingBlock(ctx, fb);
    for (const ex of game.explosions) drawExplosion(ctx, ex);
    // The map is painted once. Tall actors go above terrain, never under a
    // second wall pass. Sort their ground positions for consistent overlap.
    ArenaArt.overlays(ctx,game);
    if(typeof Deathmatch!=='undefined'&&Deathmatch.active(game))Deathmatch.drawBrickBars(ctx,game);
    const actors=[...game.enemies.filter(e=>(e.alive||e.dying)&&!e.carriedBy&&!e.gloveFlight).map(e=>({entity:e,player:false})),...game.players.filter(p=>(p.alive||p.dying)&&!p.carriedBy&&!p.gloveFlight).map(p=>({entity:p,player:true}))];
    actors.sort((a,b)=>a.entity.y-b.entity.y);
    for(const actor of actors){if(actor.player)drawPlayer(ctx,actor.entity,game);else drawEnemy(ctx,actor.entity,game);}
    ArenaArt.airObjects(ctx,game);
    ArenaArt.portalFront(ctx,game);
    drawParticles(ctx, game.particles);
    drawFloaters(ctx, game.floaters);

    ctx.restore();

    if (game.state === 'intro') drawIntro(ctx, game);

    if (game.state === 'playing' && ((game.mode === 1 && game.timeLeft < 30) || game.suddenDeath)) {
      ctx.save();
      ctx.globalAlpha = 0.08 + 0.06 * Math.sin(game.elapsed * 6);
      ctx.fillStyle = '#f44336';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
  }

  rebuild();
  return { draw, setTheme, setScale, forceRebuild: rebuild };
})();
