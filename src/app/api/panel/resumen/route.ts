import { json, rejectPanel, weeklyParticipants } from "@/lib/panel-api";
import { listCompanies, listRunningAssignments } from "@/lib/queries";

/** Resumen para el Inicio y las Métricas del panel de Antídoto. */
export async function GET(request: Request) {
  const rejected = rejectPanel(request);
  if (rejected) return rejected;

  const [running, companies, semanas] = await Promise.all([listRunningAssignments(), listCompanies(), weeklyParticipants()]);
  const count = (estado: string) => running.filter((a) => a.estado === estado).length;
  const participantes = running.reduce((n, a) => n + a.participantes, 0);
  const completaron = running.reduce((n, a) => n + a.completaron, 0);

  return json({
    empresas: companies.length,
    actividades: { activas: count("activo"), pausadas: count("pausado"), vencidas: count("vencido") },
    participantes,
    completaron,
    semanas,
    // Lo que está abierto ahora, con más participantes primero.
    enMarcha: running
      .filter((a) => a.estado === "activo")
      .sort((a, b) => b.participantes - a.participantes)
      .slice(0, 50)
      .map((a) => ({
        id: a.id,
        codigo: a.codigo,
        actividad: a.title,
        empresaId: a.company_id,
        empresa: a.empresa,
        expira: a.expira,
        participantes: a.participantes,
        completaron: a.completaron,
        avance: a.avance,
      })),
  });
}
