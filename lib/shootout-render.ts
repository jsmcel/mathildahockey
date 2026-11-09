import { birds, birdSvg } from "./birds";
import { Shootout, NET, penaltyViewport, type Point } from "./shootout";

export type PenaltyArt = {
  atlas: HTMLImageElement;
  pigs: Record<string, HTMLImageElement>;
  background: HTMLCanvasElement | null;
  trail: Point[];
  lastPhase: string;
};
export function loadPenaltyArt(): PenaltyArt {
  const atlas = new Image();
  atlas.src = "./art/bird-team-v2.png";
  const pigs: Record<string, HTMLImageElement> = {};
  for (const id of ["pig", "pighelmet", "pigking"]) {
    const img = new Image();
    img.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(birdSvg(id, true));
    pigs[id] = img;
  }
  return { atlas, pigs, background: null, trail: [], lastPhase: "" };
}
const box = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
) => {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
};
function segment(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  xx: number,
  yy: number,
  color: string,
  width = 2,
) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.stroke();
}
function sprite(
  c: CanvasRenderingContext2D,
  a: PenaltyArt,
  id: string,
  x: number,
  y: number,
  size: number,
  alpha = 1,
) {
  c.save();
  c.globalAlpha = alpha;
  const cell = birds.findIndex((b) => b.id === id);
  if (cell >= 0 && a.atlas.complete && a.atlas.naturalWidth) {
    const w = a.atlas.naturalWidth / 3,
      h = a.atlas.naturalHeight / 2;
    c.drawImage(
      a.atlas,
      (cell % 3) * w,
      Math.floor(cell / 3) * h,
      w,
      h,
      x,
      y,
      size,
      size,
    );
  } else if (a.pigs[id]?.complete && a.pigs[id].naturalWidth)
    c.drawImage(a.pigs[id], x, y, size, size);
  c.restore();
}
function background(c: CanvasRenderingContext2D) {
  const wall = c.createLinearGradient(0, 0, 0, 700);
  wall.addColorStop(0, "#174b70");
  wall.addColorStop(1, "#cdeafa");
  c.fillStyle = wall;
  c.fillRect(0, 0, 1000, 700);
  // Frosted windows and timber roof beams.
  for (let i = 0; i < 7; i++) {
    box(c, 85 + i * 122, 10, 110, 100, 7, "#73bddc");
    segment(c, 85 + i * 122, 62, 195 + i * 122, 62, "#bde7ee", 3);
    c.fillStyle = "#d6f3fb";
    c.beginPath();
    c.moveTo(110 + i * 122, 104);
    c.lineTo(140 + i * 122, 37);
    c.lineTo(176 + i * 122, 104);
    c.fill();
    c.fillStyle = "#fffaf0";
    c.beginPath();
    c.moveTo(118 + i * 122, 86);
    c.lineTo(140 + i * 122, 37);
    c.lineTo(161 + i * 122, 86);
    c.lineTo(143 + i * 122, 75);
    c.fill();
  }
  for (const x of [55, 500, 945]) {
    segment(c, x, 0, x + 30, 120, "#8b654e", 13);
    segment(c, x + 5, 0, x + 35, 120, "#bc9171", 4);
  }
  for (const x of [260, 745]) {
    segment(c, x, 0, x, 40, "#27435b", 3);
    c.fillStyle = "#ffd778";
    c.beginPath();
    c.ellipse(x, 43, 33, 10, 0, 0, Math.PI * 2);
    c.fill();
  }
  box(c, 0, 99, 1000, 58, 4, "#886b50");
  for (let i = 0; i < 31; i++) {
    const x = 14 + i * 33,
      y = 123 + (i % 3) * 3;
    c.fillStyle = i % 3 ? "#95c955" : "#b5d874";
    c.beginPath();
    c.arc(x, y, 11, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(x - 7, y - 9, 4, 0, Math.PI * 2);
    c.arc(x + 7, y - 9, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#d4eb9e";
    c.beginPath();
    c.ellipse(x, y + 3, 6, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#477a35";
    c.fillRect(x - 4, y + 2, 2, 3);
    c.fillRect(x + 2, y + 2, 2, 3);
  }
  box(c, 0, 146, 1000, 62, 0, "#f0f0de");
  box(c, 0, 196, 1000, 11, 0, "#e06b62");
  const ice = c.createLinearGradient(0, 200, 0, 700);
  ice.addColorStop(0, "#d8eef9");
  ice.addColorStop(0.6, "#effbff");
  ice.addColorStop(1, "#b8e4f5");
  c.fillStyle = ice;
  c.fillRect(0, 207, 1000, 493);
  c.save();
  c.globalAlpha = 0.25;
  for (let i = 0; i < 16; i++)
    segment(c, 500, 160, -300 + i * 120, 700, "#93c3dc", 1);
  for (let i = 0; i < 7; i++)
    segment(c, 0, 255 + i * i * 11, 1000, 255 + i * i * 11, "#8fb6cf", 1);
  c.restore();
  c.fillStyle = "#7bbfdc30";
  c.beginPath();
  c.ellipse(500, 423, 330, 84, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#8ac5df";
  c.lineWidth = 3;
  c.stroke();
  c.fillStyle = "#d8e7f4";
  c.beginPath();
  c.moveTo(NET.left, NET.bottom);
  c.lineTo(NET.left + 22, NET.top - 13);
  c.lineTo(NET.right - 22, NET.top - 13);
  c.lineTo(NET.right, NET.bottom);
  c.closePath();
  c.fill();
  // Netting sits behind the keeper and the target surface.
  for (let x = NET.left + 15; x < NET.right; x += 24)
    segment(c, x, NET.top - 10, x, NET.bottom, "#a9c2d2", 1.4);
  for (let y = NET.top; y < NET.bottom; y += 22)
    segment(c, NET.left, y, NET.right, y, "#a9c2d2", 1.4);
  for (let x = NET.left; x < NET.right; x += 48)
    segment(c, x, NET.top, x + 30, NET.bottom, "#eff8fc80", 1);
  c.strokeStyle = "#9d3447";
  c.lineWidth = 15;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(NET.left, NET.bottom);
  c.lineTo(NET.left, NET.top);
  c.lineTo(NET.right, NET.top);
  c.lineTo(NET.right, NET.bottom);
  c.stroke();
  c.strokeStyle = "#fa8c82";
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(NET.left - 2, NET.bottom);
  c.lineTo(NET.left - 2, NET.top - 2);
  c.lineTo(NET.right, NET.top - 2);
  c.stroke();
  c.fillStyle = "#527c9d";
  c.font = "900 11px Nunito, sans-serif";
  c.textAlign = "center";
  c.fillText("P I G G Y   I C E   A R E N A", 500, 479);
  c.strokeStyle = "#dca0a2";
  c.lineWidth = 4;
  c.beginPath();
  c.ellipse(500, 649, 215, 40, 0, 0, Math.PI * 2);
  c.stroke();
}
function keeper(
  c: CanvasRenderingContext2D,
  a: PenaltyArt,
  g: Shootout,
  x: number,
  alpha = 1,
  clone = false,
) {
  const id =
    g.turn === "attack" ? (g.rival === 2 ? "pigking" : "pighelmet") : g.keeper;
  const active = g.turn === "defend" && g.keeperActive;
  const size = clone ? 170 : 219,
    rise = Math.max(0, 255 - g.keeperY) * 0.35;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "#244e7430";
  c.beginPath();
  c.ellipse(x, 446, size * 0.46, 17, 0, 0, Math.PI * 2);
  c.fill();
  if (active && !clone) {
    const color =
      g.keeper === "stella"
        ? "#d5a0e5"
        : g.keeper === "red"
          ? "#ec7770"
          : "#e8bf5c";
    c.strokeStyle = color;
    c.lineWidth = g.keeper === "red" ? 10 : 5;
    c.fillStyle = color + "20";
    c.beginPath();
    c.ellipse(
      x,
      g.keeperY + 40,
      g.keeper === "red" ? 178 : 149,
      g.keeper === "stella" ? 165 : 132,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
    c.stroke();
    if (g.keeper === "bomb") {
      for (let i = 0; i < 3; i++) {
        c.globalAlpha = alpha * (1 - i * 0.22);
        c.beginPath();
        c.ellipse(x, 365, 90 + i * 44, 45 + i * 17, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = alpha;
    }
    if (g.keeper === "chuck") {
      c.fillStyle = "#e9ad24";
      c.font = "900 37px Nunito";
      c.fillText("»", x - 135, 295);
      c.fillText("«", x + 135, 295);
    }
  }
  sprite(c, a, id, x - size / 2, 447 - size - rise, size);
  const pad = clone ? 26 : 37,
    spread = active && g.keeper === "red" ? 75 : 48;
  for (const side of [-1, 1]) {
    box(c, x + side * spread - pad / 2, 366 - rise, pad, 79, 8, "#fffdf0");
    segment(
      c,
      x + side * spread - pad / 2 + 3,
      391 - rise,
      x + side * spread + pad / 2 - 3,
      391 - rise,
      g.turn === "attack" ? "#e47769" : "#30b0c6",
      8,
    );
  }
  for (const side of [-1, 1]) {
    c.fillStyle = "#fff7db";
    c.strokeStyle = g.turn === "attack" ? "#c76c60" : "#298da8";
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(
      x + side * (clone ? 61 : 85),
      g.keeperY + 25,
      clone ? 17 : 25,
      clone ? 22 : 31,
      side * 0.28,
      0,
      Math.PI * 2,
    );
    c.fill();
    c.stroke();
  }
  if (g.turn === "defend" && ["ready", "windup", "flight"].includes(g.phase)) {
    c.strokeStyle = "#fff";
    c.lineWidth = 8;
    c.beginPath();
    c.ellipse(x, 451, 90, 18, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "#18a1bf";
    c.lineWidth = 4;
    c.stroke();
  }
  c.restore();
}
function puck(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  egg = false,
  alpha = 1,
) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "#244b6b30";
  c.beginPath();
  c.ellipse(x, y + r * 0.6, r * 1.3, r * 0.4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = egg ? "#fff8d9" : "#102738";
  c.strokeStyle = egg ? "#e6af37" : "#fff";
  c.lineWidth = 3.5;
  c.beginPath();
  c.ellipse(
    x,
    y,
    r * (egg ? 0.73 : 1),
    r * (egg ? 1.1 : 0.7),
    egg ? -0.3 : 0,
    0,
    Math.PI * 2,
  );
  c.fill();
  c.stroke();
  if (!egg) {
    c.fillStyle = "#426179";
    c.beginPath();
    c.ellipse(x, y - r * 0.22, r * 0.84, r * 0.38, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#aacede";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(x, y - r * 0.22, r * 0.58, r * 0.2, 0, 3.5, 5.9);
    c.stroke();
  }
  c.restore();
}
export function paintShootout(
  canvas: HTMLCanvasElement,
  g: Shootout,
  a: PenaltyArt,
) {
  const c = canvas.getContext("2d");
  if (!c) return;
  const rect = canvas.getBoundingClientRect(),
    dpr = Math.min(window.devicePixelRatio || 1, 2),
    w = Math.round(rect.width * dpr),
    h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const fit = penaltyViewport(w, h);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#d8edf8";
  c.fillRect(0, 0, w, h);
  c.setTransform(fit.scale, 0, 0, fit.scale, fit.x, fit.y);
  if (!a.background) {
    a.background = document.createElement("canvas");
    a.background.width = 1500;
    a.background.height = 1050;
    const ctx = a.background.getContext("2d");
    if (ctx) {
      ctx.scale(1.5, 1.5);
      background(ctx);
    }
  }
  c.drawImage(a.background, 0, 0, 1000, 700);
  if (g.phase === "aim") {
    c.strokeStyle = "#ffffff90";
    c.lineWidth = 2;
    c.setLineDash([7, 12]);
    for (const x of [NET.left + 90, NET.right - 90])
      for (const y of [NET.top + 65, NET.bottom - 65]) {
        c.beginPath();
        c.arc(x, y, 24, 0, Math.PI * 2);
        c.stroke();
      }
    c.setLineDash([]);
  }
  if (g.turn === "defend" && g.keeperActive && g.keeper === "blues") {
    keeper(c, a, g, g.keeperX - 150, 0.72, true);
    keeper(c, a, g, g.keeperX + 150, 0.72, true);
  }
  keeper(c, a, g, g.keeperX);
  if (g.phase === "aim" && g.aim) {
    c.strokeStyle = "#d6a739";
    c.lineWidth = 3;
    c.setLineDash([9, 10]);
    c.beginPath();
    c.moveTo(500, 635);
    c.lineTo(g.aim.x, g.aim.y);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#ffeaa05c";
    c.strokeStyle = "#ffdc63";
    c.lineWidth = 5;
    c.beginPath();
    c.arc(g.aim.x, g.aim.y, 25, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = "#fff";
    c.lineWidth = 2;
    c.stroke();
  }
  const actor = g.turn === "attack" ? g.shooter : "pig";
  sprite(c, a, actor, 290, 501, 156);
  if (g.phase === "ready") {
    c.fillStyle = "#fff";
    c.strokeStyle = "#4b8fac";
    c.lineWidth = 5;
    c.font = "900 46px Nunito";
    c.textAlign = "center";
    c.strokeText("←", g.keeperX - 115, 515);
    c.fillText("←", g.keeperX - 115, 515);
    c.strokeText("→", g.keeperX + 115, 515);
    c.fillText("→", g.keeperX + 115, 515);
  }
  if (g.phase === "windup" && g.rival === 0) {
    c.fillStyle = "#f4d35a66";
    c.beginPath();
    c.arc(g.target.x, g.target.y, 26, 0, Math.PI * 2);
    c.fill();
  }
  if (g.phase === "flight") {
    const p = g.puckPosition(),
      r = 25 - g.progress * 8;
    if (a.lastPhase !== "flight") a.trail = [];
    a.trail.push(p);
    if (a.trail.length > 11) a.trail.shift();
    for (let i = 0; i < a.trail.length - 1; i++)
      segment(
        c,
        a.trail[i].x,
        a.trail[i].y,
        a.trail[i + 1].x,
        a.trail[i + 1].y,
        `rgba(${g.shotKind === "normal" ? "62,123,153" : "237,182,58"},${(i / a.trail.length) * 0.33})`,
        3 + i * 0.3,
      );
    if (g.shotKind === "blues") {
      puck(c, p.x - 108 * g.progress, p.y - 12, r, false, 0.42);
      puck(c, p.x + 108 * g.progress, p.y + 12, r, false, 0.42);
    }
    if (g.shotKind === "stella") {
      c.fillStyle = "#e3b7ef40";
      c.strokeStyle = "#c88ddd";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(p.x, p.y, r + 18, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    if (g.shotKind === "bomb" && g.progress > 0.54) {
      c.strokeStyle = "#edc05f";
      c.lineWidth = 4;
      c.globalAlpha = Math.max(0, 1 - (g.progress - 0.54) * 2);
      c.beginPath();
      c.ellipse(
        p.x,
        p.y,
        40 + (g.progress - 0.54) * 160,
        30 + (g.progress - 0.54) * 70,
        0,
        0,
        Math.PI * 2,
      );
      c.stroke();
      c.globalAlpha = 1;
    }
    puck(c, p.x, p.y, r, g.shotKind === "matilda");
  } else if (g.phase === "result") {
    if (g.outcome === "goal")
      puck(c, g.target.x, g.target.y, 17, g.shotKind === "matilda");
    const good =
      g.turn === "attack" ? g.outcome === "goal" : g.outcome === "saved";
    c.textAlign = "center";
    c.font = "900 53px Nunito, sans-serif";
    c.strokeStyle = "#fffef1";
    c.lineWidth = 10;
    const label = g.outcome === "goal" ? "¡GOL!" : "¡PARADA!";
    c.strokeText(label, 500, 548);
    c.fillStyle = good ? "#128ba0" : "#577c94";
    c.fillText(label, 500, 548);
    if (good) {
      c.font = "900 28px Nunito";
      c.fillStyle = "#e5b13e";
      c.fillText("★  ★  ★", 500, 587);
    }
  } else
    puck(
      c,
      500,
      635,
      27,
      g.turn === "attack" && g.shotArmed && g.shooter === "matilda",
    );
  a.lastPhase = g.phase;
}
