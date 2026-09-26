// Datos que un código pide al participante en la bienvenida. Solo listas cerradas: el
// cargo sale de la lista que arma el admin al asignar la actividad y el lugar, de la
// DIVIPOLA. Así los reportes se filtran sin "Bogota", "bogotá" y "Bta" por separado.
// Lógica pura, sin base de datos, para probarla con node --test.

import { lugar } from "./colombia.ts";

export interface ProfileConfig {
  /** Cargos para elegir; null = no se pregunta el cargo. */
  cargos: string[] | null;
  /** Se preguntan departamento y municipio. */
  askPlace: boolean;
}

export interface ParticipantProfile {
  cargo: string | null;
  /** Código DANE del municipio. */
  municipio: string | null;
}

/** Propuesta para una empresa nueva: el admin la ajusta a los cargos reales. */
export const DEFAULT_CARGOS = [
  "Operario de campo",
  "Operario de planta o producción",
  "Conductor o transporte",
  "Bodega y logística",
  "Mantenimiento",
  "Atención al cliente o tienda",
  "Administrativo",
  "Supervisor o coordinador",
  "Directivo",
];

export const CARGO_LIMITS = { items: 40, length: 60 } as const;

/** Una línea por cargo; se quitan vacíos y repetidos (sin importar mayúsculas). */
export function parseCargos(text: string): { ok: true; value: string[] } | { ok: false; error: string } {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const raw of text.split("\n")) {
    const cargo = raw.replace(/\s+/g, " ").trim();
    if (!cargo) continue;
    if (cargo.length > CARGO_LIMITS.length) return { ok: false, error: `"${cargo.slice(0, 30)}…" es muy largo: máximo ${CARGO_LIMITS.length} caracteres por cargo.` };
    const key = cargo.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(cargo);
  }
  if (list.length < 2) return { ok: false, error: "Escribe al menos dos cargos, uno por línea." };
  if (list.length > CARGO_LIMITS.items) return { ok: false, error: `Máximo ${CARGO_LIMITS.items} cargos.` };
  return { ok: true, value: list };
}

/** Lo que llega del formulario de la bienvenida, validado contra lo que pide el código. */
export function validateProfile(
  config: ProfileConfig,
  input: { cargo: unknown; municipio: unknown },
): { ok: true; value: ParticipantProfile } | { ok: false; error: string } {
  let cargo: string | null = null;
  if (config.cargos) {
    cargo = typeof input.cargo === "string" ? input.cargo : "";
    if (!config.cargos.includes(cargo)) return { ok: false, error: "Elige tu cargo de la lista." };
  }
  let municipio: string | null = null;
  if (config.askPlace) {
    municipio = typeof input.municipio === "string" ? input.municipio : "";
    if (!lugar(municipio)) return { ok: false, error: "Elige tu departamento y tu municipio." };
  }
  return { ok: true, value: { cargo, municipio } };
}

export function asksSomething(config: ProfileConfig | null): config is ProfileConfig {
  return !!config && (!!config.cargos || config.askPlace);
}
