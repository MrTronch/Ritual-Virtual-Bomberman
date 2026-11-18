// Original MP3 soundtrack; one player prevents overlapping music across screens.
class Music {
 constructor(sfx){
  this.sfx=sfx;this.track=null;this.timer=null;this.volume=.5;this.duck=1;this.unlocked=false;this.pending=false;this.retryAt=0;this.generation=0;
  this.files={title:'audio/music-menu.mp3',ritual:'audio/music-ritual.mp3',jurassic:'audio/music-jurassic.mp3',overdrive:'audio/music-overdrive.mp3',inca:'audio/music-inti.mp3'};
  this.audio=new Audio();this.audio.loop=true;this.audio.preload='metadata';this.audio.setAttribute('playsinline','');this.audio.setAttribute('webkit-playsinline','');
  const unlock=()=>{this.unlocked=true;this.retryAt=0;this.resume();};
  for(const type of ['pointerdown','touchend','keydown','click'])document.addEventListener(type,unlock,{capture:true,passive:true});this.refreshMute();
 }
 setVolume(v){this.volume=Math.max(0,Math.min(1,Number.isFinite(v)?v:.5));this.refreshMute();}
 setDuck(d){this.duck=Math.max(0,Math.min(1,d));this.refreshMute();}
 refreshMute(){this.audio.muted=!!this.sfx.muted||this.volume===0;this.audio.volume=Math.max(0,Math.min(1,this.volume*this.duck));if(!this.audio.muted)this.resume();}
 resolve(key){if(key==='title')return 'title';if(this.files[key])return key;const arena=window.game?.arenaStyle;if(this.files[arena])return arena;return ({grass:'ritual',ice:'jurassic',desert:'ritual',factory:'overdrive',volcano:'jurassic'})[key]||'ritual';}
 play(key){const track=this.resolve(key);if(track!==this.track){this.generation++;this.pending=false;this.audio.pause();this.track=track;this.audio.src=this.files[track];this.audio.load();this.retryAt=0;}this.resume();}
 stop(){this.generation++;this.pending=false;this.audio.pause();this.track=null;this.timer=null;}
 stopTimer(){this.generation++;this.pending=false;this.audio.pause();this.timer=null;}
 resume(){if(!this.track||!this.unlocked||document.hidden||this.audio.muted||this.pending||!this.audio.paused||performance.now()<this.retryAt)return;this.pending=true;const generation=this.generation;const attempt=this.audio.play();if(attempt?.then)attempt.then(()=>{if(generation===this.generation)this.pending=false;}).catch(error=>{if(generation!==this.generation)return;this.pending=false;if(error.name==='NotAllowedError')this.unlocked=false;else this.retryAt=performance.now()+2000;});else this.pending=false;}
}
