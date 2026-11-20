// ---------------------------------------------------------------------------
// AI-controlled Bomberman players ("bots") for battle mode.
//
// A bot drives an ordinary Player through a stand-in input object, so the
// movement / bomb code is shared with human players. Each replan the bot builds
// a danger map (which tiles will be hit, and when), then runs a time-aware BFS
// to escape, grab power-ups, attack, dig through bricks, or wander.
// ---------------------------------------------------------------------------

const BOT_TIERS = {
  easy: {
    label: 'Easy',
    reactionDelay: 550, // ms before noticing a new bomb
    replanInterval: 500,
    mistakeProb: 0.1, // chance per replan to do something dumb
    margin: 150, // safety margin (ms) when timing flames
    lookahead: 1200, // ignore bombs with more fuse than this
    predictChains: false,
    aggressionRadius: 2,
    powerupRadius: 1,
    enemyRadius: 1,
    maxEscapeLen: 3,
    bombInterval: 3.6,
  },
  normal: {
    label: 'Normal',
    reactionDelay: 350,
    replanInterval: 450,
    mistakeProb: 0.06,
    margin: 300,
    lookahead: Infinity,
    predictChains: true,
    aggressionRadius: 3,
    powerupRadius: 3,
    enemyRadius: 2,
    maxEscapeLen: 4,
    bombInterval: 2.9,
  },
  hard: {
    label: 'Hard',
    reactionDelay: 120,
    replanInterval: 100,
    mistakeProb: 0,
    margin: 450,
    lookahead: Infinity,
    predictChains: true,
    aggressionRadius: 6,
    powerupRadius: 8,
    enemyRadius: 2,
    maxEscapeLen: 5,
    bombInterval: 1.8,
  },
};

// Touch play gives newcomers more room without slowing the human controls.
const MobileBalance={
 active(game){return !game.demo&&!!(game.ui?.coarse||game.ui?.isTouch?.());},
 tiers:{
  easy:{...BOT_TIERS.easy,reactionDelay:650,replanInterval:700,mistakeProb:.1,aggressionRadius:2,powerupRadius:1,bombInterval:4.2},
  normal:{...BOT_TIERS.easy,reactionDelay:500,replanInterval:600,mistakeProb:.07,aggressionRadius:2,powerupRadius:2,maxEscapeLen:4,bombInterval:3.5},
  hard:{...BOT_TIERS.normal,reactionDelay:260,replanInterval:350,mistakeProb:.04,aggressionRadius:4,powerupRadius:3,bombInterval:2.5}
 },
 config(game,tier){return this.active(game)?this.tiers[tier]||this.tiers.normal:BOT_TIERS[tier]||BOT_TIERS.normal;},
 shipLimit(game,p){return p.isBot&&this.active(game)?1:2;},
 shipCooldown(game,p){return p.isBot?(this.active(game)?4+Math.random()*.7:2.5):1;}
};

// Mimics the Input class API used by Player.update.
class BotInput {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
  }

  isDown(codes) {
    return [].concat(codes).some((c) => this.down.has(c));
  }

  wasPressed(codes) {
    return [].concat(codes).some((c) => this.pressed.has(c));
  }
}

// Tiles a bomb at (tx, ty) with `range` would hit, mirroring Game.explodeBomb.
function botBlastCells(game, tx, ty, range, kind='normal') {
  if(game.blastCells)return game.blastCells(tx,ty,range,kind);
  const cells = [{ x: tx, y: ty }];
  for (const dir of DIR_LIST) {
    const v = DIRS[dir];
    for (let i = 1; i <= range; i++) {
      const x = tx + v.dx * i;
      const y = ty + v.dy * i;
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) break;
      if (game.grid[y][x] === TILE_WALL) break;
      cells.push({ x, y });
      if (game.grid[y][x] === TILE_BRICK || game.bombAt(x, y)) break;
    }
  }
  return cells;
}

// danger[y][x] = { hitAt, clearAt } in ms from now. hitAt === Infinity means safe.
function botDangerMap(game, cfg, extraBomb, self = null) {
  const d = [];
  for (let y = 0; y < ROWS; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) row.push({ hitAt: Infinity, clearAt: 0 });
    d.push(row);
  }

  // Remote bombs have no fuse. Ours only go off when we detonate them, so plan
  // a leisurely escape; anyone else's could go off at any moment.
  const bombs = game.bombs.map((b) => ({
    tx: b.tx,
    ty: b.ty,
    range: b.range,
    kind:b.kind||'normal',
    remote: b.remote,
    t: Number.isFinite(b.timer) ? b.timer : b.owner === self ? 4000 : 1500,
  }));
  if (extraBomb) bombs.push({ tx: extraBomb.tx, ty: extraBomb.ty, range: extraBomb.range, kind:extraBomb.kind||self?.bombKind||'normal', t: extraBomb.timer });
  if(game.paracas)for(const b of bombs)if(game.paracas.trapKeys.has(tileKey(b.tx,b.ty))){const t=Paracas.phase(game);b.t=Math.min(b.t,t>=Paracas.halfCycle?0:(Paracas.halfCycle-t)*1000);}
  const cells = bombs.map((b) => botBlastCells(game, b.tx, b.ty, b.range,b.kind));

  if (cfg.predictChains) {
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 32) {
      changed = false;
      bombs.forEach((b, i) => {
        for (const c of cells[i]) {
          for (const o of bombs) {
            if (o.tx === c.x && o.ty === c.y && o.t > b.t) {
              o.t = b.t;
              changed = true;
            }
          }
        }
      });
    }
  }

  bombs.forEach((b, i) => {
    if (!b.remote && b.t > cfg.lookahead) return;
    for (const c of cells[i]) {
      const e = d[c.y][c.x];
      e.hitAt = Math.min(e.hitAt, b.t);
      e.clearAt = Math.max(e.clearAt, b.t + (b.kind==='napalm'?SPECIAL_FLAME_MS.napalm:b.kind==='tnt'?SPECIAL_FLAME_MS.tnt:EXPLOSION_DURATION));
    }
  });

  for (const ex of game.explosions) {
    for (const c of ex.cells) {
      const e = d[c.y][c.x];
      e.hitAt = 0;
      e.clearAt = Math.max(e.clearAt, ex.timer);
    }
  }

  for(const c of game.lavaThreats?.()||[]){const e=d[c.y][c.x];e.hitAt=Math.min(e.hitAt,c.hitAt);e.clearAt=Math.max(e.clearAt,c.clearAt);}

  // Sudden death: the next tiles to be crushed are never safe.
  if (game.nextSpiralTiles) {
    for (const s of game.nextSpiralTiles(4)) {
      d[s.y][s.x].hitAt = 0;
      d[s.y][s.x].clearAt = Infinity;
    }
  }

  // Monsters: avoid their tile and the tiles they could step into.
  for (const e of game.enemies) {
    if (!e.alive) continue;
    for (let r = 0; r <= cfg.enemyRadius; r++) {
      const spots = r === 0 ? [[0, 0]] : [[r, 0], [-r, 0], [0, r], [0, -r]];
      for (const [dx, dy] of spots) {
        const x = e.tx + dx;
        const y = e.ty + dy;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        const cell = d[y][x];
        cell.hitAt = 0;
        cell.clearAt = Math.max(cell.clearAt, 800);
      }
    }
  }

  return d;
}

class Bot {
  constructor(player, tier) {
    this.player = player;
    this.tier = tier;
    this.cfg = BOT_TIERS[tier] || BOT_TIERS.normal;
    this.input = new BotInput();
    this.reset();
  }

  reset() {
    this.path = [];
    this.replanTimer = 0;
    this.reaction = 0;
    this.lastBombCount = 0;
    this.mobileBombCooldown=1.2+Math.random()*.6;
    this.input.down.clear();
    this.input.pressed.clear();
  }

  // ------------------------------------------------------------------
  think(dt, game) {
    const p = this.player;
    const cfg = this.cfg=MobileBalance.config(game,this.tier);
    this.mobileBombCooldown=Math.max(0,this.mobileBombCooldown-dt);
    this.input.pressed.clear();

    const snap = Math.max(2, p.speed * dt * 1.05);
    const cx = centerOf(p.tx);
    const cy = centerOf(p.ty);
    const atCentre = Math.abs(p.x - cx) <= snap && Math.abs(p.y - cy) <= snap;

    this.replanTimer -= dt * 1000;
    if (game.bombs.length > this.lastBombCount) this.reaction = cfg.reactionDelay;
    this.lastBombCount = game.bombs.length;
    this.reaction -= dt * 1000;

    if (atCentre || this.replanTimer <= 0 || this.path.length === 0 || this.pathBlocked(game)) {
      this.replanTimer = cfg.replanInterval;
      const d = botDangerMap(game, cfg, null, p);
      const here = d[p.ty][p.tx];
      const inDanger = here.hitAt !== Infinity && this.reaction <= 0;

      if (Math.random() < cfg.mistakeProb) {
        this.path = this.randomStep(game);
      } else if (inDanger || this.pathUnsafe(d)) {
        this.path = this.findSafePath(game, d) || [];
      } else if (atCentre || this.path.length === 0) {
        this.path = this.pickGoal(game, d);
      }
    }

    if (p.remote) this.considerDetonate(game);
    this.steer(snap);
  }

  // With remote bombs: blow up our bombs once we are clear of them and either
  // an opponent stands in the blast or the bomb has been waiting a while.
  considerDetonate(game) {
    const p = this.player;
    const own = game.bombs.filter((b) => b.owner === p && b.remote);
    if (!own.length) return;
    const bomb = own[0];
    // Everything that would go off together: the bomb plus any bombs its
    // flames reach, transitively (chain reactions).
    const chained = new Set([bomb]);
    const cells = [];
    const queue = [bomb];
    while (queue.length) {
      const b = queue.shift();
      for (const c of botBlastCells(game, b.tx, b.ty, b.range,b.kind)) {
        cells.push(c);
        const other = game.bombAt(c.x, c.y);
        if (other && !chained.has(other)) {
          chained.add(other);
          queue.push(other);
        }
      }
    }
    // Stay well clear: our body must be at least a few pixels outside every
    // blast tile, and we must not be walking into one.
    const reach = TILE / 2 + 12;
    if (cells.some((c) => Math.abs(p.x - centerOf(c.x)) < reach && Math.abs(p.y - centerOf(c.y)) < reach)) return;
    const next = this.path[0];
    if (next && cells.some((c) => c.x === next.x && c.y === next.y)) return;
    const opponentHit = game.players.some((o) => o !== p && o.alive && !(game.mode === 2 && !game.demo && game.settings.battle.formation === 'teams' && o.team === p.team) && cells.some((c) => c.x === o.tx && c.y === o.ty));
    if (opponentHit || bomb.age > 1.5) this.input.pressed.add(p.keys.detonate[0]);
  }

  pathBlocked(game) {
    const next = this.path[0];
    return !!next && game.isSolidFor(next.x, next.y, this.player);
  }

  pathUnsafe(d) {
    const tileTime = (TILE / this.player.speed) * 1000;
    return this.path.some((n, i) => {
      const e = d[n.y][n.x];
      return e.hitAt !== Infinity && e.hitAt < (i + 2) * tileTime + this.cfg.margin;
    });
  }

  steer(snap) {
    const p = this.player;
    this.input.down.clear();
    let guard = 0;
    while (this.path.length && guard++ < 4) {
      const next = this.path[0];
      const tx = centerOf(next.x);
      const ty = centerOf(next.y);
      if (Math.abs(p.x - tx) <= snap && Math.abs(p.y - ty) <= snap) {
        this.path.shift();
        continue;
      }
      const k = p.keys;
      const rev = p.hasCurse('reverse');
      if (Math.abs(p.x - tx) > snap) this.input.down.add(p.x < tx !== rev ? k.right[0] : k.left[0]);
      else this.input.down.add(p.y < ty !== rev ? k.down[0] : k.up[0]);
      return;
    }
  }

  // ------------------------------------------------------------------
  // Time-aware BFS over walkable tiles. Returns nodes in BFS order; each
  // node has { x, y, t (arrival ms), dist, prev }.
  // With `relaxed`, only require arriving before the flames (no safety margin
  // and no need to leave in time). Used as a last resort when trapped.
  bfs(game, d, maxDist, relaxed = false) {
    const p = this.player;
    const tileTime = (TILE / p.speed) * 1000;
    const margin = relaxed ? 0 : this.cfg.margin;
    const start = { x: p.tx, y: p.ty, t: 0, dist: 0, prev: null };
    const seen = new Set([tileKey(start.x, start.y)]);
    const queue = [start];
    const out = [];
    let head = 0;
    while (head < queue.length) {
      const n = queue[head++];
      out.push(n);
      if (n.dist >= maxDist) continue;
      for (const dir of DIR_LIST) {
        const x = n.x + DIRS[dir].dx;
        const y = n.y + DIRS[dir].dy;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        const k = tileKey(x, y);
        if (seen.has(k)) continue;
        if (game.grid[y][x] !== TILE_EMPTY || game.bombAt(x, y)) continue;
        if (game.players.some((o) => o !== p && o.alive && !(game.mode === 2 && !game.demo && game.settings.battle.formation === 'teams' && o.team === p.team) && o.tx === x && o.ty === y)) continue;
        const t = n.t + tileTime; // arrival at the tile centre
        const enter = t - tileTime / 2; // the game counts us inside once our centre crosses the edge
        const e = d[y][x];
        const passable = relaxed
          ? enter < e.hitAt || enter > e.clearAt + 40
          : t + tileTime + margin < e.hitAt || enter > e.clearAt + 60;
        if (!passable || game.paracasSafeAt&&!game.paracasSafeAt(x,y,enter,t+tileTime+margin)) continue;
        seen.add(k);
        queue.push({ x, y, t, dist: n.dist + 1, prev: n });
      }
    }
    return out;
  }

  unwind(node) {
    const path = [];
    let n = node;
    while (n && n.prev) {
      path.push({ x: n.x, y: n.y });
      n = n.prev;
    }
    return path.reverse();
  }

  findSafePath(game, d, maxDist = 99) {
    const nodes = this.bfs(game, d, maxDist);
    const safe = nodes.find((n) => d[n.y][n.x].hitAt === Infinity);
    if (safe) return this.unwind(safe);
    // No comfortable route: run for any tile we can reach before it burns.
    const dash = this.bfs(game, d, maxDist, true).find((n) => d[n.y][n.x].hitAt === Infinity);
    if (dash) return this.unwind(dash);
    // Trapped: go to the tile whose doom is furthest away.
    let best = null;
    let bestScore = -Infinity;
    for (const n of nodes) {
      const score = d[n.y][n.x].hitAt - n.t;
      if (score > bestScore) {
        bestScore = score;
        best = n;
      }
    }
    return best ? this.unwind(best) : null;
  }

  // Would a bomb at (bx, by) with `range` reach tile (tx, ty)?
  inBlast(game, bx, by, range, tx, ty) {
    if (bx === tx && by === ty) return true;
    if (bx !== tx && by !== ty) return false;
    const dist = Math.abs(bx - tx) + Math.abs(by - ty);
    if (dist > range) return false;
    const sx = Math.sign(tx - bx);
    const sy = Math.sign(ty - by);
    return game.clearLine(bx, by, sx, sy, dist);
  }

  hasAdjacentBrick(game, x, y) {
    return DIR_LIST.some((dir) => {
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      return game.grid[ny] && game.grid[ny][nx] === TILE_BRICK;
    });
  }

  tryBomb(game) {
    const p = this.player;
    if(this.mobileBombCooldown>0)return false;
    if (p.bombsActive >= p.maxBombs) return false;
    if (game.grid[p.ty][p.tx] !== TILE_EMPTY || game.bombAt(p.tx, p.ty)) return false;
    const d = botDangerMap(game, this.cfg, { tx: p.tx, ty: p.ty, range: p.range, timer: BOMB_FUSE }, p);
    const nodes = this.bfs(game, d, this.cfg.maxEscapeLen);
    const safe = nodes.find((n) => d[n.y][n.x].hitAt === Infinity);
    if (!safe) return false;
    this.input.pressed.add(p.keys.bomb[0]);
    this.mobileBombCooldown=(MobileBalance.config(game,this.tier).bombInterval)+Math.random()*.4;
    this.path = this.unwind(safe);
    this.replanTimer = this.cfg.replanInterval;
    return true;
  }

  // A deliberate "mistake": ignore fuse timers, but never walk into visible fire.
  randomStep(game) {
    const p = this.player;
    const options = DIR_LIST.filter((dir) => {
      const x = p.tx + DIRS[dir].dx;
      const y = p.ty + DIRS[dir].dy;
      return !game.isSolidFor(x, y, p) && game.dangerAt(x, y) !== 2;
    });
    if (!options.length) return [];
    const dir = randomItem(options);
    return [{ x: p.tx + DIRS[dir].dx, y: p.ty + DIRS[dir].dy }];
  }

  pickGoal(game, d) {
    const p = this.player;
    const cfg = this.cfg;
    const opponents = game.players.filter((o) => o !== p && o.alive && !(game.mode === 2 && !game.demo && game.settings.battle.formation === 'teams' && o.team === p.team));
    let target = null;
    let targetDist = Infinity;
    for (const o of opponents) {
      const dist = Math.abs(o.tx - p.tx) + Math.abs(o.ty - p.ty);
      if (dist < targetDist) {
        targetDist = dist;
        target = o;
      }
    }

    const nodes = this.bfs(game, d, 99);
    const isSafe = (n) => d[n.y][n.x].hitAt === Infinity;

    // 1. Power-ups nearby
    if (game.powerups.length && cfg.powerupRadius > 0) {
      const node = nodes.find(
        (n) => n.dist <= cfg.powerupRadius && isSafe(n) && game.powerups.some((u) => u.tx === n.x && u.ty === n.y)
      );
      if (node) return this.unwind(node);
    }

    // 2. Attack
    if (target) {
      if (this.inBlast(game, p.tx, p.ty, p.range, target.tx, target.ty)) {
        if (this.tryBomb(game)) return this.path;
      }
      const firing = nodes.find(
        (n) => n.dist > 0 && n.dist <= cfg.aggressionRadius && isSafe(n) && this.inBlast(game, n.x, n.y, p.range, target.tx, target.ty)
      );
      if (firing) return this.unwind(firing);
      // Approach if the opponent is reachable without digging.
      const adjacent = nodes.find(
        (n) => n.dist <= cfg.aggressionRadius && isSafe(n) && Math.abs(n.x - target.tx) + Math.abs(n.y - target.ty) <= 1
      );
      if (adjacent && adjacent.dist > 0) return this.unwind(adjacent);
    }

    // 3. Dig toward the target (or the arena centre)
    const digTarget = target ? { x: target.tx, y: target.ty } : { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
    let spot = null;
    let spotScore = Infinity;
    for (const n of nodes) {
      if (!isSafe(n) || !this.hasAdjacentBrick(game, n.x, n.y)) continue;
      const score = n.dist + 1.5 * (Math.abs(n.x - digTarget.x) + Math.abs(n.y - digTarget.y));
      if (score < spotScore) {
        spotScore = score;
        spot = n;
      }
    }
    if (spot) {
      if (spot.dist === 0) {
        if (this.tryBomb(game)) return this.path;
      } else {
        return this.unwind(spot);
      }
    }

    // 4. Wander
    const candidates = nodes.filter((n) => n.dist >= 1 && n.dist <= 3 && isSafe(n));
    if (candidates.length) return this.unwind(randomItem(candidates));
    return [];
  }
}
