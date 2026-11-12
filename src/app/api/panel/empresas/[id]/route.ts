import { json, rejectPanel } from "@/lib/panel-api";
import { getCompany, listCompanyAssignments } from "@/lib/queries";

/** Una empresa con sus actividades y códigos, para la ficha de la organización en el panel. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rejected = rejectPanel(request);
  if (rejected) return rejected;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "no existe" }, 404);
  const [company, assignments] = await Promise.all([getCompany(id), listCompanyAssignments(id)]);
  if (!company) return json({ error: "no existe" }, 404);

  return json({
    empresa: { id: company.id, nombre: company.name, archivada: company.archived },
    actividades: assignments
      .filter((a) => !a.archivado)
      .map((a) => ({
        id: a.id,
        codigo: a.codigo,
        actividad: a.title,
        estado: a.estado,
        expira: a.expira,
        participantes: a.participantes,
        completaron: a.completaron,
        avance: a.avance,
      })),
  });
}
