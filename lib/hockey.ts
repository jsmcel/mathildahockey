import { birdById, birdSvg, type BirdId } from './birds';

export type Options = { sound: boolean; auto: boolean; slow: boolean; effects: boolean; target: number };
export type Snapshot = { ours: number; theirs: number; active: number; power: number; message: string; goal: boolean; finished: boolean; possession: boolean; skill: string };
type Player = { x: number; y: number; id: string; team: number; frozen: number };
const W = 1000, H = 560;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const distance = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x-b.x, a.y-b.y);

export class Hockey {
  players: Player[] = [];
  puck = { x: 330, y: 280, vx: 0, vy: 0, owner: 0, lock: 0, super: false };
  state: Snapshot = { ours: 0, theirs: 0, active: 0, power: 100, message: '¡Vamos, Jorge! Ataca hacia la derecha →', goal: false, finished: false, possession: true, skill: '' };
  paused = false;
  direction = { x: 0, y: 0 };
  target: {x:number;y:number}|null = null;
  clock = 0;
  goalWait = 0;
  boosted = 0;
  protectedUntil = 0;
  nextSteal = 0;
  nextShot = 0;
  images: Record<string, HTMLImageElement> = {};
  raf = 0;
  last = 0;
  emitAt = 0;
  width = 1000;
  height = 560;
  audio: AudioContext|null = null;
  constructor(public canvas: HTMLCanvasElement, public team: BirdId[], public rival: number, public options: Options, public onUpdate: (s: Snapshot) => void) {
    const ids = [...team, 'pig','pighelmet',rival === 2 ? 'pigking':'pig'];
    ids.forEach(id => { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(birdSvg(id, true)); this.images[id] = img; });
    this.reset(); this.emit(); this.raf = requestAnimationFrame(this.frame);
  }
  reset() {
    this.players = [
      {x:330,y:280,id:this.team[0],team:0,frozen:0}, {x:260,y:160,id:this.team[1],team:0,frozen:0}, {x:260,y:400,id:this.team[2],team:0,frozen:0},
      {x:685,y:280,id:'pig',team:1,frozen:0}, {x:750,y:155,id:'pighelmet',team:1,frozen:0}, {x:750,y:405,id:this.rival===2?'pigking':'pig',team:1,frozen:0},
    ];
    this.state.active=0; Object.assign(this.puck,{x:330,y:280,vx:0,vy:0,owner:0,lock:0,super:false});
    this.target=null; this.direction={x:0,y:0}; this.state.goal=false;
  }
  emit() {
    this.state.possession=this.puck.owner>=0 && this.puck.owner<3;
    this.state.skill=birdById(this.players[this.state.active]?.id).skill;
    this.onUpdate({...this.state});
  }
  setActive(i:number) { if(i<0||i>2||this.paused||this.goalWait||this.state.finished)return; if(this.puck.owner>=0&&this.puck.owner<3){this.pass(i);return;} this.state.active=i;this.target=null;this.emit(); }
  pass(to?:number) {
    if(this.paused||this.goalWait||this.state.finished)return;
    if(this.puck.owner>=0&&this.puck.owner<3){
      const from=this.puck.owner;const next=to??(from+1)%3;
      if(next===from)return;
      this.puck.owner=next;this.puck.lock=.8;this.state.active=next;this.state.message=`¡Pase a ${birdById(this.players[next].id).name}!`;this.tone(460,.08);
    }else{this.state.active=(this.state.active+1)%3;this.state.message=`Ahora patinas con ${birdById(this.players[this.state.active].id).name}.`;}
    this.target=null;this.emit();
  }
  shoot(special=false) {
    if(this.paused||this.goalWait||this.state.finished)return;
    const p=this.players[this.state.active];
    if(this.puck.owner!==this.state.active){
      if(this.puck.owner>=0&&this.puck.owner<3){this.state.active=this.puck.owner;}
      else if(distance(p,this.puck)<100){this.puck.owner=this.state.active;this.puck.lock=1;this.state.message='¡Tienes el disco! Pulsa TIRAR.';this.emit();return;}
      else{this.target={x:this.puck.x,y:this.puck.y};this.state.message='Vamos a por el disco.';this.emit();return;}
    }
    const shooter=this.players[this.state.active];const def=birdById(shooter.id);
    const goalY=280+Math.sin(this.clock*1.3)*35;const dx=970-shooter.x,dy=goalY-shooter.y;const len=Math.hypot(dx,dy);
    const power=def.power*(special?1.6:1);this.puck.owner=-1;this.puck.x=shooter.x+35;this.puck.y=shooter.y;
    this.puck.vx=dx/len*power;this.puck.vy=dy/len*power;this.puck.lock=.28;this.puck.super=special;
    this.state.message=special?`¡${def.skill}!`:'¡Buen tiro, Jorge!';this.tone(special?620:360,.13);this.emit();
  }
  special() {
    if(this.paused||this.goalWait||this.state.finished||this.state.power<100)return;
    const player=this.players[this.state.active];const id=player.id;
    if(['matilda','red'].includes(id) && !(this.puck.owner>=0&&this.puck.owner<3)){this.state.message='Recupera el disco para tu tiro especial.';this.emit();return;}
    this.state.power=0;
    if(id==='matilda'||id==='red')this.shoot(true);
    if(id==='chuck'){this.boosted=this.clock+7;this.state.message='¡Chuck patina a toda velocidad!';}
    if(id==='bomb'){for(const p of this.players.slice(3))if(distance(p,player)<340)p.frozen=this.clock+4;if(distance(player,this.puck)<340){this.puck.owner=this.state.active;this.puck.lock=1;}this.state.message='¡Bomb hace espacio con su onda de aire!';}
    if(id==='blues'){for(const p of this.players.slice(0,3))p.x=clamp(p.x+170,85,850);this.puck.owner=this.state.active;this.puck.lock=1;this.state.message='¡Pase mágico! El equipo avanza.';}
    if(id==='stella'){this.protectedUntil=this.clock+8;this.state.message='¡Una burbuja protege el disco!';}
    this.emit();
  }
  tone(freq:number,duration:number){
    if(!this.options.sound)return;
    try{this.audio??=new AudioContext();void this.audio.resume();const osc=this.audio.createOscillator(),gain=this.audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.055,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+duration);osc.connect(gain);gain.connect(this.audio.destination);osc.start();osc.stop(this.audio.currentTime+duration);}catch{}
  }
  pause(value:boolean){this.paused=value;this.direction={x:0,y:0};this.target=null;}
  goal(team:number){
    if(this.goalWait)return;
    if(team===0)this.state.ours++;else this.state.theirs++;
    this.state.goal=true;this.goalWait=2.7;
    this.state.finished=this.state.ours>=this.options.target||this.state.theirs>=this.options.target;
    this.state.message=team===0?'¡Gooool! ¡Bien jugado, Jorge!':'Gol de los piggies. ¡Vamos a por el siguiente!';this.state.power=100;
    if(team===0)this.tone(660,.35);this.emit();
  }
  move(p:Player,x:number,y:number,speed:number,dt:number){const dx=x-p.x,dy=y-p.y,len=Math.hypot(dx,dy);if(len>3){const step=Math.min(speed*dt,len);p.x=clamp(p.x+dx/len*step,75,925);p.y=clamp(p.y+dy/len*step,78,482);}}
  update(dt:number){
    if(this.paused)return;
    if(this.goalWait>0){if(!this.state.finished){this.goalWait-=dt;if(this.goalWait<=0){this.goalWait=0;this.reset();this.state.message='¡Seguimos! La portería está a la derecha →';this.emit();}}return;}
    if(this.state.finished)return;
    this.clock+=dt;this.puck.lock=Math.max(0,this.puck.lock-dt);this.state.power=Math.min(100,this.state.power+dt*6);
    const owner=this.puck.owner,active=this.players[this.state.active];const pace=this.options.slow?.72:1;
    this.players.forEach((p,i)=>{
      if(p.frozen>this.clock)return;
      const speed=(p.team===0?birdById(p.id).speed:78+this.rival*17)*pace*(i===this.state.active&&this.boosted>this.clock?1.85:1);
      if(i===this.state.active){
        if(Math.hypot(this.direction.x,this.direction.y)>.08){p.x=clamp(p.x+this.direction.x*speed*dt,75,925);p.y=clamp(p.y+this.direction.y*speed*dt,78,482);this.target=null;}
        else if(this.target){this.move(p,this.target.x,this.target.y,speed,dt);if(distance(p,this.target)<9)this.target=null;}
        else if(this.options.auto){if(owner===i)this.move(p,790,280+Math.sin(this.clock*.45)*70,speed*.68,dt);else if(owner<0||owner>=3)this.move(p,this.puck.x,this.puck.y,speed,dt);else this.move(p,clamp(this.players[owner].x+100,120,830),i===0?280:i===1?150:410,speed*.6,dt);}
      }else if(p.team===0){if(owner===i){this.state.active=i;}else if(owner>=0&&owner<3)this.move(p,clamp(this.players[owner].x-100+(i===1?40:0),100,780),i===1?155:410,speed*.56,dt);else this.move(p,i===1?300:420,i===1?170:390,speed*.5,dt);}
      else{
        if(owner===i){this.move(p,180,280,speed*.9,dt);if(p.x<410&&this.clock>this.nextShot){this.nextShot=this.clock+6;this.puck.owner=-1;this.puck.vx=-360;this.puck.vy=(280-p.y)*1.1;this.puck.lock=.35;this.puck.super=false;}}
        else {const chaser=this.players.slice(3).reduce((best,other)=>distance(other,this.puck)<distance(best,this.puck)?other:best);if(p===chaser)this.move(p,this.puck.x,this.puck.y,speed*.78,dt);else this.move(p,owner>=3?460:650,i===4?165:395,speed*.6,dt);}
      }
    });
    if(this.puck.owner>=0){const p=this.players[this.puck.owner];this.puck.x=p.x+(p.team===0?29:-29);this.puck.y=p.y+15;
      if(!this.puck.lock&&this.clock>this.nextSteal){const enemy=this.players.find(p2=>p2.team!==p.team&&distance(p2,p)<43&&p2.frozen<this.clock);if(enemy&&!(p.team===0&&this.protectedUntil>this.clock)){this.puck.owner=this.players.indexOf(enemy);this.puck.lock=1.5;this.nextSteal=this.clock+3;if(enemy.team===0)this.state.active=this.puck.owner;this.state.message=enemy.team===0?'¡Disco recuperado!':'Los piggies tienen el disco. ¡Vamos a recuperarlo!';this.emit();}}
    }else{
      this.puck.x+=this.puck.vx*dt;this.puck.y+=this.puck.vy*dt;const friction=Math.exp(-.19*dt);this.puck.vx*=friction;this.puck.vy*=friction;
      if(this.puck.y<60||this.puck.y>500){this.puck.y=clamp(this.puck.y,60,500);this.puck.vy*=-.8;}
      if(this.puck.x>946&&this.puck.y>212&&this.puck.y<348){this.goal(0);return;}
      if(this.puck.x<54&&this.puck.y>212&&this.puck.y<348){this.goal(1);return;}
      if(this.puck.x<55||this.puck.x>945){this.puck.x=clamp(this.puck.x,55,945);this.puck.vx*=-.7;}
      // The friendly keeper blocks slowly; piggy keepers can save ordinary shots.
      if(this.puck.vx<0&&this.puck.x<116&&Math.abs(this.puck.y-this.keeperY(0))<36){this.puck.vx=250;this.puck.lock=.35;this.state.message='¡Buena parada de nuestro portero!';}
      if(!this.puck.super&&this.puck.vx>0&&this.puck.x>885&&this.puck.x<915&&Math.abs(this.puck.y-this.keeperY(1))<20+this.rival*3){this.puck.vx=-220;this.puck.vy+=85;this.puck.lock=.45;this.state.message='¡El portero la para! Probamos otra vez.';}
      if(!this.puck.lock&&!this.puck.super){const catcher=this.players.find(p=>distance(p,this.puck)<38&&p.frozen<this.clock);if(catcher){this.puck.owner=this.players.indexOf(catcher);this.puck.lock=1;if(catcher.team===0)this.state.active=this.puck.owner;}}
    }
    if(this.clock-this.emitAt>.2){this.emitAt=this.clock;this.emit();}
  }
  keeperY(team:number){return 280+Math.sin(this.clock*(team?1.1:.7)+(team?2:0))*(team?51:34);}
  frame=(now:number)=>{const dt=Math.min((now-(this.last||now))/1000,.035);this.last=now;this.update(dt);this.draw();this.raf=requestAnimationFrame(this.frame);};
  draw(){
    const ctx=this.canvas.getContext('2d');if(!ctx)return;
    const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    const cw=Math.round(rect.width*dpr),ch=Math.round(rect.height*dpr);if(this.canvas.width!==cw||this.canvas.height!==ch){this.canvas.width=cw;this.canvas.height=ch;}
    ctx.setTransform(cw/W,0,0,ch/H,0,0);ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#6c9e9a';ctx.fillRect(0,0,W,H);
    // Quiet stadium stands, with a small piggy crowd.
    for(let i=0;i<24;i++){ctx.fillStyle=i%3===0?'#c6d5a6':'#a3c7a1';ctx.beginPath();ctx.arc(38+i*40,17,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#527c67';ctx.beginPath();ctx.ellipse(38+i*40,20,5,3,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#f5f5e9';ctx.beginPath();ctx.roundRect(25,38,950,488,70);ctx.fill();ctx.strokeStyle='#ded7c5';ctx.lineWidth=11;ctx.stroke();
    ctx.fillStyle='#e5f2f2';ctx.beginPath();ctx.roundRect(43,55,914,450,53);ctx.fill();
    ctx.save();ctx.beginPath();ctx.roundRect(43,55,914,450,53);ctx.clip();
    ctx.strokeStyle='#cbdfe0';ctx.lineWidth=1;for(let i=0;i<15;i++){ctx.beginPath();ctx.moveTo(40,60+i*33);ctx.lineTo(960,45+i*33);ctx.stroke();}
    ctx.fillStyle='#bddadb';ctx.globalAlpha=.3;ctx.font='900 44px Trebuchet MS';ctx.textAlign='center';ctx.fillText('EL EQUIPO DE JORGE',500,286);ctx.globalAlpha=1;
    ctx.strokeStyle='#b4d2d7';ctx.lineWidth=4;for(const x of [330,670]){ctx.beginPath();ctx.moveTo(x,55);ctx.lineTo(x,505);ctx.stroke();}
    ctx.strokeStyle='#d9948f';ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.beginPath();ctx.moveTo(500,55);ctx.lineTo(500,505);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(500,280,68,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d9948f';ctx.beginPath();ctx.arc(500,280,5,0,Math.PI*2);ctx.fill();
    for(const x of [220,780])for(const y of [155,405]){ctx.strokeStyle='#c7b5b4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,51,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#cde3e7';for(const x of [60,940]){ctx.beginPath();ctx.ellipse(x,280,70,78,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    // Nets.
    for(const x of [24,948]){ctx.fillStyle='#f9f8ee';ctx.fillRect(x,219,29,122);ctx.strokeStyle='#c2d1ce';ctx.lineWidth=1;for(let y=222;y<341;y+=12){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+28,y);ctx.stroke();}for(let xx=x;xx<x+30;xx+=9){ctx.beginPath();ctx.moveTo(xx,220);ctx.lineTo(xx,340);ctx.stroke();}ctx.strokeStyle='#c86961';ctx.lineWidth=5;ctx.strokeRect(x,217,29,126);}
    // Keepers.
    this.drawPlayer(ctx,{x:94,y:this.keeperY(0),id:this.team[0],team:0,frozen:0},false,true);
    this.drawPlayer(ctx,{x:906,y:this.keeperY(1),id:'pighelmet',team:1,frozen:0},false,true);
    this.players.forEach((p,i)=>this.drawPlayer(ctx,p,i===this.state.active,false));
    if(this.target){ctx.strokeStyle='#2a8279';ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.target.x,this.target.y,15,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#2c3e47';ctx.beginPath();ctx.ellipse(this.puck.x,this.puck.y+3,10,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.puck.super?'#f1c65c':'#475a64';ctx.beginPath();ctx.ellipse(this.puck.x,this.puck.y,10,5,0,0,Math.PI*2);ctx.fill();
    if(this.state.goal&&!this.state.finished){ctx.fillStyle='#fffaf0ef';ctx.beginPath();ctx.roundRect(290,205,420,140,25);ctx.fill();ctx.fillStyle='#247d70';ctx.font='900 47px Trebuchet MS';ctx.textAlign='center';ctx.fillText(this.state.message.startsWith('¡Goo')?'¡GOOOL, JORGE!':'¡Seguimos jugando!',500,269);ctx.font='22px Trebuchet MS';ctx.fillText(`${this.state.ours} — ${this.state.theirs}`,500,315);}
  }
  drawPlayer(ctx:CanvasRenderingContext2D,p:Player,active:boolean,keeper:boolean){
    const size=keeper?67:78;
    ctx.fillStyle='#3d70741a';ctx.beginPath();ctx.ellipse(p.x,p.y+22,28,8,0,0,Math.PI*2);ctx.fill();
    if(active){ctx.strokeStyle='#25867b';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+18,36,15,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#25867b';ctx.beginPath();ctx.moveTo(p.x-7,p.y-53);ctx.lineTo(p.x+7,p.y-53);ctx.lineTo(p.x,p.y-43);ctx.fill();}
    if(active&&this.protectedUntil>this.clock){ctx.strokeStyle='#bc87b6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y-7,43,0,Math.PI*2);ctx.stroke();}
    const img=this.images[p.id];if(img?.complete&&img.naturalWidth)ctx.drawImage(img,p.x-size/2,p.y-size*.72,size,size);
    if(p.team===1){ctx.fillStyle='#b65c50';ctx.beginPath();ctx.roundRect(p.x-18,p.y+19,36,9,4);ctx.fill();}
    if(p.frozen>this.clock){ctx.fillStyle='#7e9fb4';ctx.font='23px sans-serif';ctx.textAlign='center';ctx.fillText('· · ·',p.x,p.y-35);}
  }
  destroy(){cancelAnimationFrame(this.raf);void this.audio?.close();}
}
