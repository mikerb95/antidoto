import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GUIDES, guidesFor, resolveStep, startStep, stepHref, stepMatches } from "./admin-guides.ts";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.tsx$/.test(p) ? [readFileSync(p, "utf8")] : [];
  });
}

test("las guías tienen ids únicos y rutas válidas", () => {
  assert.equal(new Set(GUIDES.map((g) => g.id)).size, GUIDES.length);
  for (const g of GUIDES) {
    assert.ok(g.steps.length > 0, g.id);
    for (const s of g.steps) assert.doesNotThrow(() => new RegExp(s.path), `${g.id}: ${s.path}`);
  }
});

test("cada elemento que ilumina una guía está marcado en alguna pantalla", () => {
  const code = sources(new URL("../", import.meta.url).pathname).join("\n");
  for (const g of GUIDES) {
    for (const s of g.steps) {
      if (!s.target) continue;
      const literal = code.includes(`data-guide="${s.target}"`);
      // Las secciones del editor de marca se marcan con su número: data-guide={`marca-${step}`}.
      const numbered = /^marca-\d$/.test(s.target) && code.includes("data-guide={`marca-${step}`}");
      assert.ok(literal || numbered, `${g.id}: falta data-guide="${s.target}"`);
    }
  }
});

test("el admin de empresa no ve guías ni pasos solo de superadmin", () => {
  const mine = guidesFor("empresa");
  assert.ok(!mine.some((g) => g.id === "crear-empresa" || g.id === "asignar-actividad"));
  for (const g of mine) for (const s of g.steps) assert.ok(!s.roles || s.roles.includes("empresa"), `${g.id}: ${s.title}`);
});

test("la guía empieza en la pantalla donde está el admin", () => {
  const asignar = guidesFor("super").find((g) => g.id === "asignar-actividad")!;
  assert.equal(startStep(asignar, "/admin"), 0);
  assert.equal(startStep(asignar, "/admin/empresas/7"), 1);
  assert.equal(startStep(asignar, "/admin/asignar"), 2);
});

test("avanza sola al llegar a la pantalla del paso siguiente, de a uno", () => {
  const asignar = guidesFor("super").find((g) => g.id === "asignar-actividad")!;
  assert.equal(resolveStep(asignar, 1, "/admin/asignar"), 2);
  assert.equal(resolveStep(asignar, 1, "/admin/empresas/7"), 1);
  const last = asignar.steps.length - 1;
  assert.equal(resolveStep(asignar, last - 1, "/admin/empresas/7"), last);
  // Desde la lista de empresas no salta hasta el formulario: hay un paso en otra pantalla entre medio.
  assert.equal(resolveStep(asignar, 0, "/admin/asignar"), 0);
  // Sí se salta lo que quedaba en la misma pantalla: tocó «Ver resultados» sin ver «Certificados».
  const resultados = guidesFor("super").find((g) => g.id === "ver-resultados")!;
  assert.equal(resolveStep(resultados, 1, "/admin/empresas/7/actividades/m1"), resultados.steps.length - 1);
});

test("las rutas distinguen la edición de riesgos de las otras páginas de la biblioteca", () => {
  const editar = GUIDES.find((g) => g.id === "editar-textos")!;
  const riesgo = editar.steps.at(-1)!;
  assert.ok(stepMatches(riesgo, "/admin/biblioteca/jv-bodega"));
  assert.ok(!stepMatches(riesgo, "/admin/biblioteca/actividad/jv-bodega"));
});

test("Llévame resuelve la empresa del admin y no inventa una para el superadmin", () => {
  const step = { path: "x", href: "/admin/empresas/{empresa}", title: "", body: "" };
  assert.equal(stepHref(step, 4), "/admin/empresas/4");
  assert.equal(stepHref(step, null), null);
});
