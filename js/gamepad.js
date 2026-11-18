// Start claims a stable J1–J4 slot. Other controllers never inherit that slot
// simply because a preceding controller disconnects.
const PAD_MAPS=[
 {up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',bomb:'KeyM',glove:'KeyN'},
 {up:'KeyI',down:'KeyK',left:'KeyJ',right:'KeyL',bomb:'Enter',glove:'KeyO'},
 {up:'KeyT',down:'KeyG',left:'KeyF',right:'KeyH',bomb:'KeyC',glove:'KeyY'},
 {up:'Numpad8',down:'Numpad5',left:'Numpad4',right:'Numpad6',bomb:'Numpad0',glove:'NumpadDecimal'}
];
class GamepadInput {
 constructor(input,isMenu){
  this.input=input;this.isMenu=isMenu;this.held=Array.from({length:4},()=>new Set());this.menuMode=Array(4).fill(null);
  this.joined=Array(4).fill(null);this.joinStart=new Set();this.startHeld=new Map();this.repeatState=Array.from({length:4},()=>new Map());this.connected=0;this.onConnect=null;this.onJoin=null;this.menuOwner=()=>0;
  window.addEventListener('gamepadconnected',e=>{this.connected++;if(this.onConnect)this.onConnect(e.gamepad);});
  window.addEventListener('gamepaddisconnected',e=>{this.connected=Math.max(0,this.connected-1);this.releaseController(e.gamepad.index);});
 }
 releaseController(index){const slot=this.joined.indexOf(index);if(slot>=0){this.apply(slot,new Set(),false);this.joined[slot]=null;this.menuMode[slot]=null;}this.startHeld.delete(index);}
 ready(count){let pads;try{pads=Array.from(navigator.getGamepads?.()||[]);}catch{return false;}return this.joined.slice(0,count).every(index=>index!==null&&pads.some(p=>p&&p.connected&&p.index===index))&&new Set(this.joined.slice(0,count)).size===count;}
 pressed(pad,n){return !!(pad.buttons[n]&&(pad.buttons[n].pressed||pad.buttons[n].value>.5));}
 poll(){
  if(!navigator.getGamepads)return;
  let pads;try{pads=Array.from(navigator.getGamepads()).filter(p=>p&&p.connected);}catch{return;}
  for(const index of [...this.joined])if(index!==null&&!pads.some(p=>p.index===index))this.releaseController(index);
  const newlyJoined=new Set();
  for(const pad of pads){
   const start=this.pressed(pad,9);if(!start)this.joinStart.delete(pad.index);const edge=start&&!this.startHeld.get(pad.index);this.startHeld.set(pad.index,start);
   if(edge&&!this.joined.includes(pad.index)){
    const slot=this.joined.indexOf(null);
    if(slot>=0&&(!this.onJoin||this.onJoin(slot,pad)!==false)){this.joined[slot]=pad.index;newlyJoined.add(pad.index);this.joinStart.add(pad.index);}
   }
  }
  for(let slot=0;slot<4;slot++){
   const pad=pads.find(p=>p.index===this.joined[slot]);if(!pad){this.apply(slot,new Set(),false);continue;}
   if(this.inLobby?.()){const codes=this.codesFor(pad,PAD_MAPS[0],true,this.joinStart.has(pad.index));const old=this.lobbyHeld?.[slot]||new Set();for(const code of codes)if(!old.has(code))this.lobbyInput(slot,code);if(!this.lobbyHeld)this.lobbyHeld=[];this.lobbyHeld[slot]=codes;this.apply(slot,new Set(),false);continue;}
   this.lobbyHeld=[];
   const anyMenu=this.isMenu(),menu=anyMenu&&slot===this.menuOwner();
   const remapped=this.menuMode[slot]!==null&&this.menuMode[slot]!==menu;this.menuMode[slot]=menu;
   const codes=anyMenu&&!menu?new Set():this.codesFor(pad,(menu||!this.controllerOnly?.()?PAD_MAPS[menu?0:slot]:Object.fromEntries(Object.entries(CONTROLLER_KEYS[slot]).map(([a,c])=>[a,c[0]]))),menu,this.joinStart.has(pad.index));
   this.apply(slot,codes,remapped);
   const repeats=this.repeatState[slot],now=performance.now();
   for(const code of [...repeats.keys()])if(!menu||!codes.has(code))repeats.delete(code);
   if(menu)for(const code of codes)if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code)){
    if(!repeats.has(code))repeats.set(code,now+360);
    else if(now>=repeats.get(code)){this.input.pressed.add(code);repeats.set(code,now+180);}
   }
  }
  const signature=JSON.stringify(this.joined);if(signature!==this.assignmentSignature){this.assignmentSignature=signature;this.onAssignmentsChanged?.();}
 }
 codesFor(pad,map,menu,justJoined=false){
  const b=n=>this.pressed(pad,n),ax=pad.axes[0]||0,ay=pad.axes[1]||0,codes=new Set();
  if(b(12)||ay<-.45)codes.add(map.up);if(b(13)||ay>.45)codes.add(map.down);
  if(b(14)||ax<-.45)codes.add(map.left);if(b(15)||ax>.45)codes.add(map.right);
  if(menu){
   if(b(0)||b(2)||(b(9)&&!justJoined))codes.add('Enter');
   if(b(1)||b(8))codes.add('Backspace');
  }else{
   // PlayStation cross = button 0; square = button 2 (Xbox A / X).
   if(b(0))codes.add(map.bomb);
   if(b(2))codes.add(map.glove);
   if(b(9)&&!justJoined)codes.add('KeyP');
  }
  return codes;
 }
 apply(slot,codes,remapped){
  const previous=this.held[slot];
  for(const code of previous)if(!codes.has(code))this.input.release(code);
  for(const code of codes)if(!previous.has(code)){if(remapped)this.input.down.add(code);else this.input.press(code);}else if(!this.input.down.has(code))this.input.down.add(code);
  this.held[slot]=codes;
 }
}
