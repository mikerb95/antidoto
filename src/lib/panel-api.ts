import "server-only";
import { all, one, run } from "./db";
import { verifyPass } from "./panel-pass";
import { LIVE_CODE } from "./scope";

// API para el panel de Antídoto (antidoto-web): solo de servidor a servidor, con un pase firmado
// en Authorization. No usa la sesión del portal ni acepta llamadas del navegador.

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** null si la petición trae un pase de API vigente; si no, la respuesta de rechazo. */
export function rejectPanel(request: Request): Response | null {
  const secret = process.env.PANEL_SHARED_SECRET;
  if (!secret) return json({ error: "sin_configurar" }, 503);
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return verifyPass(token, secret, "api") ? null : json({ error: "pase" }, 401);
}

export const WEEKS = 12;

/** Participantes nuevos por semana, de la más vieja a la actual. */
export async function weeklyParticipants(): Promise<number[]> {
  const rows = await all<{ hace: number; n: number }>(
    `SELECT CAST((julianday('now') - julianday(p.started_at)) / 7 AS INTEGER) AS hace, COUNT(*) AS n
     FROM participations p JOIN activity_codes ac ON ac.id = p.activity_code_id
     WHERE p.started_at >= datetime('now', ?) AND ${LIVE_CODE}
     GROUP BY hace`,
    [`-${WEEKS * 7} days`]
  );
  const weeks = Array.from({ length: WEEKS }, () => 0);
  for (const r of rows) {
    const i = WEEKS - 1 - Number(r.hace);
    if (i >= 0 && i < WEEKS) weeks[i] = Number(r.n);
  }
  return weeks;
}

export interface PanelCompany {
  id: number;
  nombre: string;
  archivada: boolean;
  actividades: number;
  participantes: number;
}

/** Todas las empresas, archivadas incluidas, con lo que tienen asignado y sin quitar. */
export async function listPanelCompanies(): Promise<PanelCompany[]> {
  const rows = await all<{ id: number; name: string; archived: number; activities: number; participantes: number }>(
    `SELECT c.id, c.name,
            EXISTS (SELECT 1 FROM company_archive ca WHERE ca.company_id = c.id) AS archived,
            COUNT(DISTINCT ac.id) AS activities, COUNT(p.id) AS participantes
     FROM companies c
     LEFT JOIN activity_codes ac ON ac.company_id = c.id
       AND NOT EXISTS (SELECT 1 FROM activity_code_archive xa WHERE xa.activity_code_id = ac.id)
     LEFT JOIN participations p ON p.activity_code_id = ac.id
     GROUP BY c.id
     ORDER BY c.name COLLATE NOCASE`
  );
  return rows.map((r) => ({
    id: Number(r.id),
    nombre: r.name,
    archivada: Number(r.archived) === 1,
    actividades: Number(r.activities),
    participantes: Number(r.participantes),
  }));
}

/**
 * Crea la empresa (sin marca: se muestra con la de Antídoto hasta que alguien la edite) o
 * devuelve la que ya tiene ese nombre, para que enlazar dos veces no la duplique.
 */
export async function findOrCreateCompany(rawName: string, actor: string): Promise<{ id: number; nombre: string; creada: boolean } | null> {
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) return null;
  const find = () => one<{ id: number; name: string }>("SELECT id, name FROM companies WHERE name = ? COLLATE NOCASE", [name]);

  const existing = await find();
  if (existing) return { id: Number(existing.id), nombre: existing.name, creada: false };

  await run("INSERT OR IGNORE INTO companies (name) VALUES (?)", [name]);
  const saved = await find();
  if (!saved) return null;
  const id = Number(saved.id);
  await run("INSERT INTO audit_log (text, admin_user_id, company_id) VALUES (?, NULL, ?)", [
    `Empresa "${saved.name}" creada desde el panel de Antídoto por ${actor.slice(0, 120)}.`,
    id,
  ]);
  return { id, nombre: saved.name, creada: true };
}
