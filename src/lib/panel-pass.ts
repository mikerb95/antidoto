import { createHmac, timingSafeEqual } from "node:crypto";

// Pases firmados que emite el panel de Antídoto (antidoto-web, api/src/misiones.ts) para entrar
// a este portal sin otra contraseña y para leer el resumen de servidor a servidor. Los dos lados
// comparten un secreto (PANEL_SHARED_SECRET aquí, MISIONES_SECRETO allá). Sin "server-only" ni
// base de datos, para probarlo con node --test.
//
// Formato: "v1.<datos en base64url>.<HMAC-SHA256 de 'v1.<datos>' en base64url>".

export type PassUse = "entrar" | "api";

export interface PassClaims {
  /** Para qué sirve: un pase de API no abre sesión y uno de entrada no lee la API. */
  uso: PassUse;
  /** Vencimiento en milisegundos. */
  exp: number;
  /** Identificador único: el pase de entrada sirve una sola vez. */
  jti: string;
  email?: string;
  nombre?: string;
  /** Ruta del portal a la que se llega después de entrar. */
  destino?: string;
}

/** Un pase dura segundos. Uno que venza más lejos que esto no lo firmó el panel. */
export const PASS_MAX_MS = 5 * 60_000;
export const SECRET_MIN = 32;

const sign = (body: string, secret: string) => createHmac("sha256", secret).update(`v1.${body}`).digest();

export function signPass(claims: PassClaims, secret: string): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `v1.${body}.${sign(body, secret).toString("base64url")}`;
}

/** Los datos del pase, o null si la firma, el uso o la vigencia no cuadran. */
export function verifyPass(token: string, secret: string | undefined, uso: PassUse, now = Date.now()): PassClaims | null {
  if (!secret || secret.length < SECRET_MIN || token.length > 2000) return null;
  const [version, body, signature, extra] = token.split(".");
  if (version !== "v1" || !body || !signature || extra !== undefined) return null;

  const given = Buffer.from(signature, "base64url");
  const expected = sign(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let claims: PassClaims;
  try {
    claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PassClaims;
  } catch {
    return null;
  }
  if (!claims || typeof claims !== "object" || claims.uso !== uso) return null;
  if (typeof claims.exp !== "number" || claims.exp <= now || claims.exp - now > PASS_MAX_MS) return null;
  if (typeof claims.jti !== "string" || claims.jti.length < 16 || claims.jti.length > 80) return null;
  return claims;
}

/** Solo rutas del portal: un pase no puede mandar a otro sitio ni a otra parte de la app. */
export function safeDestination(path: unknown): string {
  if (typeof path !== "string" || path.length > 200) return "/admin";
  if (!/^\/admin(\/[A-Za-z0-9/_-]*)?$/.test(path) || path.includes("//")) return "/admin";
  if (path.startsWith("/admin/login") || path.startsWith("/admin/entrar")) return "/admin";
  return path;
}

/** El usuario del portal de quien entra desde el panel es su correo, en minúsculas. */
export function ssoUsername(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const username = email.trim().toLowerCase();
  if (username.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(username)) return null;
  return username;
}

/** Marca de una cuenta sin contraseña: verifyPassword no la acepta nunca. */
export const SSO_PASSWORD_HASH = "sso$";
