import { birdById, birdSvg, type BirdId } from "./birds";
import { paintGame } from "./render";
import { PUCK_OFFSET_X, PUCK_OFFSET_Y } from "./viewport";

export type Options = {
  sound: boolean;
  auto: boolean;
  slow: boolean;
  effects: boolean;
  target: number;
};
export type Snapshot = {
  ours: number;
  theirs: number;
  active: number;
  power: number;
  message: string;
  goal: boolean;
  finished: boolean;
  possession: boolean;
  skill: string;
  queued: boolean;
  shotHint: string;
};
type Player = {
  x: number;
  y: number;
  id: string;
  team: number;
  frozen: number;
  vx?: number;
  vy?: number;
  lane?: number;
  chooseLaneAt?: number;
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export class Hockey {
  players: Player[] = [];
  puck = { x: 330, y: 280, vx: 0, vy: 0, owner: 0, lock: 0, super: false };
  state: Snapshot = {
    ours: 0,
    theirs: 0,
    active: 0,
    power: 100,
    message: "Pasa para acercarte y busca tu tiro. Yo patino y apunto.",
    goal: false,
    finished: false,
    possession: true,
    skill: "",
    queued: false,
    shotHint: "Acércate o pasa",
  };
  paused = false;
  direction = { x: 0, y: 0 };
  target: { x: number; y: number } | null = null;
  clock = 0;
  goalWait = 0;
  boosted = 0;
  protectedUntil = 0;
  nextSteal = 0;
  nextShot = 0;
  images: Record<string, HTMLImageElement> = {};
  atlas: HTMLImageElement;
  raf = 0;
  last = 0;
  emitAt = 0;
  width = 1000;
  height = 560;
  audio: AudioContext | null = null;
  arena: HTMLCanvasElement | null = null;
  passFlight: { x: number; y: number; to: number; start: number } | null = null;
  burst: {
    kind: string;
    x: number;
    y: number;
    start: number;
    duration: number;
  } | null = null;
  puckTrail: { x: number; y: number }[] = [];
  lastShooter = "";
  pendingShot: "normal" | "special" | null = null;
  nextPlayerShot = 0;
  keeperPositions = [280, 280];
  keeperHold: { team: number; until: number } | null = null;
  shotTeam = -1;
  setupUntil = 0;
  shotStarted = 0;
  lastGoalTeam = -1;
  constructor(
    public canvas: HTMLCanvasElement,
    public team: BirdId[],
    public rival: number,
    public options: Options,
    public onUpdate: (s: Snapshot) => void,
  ) {
    this.atlas = new Image();
    this.atlas.src = "./art/bird-team-v2.png";
    const ids = [...team, "pig", "pighelmet", rival === 2 ? "pigking" : "pig"];
    ids.forEach((id) => {
      const img = new Image();
      img.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(birdSvg(id, true));
      this.images[id] = img;
    });
    this.reset();
    this.emit();
    this.raf = requestAnimationFrame(this.frame);
  }
  reset() {
    this.players = [
      { x: 330, y: 280, id: this.team[0], team: 0, frozen: 0 },
      { x: 260, y: 160, id: this.team[1], team: 0, frozen: 0 },
      { x: 260, y: 400, id: this.team[2], team: 0, frozen: 0 },
      { x: 685, y: 280, id: "pig", team: 1, frozen: 0 },
      { x: 750, y: 155, id: "pighelmet", team: 1, frozen: 0 },
      {
        x: 750,
        y: 405,
        id: this.rival === 2 ? "pigking" : "pig",
        team: 1,
        frozen: 0,
      },
    ];
    this.state.active = 0;
    Object.assign(this.puck, {
      x: 330,
      y: 280,
      vx: 0,
      vy: 0,
      owner: 0,
      lock: this.rival === 0 ? 2.3 : 1.1,
      super: false,
    });
    this.target = null;
    this.direction = { x: 0, y: 0 };
    this.state.goal = false;
    this.passFlight = null;
    this.puckTrail = [];
    this.burst = null;
    this.pendingShot = null;
    this.keeperHold = null;
    this.keeperPositions = [280, 280];
    this.shotTeam = -1;
    this.setupUntil = 0;
    if (this.lastGoalTeam === 0 && this.rival > 0) {
      this.puck.owner = 3;
      this.puck.x = this.players[3].x - PUCK_OFFSET_X;
      this.puck.y = this.players[3].y + PUCK_OFFSET_Y;
    }
  }
  emit() {
    this.state.possession = this.puck.owner >= 0 && this.puck.owner < 3;
    this.state.skill = birdById(this.players[this.state.active]?.id).skill;
    this.state.queued = this.pendingShot !== null;
    const carrier = this.players[this.puck.owner];
    this.state.shotHint =
      !carrier || carrier.team !== 0
        ? "Voy a por el disco"
        : carrier.x < 620 || carrier.y < 200 || carrier.y > 335
          ? "Acércate o pasa"
          : this.blockedLane(carrier)
            ? "Pasa a un amigo"
            : "¡Buen tiro!";
    this.onUpdate({ ...this.state });
  }
  setActive(i: number) {
    if (i < 0 || i > 2 || this.paused || this.goalWait || this.state.finished)
      return;
    if (this.puck.owner >= 0 && this.puck.owner < 3) {
      this.pass(i);
      return;
    }
    this.state.active = i;
    this.pendingShot = null;
    this.target = null;
    this.emit();
  }
  pass(to?: number) {
    if (this.paused || this.goalWait || this.state.finished) return;
    this.pendingShot = null;
    if (this.puck.owner >= 0 && this.puck.owner < 3) {
      const from = this.puck.owner;
      const next = to ?? (from + 1) % 3;
      if (next === from) return;
      this.passFlight = {
        x: this.players[from].x + PUCK_OFFSET_X,
        y: this.players[from].y + PUCK_OFFSET_Y,
        to: next,
        start: this.clock,
      };
      this.puck.owner = next;
      this.puck.lock = 0.85;
      this.setupUntil = this.clock + 2;
      this.state.active = next;
      this.state.message = `¡Pase a ${birdById(this.players[next].id).name}! Busca un hueco.`;
      this.tone(460, 0.08);
    } else {
      this.state.active = (this.state.active + 1) % 3;
      this.state.message = `Ahora patinas con ${birdById(this.players[this.state.active].id).name}.`;
    }
    this.target = null;
    this.emit();
  }
  shoot(special = false) {
    if (this.paused || this.goalWait || this.state.finished) return;
    if (this.clock < this.nextPlayerShot) return;
    if (this.keeperHold) {
      this.pendingShot = special ? "special" : "normal";
      this.state.message = "El portero la tiene. Prepárate para recuperar.";
      this.emit();
      return;
    }
    const p = this.players[this.state.active];
    if (this.puck.owner !== this.state.active) {
      if (this.puck.owner >= 0 && this.puck.owner < 3) {
        this.state.active = this.puck.owner;
      } else if (
        this.puck.owner < 0 &&
        this.puck.vx > 240 &&
        this.lastShooter !== "pig"
      ) {
        // Repeated taps must never grab our own shot out of the air.
        return;
      } else if (this.puck.owner < 0 && distance(p, this.puck) < 60) {
        this.puck.owner = this.state.active;
        this.puck.lock = 0.7;
      } else {
        // Remember the tap and keep following the moving puck, not its old position.
        this.pendingShot = special ? "special" : "normal";
        this.target = null;
        this.state.message =
          "Voy a por el disco y tiro. ¡No hace falta tocar otra vez!";
        this.emit();
        return;
      }
    }
    const shooter = this.players[this.state.active];
    const def = birdById(shooter.id);
    this.passFlight = null;
    this.puckTrail = [];
    this.lastShooter = shooter.id;
    this.pendingShot = null;
    this.nextPlayerShot = this.clock + 0.65;
    this.shotTeam = 0;
    this.shotStarted = this.clock;
    const goalY = this.keeperY(1) > 280 ? 222 : 338;
    const power = def.power * (special ? 1.25 : 0.86);
    this.puck.owner = -1;
    this.puck.x = shooter.x + PUCK_OFFSET_X;
    this.puck.y = shooter.y + PUCK_OFFSET_Y;
    const aimY = goalY - this.puck.y;
    const aimX = 947 - this.puck.x;
    const aimLength = Math.hypot(aimX, aimY);
    this.puck.vx = (aimX / aimLength) * power;
    this.puck.vy = (aimY / aimLength) * power;
    this.puck.lock = 0.28;
    this.puck.super = special;
    this.state.message = special
      ? `¡${def.skill}!`
      : shooter.x < 590
        ? "Tiro lejano. Con un pase puedes acercarte más."
        : "¡Buen tiro, Jorge!";
    this.tone(special ? 620 : 360, 0.13);
    this.emit();
  }
  special() {
    if (
      this.paused ||
      this.goalWait ||
      this.state.finished ||
      this.state.power < 100
    )
      return;
    const player = this.players[this.state.active];
    const id = player.id;
    if (this.keeperHold && ["bomb", "blues"].includes(id)) {
      this.state.message =
        "El portero la tiene. Guarda ese poder para la salida.";
      this.emit();
      return;
    }
    if (
      ["matilda", "red"].includes(id) &&
      (this.clock < this.nextPlayerShot ||
        (this.puck.owner < 0 &&
          this.puck.vx > 240 &&
          this.lastShooter !== "pig"))
    ) {
      this.state.message =
        "El tiro ya va a portería. Tu superpoder sigue listo.";
      this.emit();
      return;
    }
    if (
      ["matilda", "red"].includes(id) &&
      !this.keeperHold &&
      this.puck.owner < 0 &&
      distance(player, this.puck) < 60
    ) {
      this.puck.owner = this.state.active;
      this.puck.lock = 0.7;
    }
    if (
      ["matilda", "red"].includes(id) &&
      !(this.puck.owner >= 0 && this.puck.owner < 3)
    ) {
      this.pendingShot = "special";
      this.target = null;
      this.state.message = "Voy a por el disco para tu superpoder.";
      this.emit();
      return;
    }
    this.state.power = 0;
    this.burst = {
      kind: id,
      x: player.x,
      y: player.y,
      start: this.clock,
      duration: 1.4,
    };
    if (id === "matilda" || id === "red") this.shoot(true);
    if (id === "chuck") {
      this.boosted = this.clock + 7;
      this.state.message = "¡Chuck patina a toda velocidad!";
    }
    if (id === "bomb") {
      for (const p of this.players.slice(3))
        if (distance(p, player) < 340) p.frozen = this.clock + 4;
      if (distance(player, this.puck) < 340) {
        this.puck.owner = this.state.active;
        this.puck.lock = 1;
      }
      this.state.message = "¡Bomb hace espacio con su onda de aire!";
    }
    if (id === "blues") {
      for (const p of this.players.slice(0, 3)) p.x = clamp(p.x + 170, 85, 850);
      this.puck.owner = this.state.active;
      this.puck.lock = 1;
      this.state.message = "¡Pase mágico! El equipo avanza.";
    }
    if (id === "stella") {
      this.protectedUntil = this.clock + 8;
      this.state.message = "¡Una burbuja protege el disco!";
    }
    this.emit();
  }
  tone(freq: number, duration: number) {
    if (!this.options.sound) return;
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume();
      const osc = this.audio.createOscillator(),
        gain = this.audio.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.055, this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audio.currentTime + duration,
      );
      osc.connect(gain);
      gain.connect(this.audio.destination);
      osc.start();
      osc.stop(this.audio.currentTime + duration);
    } catch {}
  }
  pause(value: boolean) {
    this.paused = value;
    this.direction = { x: 0, y: 0 };
    this.target = null;
    if (value) this.pendingShot = null;
  }
  goal(team: number) {
    if (this.goalWait) return;
    if (team === 0) this.state.ours++;
    else this.state.theirs++;
    this.lastGoalTeam = team;
    this.state.goal = true;
    this.pendingShot = null;
    this.goalWait = 2.7;
    this.state.finished =
      this.state.ours >= this.options.target ||
      this.state.theirs >= this.options.target;
    this.state.message =
      team === 0
        ? "¡Gooool! ¡Bien jugado, Jorge!"
        : "Gol de los piggies. ¡Vamos a por el siguiente!";
    if (team === 0) this.tone(660, 0.35);
    this.emit();
  }
  move(p: Player, x: number, y: number, speed: number, dt: number) {
    const dx = x - p.x,
      dy = y - p.y,
      len = Math.hypot(dx, dy);
    if (len > 3) {
      const step = Math.min(speed * dt, len);
      p.x = clamp(p.x + (dx / len) * step, 75, 925);
      p.y = clamp(p.y + (dy / len) * step, 78, 482);
    }
  }
  update(dt: number) {
    if (this.paused) return;
    if (this.goalWait > 0) {
      if (!this.state.finished) {
        this.goalWait -= dt;
        if (this.goalWait <= 0) {
          this.goalWait = 0;
          this.reset();
          this.state.message = "¡Seguimos! Pasa, acércate y busca tu tiro →";
          this.emit();
        }
      }
      return;
    }
    if (this.state.finished) return;
    this.clock += dt;
    this.puck.lock = Math.max(0, this.puck.lock - dt);
    this.state.power = Math.min(100, this.state.power + dt * 4);
    const owner = this.puck.owner,
      active = this.players[this.state.active];
    const pace = this.options.slow ? 0.72 : 1;
    const positions = this.players.map((p) => ({ x: p.x, y: p.y }));
    this.updateKeepers(dt);
    this.players.forEach((p, i) => {
      if (p.frozen > this.clock) return;
      const speed =
        (p.team === 0 ? birdById(p.id).speed : 116 + this.rival * 20) *
        pace *
        (i === this.state.active && this.boosted > this.clock ? 1.85 : 1);
      if (i === this.state.active) {
        if (Math.hypot(this.direction.x, this.direction.y) > 0.08) {
          const length = Math.max(
            1,
            Math.hypot(this.direction.x, this.direction.y),
          );
          p.x = clamp(p.x + (this.direction.x / length) * speed * dt, 75, 925);
          p.y = clamp(p.y + (this.direction.y / length) * speed * dt, 78, 482);
          this.target = null;
        } else if (this.target) {
          this.move(p, this.target.x, this.target.y, speed, dt);
          if (distance(p, this.target) < 9) this.target = null;
        } else if (this.options.auto || this.pendingShot) {
          if (owner === i) {
            const route = this.dribbleRoute(p, i);
            this.move(p, route.x, route.y, speed * 0.9, dt);
          } else if (owner < 0 || owner >= 3)
            this.move(p, this.puck.x, this.puck.y, speed, dt);
          else
            this.move(
              p,
              clamp(this.players[owner].x + 100, 120, 830),
              i === 0 ? 280 : i === 1 ? 150 : 410,
              speed * 0.6,
              dt,
            );
        }
      } else if (p.team === 0) {
        if (owner === i) {
          this.state.active = i;
        } else if (owner >= 0 && owner < 3)
          this.move(
            p,
            clamp(this.players[owner].x + 125, 150, 830),
            i === this.players.slice(0, 3).findIndex((_, j) => j !== owner)
              ? 160
              : 400,
            speed * 0.8,
            dt,
          );
        else
          this.move(
            p,
            i === 1 ? 300 : 420,
            i === 1 ? 170 : 390,
            speed * 0.5,
            dt,
          );
      } else {
        if (owner === i) {
          this.move(
            p,
            175,
            280 + (i === 4 ? -45 : i === 5 ? 45 : 0),
            speed * 0.94,
            dt,
          );
          if (
            p.x < 215 + this.rival * 8 &&
            this.clock > this.nextShot &&
            !this.keeperHold
          ) {
            this.nextShot = this.clock + 3.5;
            this.puck.owner = -1;
            const gx = 30 - this.puck.x,
              gy = (this.keeperY(0) > 280 ? 223 : 337) - this.puck.y,
              len = Math.hypot(gx, gy);
            this.puck.vx = (gx / len) * (510 + this.rival * 35);
            this.puck.vy = (gy / len) * (510 + this.rival * 35);
            this.puck.lock = 0.35;
            this.puck.super = false;
            this.lastShooter = "pig";
            this.shotTeam = 1;
            this.shotStarted = this.clock;
          }
        } else {
          const chaser = this.players
            .slice(3)
            .reduce((best, other) =>
              distance(other, this.puck) < distance(best, this.puck)
                ? other
                : best,
            );
          if (p === chaser)
            this.move(p, this.puck.x, this.puck.y, speed * 0.92, dt);
          else
            this.move(
              p,
              owner >= 3
                ? clamp(this.players[owner].x - 110, 200, 750)
                : clamp(this.puck.x + 130, 560, 845),
              i === 4 ? 165 : 395,
              speed * 0.6,
              dt,
            );
        }
      }
    });
    this.players.forEach((p, i) => {
      p.vx = (p.x - positions[i].x) / Math.max(dt, 0.001);
      p.vy = (p.y - positions[i].y) / Math.max(dt, 0.001);
    });
    if (this.keeperHold) {
      const team = this.keeperHold.team;
      this.puck.x = team === 0 ? 100 : 900;
      this.puck.y = this.keeperY(team);
      this.puck.vx = 0;
      this.puck.vy = 0;
      if (this.clock >= this.keeperHold.until) {
        const candidates = this.players
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.team === team);
        const receiver = candidates.reduce((best, other) =>
          distance(other.p, this.puck) < distance(best.p, this.puck)
            ? other
            : best,
        );
        this.puck.owner = receiver.i;
        this.puck.lock = 0.9;
        this.keeperHold = null;
        if (team === 0) this.state.active = receiver.i;
        this.state.message =
          team === 0
            ? "¡Nuestro portero saca! Avanza con un pase."
            : "Los piggies salen al ataque. ¡A defender!";
      }
    } else if (this.puck.owner >= 0) {
      const p = this.players[this.puck.owner];
      this.puck.x = p.x + (p.team === 0 ? PUCK_OFFSET_X : -PUCK_OFFSET_X);
      this.puck.y = p.y + PUCK_OFFSET_Y;
      this.puckTrail = [];
      if (!this.puck.lock && this.clock > this.nextSteal) {
        const enemy = this.players.find(
          (p2) =>
            p2.team !== p.team &&
            distance(p2, p) < (p2.team === 0 ? 43 : 37 + this.rival * 3) &&
            p2.frozen < this.clock,
        );
        if (enemy && !(p.team === 0 && this.protectedUntil > this.clock)) {
          this.puck.owner = this.players.indexOf(enemy);
          this.puck.lock = enemy.team === 0 && this.rival === 0 ? 1.8 : 1;
          this.nextSteal = this.clock + 1.1;
          if (enemy.team === 0) this.state.active = this.puck.owner;
          this.state.message =
            enemy.team === 0
              ? "¡Disco recuperado!"
              : "Los piggies tienen el disco. ¡Vamos a recuperarlo!";
          this.emit();
        }
      }
    } else {
      this.puckTrail.push({ x: this.puck.x, y: this.puck.y });
      if (this.puckTrail.length > 14) this.puckTrail.shift();
      const previousX = this.puck.x;
      this.puck.x += this.puck.vx * dt;
      this.puck.y += this.puck.vy * dt;
      const friction = Math.exp(-0.19 * dt);
      this.puck.vx *= friction;
      this.puck.vy *= friction;
      if (this.puck.y < 60 || this.puck.y > 500) {
        this.puck.y = clamp(this.puck.y, 60, 500);
        this.puck.vy *= -0.8;
      }
      if (this.puck.x > 946 && this.puck.y > 212 && this.puck.y < 348) {
        this.goal(0);
        return;
      }
      if (this.puck.x < 54 && this.puck.y > 212 && this.puck.y < 348) {
        this.goal(1);
        return;
      }
      if (this.puck.x < 55 || this.puck.x > 945) {
        this.puck.x = clamp(this.puck.x, 55, 945);
        this.puck.vx *= -0.7;
      }
      for (const team of [0, 1]) {
        const plane = team === 0 ? 104 : 896;
        const crosses =
          team === 0
            ? this.puck.vx < 0 && previousX >= plane && this.puck.x <= plane
            : this.puck.vx > 0 && previousX <= plane && this.puck.x >= plane;
        const reach = team === 0 ? 27 : 22 + this.rival * 5;
        if (crosses && Math.abs(this.puck.y - this.keeperY(team)) < reach) {
          this.keeperHold = { team, until: this.clock + 0.7 };
          this.puck.vx = 0;
          this.puck.vy = 0;
          this.puck.super = false;
          this.puck.owner = -1;
          this.puck.lock = 0.4;
          this.state.message =
            team === 0
              ? "¡Buena parada de nuestro portero!"
              : "¡Parada de los piggies! Prueba más cerca o después de un pase.";
          break;
        }
      }
      if (
        !this.keeperHold &&
        !this.puck.lock &&
        !this.puck.super &&
        this.shotTeam >= 0
      ) {
        const blocker = this.players.find(
          (p) =>
            p.team !== this.shotTeam &&
            p.frozen < this.clock &&
            distance(p, this.puck) < 27,
        );
        if (blocker) {
          this.puck.owner = this.players.indexOf(blocker);
          this.puck.lock = 0.8;
          this.shotTeam = -1;
          if (blocker.team === 0) this.state.active = this.puck.owner;
          this.state.message =
            blocker.team === 0
              ? "¡Disco recuperado!"
              : "Un defensa bloquea el tiro. Busca un pase.";
        }
      }
      if (
        !this.keeperHold &&
        !this.puck.lock &&
        !this.puck.super &&
        Math.hypot(this.puck.vx, this.puck.vy) < 240
      ) {
        const catcher = this.players.find(
          (p) =>
            distance(p, this.puck) < (p.team === 0 ? 48 : 38) &&
            p.frozen < this.clock,
        );
        if (catcher) {
          this.puck.owner = this.players.indexOf(catcher);
          this.puck.lock = 0.9;
          if (catcher.team === 0) this.state.active = this.puck.owner;
        }
      }
    }
    if (this.pendingShot) {
      const active = this.players[this.state.active];
      if (
        (this.puck.owner >= 0 && this.puck.owner < 3) ||
        distance(active, this.puck) < 100
      ) {
        if (this.pendingShot === "special") this.special();
        else this.shoot();
      }
    }
    if (this.clock - this.emitAt > 0.2) {
      this.emitAt = this.clock;
      this.emit();
    }
  }
  blockedLane(player: Player) {
    const dx = 950 - player.x,
      dy = 280 - player.y,
      length = Math.hypot(dx, dy);
    return this.players
      .slice(3)
      .some(
        (p) =>
          p.frozen < this.clock &&
          p.x > player.x + 35 &&
          p.x < 910 &&
          Math.abs((p.x - player.x) * dy - (p.y - player.y) * dx) / length < 42,
      );
  }
  dribbleRoute(player: Player, index: number) {
    if (player.x > 680)
      return { x: 815, y: (player.lane ?? player.y) < 270 ? 225 : 315 };
    if (this.clock >= (player.chooseLaneAt ?? 0)) {
      const aimX = Math.min(player.x + 180, 820);
      const scores = [145, 280, 415]
        .map((y) => {
          const dx = aimX - player.x,
            dy = y - player.y,
            length = Math.hypot(dx, dy) || 1;
          const opponents = this.players
            .slice(3)
            .filter(
              (p) =>
                p.frozen < this.clock && p.x > player.x - 35 && p.x < aimX + 50,
            );
          const clearance = opponents.length
            ? Math.min(
                ...opponents.map(
                  (p) =>
                    Math.abs((p.x - player.x) * dy - (p.y - player.y) * dx) /
                    length,
                ),
              )
            : 150;
          return { y, score: clearance - Math.abs(y - player.y) * 0.17 };
        })
        .sort((a, b) => b.score - a.score);
      player.lane = scores[0].y;
      player.chooseLaneAt = this.clock + 1.4;
    }
    return {
      x: 815,
      y: player.lane ?? (index === 1 ? 145 : index === 2 ? 415 : 280),
    };
  }
  updateKeepers(dt: number) {
    for (const team of [0, 1]) {
      let target = 280;
      const toward = team === 0 ? this.puck.vx < -80 : this.puck.vx > 80;
      const unreadable =
        this.puck.super && this.lastShooter === "matilda" && this.puck.x < 810;
      const reacted =
        this.clock - this.shotStarted >=
        (team === 0 ? 0.14 : [0.23, 0.14, 0.07][this.rival]);
      if (
        this.puck.owner < 0 &&
        toward &&
        !unreadable &&
        !this.keeperHold &&
        reacted
      ) {
        const plane = team === 0 ? 104 : 896;
        target = clamp(
          this.puck.y + ((plane - this.puck.x) * this.puck.vy) / this.puck.vx,
          218,
          342,
        );
      } else if (this.puck.owner >= 0)
        target = clamp(this.players[this.puck.owner].y, 235, 325);
      else if (toward) target = this.keeperPositions[team];
      let speed = team === 0 ? 155 : 100 + this.rival * 42;
      if (team === 1 && this.setupUntil > this.clock) speed *= 0.55;
      const delta = target - this.keeperPositions[team];
      this.keeperPositions[team] +=
        Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);
    }
  }
  keeperY(team: number) {
    return this.keeperPositions[team];
  }
  frame = (now: number) => {
    const dt = Math.min((now - (this.last || now)) / 1000, 0.035);
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };
  draw() {
    paintGame(this);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    void this.audio?.close();
  }
}
