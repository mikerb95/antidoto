// Lo que cada empresa puede ajustar de su certificado. Módulo puro (sin node:crypto ni base
// de datos): lo usan el servidor, el editor en el navegador y los tests.
import { parseHex } from "./brand-palette";

export interface CertificateConfig {
  title: string;
  intro: string;
  reason: string;
  showDate: boolean;
  showCargo: boolean;
  showFolio: boolean;
  showLogo: boolean;
  /** Roseta de fondo y doble marco. */
  showDecor: boolean;
  showSeal: boolean;
  /** Null = los colores de la marca de la empresa. */
  primary: string | null;
  secondary: string | null;
  signerName: string | null;
  signerRole: string | null;
  /** Con versión para cachearla; null = sin imagen de firma. */
  signatureUrl: string | null;
}

/** El certificado tal como era antes de poder configurarlo. */
export const DEFAULT_CERTIFICATE: CertificateConfig = {
  title: "CERTIFICADO DE PARTICIPACIÓN",
  intro: "Se otorga a",
  reason: "por haber participado y completado la actividad",
  showDate: true,
  showCargo: true,
  showFolio: true,
  showLogo: true,
  showDecor: true,
  showSeal: true,
  primary: null,
  secondary: null,
  signerName: null,
  signerRole: null,
  signatureUrl: null,
};

export const CERT_LIMITS = { title: 60, intro: 60, reason: 140, signer: 80 } as const;

export const TOGGLES = ["showDate", "showCargo", "showFolio", "showLogo", "showDecor", "showSeal"] as const;
export type CertificateToggle = (typeof TOGGLES)[number];

export type CertificateField = "title" | "intro" | "reason" | "primary" | "secondary" | "signerName" | "signerRole" | "signature";

/** Espacios repetidos fuera y bordes recortados. */
export const cleanText = (value: string) => value.trim().replace(/\s+/g, " ");

export const signatureUrl = (companyId: number, version: string) => `/marca/${companyId}/firma?v=${version}`;

/** El certificado tiene bloque de firma si hay alguien que firma o una imagen. */
export const hasSignature = (c: Pick<CertificateConfig, "signerName" | "signatureUrl">) => !!(c.signerName || c.signatureUrl);

export type ParsedCertificate =
  | { ok: true; value: Omit<CertificateConfig, "signatureUrl"> }
  | { ok: false; error: string; field?: CertificateField };

/**
 * Lee y valida los campos del formulario. `get` devuelve el valor crudo de un campo (o null).
 * Los interruptores llegan como "1" encendidos; cualquier otra cosa es apagado.
 */
export function parseCertificateForm(get: (key: string) => string | null): ParsedCertificate {
  const text = (key: string) => cleanText(get(key) ?? "");

  const title = text("title");
  if (!title) return { ok: false, error: "Escribe el título del certificado.", field: "title" };
  if (title.length > CERT_LIMITS.title) return { ok: false, error: `El título admite hasta ${CERT_LIMITS.title} caracteres.`, field: "title" };
  const intro = text("intro");
  if (intro.length > CERT_LIMITS.intro) return { ok: false, error: `La frase admite hasta ${CERT_LIMITS.intro} caracteres.`, field: "intro" };
  const reason = text("reason");
  if (reason.length > CERT_LIMITS.reason) return { ok: false, error: `El motivo admite hasta ${CERT_LIMITS.reason} caracteres.`, field: "reason" };

  let primary: string | null = null;
  let secondary: string | null = null;
  if (get("colorMode") === "propios") {
    primary = parseHex(text("primary"));
    if (!primary) return { ok: false, error: "Elige un color principal válido (por ejemplo #1C99CA).", field: "primary" };
    const rawSecondary = text("secondary");
    secondary = rawSecondary ? parseHex(rawSecondary) : null;
    if (rawSecondary && !secondary) return { ok: false, error: "El color secundario no es válido.", field: "secondary" };
  }

  const signerName = text("signerName") || null;
  if (signerName && signerName.length > CERT_LIMITS.signer) return { ok: false, error: `El nombre admite hasta ${CERT_LIMITS.signer} caracteres.`, field: "signerName" };
  const signerRole = text("signerRole") || null;
  if (signerRole && signerRole.length > CERT_LIMITS.signer) return { ok: false, error: `El cargo admite hasta ${CERT_LIMITS.signer} caracteres.`, field: "signerRole" };

  const flag = (key: CertificateToggle) => get(key) === "1";
  return {
    ok: true,
    value: {
      title,
      intro,
      reason,
      showDate: flag("showDate"),
      showCargo: flag("showCargo"),
      showFolio: flag("showFolio"),
      showLogo: flag("showLogo"),
      showDecor: flag("showDecor"),
      showSeal: flag("showSeal"),
      primary,
      secondary: primary ? secondary : null,
      signerName,
      signerRole,
    },
  };
}
