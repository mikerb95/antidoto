import type { PublicExperience, RiskResult } from "@/lib/experiences/types";
import { GRAINS_CORRECT, GRAINS_FOUND } from "@/lib/experiences/texts";

export type Results = Map<string, RiskResult>;

/** Cómo va la ruta: granos, riesgos y qué estaciones están terminadas o abiertas. */
export function routeProgress(stations: PublicExperience[], results: Results) {
  const all = [...results.values()];
  const correct = all.filter((r) => r.correct).length;
  const spotted = all.filter((r) => r.chosen !== null).length;
  const done = stations.map((s) => s.risks.every((r) => results.has(r.id)));
  const current = done.indexOf(false);
  return {
    grains: correct * GRAINS_CORRECT + (spotted - correct) * GRAINS_FOUND,
    found: results.size,
    total: stations.reduce((n, s) => n + s.risks.length, 0),
    done,
    /** Una estación se abre al terminar la anterior. */
    open: stations.map((_, k) => k === 0 || done[k - 1]),
    /** La primera sin terminar; -1 si ya terminó todas. */
    current,
  };
}

/** "5 a 8 min" de cada estación sumados: "25 a 40 minutos". */
export function totalMinutes(stations: PublicExperience[]): string | null {
  let lo = 0;
  let hi = 0;
  for (const s of stations) {
    const m = /(\d+)\s*a\s*(\d+)/.exec(s.minutes);
    if (!m) return null;
    lo += Number(m[1]);
    hi += Number(m[2]);
  }
  return `${lo} a ${hi} minutos`;
}
