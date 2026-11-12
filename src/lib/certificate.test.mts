import { test } from "node:test";
import assert from "node:assert/strict";
import { certificateDate, certificateFolio, nameFontSize, normalizeFolio } from "./certificate.ts";

test("el número del certificado es estable y tiene la forma XXXX-XXXX", () => {
  const folio = certificateFolio("abc123");
  assert.match(folio, /^[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(certificateFolio("abc123"), folio);
  assert.notEqual(certificateFolio("abc124"), folio);
});

test("el número no contiene el id de la participación", () => {
  assert.equal(certificateFolio("DEADBEEF").replace("-", "") === "DEADBEEF", false);
});

test("un número escrito a mano se normaliza", () => {
  assert.equal(normalizeFolio(" 7f3a 91c2 "), "7F3A-91C2");
  assert.equal(normalizeFolio("7F3A-91C2"), "7F3A-91C2");
  assert.equal(normalizeFolio("7F3A"), null);
  assert.equal(normalizeFolio("zzzz-zzzz"), null);
});

test("la fecha sale en hora de Colombia, no en la del servidor", () => {
  // 3 am UTC del 13 son las 10 pm del 12 en Colombia.
  assert.equal(certificateDate("2026-11-13 03:00:00"), "12 de noviembre de 2026");
  assert.equal(certificateDate("2026-11-13 15:00:00"), "13 de noviembre de 2026");
});

test("una fecha ilegible se devuelve tal cual", () => {
  assert.equal(certificateDate("pronto"), "pronto");
});

test("los nombres largos bajan de tamaño", () => {
  assert.ok(nameFontSize("Ana Ruiz") > nameFontSize("María Fernanda de los Ángeles Rodríguez"));
  assert.ok(nameFontSize("María Fernanda de los Ángeles Rodríguez") > nameFontSize("x".repeat(60)));
});
