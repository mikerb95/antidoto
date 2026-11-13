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
  const reds = [brick(1, "placa-2x4", "Rojo brillante"), brick(2, "placa-2x4", "Rojo brillante", 4)];
  assert.equal(stockLeft(stock, reds).get(stockKey(partByKey("placa-2x4").id, colorIndex("Rojo brillante"))), 0);
  assert.equal(overStock(stock, reds), false);
  assert.equal(overStock(stock, [...reds, brick(3, "placa-2x4", "Rojo brillante", 8)]), true);
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
