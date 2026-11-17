// Shared by gameplay and the offline frame-by-frame animation viewer.
const DefeatAnimation={
 ids:['psicogato','bunnylicious','perrotech','sazonix','sr-mr','michia','max'],
 names:['Psicogato','Bunnylicious','Perrotech','Sazonix','Sr. Mr.','Michia','Max'],
 reactions:Object.assign(new Image(),{src:'reactions.webp'}),
 bursts:Object.assign(new Image(),{src:'assets/defeat/bursts.webp'}),
 rects:[[[54, 22, 112, 147], [239, 22, 137, 147], [398, 23, 161, 146], [576, 22, 160, 147], [776, 22, 115, 148], [938, 11, 151, 161], [1115, 24, 119, 147]], [[35, 187, 147, 159], [220, 182, 160, 165], [400, 189, 149, 158], [580, 191, 147, 152], [764, 190, 136, 154], [938, 176, 155, 171], [1105, 193, 137, 155]], [[43, 361, 130, 154], [227, 361, 142, 153], [396, 364, 150, 151], [572, 364, 160, 150], [766, 364, 129, 151], [938, 359, 147, 156], [1108, 366, 132, 150]], [[52, 531, 110, 158], [236, 529, 135, 160], [396, 532, 149, 157], [578, 531, 149, 157], [771, 529, 109, 159], [938, 528, 150, 161], [1117, 532, 115, 157]], [[46, 710, 122, 135], [230, 695, 145, 150], [393, 709, 154, 134], [570, 711, 154, 130], [766, 711, 117, 131], [931, 699, 157, 143], [1112, 708, 123, 135]], [[52, 856, 110, 169], [234, 856, 137, 173], [400, 857, 144, 168], [581, 856, 141, 169], [770, 855, 114, 170], [943, 857, 126, 172], [1116, 856, 118, 169]], [[40, 1036, 121, 178], [225, 1029, 165, 186], [390, 1036, 162, 177], [571, 1037, 164, 176], [763, 1036, 126, 178], [927, 1029, 161, 186], [1106, 1035, 140, 181]]],burstRects:[[114, 99, 315, 324], [580, 86, 367, 357], [1089, 90, 366, 349], [112, 596, 330, 321], [631, 635, 272, 248]],
 phases:['Reposo','Sorpresa','Temblor','Alarma','Hinchado','Hinchado máximo','Silueta blanca','Destello','Explosión','Humo','Dispersión','Chispas'],
 draw(ctx,id,phase){
  const row=this.ids.indexOf(id);phase=Math.max(0,Math.min(11,Math.floor(phase)));
  const source=phase<7?this.reactions:this.bursts,rect=phase<7?this.rects[row]?.[phase]:this.burstRects[phase-7];
  if(!rect||!source.complete||!source.naturalWidth)return false;
  const [x,y,w,h]=rect;ctx.save();ctx.imageSmoothingEnabled=false;
  if(phase<7){const base=this.rects[row][0],k=Math.min(60/base[2],72/base[3]);ctx.drawImage(source,x,y,w,h,-w*k/2,24-h*k,w*k,h*k);}
  else{const sizes=[62,88,82,84,72],size=sizes[phase-7],k=size/Math.max(w,h);ctx.drawImage(source,x,y,w,h,-w*k/2,-12-h*k/2,w*k,h*k);}
  ctx.restore();return true;
 }
};
DefeatAnimation.ready=Promise.all([DefeatAnimation.reactions,DefeatAnimation.bursts].map(im=>im.decode().catch(()=>{})));
if(typeof RitualSprites!=='undefined'){
 const defeatBeforeAtlas=RitualSprites.drawDefeat;
 RitualSprites.drawDefeat=function(ctx,p,phase){if(!DefeatAnimation.draw(ctx,p.character,phase))defeatBeforeAtlas.call(this,ctx,p,phase);};
}

DefeatAnimation.rects=[[[49, 10, 119, 161], [236, 10, 142, 161], [396, 10, 165, 161], [574, 10, 164, 161], [774, 9, 119, 163], [936, 5, 153, 169], [1113, 23, 123, 150]], [[34, 182, 148, 166], [219, 180, 163, 169], [398, 182, 153, 167], [578, 182, 151, 163], [756, 179, 144, 167], [931, 174, 164, 175], [1104, 191, 140, 159]], [[43, 359, 130, 157], [227, 359, 142, 157], [396, 359, 150, 157], [572, 359, 160, 157], [764, 362, 133, 154], [936, 359, 149, 158], [1106, 364, 136, 153]], [[52, 531, 110, 160], [236, 529, 135, 162], [394, 532, 152, 158], [576, 529, 153, 160], [769, 529, 114, 162], [938, 528, 150, 163], [1115, 530, 119, 161]], [[46, 696, 122, 151], [230, 695, 145, 151], [391, 696, 158, 149], [570, 696, 156, 146], [763, 696, 120, 148], [929, 695, 161, 149], [1110, 706, 127, 139]], [[46, 852, 123, 175], [227, 852, 144, 177], [400, 852, 144, 175], [581, 852, 141, 175], [762, 853, 130, 172], [937, 853, 132, 176], [1112, 851, 134, 178]], [[38, 1034, 125, 182], [224, 1029, 166, 187], [385, 1034, 167, 181], [571, 1035, 164, 180], [761, 1035, 130, 181], [926, 1029, 162, 188], [1104, 1033, 144, 185]]];
