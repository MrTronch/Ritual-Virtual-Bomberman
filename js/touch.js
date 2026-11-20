// ---------------------------------------------------------------------------
// Touch controls: a virtual D-pad plus action buttons that feed key codes
// into the shared Input instance, so the game code is unchanged.
// ---------------------------------------------------------------------------

class TouchControls {
  constructor(input, root) {
    this.input = input;
    this.root = root;
    this.onAny = null;
    this.pad = root.querySelector('#dpad');
    this.active = new Map(); // pointerId -> Set(codes)
    this.rect = null;

    // 8 sectors starting at "right", going clockwise.
    this.sectors = [
      ['ArrowRight'],
      ['ArrowRight', 'ArrowDown'],
      ['ArrowDown'],
      ['ArrowDown', 'ArrowLeft'],
      ['ArrowLeft'],
      ['ArrowLeft', 'ArrowUp'],
      ['ArrowUp'],
      ['ArrowUp', 'ArrowRight'],
    ];

    if (this.pad) this.bindPad();
    root.querySelectorAll('[data-code]').forEach((btn) => this.bindButton(btn));
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });
  }

  moveStick(e){
    const r=this.rect||this.pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
    const distance=Math.hypot(dx,dy),limit=r.width*.28,k=distance>limit?limit/distance:1;
    this.pad.style.setProperty('--stick-x',dx*k+'px');this.pad.style.setProperty('--stick-y',dy*k+'px');this.pad.classList.add('engaged');
  }
  resetStick(){this.stickAxis=null;this.pad.style.setProperty('--stick-x','0px');this.pad.style.setProperty('--stick-y','0px');this.pad.classList.remove('engaged');this.rect=null;}
  codesAt(e) {
    const r = this.rect || this.pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12){this.stickAxis=null;return [];}
    let axis=this.stickAxis||(Math.abs(dx)>Math.abs(dy)?'x':'y');
    if(axis==='x'&&Math.abs(dy)>Math.abs(dx)*1.25)axis='y';
    else if(axis==='y'&&Math.abs(dx)>Math.abs(dy)*1.25)axis='x';
    this.stickAxis=axis;
    return [axis==='x'?(dx<0?'ArrowLeft':'ArrowRight'):(dy<0?'ArrowUp':'ArrowDown')];
  }

  apply(id, codes) {
    const prev = this.active.get(id) || new Set();
    const next = new Set(codes);
    for (const c of prev) if (!next.has(c)) this.input.release(c);
    for (const c of next) if (!prev.has(c)) this.input.press(c);
    this.active.set(id, next);
    this.pad.dataset.dir = codes.join(' ');
    if (this.onAny) this.onAny();
  }

  bindPad() {
    const pad = this.pad;
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if(this.active.size)return;
      this.rect = pad.getBoundingClientRect();
      try {
        pad.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      this.moveStick(e);this.apply(e.pointerId, this.codesAt(e));
    }, { passive: false });
    pad.addEventListener('pointermove', (e) => {
      if (this.active.has(e.pointerId)){this.moveStick(e);this.apply(e.pointerId, this.codesAt(e));}
    }, { passive: false });
    const end = (e) => {
      if (!this.active.has(e.pointerId)) return;
      this.apply(e.pointerId, []);
      this.active.delete(e.pointerId);this.resetStick();
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(type, end);
  }

  bindButton(btn) {
    const code = btn.dataset.code;
    const press = (e) => {
      e.preventDefault();
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
      this.input.press(code);
      btn.classList.add('held');
      if (this.onAny) this.onAny();
    };
    const release = () => {
      this.input.release(code);
      btn.classList.remove('held');
    };
    btn.addEventListener('pointerdown', press, { passive: false });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(type, release);
  }

  releaseAll() {
    this.resetStick();
    for (const [id, codes] of this.active) {
      for (const c of codes) this.input.release(c);
      this.active.delete(id);
    }
    this.root.querySelectorAll('[data-code]').forEach((btn) => {
      this.input.release(btn.dataset.code);
      btn.classList.remove('held');
    });
  }
}
