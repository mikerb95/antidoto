// Visor en tiempo real del admin (pedido del 2026-11-12): compara la obra que ya se ve con la que
// acaba de guardar el participante y saca solo lo que cambió, para que las piezas nuevas caigan
// con su animación en vez de redibujar toda la obra. Lógica pura, sin three.

import type { Op } from "./ops.ts";
import type { Brick } from "./world.ts";

/** Una pieza se reconoce por lo que es y dónde está: los ids se regeneran en cada guardado. */
export function brickKey(b: Pick<Brick, "part" | "color" | "x" | "y" | "z" | "rot">): string {
  return `${b.part}:${b.color}:${b.x}:${b.y}:${b.z}:${b.rot}`;
}

/** La obra con ids estables (su clave), para poder comparar dos guardados. */
export function keyed(bricks: Brick[]): Brick[] {
  const seen = new Set<string>();
  const out: Brick[] = [];
  for (const b of bricks) {
    const id = brickKey(b);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ ...b, id });
  }
  return out;
}

/** Operaciones para pasar de `prev` a `next` (ambas con `keyed`): primero lo que sale, luego lo que entra. */
export function diffBricks(prev: Brick[], next: Brick[]): Op[] {
  const before = new Map(prev.map((b) => [b.id, b]));
  const after = new Set(next.map((b) => b.id));
  const ops: Op[] = [];
  for (const b of prev) if (!after.has(b.id)) ops.push({ t: "remove", brick: b });
  // De abajo hacia arriba: una pieza nueva puede apoyarse en otra que también es nueva.
  for (const b of [...next].sort((a, c) => a.y - c.y)) if (!before.has(b.id)) ops.push({ t: "add", brick: b });
  return ops;
}

/** Estado de una obra en el visor, dicho como lo leería el admin. */
export type WatchState = "sin-empezar" | "construyendo" | "quieto" | "entrego";

/** Sin cambios en este tiempo, la persona probablemente está pensando o se fue. */
export const IDLE_MS = 60_000;

export function watchState(w: { started: boolean; submitted: boolean; updatedMs: number | null }, now: number): WatchState {
  if (w.submitted) return "entrego";
  if (!w.started) return "sin-empezar";
  return w.updatedMs !== null && now - w.updatedMs < IDLE_MS ? "construyendo" : "quieto";
}
