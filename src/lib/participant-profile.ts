import "server-only";
import { all, one } from "./db";
import type { ParticipantProfile, ProfileConfig } from "./profile";

function parseConfig(row: { cargos: string | null; ask_place: number } | null): ProfileConfig | null {
  if (!row) return null;
  let cargos: string[] | null = null;
  try {
    const parsed = row.cargos ? JSON.parse(row.cargos) : null;
    if (Array.isArray(parsed) && parsed.every((c) => typeof c === "string")) cargos = parsed;
  } catch {
    cargos = null;
  }
  return { cargos, askPlace: Number(row.ask_place) === 1 };
}

/** Qué datos pide el código de una participación; null si no pide nada. */
export async function profileConfigFor(participationId: string): Promise<ProfileConfig | null> {
  const row = await one<{ cargos: string | null; ask_place: number }>(
    `SELECT acp.cargos, acp.ask_place
     FROM participations p JOIN activity_code_profile acp ON acp.activity_code_id = p.activity_code_id
     WHERE p.id = ?`,
    [participationId],
  );
  return parseConfig(row);
}

/** Lo que respondió en la bienvenida; null si todavía no la termina. */
export async function participantProfile(participationId: string): Promise<ParticipantProfile | null> {
  const row = await one<ParticipantProfile>("SELECT cargo, municipio FROM participant_profiles WHERE participation_id = ?", [
    participationId,
  ]);
  return row ? { cargo: row.cargo, municipio: row.municipio } : null;
}

/**
 * Los cargos del último código de cada empresa que los pidió: al asignarle otra actividad
 * el formulario los propone y no hay que escribirlos otra vez.
 */
export async function lastCargosByCompany(): Promise<Record<number, string[]>> {
  const rows = await all<{ company_id: number; cargos: string | null; ask_place: number }>(
    `SELECT ac.company_id, acp.cargos, acp.ask_place
     FROM activity_code_profile acp JOIN activity_codes ac ON ac.id = acp.activity_code_id
     WHERE acp.cargos IS NOT NULL
       AND ac.id = (SELECT MAX(x.id) FROM activity_codes x JOIN activity_code_profile y ON y.activity_code_id = x.id
                    WHERE x.company_id = ac.company_id AND y.cargos IS NOT NULL)`,
  );
  const out: Record<number, string[]> = {};
  for (const r of rows) {
    const cargos = parseConfig(r)?.cargos;
    if (cargos) out[Number(r.company_id)] = cargos;
  }
  return out;
}
