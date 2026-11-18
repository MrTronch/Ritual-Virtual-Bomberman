// Hand-authored pixel icons; the same painter generates the illustrated guide.
const PixelItems = {
  info: [
    ['bomb','Bomba extra','Una bomba simultánea más'],
    ['fire','Más fuego','Aumenta el alcance de la explosión'],
    ['speed','Patín','Velocidad gradual · máximo 168 px/s'],
    ['kick','Patada','Empuja las bombas del camino'],
    ['wallpass','Atravesar bloques','Cruza ladrillos; cuidado con el fuego'],
    ['life','Protección','Burbuja de un golpe · no se acumula'],
    ['skull','Calavera','Maldición temporal durante 10 s'],
  ],
  patterns: {
    bomb:['........Y...','.......YY...','.....BBB....','...BBBBBBB..','..BBHBBBBBB.','.BBHHBBBBBBB','.BBHBBBBBBBB','.BBBBBBBBBBB','.BBBBBBBBBBB','..BBBBBBBBB.','...BBBBBBB..','............'],
    fire:['.....Y......','.....YY.....','....WYY.....','...WWYYY....','...WY.YYY...','..WWY.YYY...','.WWYY.WYYY..','.WYY..WWYY..','.WYY.WWWYY..','..YYWWYYY...','...YYYYY....','....YYY.....'],
    speed:['...HHHHH....','...HGGGH....','...HGGGH....','...HGGGHH...','...HGGGGHH..','..HHGGGGGHH.','..HGGGGGGGH.','..HHHHHHHHH.','...DD..DD...','..DKD.DKD...','...DD..DD...','............'],
    kick:['...AAAA.....','...AHAA.....','...AHAA.....','...AHAA.....','...AAAA.....','...AAAAAAA..','...AAAAAAAH.','..AAAAAAAAH.','..KKKKKKKKK.','..KKKKKKKKK.','............','............'],
    wallpass:['....PPPP....','...PHPPPP...','..PHPPPPPP..','..PPPPPPPP..','..PKKPPKKP..','..PHHPPHHP..','..PPPPPPPP..','..PPPKKPPP..','..PPPPPPPP..','..PPPPPPPP..','..PP.PP.PP..','..P...P..P..'],
    life:['............','..RRR..RRR..','.RHHHRRHHHR.','.RHHHRRHHHR.','.RHHHRRHHHR.','.RRRRRRRRRR.','..RRRRRRRR..','...RRRRRR...','....RRRR....','.....RR.....','............','............'],
    skull:['...HHHHHH...','..HHHHHHHH..','.HHHHHHHHHH.','.HKKHHHHKKH.','.HKKHHHHKKH.','.HHHHKKHHHH.','..HHHHHHHH..','...HKHKHH...','...HHHHHH...','....K..K....','...KK..KK...','............'],
  },
  palette: { B:'#263b65',H:'#fff5d2',Y:'#ffb32c',W:'#ff542e',G:'#57d6cf',D:'#afb9e7',K:'#161b30',A:'#ba754c',P:'#b08aff',R:'#ff527a' },
  icon(ctx,type,x,y,size=24) {
    const rows=this.patterns[type];if(!rows)return;
    const unit=size/12;ctx.save();ctx.imageSmoothingEnabled=false;
    rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(this.palette[v]){ctx.fillStyle=this.palette[v];ctx.fillRect(x+i*unit,y+j*unit,unit,unit);}}));ctx.restore();
  },
  // A supply case with a pictogram. There are no letter labels on the items.
  cases: {bomb:'#413f68',fire:'#703b46',speed:'#275672',kick:'#43623f',wallpass:'#584579',life:'#71445c',skull:'#393b4e'},
  badgeCache: new Map(),
  badge(ctx,type,x,y,size=36) {
    if(!this.patterns[type])return;
    if(size!==36){
      if(!this.badgeCache.has(type)){const tile=document.createElement('canvas');tile.width=36;tile.height=36;this.badge(tile.getContext('2d'),type,0,0,36);this.badgeCache.set(type,tile);}
      ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.badgeCache.get(type),x,y,size,size);ctx.restore();return;
    }
    ctx.save();ctx.translate(x,y);
    const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
    box(2,2,32,32,'#11121c');box(0,8,36,20,'#11121c');
    box(3,3,30,30,'#727482');box(2,8,32,20,'#727482');
    box(5,5,26,26,this.cases[type]);box(4,4,27,2,'#dce4df');box(3,6,2,24,'#b5c0be');
    box(5,30,26,3,'#323543');box(30,6,3,24,'#444757');
    box(7,6,22,24,type==='bomb'?'#d4f4bc':type==='skull'?'#b9b1db':'#d3cce7');
    // Corner armour, rivets and the small latch read as a crate rather than a badge.
    for(const [cx,cy] of [[3,3],[29,3],[3,29],[29,29]]) {box(cx,cy,4,4,'#afb8bb');box(cx+1,cy+1,2,2,'#3d4151');}
    box(15,2,6,4,'#b4c0b8');box(17,3,2,2,'#4e5862');
    this.icon(ctx,type,6,6,24);
    ctx.restore();
  },
  draw(ctx,pu) {
    if (!this.patterns[pu.type]) return;
    const bounce=Math.round(Math.abs(Math.sin(pu.age*3.8))*3);
    const x=pu.tx*TILE+3,y=pu.ty*TILE+3-bounce;
    ctx.save();ctx.fillStyle='rgba(0,0,0,.24)';ctx.fillRect(x+6,y+36+bounce,24,4);
    this.badge(ctx,pu.type,x,y,42);ctx.restore();
  },
  guide() {
    const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=1120;const c=canvas.getContext('2d');
    c.fillStyle='#121625';c.fillRect(0,0,1400,1120);
    c.fillStyle='#adf579';c.font='24px "Ritual Pixel",monospace';c.fillText('RITUAL VIRTUAL / BOMBERMAN',64,65);
    c.fillStyle='#f2ecff';c.font='48px "Ritual Pixel",monospace';c.fillText('ÍTEMS DE LA ARENA',64,132);
    c.fillStyle='#b3bed4';c.font='20px "Ritual Pixel",monospace';c.fillText('Recógelos al romper ladrillos · La bomba remota fue retirada',64,180);
    this.info.forEach(([type,name,desc],i)=>{
      const x=64+(i%2)*650,y=220+Math.floor(i/2)*193;
      c.fillStyle='#222940';c.fillRect(x,y,620,165);
      this.badge(c,type,x+24,y+28,104);
      c.fillStyle='#f2ecff';c.font='28px "Ritual Pixel",monospace';c.fillText(name,x+148,y+60);
      c.fillStyle='#c4cde1';c.font='18px "Ritual Pixel",monospace';
      const words=desc.split(' ');let line='',yy=y+99;for(const w of words){if(c.measureText(line+w).width>440){c.fillText(line,x+148,yy);yy+=28;line='';}line+=w+' ';}c.fillText(line,x+148,yy);
    });
    c.fillStyle='#9dabc4';c.font='18px "Ritual Pixel",monospace';c.fillText('M: bomba   ·   Espacio: pausa   ·   Patín: 132 → 144 → 156 → 168 px/s',64,1052);
    return canvas;
  }
};
