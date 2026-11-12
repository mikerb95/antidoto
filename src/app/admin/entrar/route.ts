import { redirect } from "next/navigation";
import { createSession, one, purgeExpiredSessions, run } from "@/lib/auth";
import { audit } from "@/lib/admin-guard";
import { SSO_PASSWORD_HASH, safeDestination, ssoUsername, verifyPass } from "@/lib/panel-pass";

export const dynamic = "force-dynamic";

const DENIED = "/admin/login?aviso=pase";

/**
 * Entrada desde el panel de Antídoto (antidoto-web): un pase firmado, de un solo uso y de
 * segundos de vida, abre la sesión de superadmin de quien lo pidió allá. Solo el rol Admin del
 * panel puede pedirlo. Los admins de empresa siguen entrando con su usuario y contraseña.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("pase") ?? "";
  const pass = verifyPass(token, process.env.PANEL_SHARED_SECRET, "entrar");
  const username = ssoUsername(pass?.email);
  if (!pass || !username) redirect(DENIED);

  // Un solo uso: la clave primaria deja pasar al primero aunque lleguen dos a la vez.
  await run("DELETE FROM sso_passes WHERE expires_at <= ?", [new Date().toISOString()]);
  const used = await run("INSERT OR IGNORE INTO sso_passes (jti, expires_at) VALUES (?, ?)", [pass.jti, new Date(pass.exp).toISOString()]);
  if (used.rowsAffected !== 1) redirect(DENIED);

  // La cuenta se crea la primera vez, sin contraseña. Si ya hay una con ese usuario, se usa
  // solo si es de superadmin: un pase nunca convierte la cuenta de una empresa.
  await run("INSERT OR IGNORE INTO admin_users (username, password_hash, role, company_id) VALUES (?, ?, 'super', NULL)", [username, SSO_PASSWORD_HASH]);
  const user = await one<{ id: number; role: string; disabled: number }>(
    `SELECT u.id, u.role, EXISTS (SELECT 1 FROM admin_user_disabled d WHERE d.admin_user_id = u.id) AS disabled
     FROM admin_users u WHERE u.username = ?`,
    [username]
  );
  if (!user || user.role !== "super" || Number(user.disabled) === 1) redirect(DENIED);

  const id = Number(user.id);
  await createSession(id);
  await purgeExpiredSessions();
  await audit(`${username} entró desde el panel de Antídoto.`, {
    id,
    username,
    role: "super",
    company_id: null,
    company_name: null,
    notifications_read_at: null,
  });
  redirect(safeDestination(pass.destino));
}
