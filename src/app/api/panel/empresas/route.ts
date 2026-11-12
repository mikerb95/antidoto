import { findOrCreateCompany, json, listPanelCompanies, rejectPanel } from "@/lib/panel-api";
import { revalidatePath } from "next/cache";

/** Empresas del portal, para enlazarlas con las organizaciones del panel de Antídoto. */
export async function GET(request: Request) {
  const rejected = rejectPanel(request);
  if (rejected) return rejected;
  return json({ empresas: await listPanelCompanies() });
}

/** Crea la empresa de una organización del panel, o devuelve la que ya se llama igual. */
export async function POST(request: Request) {
  const rejected = rejectPanel(request);
  if (rejected) return rejected;

  const body = (await request.json().catch(() => null)) as { nombre?: unknown; actor?: unknown } | null;
  const nombre = typeof body?.nombre === "string" ? body.nombre : "";
  const actor = typeof body?.actor === "string" ? body.actor : "el panel";
  const company = await findOrCreateCompany(nombre, actor);
  if (!company) return json({ error: "nombre" }, 422);
  if (company.creada) revalidatePath("/admin/empresas");
  return json({ empresa: company });
}
