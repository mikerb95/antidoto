import { test } from "node:test";
import assert from "node:assert/strict";
import { apply } from "./ops.ts";
import { BrickWorld, type Brick } from "./world.ts";
import { diffBricks, keyed, watchState, IDLE_MS } from "./watch.ts";

const b = (x: number, y = 0, color = 0): Brick => ({ id: `x${x}${y}`, part: 1, color, x, y, z: 0, rot: 0 });

test("la comparación saca solo lo que cambió y deja la obra igual a la nueva", () => {
  const prev = keyed([b(0), b(2), b(4)]);
  const next = keyed([b(0), b(4), b(6), b(6, 3)]);
  const ops = diffBricks(prev, next);
  assert.equal(ops.filter((o) => o.t === "remove").length, 1);
  assert.equal(ops.filter((o) => o.t === "add").length, 2);
  const world = new BrickWorld(16);
  for (const p of prev) world.add(p);
  for (const op of ops) assert.ok(apply(world, op), JSON.stringify(op));
  assert.deepEqual([...world.bricks.keys()].sort(), next.map((n) => n.id).sort());
});

test("pintar una pieza cuenta como quitar la vieja y poner la nueva", () => {
  const ops = diffBricks(keyed([b(0, 0, 1)]), keyed([b(0, 0, 2)]));
  assert.deepEqual(ops.map((o) => o.t), ["remove", "add"]);
});

test("las piezas nuevas entran de abajo hacia arriba", () => {
  const ops = diffBricks([], keyed([b(0, 6), b(0, 0), b(0, 3)]));
  assert.deepEqual(ops.map((o) => (o.t === "add" ? o.brick.y : -1)), [0, 3, 6]);
});

test("el estado se lee como lo diría el admin", () => {
  const now = 1_000_000;
  assert.equal(watchState({ started: false, submitted: false, updatedMs: null }, now), "sin-empezar");
  assert.equal(watchState({ started: true, submitted: false, updatedMs: now - 5000 }, now), "construyendo");
  assert.equal(watchState({ started: true, submitted: false, updatedMs: now - IDLE_MS - 1 }, now), "quieto");
  assert.equal(watchState({ started: true, submitted: true, updatedMs: now }, now), "entrego");
});
