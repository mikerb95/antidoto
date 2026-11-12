// Certificados de participación. Puro para poder probarlo.
import { createHash } from "node:crypto";

/**
 * Número del certificado ("7F3A-91C2"). Sale del id de la participación, así que la misma
 * persona recibe siempre el mismo número, pero no deja adivinar el id (que viaja en una cookie).
 */
export function certificateFolio(participationId: string): string {
  const hex = createHash("sha256").update(`certificado:${participationId}`).digest("hex").slice(0, 8).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

/** Acepta el número como lo escribiría alguien: minúsculas, sin guion, con espacios. */
export function normalizeFolio(value: string): string | null {
  const hex = value.toUpperCase().replace(/[^0-9A-F]/g, "");
  return hex.length === 8 ? `${hex.slice(0, 4)}-${hex.slice(4)}` : null;
}

/** Fecha de SQLite ("YYYY-MM-DD HH:MM:SS", UTC) como "12 de noviembre de 2026", en hora de Colombia. */
export function certificateDate(value: string): string {
  const date = new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long", year: "numeric" });
}

/** Tamaño del nombre en puntos: uno largo baja de tamaño para no partirse en tres líneas. */
export function nameFontSize(name: string): number {
  const n = [...name.trim()].length;
  if (n <= 22) return 44;
  if (n <= 32) return 36;
  if (n <= 46) return 29;
  return 23;
}
