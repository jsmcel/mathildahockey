import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
const temp = await mkdtemp(path.join(tmpdir(), "penalty-tests-"));
await build({
  entryPoints: ["lib/shootout.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(temp, "shootout.mjs"),
  logLevel: "silent",
});
const { Shootout, NET, penaltyViewport, penaltyPoint } = await import(
  pathToFileURL(path.join(temp, "shootout.mjs"))
);
const game = (shooter = "matilda", keeper = "bomb", rival = 1) =>
  new Shootout([shooter, "red", "chuck"], keeper, rival);
function resolve(g) {
  for (let i = 0; i < 600 && ["flight", "windup"].includes(g.phase); i++)
    g.update(1 / 120);
  assert.equal(g.phase, "result");
}
function defendTurn(g) {
  g.shoot({ x: 500, y: 280 });
  resolve(g);
  g.next();
  assert.equal(g.phase, "ready");
}

test("tap a gap fires one shot; outside taps and repeated firing never consume turns", () => {
  const g = game();
  assert.equal(g.shoot({ x: 100, y: 640 }), false);
  assert.equal(g.phase, "aim");
  assert.equal(g.shoot({ x: 195, y: 160 }), true);
  assert.equal(g.shoot({ x: 805, y: 160 }), false);
  resolve(g);
  assert.equal(g.ourShots.length, 1);
  assert.equal(g.phase, "result");
  g.update(30);
  assert.equal(g.phase, "result");
  assert.equal(g.ourShots.length, 1);
});
test("center shots can be saved and a free corner can score", () => {
  const center = game(),
    corner = game();
  center.shoot({ x: 500, y: 285 });
  corner.shoot({ x: 190, y: 160 });
  resolve(center);
  resolve(corner);
  assert.equal(center.outcome, "saved");
  assert.equal(corner.outcome, "goal");
});
test("turns alternate between shooting and goalkeeping; the piggies wait for ready", () => {
  const g = game();
  defendTurn(g);
  assert.equal(g.turn, "defend");
  g.update(40);
  assert.equal(g.phase, "ready");
  g.ready();
  assert.equal(g.phase, "windup");
  g.update(0.79);
  assert.equal(g.phase, "windup");
  g.update(0.02);
  assert.equal(g.phase, "flight");
  assert.equal(g.flightAge, 0);
  g.moveKeeper(g.target.x);
  resolve(g);
  assert.equal(g.outcome, "saved");
  g.next();
  assert.equal(g.turn, "attack");
  assert.equal(g.round, 2);
  assert.equal(g.shooter, "red");
});
test("keeper directly follows one finger, stays when released and can concede if left in the middle", () => {
  const g = game();
  defendTurn(g);
  g.moveKeeper(250);
  assert.equal(g.keeperX, 250);
  g.update(0.5);
  assert.equal(g.keeperX, 250);
  g.moveKeeper(500);
  g.ready();
  resolve(g);
  assert.equal(g.outcome, "goal");
});
test("shot power can be armed and cancelled freely; each launch spends one of two uses", () => {
  const g = game();
  g.toggleShot();
  assert.equal(g.shotCharges, 2);
  g.toggleShot();
  assert.equal(g.shotCharges, 2);
  g.toggleShot();
  g.shoot({ x: 190, y: 160 });
  assert.equal(g.shotCharges, 1);
  assert.equal(g.shotKind, "matilda");
  resolve(g);
  g.next();
  assert.equal(g.shotCharges, 1);
});
test("all six shooting abilities have their own identity and use the selected shooter", () => {
  const durations = {};
  for (const id of ["matilda", "red", "chuck", "bomb", "blues", "stella"]) {
    const g = game(id);
    g.toggleShot();
    g.shoot({ x: 230, y: 180 });
    assert.equal(g.shotKind, id);
    assert.equal(g.shotCharges, 1);
    durations[id] = g.flightDuration;
    resolve(g);
    assert.equal(g.ourShots.length, 1);
  }
  assert.ok(durations.chuck < durations.red);
  assert.ok(durations.red < durations.matilda);
});
test("keeper powers arm before ready and only spend a use when the shot starts", () => {
  for (const id of ["matilda", "red", "chuck", "bomb", "blues", "stella"]) {
    const g = game("matilda", id);
    defendTurn(g);
    g.toggleKeeper();
    assert.equal(g.keeperCharges, 2);
    assert.equal(g.keeperArmed, true);
    g.moveKeeper(g.target.x);
    g.ready();
    g.update(0.81);
    assert.equal(g.keeperCharges, 1);
    assert.equal(g.powerUsed, true);
    g.toggleKeeper();
    assert.equal(g.keeperCharges, 1);
    if (id === "chuck") assert.ok(g.flightDuration > 1.25);
    resolve(g);
    assert.equal(g.outcome, "saved");
  }
});
test("Red covers a wider area and Blues clones save at distinct positions", () => {
  for (const id of ["red", "blues"]) {
    const g = game("matilda", id);
    defendTurn(g);
    g.target = { x: 650, y: 285 };
    g.keeperX = 500;
    g.keeperY = 285;
    assert.equal(g.isSaved(), false);
    g.keeperActive = true;
    assert.equal(g.isSaved(), true);
  }
});
test("Stella can catch a nearby puck before it reaches the net", () => {
  const g = game("matilda", "stella");
  defendTurn(g);
  g.moveKeeper(530);
  g.toggleKeeper();
  g.ready();
  resolve(g);
  assert.equal(g.outcome, "saved");
  assert.ok(g.progress < 1);
});
test("pause freezes movement, shots, ready and powers without changing the score", () => {
  const g = game();
  g.pause(true);
  const before = JSON.stringify(g.snapshot());
  g.update(50);
  g.shoot({ x: 220, y: 220 });
  g.toggleShot();
  assert.equal(JSON.stringify(g.snapshot()), before);
  g.pause(false);
  defendTurn(g);
  g.pause(true);
  const x = g.keeperX;
  g.moveKeeper(800);
  g.ready();
  g.toggleKeeper();
  g.update(5);
  assert.equal(g.keeperX, x);
  assert.equal(g.phase, "ready");
});
test("five complete rounds count each team once and tie-break adds one chosen round", () => {
  const g = game();
  for (let i = 0; i < 10; i++) {
    if (g.turn === "attack") g.shoot({ x: 500, y: 285 });
    else {
      g.moveKeeper(g.target.x);
      g.ready();
    }
    resolve(g);
    g.next();
  }
  assert.equal(g.phase, "finished");
  assert.equal(g.ourShots.length, 5);
  assert.equal(g.pigShots.length, 5);
  assert.equal(g.ours, 0);
  assert.equal(g.theirs, 0);
  g.update(50);
  assert.equal(g.phase, "finished");
  g.extraRound();
  assert.equal(g.rounds, 6);
  assert.equal(g.round, 6);
  assert.equal(g.phase, "aim");
});
test("input uses the same proportions as the drawing in portrait and landscape", () => {
  for (const [w, h] of [
    [900, 600],
    [500, 650],
    [1200, 710],
    [330, 270],
  ]) {
    const v = penaltyViewport(w, h),
      p = penaltyPoint(v.x + 200 * v.scale, v.y + 200 * v.scale, w, h);
    assert.ok(Math.abs(p.x - 200) < 0.001);
    assert.ok(Math.abs(p.y - 200) < 0.001);
    assert.ok(1000 * v.scale <= w + 0.001);
    assert.ok(700 * v.scale <= h + 0.001);
  }
});
if (
  !path.resolve(temp).startsWith(path.resolve(tmpdir()) + path.sep) ||
  !path.basename(temp).startsWith("penalty-tests-")
)
  throw Error("Unexpected test directory");
await rm(temp, { recursive: true, force: true });
