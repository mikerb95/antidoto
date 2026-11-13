import { test } from "node:test";
import assert from "node:assert/strict";
import { getBuild, publicBuild, validateWork } from "./challenges.ts";
import { encodeBuild } from "./codec.ts";
import { getKit, KITS, kitStock, kitTotal, overStock, publicKit, stockKey, stockLeft } from "./kits.ts";
import { colorIndex } from "./palette.ts";
import { partByKey } from "./parts.ts";
import type { Brick } from "./world.ts";

const brick = (n: number, key: string, color: string, x = 0): Brick => ({ id: `k${n}`, part: partByKey(key).id, color: colorIndex(color), x, y: 0, z: 0, rot: 0 });

test("los kits tienen claves únicas y todas sus piezas y colores existen", () => {
  assert.equal(new Set(KITS.map((k) => k.key)).size, KITS.length);
  for (const k of KITS) {
    // kitStock falla si una pieza o un color no existen.
    assert.ok(kitStock(k).size > 0, k.key);
    for (const i of k.items) assert.ok(Number.isInteger(i.qty) && i.qty > 0, `${k.key}: ${i.part}`);
  }
});

test("las cantidades siguen los inventarios oficiales", () => {
  assert.equal(kitTotal(getKit("pato")!), 6);
  assert.equal(kitTotal(getKit("window-exploration")!), 48);
  const starter = kitTotal(getKit("starter")!);
  assert.ok(starter >= 180 && starter <= 234, `starter: ${starter}`);
});

test("el kit público junta la misma pieza y color en una sola fila", () => {
  const pub = publicKit(getKit("pato")!);
  assert.equal(pub.total, 6);
  assert.equal(pub.items.reduce((s, i) => s + i.qty, 0), 6);
  const keys = pub.items.map((i) => stockKey(i.part, i.color));
  assert.equal(new Set(keys).size, keys.length);
});

test("el inventario descuenta lo puesto y detecta lo que se pasa", () => {
  const stock = kitStock(getKit("pato")!);
  const reds = [brick(1, "placa-2x3", "Rojo brillante"), brick(2, "placa-2x3", "Rojo brillante", 4)];
  assert.equal(stockLeft(stock, reds).get(stockKey(partByKey("placa-2x3").id, colorIndex("Rojo brillante"))), 0);
  assert.equal(overStock(stock, reds), false);
  assert.equal(overStock(stock, [...reds, brick(3, "placa-2x3", "Rojo brillante", 8)]), true);
  // Una pieza que el kit no trae, o un color que no trae, ya se pasa.
  assert.equal(overStock(stock, [brick(4, "ladrillo-1x1", "Amarillo brillante")]), true);
  assert.equal(overStock(stock, [brick(5, "ladrillo-2x4", "Azul brillante")]), true);
});

test("el reto con kit arranca vacío y la obra se valida contra el kit", () => {
  const def = getBuild("construccion-libre")!;
  const kit = getKit("pato")!;
  const pub = publicBuild(def, def.defaults, kit);
  assert.equal(pub.starter, false);
  assert.equal(pub.kit?.key, "pato");
  const ok = encodeBuild(def.base, [brick(1, "ladrillo-2x4", "Amarillo brillante")]);
  assert.equal(validateWork(def, ok, kit).ok, true);
  const bad = encodeBuild(def.base, [brick(1, "ladrillo-2x4", "Azul brillante")]);
  assert.equal(validateWork(def, bad, kit).ok, false);
  assert.equal(validateWork(def, bad).ok, true);
});

test("replicar no acepta kit: el modelo pide piezas exactas", () => {
  const def = getBuild("replica-casa")!;
  assert.equal(publicBuild(def, def.defaults, getKit("pato")).kit, null);
});

test("en equipo la bolsa es compartida: el servidor rechaza la pieza que ya no queda", async () => {
  const { applyTeamOp, getTeamMode, modeAcceptsKit } = await import("./team.ts");
  const { BrickWorld } = await import("./world.ts");
  const world = new BrickWorld(16);
  const rules = { base: 16, maxPieces: null, parcel: null, stock: kitStock(getKit("pato")!) };
  const add = (b: Brick) => applyTeamOp(world, { t: "add", brick: b }, rules);
  assert.equal(add(brick(1, "placa-2x3", "Rojo brillante", 0)), null);
  assert.equal(add(brick(2, "placa-2x3", "Rojo brillante", 5)), null);
  assert.equal(add(brick(3, "placa-2x3", "Rojo brillante", 10)), "kit");
  assert.equal(world.bricks.size, 2);
  // Pintar una pieza de un color que el kit no trae tampoco pasa.
  assert.equal(applyTeamOp(world, { t: "paint", id: "k1", from: colorIndex("Rojo brillante"), to: colorIndex("Azul brillante") }, rules), "kit");
  assert.equal(modeAcceptsKit(getTeamMode("telefono-roto")!), false);
  assert.equal(modeAcceptsKit(getTeamMode("obra-equipo")!), true);
});

test("solo el Starter alcanza para equipos, y hasta 4 personas", async () => {
  const { teamKits } = await import("./kits.ts");
  assert.deepEqual(teamKits(4).map((k) => k.key), ["starter"]);
  assert.deepEqual(teamKits(5), []);
});
