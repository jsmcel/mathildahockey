import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
const temp = await mkdtemp(path.join(tmpdir(), "hockey-tests-"));
const bundle = path.join(temp, "engine.mjs");
await build({
  entryPoints: ["lib/hockey.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundle,
  logLevel: "silent",
});
const { Hockey } = await import(pathToFileURL(bundle));
await build({
  entryPoints: ["lib/viewport.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(temp, "viewport.mjs"),
  logLevel: "silent",
});
const { fitViewport, pointOnIce } = await import(
  pathToFileURL(path.join(temp, "viewport.mjs"))
);
globalThis.Image = class {
  complete = false;
};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
const opts = {
  sound: false,
  auto: true,
  slow: true,
  effects: false,
  target: 3,
};
const game = (team = ["matilda", "red", "chuck"], rival = 0) =>
  new Hockey({}, team, rival, { ...opts }, () => {});
test("ordinary and special shots reach the opposing goal, count once, and finish at target", () => {
  const g = game();
  for (let n = 1; n <= 3; n++) {
    g.shoot(true);
    for (let i = 0; i < 300 && !g.state.goal; i++) g.update(1 / 60);
    assert.equal(g.state.ours, n);
    assert.equal(g.state.theirs, 0);
    g.update(0.1);
    assert.equal(g.state.ours, n);
    if (n < 3) {
      g.update(3);
      assert.equal(g.state.goal, false);
    }
  }
  assert.equal(g.state.finished, true);
  g.shoot();
  g.update(10);
  assert.equal(g.state.ours, 3);
  g.destroy();
});
test("all six abilities produce their own effect and share a rechargeable meter", () => {
  for (const id of ["matilda", "red", "chuck", "bomb", "blues", "stella"]) {
    const g = game([id, "red", "chuck"]);
    g.special();
    assert.equal(g.state.power, 0, id);
    if (id === "matilda" || id === "red") {
      assert.equal(g.puck.super, true);
      assert.equal(g.puck.owner, -1);
    }
    if (id === "chuck") assert.ok(g.boosted > g.clock);
    if (id === "bomb") assert.equal(g.puck.owner, 0);
    if (id === "blues") assert.equal(g.players[0].x, 500);
    if (id === "stella") assert.ok(g.protectedUntil > g.clock);
    const prior = g.boosted;
    g.special();
    assert.equal(g.boosted, prior);
    g.destroy();
  }
  const g = game(["chuck", "red", "matilda"]);
  g.special();
  for (let i = 0; i < 1100; i++) g.update(1 / 60);
  assert.equal(g.state.power, 100);
  g.destroy();
});
test("pause freezes puck, player movement, score, and ability recharge", () => {
  const g = game();
  g.state.power = 20;
  g.pause(true);
  const before = JSON.stringify([g.players, g.puck, g.state]);
  g.update(20);
  g.shoot();
  g.pass();
  g.special();
  g.setActive(2);
  assert.equal(JSON.stringify([g.players, g.puck, g.state]), before);
  g.destroy();
});
test("passes change both the puck carrier and controlled player; settings affect pace", () => {
  const g = game();
  g.pass();
  assert.equal(g.puck.owner, 1);
  assert.equal(g.state.active, 1);
  g.pass(2);
  assert.equal(g.puck.owner, 2);
  assert.equal(g.state.active, 2);
  const slow = game(),
    fast = game();
  fast.options.slow = false;
  slow.update(1);
  fast.update(1);
  assert.ok(fast.players[0].x > slow.players[0].x);
  g.destroy();
  slow.destroy();
  fast.destroy();
});
test("piggy goals count for the opponents and never count repeatedly during a goal", () => {
  const g = game();
  Object.assign(g.puck, { owner: -1, x: 55, y: 280, vx: -400, vy: 0, lock: 2 });
  g.update(0.02);
  assert.equal(g.state.theirs, 1);
  g.update(0.02);
  assert.equal(g.state.theirs, 1);
  g.destroy();
});
test("a single shot request recovers the opponents puck and shoots without a second tap", () => {
  const g = game();
  g.puck.owner = 3;
  g.puck.x = g.players[3].x - 44;
  g.puck.y = g.players[3].y + 29;
  g.shoot();
  assert.equal(g.state.queued, true);
  for (let i = 0; i < 60 * 18 && !g.state.ours; i++) g.update(1 / 60);
  assert.equal(g.state.ours, 1);
  assert.equal(g.state.queued, false);
  g.destroy();
});
test("one nearby shot tap recovers the puck and fires immediately; extra taps do not snatch the shot back", () => {
  const g = game();
  Object.assign(g.puck, { owner: -1, x: 390, y: 280, vx: 0, vy: 0 });
  g.shoot();
  assert.equal(g.puck.owner, -1);
  assert.ok(g.puck.vx > 0);
  for (let i = 0; i < 70 && !g.state.goal; i++) {
    g.shoot();
    g.update(1 / 60);
  }
  assert.equal(g.puck.owner, -1);
  assert.ok(g.puck.x > 850 || g.state.goal);
  g.destroy();
});
test("three goals can be reached using only the ordinary shoot control against every piggy team", () => {
  for (let rival = 0; rival < 3; rival++) {
    const g = game(["matilda", "red", "chuck"], rival);
    for (let frame = 0; frame < 60 * 35 && !g.state.finished; frame++) {
      if (frame % 42 === 0) g.shoot();
      g.update(1 / 60);
    }
    assert.equal(g.state.ours, 3, `opponent ${rival}`);
    assert.equal(g.state.finished, true);
    g.destroy();
  }
});
test("requesting an attacking power during an existing shot never wastes the charge", () => {
  const g = game();
  g.shoot();
  g.special();
  assert.equal(g.state.power, 100);
  assert.equal(g.puck.super, false);
  g.destroy();
});
test("diagonal keyboard movement has the same speed as horizontal movement", () => {
  const a = game(),
    b = game();
  a.options.auto = false;
  b.options.auto = false;
  a.direction = { x: 1, y: 0 };
  b.direction = { x: 1, y: 1 };
  a.update(0.1);
  b.update(0.1);
  assert.ok(
    Math.abs(
      a.players[0].x -
        330 -
        Math.hypot(b.players[0].x - 330, b.players[0].y - 280),
    ) < 0.0001,
  );
  a.destroy();
  b.destroy();
});
test("viewport retains the same scale on rotation and touch coordinates invert the actual painted area", () => {
  for (const [w, h] of [
    [390, 215],
    [844, 285],
    [740, 255],
    [1024, 500],
    [240, 500],
  ]) {
    const v = fitViewport(w, h);
    assert.ok(1000 * v.scale <= w + 0.0001);
    assert.ok(560 * v.scale <= h + 0.0001);
    const p = pointOnIce(v.x + 720 * v.scale, v.y + 180 * v.scale, w, h);
    assert.ok(Math.abs(p.x - 720) < 0.0001);
    assert.ok(Math.abs(p.y - 180) < 0.0001);
    if (v.x > 1) assert.equal(pointOnIce(0, h / 2, w, h), null);
    if (v.y > 1) assert.equal(pointOnIce(w / 2, 0, w, h), null);
  }
});
await rm(temp, { recursive: true, force: true });
