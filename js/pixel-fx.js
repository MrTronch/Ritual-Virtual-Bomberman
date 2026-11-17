const PixelFX = {
  bomb(ctx,b) {
    const x=Math.round(b.x)-16,y=Math.round(b.y)-14;
    ctx.save();ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+4,y+28,25,4);
    // A circular 16px sphere with a stepped outline and discrete shaded bands.
    for(let py=0;py<16;py++)for(let px=0;px<16;px++){
      const d=(px-7.5)**2+(py-7.5)**2;
      if(d>56)continue;
      let color=d>40?'#111222':py>10?'#21253c':'#343b58';
      if(d<38 && px<7 && py<7)color='#637496';
      if((px===4||px===5) && (py===3||py===4))color='#edf6ff';
      ctx.fillStyle=color;ctx.fillRect(x+px*2,y+py*2,2,2);
    }
    ctx.fillStyle='#d0bb9e';ctx.fillRect(x+18,y-2,4,6);ctx.fillRect(x+20,y-6,6,4);
    ctx.fillStyle=Math.floor(b.age*12)%2?'#fff4a0':'#ff662c';ctx.fillRect(x+24,y-8,4,4);
    ctx.fillStyle='#ff662c';ctx.fillRect(x+28,y-10,2,2);ctx.restore();
  },
  explosion(ctx,ex) {
    const phase=Math.floor(ex.age/65)%4,t=ex.age/EXPLOSION_DURATION;
    const colors=['#de351b','#ff7224','#ffc63c','#fff4aa'];
    ctx.save();ctx.globalAlpha=t>.85?(1-t)/.15:1;
    for(const cell of ex.cells){
      const hor=cell.dir==='left'||cell.dir==='right',vert=cell.dir==='up'||cell.dir==='down';
      for(let y=0;y<12;y++)for(let x=0;x<12;x++){
        const across=hor?Math.abs(y-5.5):vert?Math.abs(x-5.5):Math.min(Math.abs(x-5.5),Math.abs(y-5.5));
        let limit=4+((x+y+phase)%3===0?1:0);
        if(cell.end){const along=cell.dir==='right'?x:cell.dir==='left'?11-x:cell.dir==='down'?y:11-y;limit-=Math.max(0,along-6)*.65;}
        if(across>limit)continue;
        const layer=across<1.5?3:across<2.5?2:across<3.7?1:0;
        ctx.fillStyle=colors[layer];ctx.fillRect(cell.x*TILE+x*4,cell.y*TILE+y*4,4,4);
      }
    }ctx.restore();
  }
};
