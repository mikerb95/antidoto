import { test } from "node:test";
import assert from "node:assert/strict";
import { PASS_MAX_MS, safeDestination, signPass, ssoUsername, verifyPass, type PassClaims } from "./panel-pass.ts";

const SECRET = "un-secreto-de-prueba-de-mas-de-32-caracteres";
const NOW = 1_800_000_000_000;
const claims = (extra: Partial<PassClaims> = {}): PassClaims => ({
  uso: "entrar",
  exp: NOW + 60_000,
  jti: "0123456789abcdef0123",
  email: "ana@antidoto.co",
  ...extra,
});

test("un pase firmado con el mismo secreto se acepta", () => {
  const pass = verifyPass(signPass(claims(), SECRET), SECRET, "entrar", NOW);
  assert.equal(pass?.email, "ana@antidoto.co");
});

test("otro secreto, un secreto corto o ninguno no sirven", () => {
  const token = signPass(claims(), SECRET);
  assert.equal(verifyPass(token, `${SECRET}x`, "entrar", NOW), null);
  assert.equal(verifyPass(token, undefined, "entrar", NOW), null);
  assert.equal(verifyPass(signPass(claims(), "corto"), "corto", "entrar", NOW), null);
});

test("cambiar los datos rompe la firma", () => {
  const [v, , sig] = signPass(claims(), SECRET).split(".");
  const body = Buffer.from(JSON.stringify(claims({ email: "otra@antidoto.co" }))).toString("base64url");
  assert.equal(verifyPass(`${v}.${body}.${sig}`, SECRET, "entrar", NOW), null);
});

test("un pase vencido o que vence demasiado lejos se rechaza", () => {
  assert.equal(verifyPass(signPass(claims({ exp: NOW - 1 }), SECRET), SECRET, "entrar", NOW), null);
  assert.equal(verifyPass(signPass(claims({ exp: NOW + PASS_MAX_MS + 1000 }), SECRET), SECRET, "entrar", NOW), null);
});

test("un pase de API no abre sesión, ni al revés", () => {
  assert.equal(verifyPass(signPass(claims({ uso: "api" }), SECRET), SECRET, "entrar", NOW), null);
  assert.equal(verifyPass(signPass(claims(), SECRET), SECRET, "api", NOW), null);
  assert.ok(verifyPass(signPass(claims({ uso: "api" }), SECRET), SECRET, "api", NOW));
});

test("texto que no es un pase", () => {
  for (const basura of ["", "v1", "v1..", "v2.a.b", "v1.a.b.c", "x".repeat(3000)]) {
    assert.equal(verifyPass(basura, SECRET, "entrar", NOW), null);
  }
});

test("el destino solo puede ser una ruta del portal", () => {
  assert.equal(safeDestination("/admin/empresas/12"), "/admin/empresas/12");
  assert.equal(safeDestination("/admin"), "/admin");
  for (const malo of ["https://otro.com", "//otro.com", "/admin//otro.com", "/mision", "/admin/login", "/admin/entrar", "/admin/../x", "/admin?x=1", undefined, 5]) {
    assert.equal(safeDestination(malo), "/admin");
  }
});

test("el usuario de quien entra desde el panel es su correo en minúsculas", () => {
  assert.equal(ssoUsername(" Ana@Antidoto.co "), "ana@antidoto.co");
  assert.equal(ssoUsername("sin-arroba"), null);
  assert.equal(ssoUsername(null), null);
});
