// Music slot reserved for Ritual Virtual original soundtrack. No synth nodes or timers.
class Music {
 constructor(sfx){ this.sfx=sfx;this.track=null;this.timer=null;this.volume=0;this.duck=1; }
 setVolume(){this.volume=0;}
 setDuck(d){this.duck=d;}
 refreshMute(){}
 play(){}
 stop(){this.track=null;this.timer=null;}
 stopTimer(){this.timer=null;}
 resume(){}
}
