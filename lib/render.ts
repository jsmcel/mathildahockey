import type { Hockey } from "./hockey";
import { birdById, birds } from "./birds";
type Skater = Hockey["players"][number];
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function line(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function paintArena(ctx: CanvasRenderingContext2D) {
  const background = ctx.createLinearGradient(0, 0, 0, 560);
  background.addColorStop(0, "#164a68");
  background.addColorStop(1, "#0e304a");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 1000, 560);
  // Curved timber stands and quiet, smiling piggy spectators.
  for (let row = 0; row < 2; row++) {
    rounded(ctx, 7, row ? 529 : 4, 986, 28, 8, row ? "#674e43" : "#806047");
    for (let i = 0; i < 29; i++) {
      const x = 24 + i * 34,
        y = row ? 551 : 22;
      const c = i % 3 === 0 ? "#a1cf56" : i % 3 === 1 ? "#78b54d" : "#a6ce75";
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 6, y - 7, 3, 0, Math.PI * 2);
      ctx.arc(x + 6, y - 7, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ceec9c";
      ctx.beginPath();
      ctx.ellipse(x, y + 3, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3f763c";
      ctx.fillRect(x - 5, y - 2, 2, 2);
      ctx.fillRect(x + 3, y - 2, 2, 2);
    }
  }
  ctx.save();
  ctx.shadowColor = "#041f3b90";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 7;
  rounded(ctx, 20, 37, 960, 490, 66, "#506f84");
  ctx.restore();
  rounded(ctx, 24, 34, 952, 490, 64, "#fafaf1");
  ctx.strokeStyle = "#b7d0da";
  ctx.lineWidth = 7;
  ctx.stroke();
  rounded(ctx, 36, 46, 928, 466, 57, "#78c1dc");
  const ice = ctx.createLinearGradient(0, 60, 0, 505);
  ice.addColorStop(0, "#def5fc");
  ice.addColorStop(0.5, "#f2fcff");
  ice.addColorStop(1, "#ccebf7");
  ctx.fillStyle = ice;
  ctx.beginPath();
  ctx.roundRect(46, 57, 908, 446, 46);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Fixed ice reflections and fine scratches, never flashing.
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff25" : "#7ebad509";
    ctx.fillRect(43, 58 + i * 37, 915, 19);
  }
  for (let i = 0; i < 45; i++) {
    const x = 65 + ((i * 137) % 870),
      y = 77 + ((i * 91) % 401);
    line(ctx, x, y, x + 19 + (i % 4) * 11, y - 4, "#abcfd24a", 1);
  }
  for (const x of [337, 663]) line(ctx, x, 55, x, 505, "#78afd894", 5);
  line(ctx, 500, 54, 500, 505, "#e88d8f", 4);
  ctx.strokeStyle = "#e88d8f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(500, 280, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#e88d8f";
  ctx.beginPath();
  ctx.arc(500, 280, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#327a9b";
  ctx.font = "900 25px Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("JORGE", 500, 257);
  ctx.font = "800 10px Nunito, sans-serif";
  ctx.fillText("H O C K E Y   C L U B", 500, 311);
  ctx.restore();
  for (const x of [225, 775])
    for (const y of [157, 403]) {
      ctx.strokeStyle = "#d9a2a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 54, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#df9998";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      line(ctx, x - 12, y - 4, x - 7, y - 4, "#df9998", 2);
      line(ctx, x + 7, y + 4, x + 12, y + 4, "#df9998", 2);
    }
  for (const x of [58, 942]) {
    ctx.fillStyle = "#82c8e140";
    ctx.beginPath();
    ctx.ellipse(x, 280, 66, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#71b9d1";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  line(ctx, 80, 49, 920, 49, "#fff", 3);
  line(ctx, 80, 510, 920, 510, "#edf5f6", 3);
  // Red goals have a visible back and woven netting.
  for (const x of [24, 947]) {
    rounded(ctx, x - 3, 217, 34, 132, 6, "#b8c7c950");
    rounded(ctx, x, 214, 29, 132, 5, "#f9fbf4");
    for (let y = 218; y < 343; y += 9)
      line(ctx, x + 1, y, x + 28, y + 4, "#b1c6cb", 1);
    for (let xx = x + 4; xx < x + 29; xx += 7)
      line(ctx, xx, 216, xx, 344, "#b1c6cb", 1);
    ctx.strokeStyle = "#a82e3f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x, 214, 29, 132, 5);
    ctx.stroke();
    line(ctx, x + 2, 216, x + 26, 216, "#f1787a", 2);
    line(ctx, x + 2, 217, x + 2, 343, "#f1787a", 2);
  }
  ctx.textAlign = "center";
  ctx.font = "900 9px Nunito, sans-serif";
  ctx.fillStyle = "#597483";
  ctx.fillText("PIGGY ICE ARENA", 500, 519);
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  g: Hockey,
  id: string,
  x: number,
  y: number,
  size: number,
) {
  const cell = birds.findIndex((b) => b.id === id);
  if (cell >= 0 && g.atlas.complete && g.atlas.naturalWidth) {
    const w = g.atlas.naturalWidth / 3,
      h = g.atlas.naturalHeight / 2;
    ctx.drawImage(
      g.atlas,
      (cell % 3) * w,
      Math.floor(cell / 3) * h,
      w,
      h,
      x,
      y,
      size,
      size,
    );
  } else {
    const img = g.images[id];
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, x, y, size, size);
  }
}

export function paintPlayer(
  ctx: CanvasRenderingContext2D,
  g: Hockey,
  p: Skater,
  active: boolean,
  keeper = false,
  index = 0,
) {
  const moving = Math.hypot(p.vx || 0, p.vy || 0) > 8;
  const bob = moving
    ? Math.sin(g.clock * 12 + index * 2) * 1.7
    : Math.sin(g.clock * 2 + index) * 0.6;
  const size = keeper ? 84 : 106;
  if (moving) {
    ctx.strokeStyle = "#ffffffad";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      const x = p.x - (p.vx || 0) * 0.13;
      line(
        ctx,
        x - 4 + i * 12,
        p.y + 24,
        p.x - 10 + i * 12,
        p.y + 26,
        "#ffffffbb",
        2.5,
      );
    }
  }
  ctx.fillStyle = "#31638c20";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 25, 31, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 21, 41, 17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#0aa5c5";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = "#ffcb50";
    ctx.strokeStyle = "#7c5924";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x - 9, p.y - 65);
    ctx.lineTo(p.x + 9, p.y - 65);
    ctx.lineTo(p.x, p.y - 54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = "900 12px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#fff";
    ctx.strokeText(birdById(p.id).name, p.x, p.y - 74);
    ctx.fillStyle = "#126c88";
    ctx.fillText(birdById(p.id).name, p.x, p.y - 74);
  }
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.rotate(clamp((p.vx || 0) / 1400, -0.13, 0.13));
  ctx.save();
  ctx.translate(0, 27);
  ctx.scale(1, -0.24);
  ctx.globalAlpha = 0.1;
  drawBird(ctx, g, p.id, -size / 2, -size * 0.72, size);
  ctx.restore();
  drawBird(ctx, g, p.id, -size / 2, -size * 0.72, size);
  if (keeper) {
    rounded(ctx, -24, 15, 15, 17, 4, "#f7f6df");
    rounded(ctx, 10, 15, 15, 17, 4, "#f7f6df");
    line(ctx, -23, 23, -10, 23, p.team ? "#d85d53" : "#199bb7", 3);
    line(ctx, 11, 23, 24, 23, p.team ? "#d85d53" : "#199bb7", 3);
  }
  ctx.restore();
  if (active && g.protectedUntil > g.clock) {
    const bubble = ctx.createRadialGradient(
      p.x - 15,
      p.y - 30,
      4,
      p.x,
      p.y - 10,
      51,
    );
    bubble.addColorStop(0, "#fff0fb05");
    bubble.addColorStop(0.8, "#e7a5dc15");
    bubble.addColorStop(1, "#e1a4df75");
    ctx.fillStyle = bubble;
    ctx.strokeStyle = "#c283cd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 10, 51, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 10, 44, 3.7, 4.6);
    ctx.stroke();
  }
  if (active && g.boosted > g.clock) {
    for (let i = 0; i < 3; i++)
      line(
        ctx,
        p.x - 55 - i * 9,
        p.y - 12 + i * 9,
        p.x - 37 - i * 6,
        p.y - 12 + i * 9,
        "#f5bb30a0",
        3,
      );
  }
  if (p.frozen > g.clock) {
    ctx.fillStyle = "#88b9d3";
    ctx.font = "900 20px Nunito";
    ctx.textAlign = "center";
    ctx.fillText("· · ·", p.x, p.y - 53);
  }
}

export function paintGame(g: Hockey) {
  const canvas = g.canvas,
    ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect(),
    dpr = Math.min(window.devicePixelRatio || 1, 2),
    width = Math.round(rect.width * dpr),
    height = Math.round(rect.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(width / 1000, 0, 0, height / 560, 0, 0);
  ctx.clearRect(0, 0, 1000, 560);
  // Arena is static: rasterize once instead of repainting hundreds of details per frame.
  if (!g.arena) {
    g.arena = document.createElement("canvas");
    g.arena.width = 1500;
    g.arena.height = 840;
    const a = g.arena.getContext("2d");
    if (a) {
      a.scale(1.5, 1.5);
      paintArena(a);
    }
  }
  ctx.drawImage(g.arena, 0, 0, 1000, 560);
  if (g.options.effects) {
    for (let i = 0; i < g.puckTrail.length; i++) {
      const pt = g.puckTrail[i];
      ctx.fillStyle = `rgba(${g.puck.super ? "244,185,47" : "54,140,179"},${(i / g.puckTrail.length) * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 3 + i * 0.45, 2 + i * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  paintPlayer(
    ctx,
    g,
    { x: 94, y: g.keeperY(0), id: g.team[0], team: 0, frozen: 0 },
    false,
    true,
  );
  paintPlayer(
    ctx,
    g,
    { x: 906, y: g.keeperY(1), id: "pighelmet", team: 1, frozen: 0 },
    false,
    true,
  );
  [...g.players.map((p, i) => ({ p, i }))]
    .sort((a, b) => a.p.y - b.p.y)
    .forEach(({ p, i }) =>
      paintPlayer(ctx, g, p, i === g.state.active, false, i),
    );
  if (g.target) {
    ctx.strokeStyle = "#22a7c0";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(g.target.x, g.target.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (g.burst) {
    const b = g.burst,
      t = clamp((g.clock - b.start) / b.duration, 0, 1);
    if (t < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - t;
      if (b.kind === "bomb") {
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = ["#efbc61", "#8bc9e5", "#a0d9ea"][i];
          ctx.lineWidth = 6 - i;
          ctx.beginPath();
          ctx.ellipse(
            b.x,
            b.y,
            40 + t * (220 + i * 40),
            20 + t * (90 + i * 20),
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      }
      if (b.kind === "blues") {
        for (let i = 0; i < 3; i++)
          drawBird(
            ctx,
            g,
            "blues",
            b.x - 100 + i * 75 + t * 140,
            b.y - 70 + Math.sin(i) * 55,
            65,
          );
      }
      ctx.restore();
    }
  }
  let px = g.puck.x,
    py = g.puck.y;
  if (g.passFlight) {
    const f = g.passFlight,
      t = clamp((g.clock - f.start) / 0.42, 0, 1),
      p = g.players[f.to];
    px = f.x + (p.x + 29 - f.x) * t;
    py = f.y + (p.y + 15 - f.y) * t - Math.sin(t * Math.PI) * 26;
    ctx.strokeStyle = "#27a7c13b";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (t >= 1) g.passFlight = null;
  }
  ctx.fillStyle = "#153c5b30";
  ctx.beginPath();
  ctx.ellipse(px, py + 5, g.puck.super ? 17 : 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (g.puck.super && g.lastShooter === "matilda") {
    ctx.save();
    ctx.translate(px, py - 5);
    ctx.rotate(g.clock * 4);
    ctx.fillStyle = "#fffbe5";
    ctx.strokeStyle = "#e3ad3b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = g.puck.super ? "#e4a529" : "#142b44";
    ctx.beginPath();
    ctx.ellipse(px, py, g.puck.super ? 15 : 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.puck.super ? "#ffe898" : "#526f86";
    ctx.beginPath();
    ctx.ellipse(px, py - 3, g.puck.super ? 14 : 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (g.state.goal && !g.state.finished) {
    const win = g.state.message.startsWith("¡Goo");
    ctx.save();
    ctx.shadowColor = "#12416233";
    ctx.shadowBlur = 20;
    rounded(ctx, 260, 193, 480, 165, 27, "#fffef4f2");
    ctx.restore();
    ctx.textAlign = "center";
    ctx.fillStyle = win ? "#1488a6" : "#5f7f92";
    ctx.font = "900 43px Nunito, sans-serif";
    ctx.fillText(win ? "¡GOOOL, JORGE!" : "¡Vamos a por otro!", 500, 257);
    ctx.fillStyle = "#f2b234";
    ctx.font = "900 22px Nunito";
    ctx.fillText(win ? "★   ★   ★" : "¡Seguimos jugando!", 500, 294);
    ctx.fillStyle = "#527386";
    ctx.font = "900 24px Nunito";
    ctx.fillText(`${g.state.ours} — ${g.state.theirs}`, 500, 332);
  }
}
