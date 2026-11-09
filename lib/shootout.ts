import type { BirdId } from "./birds";

export const PENALTY_WIDTH = 1000,
  PENALTY_HEIGHT = 700;
export const NET = { left: 150, right: 850, top: 128, bottom: 408 };
export type Point = { x: number; y: number };
export type Phase =
  "aim" | "ready" | "windup" | "flight" | "result" | "finished";
export type Turn = "attack" | "defend";
export type PenaltyResult = "goal" | "saved";
export type PenaltySnapshot = {
  phase: Phase;
  turn: Turn;
  round: number;
  rounds: number;
  ours: number;
  theirs: number;
  ourShots: PenaltyResult[];
  pigShots: PenaltyResult[];
  shooter: BirdId;
  keeper: BirdId;
  shotCharges: number;
  keeperCharges: number;
  shotArmed: boolean;
  keeperArmed: boolean;
  keeperActive: boolean;
  powerUsed: boolean;
  message: string;
  outcome: PenaltyResult | null;
};
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const toward = (from: number, to: number, step: number) =>
  from + Math.sign(to - from) * Math.min(Math.abs(to - from), step);

export function penaltyViewport(width: number, height: number) {
  const scale = Math.min(width / PENALTY_WIDTH, height / PENALTY_HEIGHT);
  return {
    scale,
    x: (width - PENALTY_WIDTH * scale) / 2,
    y: (height - PENALTY_HEIGHT * scale) / 2,
  };
}
export function penaltyPoint(
  x: number,
  y: number,
  width: number,
  height: number,
): Point | null {
  const v = penaltyViewport(width, height);
  if (v.scale <= 0) return null;
  const p = { x: (x - v.x) / v.scale, y: (y - v.y) / v.scale };
  return p.x < 0 || p.x > PENALTY_WIDTH || p.y < 0 || p.y > PENALTY_HEIGHT
    ? null
    : p;
}
export function insideNet(p: Point) {
  return (
    p.x >= NET.left && p.x <= NET.right && p.y >= NET.top && p.y <= NET.bottom
  );
}

export class Shootout {
  phase: Phase = "aim";
  turn: Turn = "attack";
  index = 0;
  rounds = 5;
  clock = 0;
  phaseAge = 0;
  paused = false;
  ours = 0;
  theirs = 0;
  ourShots: PenaltyResult[] = [];
  pigShots: PenaltyResult[] = [];
  shotCharges = 2;
  keeperCharges = 2;
  shotArmed = false;
  keeperArmed = false;
  keeperActive = false;
  powerUsed = false;
  aim: Point | null = null;
  target: Point = { x: 500, y: 280 };
  keeperX = 500;
  keeperY = 285;
  flightAge = 0;
  flightDuration = 1;
  shotKind: "normal" | BirdId = "normal";
  bombPushed = false;
  outcome: PenaltyResult | null = null;
  message = "Toca un hueco de la portería para tirar.";
  private pulse = 0;
  constructor(
    public team: BirdId[],
    public keeper: BirdId,
    public rival: number,
    public onUpdate: (s: PenaltySnapshot) => void = () => {},
  ) {
    this.prepare();
  }
  get round() {
    return Math.floor(this.index / 2) + 1;
  }
  get shooter() {
    return this.team[Math.floor(this.index / 2) % this.team.length];
  }
  get progress() {
    return clamp(this.flightAge / this.flightDuration, 0, 1);
  }
  snapshot(): PenaltySnapshot {
    return {
      phase: this.phase,
      turn: this.turn,
      round: this.round,
      rounds: this.rounds,
      ours: this.ours,
      theirs: this.theirs,
      ourShots: [...this.ourShots],
      pigShots: [...this.pigShots],
      shooter: this.shooter,
      keeper: this.keeper,
      shotCharges: this.shotCharges,
      keeperCharges: this.keeperCharges,
      shotArmed: this.shotArmed,
      keeperArmed: this.keeperArmed,
      keeperActive: this.keeperActive,
      powerUsed: this.powerUsed,
      message: this.message,
      outcome: this.outcome,
    };
  }
  emit() {
    this.onUpdate(this.snapshot());
  }
  prepare() {
    this.turn = this.index % 2 === 0 ? "attack" : "defend";
    this.phase = this.turn === "attack" ? "aim" : "ready";
    this.phaseAge = 0;
    this.aim = null;
    this.shotArmed = false;
    this.keeperArmed = false;
    this.keeperActive = false;
    this.powerUsed = false;
    this.bombPushed = false;
    this.outcome = null;
    this.flightAge = 0;
    this.keeperX =
      this.turn === "attack"
        ? 500 + Math.sin(this.round * 1.7 + this.rival) * 105
        : 500;
    this.keeperY = 285;
    this.message =
      this.turn === "attack"
        ? "Toca un hueco de la portería para tirar."
        : "Coloca a tu portero y toca LISTO.";
    const xs = [255, 745, 365, 655, 500, 290, 710];
    this.target = {
      x: xs[(this.round - 1 + this.rival) % xs.length],
      y: this.round % 2 ? 220 : 350,
    };
    this.emit();
  }
  setAim(p: Point | null) {
    if (!this.paused && this.phase === "aim")
      this.aim =
        p && insideNet(p)
          ? { x: clamp(p.x, 170, 830), y: clamp(p.y, 148, 388) }
          : null;
  }
  toggleShot() {
    if (this.paused || this.phase !== "aim" || this.shotCharges <= 0) return;
    this.shotArmed = !this.shotArmed;
    this.emit();
  }
  shoot(p: Point): boolean {
    if (this.paused || this.phase !== "aim" || !insideNet(p)) return false;
    this.target = { x: clamp(p.x, 170, 830), y: clamp(p.y, 148, 388) };
    this.aim = null;
    this.shotKind =
      this.shotArmed && this.shotCharges > 0 ? this.shooter : "normal";
    if (this.shotKind !== "normal") this.shotCharges--;
    this.flightDuration =
      this.shotKind === "chuck"
        ? 0.52
        : this.shotKind === "red"
          ? 0.72
          : this.shotKind === "matilda"
            ? 1.05
            : 0.98;
    this.flightAge = 0;
    this.phaseAge = 0;
    this.phase = "flight";
    this.message = "¡A portería!";
    this.emit();
    return true;
  }
  moveKeeper(x: number) {
    if (
      this.paused ||
      this.turn !== "defend" ||
      !["ready", "windup", "flight"].includes(this.phase)
    )
      return;
    this.keeperX = clamp(x, 180, 820);
  }
  ready() {
    if (this.paused || this.phase !== "ready") return;
    this.phase = "windup";
    this.phaseAge = 0;
    this.message = "¡Prepárate! Sigue el disco y mueve al portero.";
    this.emit();
  }
  toggleKeeper() {
    if (
      this.paused ||
      this.turn !== "defend" ||
      this.keeperCharges <= 0 ||
      this.powerUsed
    )
      return;
    if (this.phase === "ready" || this.phase === "windup") {
      this.keeperArmed = !this.keeperArmed;
      this.emit();
    } else if (this.phase === "flight") this.activateKeeper();
  }
  activateKeeper() {
    if (this.keeperCharges <= 0 || this.powerUsed) return;
    this.keeperActive = true;
    this.keeperArmed = false;
    this.powerUsed = true;
    this.keeperCharges--;
    if (this.keeper === "chuck")
      this.flightDuration =
        this.flightAge + (this.flightDuration - this.flightAge) * 1.8;
    this.emit();
  }
  finish(result: PenaltyResult) {
    if (this.phase !== "flight") return;
    this.outcome = result;
    if (this.turn === "attack") {
      this.ourShots.push(result);
      if (result === "goal") this.ours++;
    } else {
      this.pigShots.push(result);
      if (result === "goal") this.theirs++;
    }
    this.phase = "result";
    this.phaseAge = 0;
    this.message =
      this.turn === "attack"
        ? result === "goal"
          ? "¡Gooool, Jorge!"
          : "¡Parada de los piggies! Probamos en el siguiente."
        : result === "saved"
          ? "¡Paradón! ¡Muy bien, Jorge!"
          : "Gol de los piggies. ¡Vamos con el siguiente!";
    this.emit();
  }
  next() {
    if (this.paused || this.phase !== "result") return;
    this.index++;
    if (this.index >= this.rounds * 2) {
      this.phase = "finished";
      this.phaseAge = 0;
      this.message =
        this.ours > this.theirs
          ? "¡Has ganado la tanda!"
          : this.ours === this.theirs
            ? "¡Empate! Una tanda muy igualada."
            : "¡Buen partido, Jorge! ¿Probamos otra tanda?";
      this.emit();
    } else this.prepare();
  }
  extraRound() {
    if (this.phase !== "finished" || this.ours !== this.theirs || this.paused)
      return;
    this.rounds++;
    this.shotCharges = Math.min(2, this.shotCharges + 1);
    this.keeperCharges = Math.min(2, this.keeperCharges + 1);
    this.prepare();
  }
  pause(value: boolean) {
    this.paused = value;
    this.aim = null;
  }
  perceivedTarget(): Point {
    const p = this.progress;
    if (this.shotKind === "matilda" && p < 0.63)
      return { x: 1000 - this.target.x, y: this.target.y };
    if (this.shotKind === "blues" && p < 0.68)
      return {
        x: clamp(this.target.x + (this.round % 2 ? 165 : -165), 170, 830),
        y: this.target.y,
      };
    if (this.shotKind === "stella" && p < 0.7)
      return { x: this.target.x, y: 540 - this.target.y };
    return this.target;
  }
  puckPosition(): Point {
    const p = this.progress,
      kind = this.shotKind;
    let tx = this.target.x,
      ty = this.target.y;
    if (this.turn === "attack" && kind === "matilda")
      tx =
        1000 -
        this.target.x +
        (this.target.x - (1000 - this.target.x)) *
          Math.max(0, (p - 0.48) / 0.52);
    const x = 500 + (tx - 500) * p;
    let y = 635 + (ty - 635) * p;
    if (kind === "stella") y -= Math.sin(p * Math.PI) * 90;
    return { x, y };
  }
  isSaved(): boolean {
    let rx = this.turn === "attack" ? [66, 76, 87][this.rival] : 78,
      ry = this.turn === "attack" ? 95 : 110;
    if (this.turn === "attack" && this.shotKind === "red") rx *= 0.75;
    if (this.turn === "defend" && this.keeperActive) {
      if (this.keeper === "matilda") {
        rx += 70;
        ry += 45;
      }
      if (this.keeper === "red") {
        rx += 105;
        ry += 30;
      }
      if (this.keeper === "bomb") {
        rx += 95;
        ry += 35;
      }
      if (this.keeper === "stella") {
        rx += 60;
        ry += 50;
      }
      if (this.keeper === "blues")
        return [-150, 0, 150].some(
          (offset) =>
            Math.abs(this.target.x - this.keeperX - offset) < rx * 0.85,
        );
    }
    return (
      ((this.target.x - this.keeperX) / rx) ** 2 +
        ((this.target.y - this.keeperY) / ry) ** 2 <=
      1
    );
  }
  update(dt: number) {
    if (this.paused || this.phase === "finished") return;
    this.clock += dt;
    this.phaseAge += dt;
    if (this.phase === "aim")
      this.keeperX =
        500 +
        Math.sin(this.phaseAge * 0.9 + this.round * 1.7 + this.rival) * 112;
    if (this.phase === "windup" && this.phaseAge >= 0.8) {
      this.phase = "flight";
      this.phaseAge = 0;
      this.flightAge = 0;
      this.flightDuration = [1.5, 1.25, 1.05][this.rival];
      this.shotKind = "normal";
      if (this.keeperArmed) this.activateKeeper();
      this.message = "¡Mueve al portero de lado a lado!";
      this.emit();
      return;
    }
    if (this.phase === "flight") {
      this.flightAge += dt;
      if (this.turn === "attack") {
        if (this.flightAge > [0.38, 0.28, 0.19][this.rival]) {
          const perceived = this.perceivedTarget();
          this.keeperX = toward(
            this.keeperX,
            perceived.x,
            [210, 270, 345][this.rival] * dt,
          );
          this.keeperY = toward(this.keeperY, perceived.y, 220 * dt);
        }
        if (
          this.shotKind === "bomb" &&
          this.progress > 0.57 &&
          !this.bombPushed
        ) {
          this.bombPushed = true;
          this.keeperX = clamp(
            this.keeperX + (this.target.x < this.keeperX ? 92 : -92),
            180,
            820,
          );
        }
      } else {
        this.keeperY = toward(this.keeperY, this.target.y, 300 * dt);
        if (
          this.keeperActive &&
          this.keeper === "stella" &&
          this.progress > 0.58
        ) {
          const puck = this.puckPosition();
          if (
            Math.abs(puck.x - this.keeperX) < 138 &&
            Math.abs(puck.y - this.keeperY) < 180
          ) {
            this.finish("saved");
            return;
          }
        }
        if (
          this.keeperActive &&
          this.keeper === "bomb" &&
          this.progress > 0.79 &&
          Math.abs(this.target.x - this.keeperX) < 175
        ) {
          this.finish("saved");
          return;
        }
      }
      if (this.progress >= 1) this.finish(this.isSaved() ? "saved" : "goal");
    }
    if (this.clock - this.pulse > 0.16) {
      this.pulse = this.clock;
      this.emit();
    }
  }
}
