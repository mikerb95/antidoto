import { NextResponse } from "next/server";
import { currentUser, type AdminUser } from "@/lib/auth";
import { getCompany, getMission } from "@/lib/queries";
import { listProfiledParticipants } from "@/lib/experience-data";
import { lugar } from "@/lib/colombia";
import { csvCell } from "@/lib/live-report-format";

/** Una fila por participante con su ficha (cargo y lugar), para cruzar en Excel. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const mission = await getMission(id);
  if (!mission) return new NextResponse("Actividad no encontrada", { status: 404 });

  const url = new URL(request.url);
  // Con ?empresa= se exporta solo esa empresa, como la ve su admin. El admin de empresa, siempre la suya.
  const empresa = Number(url.searchParams.get("empresa"));
  let viewer: AdminUser = user;
  if (Number.isInteger(empresa) && empresa > 0) {
    if (user.role === "empresa" && user.company_id !== empresa) return new NextResponse("Actividad no encontrada", { status: 404 });
    const company = await getCompany(empresa);
    if (!company) return new NextResponse("Empresa no encontrada", { status: 404 });
    viewer = { ...user, role: "empresa", company_id: company.id, company_name: company.name };
  }

  const rows = await listProfiledParticipants(id, viewer, {
    cargo: url.searchParams.get("cargo") ?? undefined,
    dpto: url.searchParams.get("dpto") ?? undefined,
    mpio: url.searchParams.get("mpio") ?? undefined,
  });

  const header = ["Empresa", "Codigo", "Nombre", "Cargo", "Departamento", "Municipio", "Codigo DANE", "Avance %", "Puntaje", "Estado", "Inicio"];
  const lines = [
    header.join(","),
    ...rows.map((r) => {
      const l = lugar(r.municipio);
      return [
        r.empresa,
        r.codigo,
        r.nombre,
        r.cargo ?? "",
        l?.departamento ?? "",
        l?.municipio ?? "",
        r.municipio ?? "",
        r.avance,
        r.puntaje ?? "",
        r.completed_at ? "Completó" : "En curso",
        r.started_at,
      ]
        .map(csvCell)
        .join(",");
    }),
  ];

  // BOM para que Excel abra bien los acentos.
  const csv = "﻿" + lines.join("\r\n");
  const filename = `${mission.title.replace(/[^\p{L}\p{N}]+/gu, "_")}_participantes.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
