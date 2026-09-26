import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DEPARTAMENTOS, lugar } from "./colombia.ts";
import { DEFAULT_CARGOS, parseCargos, validateProfile } from "./profile.ts";

describe("DIVIPOLA", () => {
  test("trae los 33 departamentos y los 1.122 municipios, sin códigos repetidos", () => {
    assert.equal(DEPARTAMENTOS.length, 33);
    const codes = DEPARTAMENTOS.flatMap((d) => d.municipios.map(([c]) => c));
    assert.equal(codes.length, 1122);
    assert.equal(new Set(codes).size, codes.length);
  });

  test("cada municipio empieza por el código de su departamento", () => {
    for (const d of DEPARTAMENTOS) for (const [c] of d.municipios) assert.ok(c.startsWith(d.code), `${c} en ${d.name}`);
  });

  test("nombres con tildes y conectores en minúscula", () => {
    assert.deepEqual(lugar("05001"), { municipio: "Medellín", departamento: "Antioquia" });
    assert.deepEqual(lugar("11001"), { municipio: "Bogotá, D.C.", departamento: "Bogotá, D.C." });
    assert.equal(lugar("54001")?.departamento, "Norte de Santander");
    assert.equal(lugar("99999"), null);
  });
});

describe("cargos", () => {
  test("una línea por cargo, sin vacíos ni repetidos", () => {
    const r = parseCargos("  Barista \n\nbarista\nMesero   de  piso\n");
    assert.deepEqual(r, { ok: true, value: ["Barista", "Mesero de piso"] });
  });

  test("pide al menos dos y no acepta cargos larguísimos", () => {
    assert.equal(parseCargos("Barista").ok, false);
    assert.equal(parseCargos(`Barista\n${"x".repeat(61)}`).ok, false);
    assert.ok(parseCargos(DEFAULT_CARGOS.join("\n")).ok);
  });
});

describe("ficha del participante", () => {
  const config = { cargos: ["Barista", "Administrativo"], askPlace: true };

  test("solo acepta valores de las listas", () => {
    assert.deepEqual(validateProfile(config, { cargo: "Barista", municipio: "05001" }), {
      ok: true,
      value: { cargo: "Barista", municipio: "05001" },
    });
    assert.equal(validateProfile(config, { cargo: "barista", municipio: "05001" }).ok, false);
    assert.equal(validateProfile(config, { cargo: "Barista", municipio: "Medellín" }).ok, false);
    assert.equal(validateProfile(config, { cargo: "Barista", municipio: null }).ok, false);
  });

  test("lo que el código no pide se guarda vacío aunque llegue", () => {
    const r = validateProfile({ cargos: null, askPlace: false }, { cargo: "Barista", municipio: "05001" });
    assert.deepEqual(r, { ok: true, value: { cargo: null, municipio: null } });
  });
});
