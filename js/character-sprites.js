// Faithful direction-specific atlases. Never mirror asymmetrical characters.
Object.assign(RitualSprites, {
  walkSheets: Object.fromEntries(CHARACTERS.filter(c=>c.enabled).map(c=>[c.id,Object.assign(new Image(),{src:c.id==='max'?'assets/personajes/caminata/max-walk.webp':`assets/personajes/caminata/${c.id}-walk-matte.webp`})])),
  michiaPortrait: Object.assign(new Image(),{src:'assets/personajes/seleccion/michia-portrait-matte.webp'}),
  michiaDeath: Object.assign(new Image(),{src:'assets/personajes/derrotas/michia-death.webp'}),
  maxDeath: Object.assign(new Image(),{src:'assets/personajes/derrotas/max-death.webp'}),
  maxDeathRects: [[58, 66, 190, 326], [358, 66, 194, 324], [633, 75, 264, 317], [945, 80, 277, 316], [35, 464, 242, 339], [327, 462, 263, 343], [635, 464, 261, 342], [949, 532, 248, 256], [12, 889, 290, 287], [323, 890, 294, 277], [647, 900, 264, 258], [990, 946, 201, 180]],
  portraitSource(id){if(id==='max')return this.walkSheets.max;return id==='michia'?this.michiaPortrait:this.portraits;},
  portraits: Object.assign(new Image(),{src:'assets/personajes/seleccion/portraits-matte.webp'}),
  deathAtlas: Object.assign(new Image(),{src:'assets/personajes/derrotas/death-12.webp'}),
  deathRects: [[[2,2,158,158],[164,2,158,158],[326,2,161,158],[491,2,159,158],[654,2,171,158],[829,2,159,158],[992,2,150,158],[1146,2,149,158],[1299,2,171,158],[1474,2,144,158],[1622,2,158,158],[1784,2,158,158]],[[2,164,158,154],[164,164,167,154],[335,164,165,154],[504,164,160,154],[668,164,158,154],[830,164,157,154],[991,164,159,154],[1154,164,141,154],[1299,164,169,154],[1472,164,146,154],[1622,164,158,154],[1784,164,158,154]],[[2,322,158,156],[164,322,158,156],[326,322,161,156],[491,322,163,156],[658,322,165,156],[827,322,161,156],[992,322,152,156],[1148,322,146,156],[1298,322,172,156],[1474,322,145,156],[1623,322,157,156],[1784,322,158,156]],[[2,482,158,158],[164,482,158,158],[326,482,158,158],[488,482,160,158],[652,482,163,158],[819,482,164,158],[987,482,153,158],[1144,482,151,158],[1299,482,170,158],[1473,482,145,158],[1622,482,158,158],[1784,482,158,158]],[[2,644,158,163],[164,644,158,163],[326,644,162,163],[492,644,164,163],[660,644,164,163],[828,644,160,163],[992,644,155,163],[1151,644,144,163],[1299,644,171,163],[1474,644,144,163],[1622,644,158,163],[1784,644,158,163]],[[0,0,362,362],[362,0,362,362],[724,0,362,362],[1086,0,362,362],[0,362,362,362],[362,362,362,362],[724,362,362,362],[1086,362,362,362],[0,724,362,362],[362,724,362,362],[724,724,362,362],[1086,724,362,362]]],
  deathBodyRects: [[[50,15,97,131],[224,15,94,131],[390,15,97,131],[554,15,96,131],[708,10,117,138],[873,8,115,141],[1050,15,92,132]],[[34,164,126,148],[208,164,123,148],[377,164,123,148],[538,164,126,148],[703,164,123,148],[868,164,119,149],[1036,164,114,148]],[[47,322,102,149],[219,322,102,149],[388,322,99,149],[551,322,103,149],[710,322,113,150],[877,322,111,150],[1049,322,95,149]],[[51,482,94,150],[225,482,91,150],[391,482,93,150],[555,482,93,150],[716,482,99,147],[883,482,100,147],[1052,482,88,151]],[[46,644,105,146],[219,644,103,146],[387,644,101,146],[549,644,107,146],[710,644,114,146],[873,644,115,148],[1047,644,100,146]],[[122,37,161,314],[470,37,162,314],[801,42,178,306],[1153,36,183,314],[101,394,207,317],[443,394,220,317],[790,399,215,312]]],
  frameCache: new Map(),
  portraitIndex: ['psicogato','bunnylicious','perrotech','sazonix','sr-mr','michia','max'],
  walkFrame(id,facing='down',step=0){
    const source=this.walkSheets[id];if(!source?.complete||!source.naturalWidth)return null;
    const row={down:0,up:1,left:2,right:3}[facing]??0;
    const w=source.naturalWidth/4,h=source.naturalHeight/4;
    return {source,rect:this.walkRects[id][row][step%4],key:`${id}:${row}:${step%4}`};
  },
  walkRects: {"psicogato":[[[77,23,195,266],[378,22,196,272],[682,22,198,264],[987,21,196,271]],[[77,331,195,265],[379,333,195,268],[685,333,194,261],[991,331,196,265]],[[71,638,187,273],[377,638,191,273],[681,638,188,272],[992,638,190,272]],[[67,942,190,280],[374,941,190,275],[676,942,193,280],[987,942,190,280]]],"bunnylicious":[[[77,26,209,272],[372,26,209,273],[667,26,210,273],[962,27,209,271]],[[78,335,214,266],[374,335,213,267],[667,335,216,266],[963,335,214,266]],[[79,639,192,276],[372,639,192,275],[667,639,191,275],[962,639,194,276]],[[97,946,186,282],[385,946,187,278],[674,946,193,282],[977,946,184,282]]],"perrotech":[[[80,23,206,281],[378,23,205,285],[679,22,204,280],[970,23,205,282]],[[80,326,196,284],[382,328,193,282],[677,326,197,282],[974,326,196,284]],[[88,634,168,283],[386,635,176,277],[682,634,173,279],[980,635,172,285]],[[100,948,171,281],[390,947,180,282],[690,947,184,282],[1001,948,175,281]]],"sazonix":[[[89,19,193,292],[381,19,194,294],[673,19,196,293],[969,18,195,295]],[[89,326,193,286],[381,326,194,284],[673,326,196,290],[968,326,196,286]],[[90,631,180,283],[375,631,184,280],[666,632,182,278],[968,631,183,279]],[[99,932,184,285],[390,932,189,285],[688,932,182,285],[981,932,183,285]]],"sr-mr":[[[96,23,182,270],[392,24,181,270],[685,24,181,267],[979,24,184,277]],[[86,322,195,274],[381,321,196,276],[677,322,198,274],[974,323,196,275]],[[90,629,174,269],[384,626,183,272],[682,629,174,270],[976,629,184,273]],[[91,934,177,272],[391,933,181,273],[688,934,175,272],[986,933,174,275]]],"michia":[[[110,65,174,247],[397,65,174,248],[683,65,174,248],[969,65,175,247]],[[109,350,175,248],[396,349,175,250],[683,349,175,250],[969,350,176,248]],[[119,646,146,247],[405,646,143,247],[692,646,142,248],[981,646,142,247]],[[126,931,147,248],[413,932,148,247],[697,931,151,248],[988,931,147,248]]],"max":[[[87,16,167,285],[388,16,168,290],[689,16,168,285],[989,16,168,285]],[[97,333,158,279],[392,333,163,284],[699,333,158,279],[996,333,164,284]],[[89,644,164,286],[390,645,159,285],[694,644,162,286],[995,645,159,286]],[[93,959,157,281],[394,960,162,280],[698,960,155,280],[999,960,156,280]]]},
  bodyMetrics: {"psicogato":[{"w":198,"h":272},{"w":196,"h":268},{"w":191,"h":273},{"w":193,"h":280}],"bunnylicious":[{"w":210,"h":273},{"w":216,"h":267},{"w":194,"h":276},{"w":193,"h":282}],"perrotech":[{"w":206,"h":285},{"w":197,"h":284},{"w":176,"h":285},{"w":184,"h":282}],"sazonix":[{"w":196,"h":295},{"w":196,"h":290},{"w":184,"h":283},{"w":189,"h":285}],"sr-mr":[{"w":184,"h":277},{"w":198,"h":276},{"w":184,"h":273},{"w":181,"h":275}],"michia":[{"w":175,"h":248},{"w":176,"h":250},{"w":146,"h":248},{"w":151,"h":248}],"max":[{"w":168,"h":290},{"w":164,"h":284},{"w":164,"h":286},{"w":162,"h":281}]},
  sheetBounds: new Map(),
  visibleBounds(id,row=0){return this.bodyMetrics[id][row];},
  isolated(frame){
    if(!this.frameCache.has(frame.key)){
      const tile=document.createElement('canvas');tile.width=64;tile.height=64;
      const ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;
      const [x,y,w,h]=frame.rect;
      if(frame.key.startsWith('max-death:')){
        const scale=Math.min(64/w,64/h),dw=w*scale,dh=h*scale;ctx.drawImage(frame.source,x,y,w,h,(64-dw)/2,(64-dh)/2,dw,dh);
      }else if(!frame.key.startsWith('death:')){
        const bounds=this.visibleBounds(frame.key.split(':')[0],Number(frame.key.split(':')[1]));
        const scale=Math.min(64/bounds.w,64/bounds.h),dw=w*scale,dh=h*scale;
        ctx.drawImage(frame.source,x,y,w,h,(64-dw)/2,64-dh,dw,dh);
      }else {
        const [,rowText,phaseText]=frame.key.split(':'),row=Number(rowText),phase=Number(phaseText);
        if(phase<7){
          // Keep the current compact costume and palette throughout the reaction.
          const walk=this.walkFrame(this.portraitIndex[row],'down',0);
          if(walk){
            const body=this.isolated(walk),widths=[64,62,64,67,69,71,71],heights=[64,62,64,61,59,57,57];
            const dw=widths[phase],dh=heights[phase],shake=phase===1?-1:phase===2?1:0;
            ctx.drawImage(body,(64-dw)/2+shake,64-dh,dw,dh);
            if(phase===6){ctx.globalCompositeOperation='source-in';ctx.fillStyle='#fff1db';ctx.fillRect(0,0,64,64);}
          }
        }else ctx.drawImage(frame.source,x+2,y+2,w-4,h-4,0,0,64,64);
      }
      this.frameCache.set(frame.key,tile);
    }
    return this.frameCache.get(frame.key);
  },
  portrait(ctx,id,w,h){
    if(id==='max'){const f=this.walkFrame(id);if(!f)return false;const [x,y,sw,sh]=f.rect;const crop=sh*.66,scale=Math.min(w/sw,h/crop);ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;ctx.drawImage(f.source,x,y,sw,crop,(w-sw*scale)/2,(h-crop*scale)/2,sw*scale,crop*scale);return true;}
    const index=this.portraitIndex.indexOf(id),source=this.portraitSource(id);
    if(index<0||!source.complete||!source.naturalWidth)return false;
    const cw=source.naturalWidth/5,ch=source.naturalHeight;
    ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
    // A large head-only crop, independent of the walking sheet.
    const sx=id==='michia'?150:index*cw+10,sy=id==='michia'?25:ch*.215,sw=id==='michia'?source.naturalWidth-300:cw-20,sh=id==='michia'?source.naturalHeight-50:ch*.64;
    const scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;
    ctx.drawImage(source,sx,sy,sw,sh,(w-dw)/2,(h-dh)/2,dw,dh);
    return true;
  },
  detailSheet:Object.assign(new Image(),{src:'assets/personajes/guante/selection-carry-v2.webp'}),
  detailRects:[[[52, 43, 124, 168], [264, 37, 119, 172], [468, 37, 119, 172], [673, 36, 111, 174], [882, 35, 117, 175]], [[42, 252, 149, 171], [246, 238, 150, 185], [449, 240, 151, 183], [658, 240, 133, 183], [869, 240, 134, 183]], [[50, 451, 136, 168], [257, 451, 130, 168], [465, 451, 123, 167], [676, 451, 99, 168], [892, 449, 100, 170]], [[51, 655, 130, 168], [254, 653, 134, 170], [458, 654, 135, 169], [661, 649, 126, 174], [877, 649, 126, 174]], [[52, 856, 130, 166], [253, 852, 134, 169], [458, 853, 138, 168], [659, 854, 128, 167], [876, 853, 128, 168]], [[52, 1055, 125, 175], [257, 1052, 130, 178], [459, 1051, 133, 179], [670, 1049, 109, 181], [877, 1050, 113, 180]], [[48, 1265, 129, 187], [250, 1265, 134, 187], [458, 1265, 130, 187], [661, 1266, 129, 186], [869, 1265, 129, 187]]],
  detailFrame(id,column=0){const source=this.detailSheet,row=this.portraitIndex.indexOf(id);if(!source.complete||!source.naturalWidth||row<0)return null;return {source,rect:this.detailRects[row][column],key:`detail:${id}:${column}`};},
  paintDetailed(ctx,frame,x,y,w,h){const [sx,sy,sw,sh]=frame.rect,k=Math.min(w/sw,h/sh);ctx.imageSmoothingEnabled=false;ctx.drawImage(frame.source,sx,sy,sw,sh,x+(w-sw*k)/2,y+h-sh*k,sw*k,sh*k);},
  preview(ctx,id,w,h){
    const detailed=this.detailFrame(id);if(detailed){ctx.clearRect(0,0,w,h);this.paintDetailed(ctx,detailed,0,0,w,h);return true;}
    const frame=this.walkFrame(id);if(!frame)return false;
    ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.isolated(frame),0,0,w,h);return true;
  },
  draw(ctx,p,game){
    let frame=this.walkFrame(p.character,p.facing,p.moving?Math.floor(p.animTime*9)%4:0);
    if(!frame)return false;
    let phase=0;
    if(p.dying)phase=Math.min(11,Math.max(0,Math.floor((1-p.deathTimer/RESPAWN_DELAY)*12)));
    ctx.save();ctx.translate(p.x,p.y);
    if(p.dying){this.drawDefeat(ctx,p,phase);ctx.restore();return true;}
    if(p.portalTransit){const t=p.portalTransit,phase=t.age/t.duration,scale=Math.max(.08,Math.abs(phase*2-1));ctx.scale(scale,.85+.15*scale);ctx.globalAlpha=.3+.7*scale;}
    if(p.wallPass&&game?.grid?.[tileOf(p.y)]?.[tileOf(p.x)]===TILE_BRICK)ctx.globalAlpha=1;
    if(!p.dying){
      ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(0,18,16,4,0,0,Math.PI*2);ctx.fill();
      if(p.heartGuard){
        ctx.fillStyle='rgba(183,255,170,.10)';ctx.strokeStyle='rgba(183,255,170,.8)';ctx.lineWidth=1.4;
        ctx.beginPath();ctx.arc(0,-6,34,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(-2,-8,28,Math.PI*1.1,Math.PI*1.45);ctx.stroke();
      }
      if(p.shield>0&&Math.floor(p.shield/110)%2===0)ctx.globalAlpha*=.55;
    }
    ctx.imageSmoothingEnabled=false;
    // Grounded centre. Tall artwork no longer places feet on the next brick row.
    const size=72;
    const drawWidth=60,feet=24;
    const carrying=p.held&&!p.dying?this.detailFrame(p.character,{down:1,up:2,left:3,right:4}[p.facing]||1):null;
    const idle=null;
    if(carrying||idle)this.paintDetailed(ctx,carrying||idle,-drawWidth/2,feet-size,drawWidth,size);
    else if(!p.dying){const [sx,sy,sw,sh]=frame.rect,b=this.visibleBounds(p.character,{down:0,up:1,left:2,right:3}[p.facing]||0),k=Math.min(drawWidth/b.w,size/b.h);ctx.drawImage(frame.source,sx,sy,sw,sh,-sw*k/2,feet-sh*k,sw*k,sh*k);}
    else ctx.drawImage(this.isolated(frame),-drawWidth/2,feet-size,drawWidth,size);
    ctx.restore();
    if(p.curse&&!p.dying){ctx.save();ctx.fillStyle='#e0b4ff';ctx.font='12px "Ritual Pixel",monospace';ctx.textAlign='center';ctx.fillText(Math.ceil(p.curse.timer/1000)+'s',p.x,p.y-56);ctx.restore();}
    return true;
  }
});

// Head-only crops keep necks and torsos out of the HUD and menu cursor.
RitualSprites.head=function(ctx,id,w,h){return SelectionArt.head(ctx,id,w,h);};


RitualSprites.walkRects["psicogato"]=[[[80, 21, 183, 262], [384, 21, 183, 268], [689, 21, 183, 262], [994, 21, 183, 263]], [[78, 328, 191, 265], [383, 328, 191, 270], [687, 328, 191, 265], [999, 328, 185, 270]], [[73, 630, 183, 279], [381, 630, 185, 279], [685, 630, 182, 278], [989, 630, 191, 279]], [[69, 940, 183, 280], [376, 940, 186, 274], [678, 940, 187, 280], [989, 940, 184, 280]]];
RitualSprites.bodyMetrics["psicogato"]=[{"w": 183, "h": 268}, {"w": 191, "h": 270}, {"w": 191, "h": 279}, {"w": 187, "h": 280}];

RitualSprites.walkRects["bunnylicious"]=[[[79, 28, 205, 268], [374, 28, 205, 269], [669, 28, 206, 269], [964, 29, 205, 267]], [[79, 337, 212, 263], [375, 337, 210, 263], [669, 337, 212, 263], [965, 337, 210, 262]], [[81, 640, 188, 273], [374, 641, 188, 271], [669, 641, 187, 271], [964, 641, 190, 272]], [[99, 948, 182, 278], [387, 948, 183, 274], [676, 948, 189, 278], [979, 948, 180, 278]]];
RitualSprites.bodyMetrics["bunnylicious"]=[{"w": 206, "h": 269}, {"w": 212, "h": 263}, {"w": 190, "h": 273}, {"w": 189, "h": 278}];

RitualSprites.walkRects["perrotech"]=[[[82, 24, 202, 278], [380, 25, 201, 281], [681, 24, 200, 276], [972, 25, 201, 279]], [[82, 328, 192, 280], [384, 330, 189, 278], [679, 328, 193, 278], [976, 327, 192, 281]], [[90, 636, 157, 280], [388, 637, 172, 273], [684, 636, 169, 275], [982, 636, 159, 283]], [[112, 949, 157, 280], [392, 951, 172, 273], [701, 951, 169, 275], [1017, 944, 159, 283]]];
RitualSprites.bodyMetrics["perrotech"]=[{"w": 202, "h": 281}, {"w": 193, "h": 281}, {"w": 172, "h": 283}, {"w": 172, "h": 283}];

RitualSprites.walkRects["sazonix"]=[[[91, 21, 189, 288], [383, 21, 190, 290], [675, 21, 192, 289], [971, 20, 191, 291]], [[91, 328, 189, 282], [383, 328, 191, 280], [675, 328, 192, 286], [970, 328, 192, 282]], [[92, 633, 176, 279], [377, 633, 181, 276], [668, 634, 178, 274], [970, 633, 179, 275]], [[101, 940, 180, 275], [392, 940, 185, 275], [690, 940, 178, 275], [983, 940, 179, 275]]];
RitualSprites.bodyMetrics["sazonix"]=[{"w": 192, "h": 291}, {"w": 192, "h": 286}, {"w": 181, "h": 279}, {"w": 185, "h": 275}];

RitualSprites.walkRects["sr-mr"]=[[[98, 25, 178, 266], [394, 25, 177, 267], [687, 26, 177, 263], [981, 26, 180, 273]], [[88, 324, 191, 270], [383, 323, 192, 272], [679, 324, 194, 270], [976, 325, 192, 271]], [[92, 631, 170, 265], [386, 628, 179, 268], [684, 631, 170, 266], [978, 631, 180, 269]], [[93, 940, 173, 264], [393, 940, 177, 264], [690, 940, 171, 264], [988, 940, 170, 266]]];
RitualSprites.bodyMetrics["sr-mr"]=[{"w": 180, "h": 273}, {"w": 194, "h": 272}, {"w": 180, "h": 269}, {"w": 177, "h": 266}];

RitualSprites.walkRects["michia"]=[[[112, 67, 170, 244], [399, 67, 170, 244], [685, 67, 171, 244], [971, 67, 171, 243]], [[111, 351, 171, 245], [398, 351, 171, 246], [685, 351, 171, 246], [971, 351, 172, 245]], [[121, 648, 142, 243], [407, 648, 139, 243], [694, 648, 138, 244], [983, 648, 138, 244]], [[128, 940, 143, 237], [415, 940, 145, 237], [699, 940, 147, 237], [990, 940, 143, 237]]];
RitualSprites.bodyMetrics["michia"]=[{"w": 171, "h": 244}, {"w": 172, "h": 246}, {"w": 142, "h": 244}, {"w": 147, "h": 237}];

// Character-specific reaction followed by separated pixel sparks, not a sphere.
RitualSprites.drawDefeat=function(ctx,p,phase){
 const f=this.walkFrame(p.character,'down',0);if(!f)return;ctx.imageSmoothingEnabled=false;
 if(phase<6){const [sx,sy,w,h]=f.rect,k=Math.min(56/w,68/h),wide=[1,1.08,.95,1.1,1.14,1.2][phase],high=[1,.92,1.06,.9,.8,.65][phase];ctx.save();ctx.rotate([0,-.09,.09,-.12,.12,0][phase]);ctx.globalAlpha=phase===5?.65:1;ctx.drawImage(f.source,sx,sy,w,h,-w*k*wide/2,24-h*k*high,w*k*wide,h*k*high);ctx.restore();}
 else{const t=(phase-6)/5;ctx.globalAlpha=1-t*.85;for(let i=0;i<10;i++){const a=i*Math.PI/5,r=9+t*32,x=Math.round(Math.cos(a)*r),y=Math.round(-8+Math.sin(a)*r-t*12);ctx.fillStyle=[p.color,'#d9b3ff','#b7ff70','#fff1c7'][i%4];const size=t<.5?5:3;ctx.fillRect(x-size/2,y-size/2,size,size);}}
};
