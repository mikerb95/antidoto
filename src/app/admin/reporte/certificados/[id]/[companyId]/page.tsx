import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCompany, getMission, listCertificates } from "@/lib/queries";
import { getCompanyBrand } from "@/lib/company-brand";
import { getCertificateConfig } from "@/lib/certificate-data";
import { brandCssVars, brandPalette } from "@/lib/brand-palette";
import { certificateDate, certificateFolio, normalizeFolio } from "@/lib/certificate";
import { colors, calSans } from "@/lib/theme";
import { secondaryButton } from "@/lib/styles";
import CertificateSheet from "@/components/report/CertificateSheet";
import PrintButton from "@/components/report/PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Certificados de participación",
  robots: { index: false, follow: false },
};

// Fuera del layout del portal a propósito: son hojas para imprimir, sin menú lateral.
export default async function CertificadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; companyId: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");

  const { id, companyId: rawCompany } = await params;
  const companyId = Number(rawCompany);
  if (!Number.isInteger(companyId) || companyId <= 0) notFound();
  // Un admin de empresa solo emite los certificados de la suya.
  if (user.role === "empresa" && user.company_id !== companyId) notFound();

  const [mission, company, brand, config] = await Promise.all([
    getMission(id),
    getCompany(companyId),
    getCompanyBrand(companyId),
    getCertificateConfig(companyId),
  ]);
  if (!mission || !company || company.archived) notFound();

  const everyone = (await listCertificates(id, companyId)).map((c) => ({ ...c, folio: certificateFolio(c.id) }));
  // ?n=XXXX-XXXX deja un solo certificado, para entregarlo o reimprimirlo suelto.
  const only = normalizeFolio((await searchParams).n ?? "");
  const shown = only ? everyone.filter((c) => c.folio === only) : everyone;
  if (only && shown.length === 0) notFound();

  const base = `/admin/reporte/certificados/${id}/${companyId}`;
  const p = brandPalette(brand);

  return (
    <div className="report-page cert-page" style={{ minHeight: "100vh", background: "#E9EEF0", padding: "24px 16px 48px", ...brandCssVars(p) }}>
      {/* La hoja de los reportes es A4 vertical con margen; el certificado, horizontal y a sangre. */}
      <style>{"@page { size: A4 landscape; margin: 0; }"}</style>

      <div className="no-print" style={{ maxWidth: "297mm", margin: "0 auto 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={only ? base : `/admin/empresas/${companyId}/actividades/${id}`}
            className="btn-secondary"
            style={{ ...secondaryButton, display: "inline-flex", alignItems: "center" }}
          >
            ‹ {only ? "Ver todos los certificados" : "Volver"}
          </Link>
          {shown.length > 0 && <PrintButton />}
        </div>
        <div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: colors.accent, letterSpacing: 1 }}>
            CERTIFICADOS DE {company.name.toUpperCase()}
          </span>
          <h1 style={{ ...calSans, fontSize: 26, margin: "4px 0 6px", color: colors.ink, fontWeight: 400 }}>{mission.title}</h1>
          <p style={{ margin: 0, fontSize: 14, color: colors.inkSoft, lineHeight: 1.6, maxWidth: 680 }}>
            {everyone.length === 0
              ? "Todavía nadie ha terminado esta actividad. Cuando alguien la complete, su certificado aparece aquí."
              : only
                ? "Este es el certificado de una sola persona. \"Guardar como PDF\" lo descarga o lo imprime."
                : `${everyone.length === 1 ? "1 persona terminó" : `${everyone.length} personas terminaron`} la actividad: hay un certificado por cada una. "Guardar como PDF" los descarga todos juntos, uno por página.`}
          </p>
          {shown.length > 0 && (
            <p style={{ margin: "6px 0 0", fontSize: 12.5, color: colors.muted }}>
              Consejo: en el diálogo de impresión activa &quot;Gráficos de fondo&quot; para conservar los colores.
            </p>
          )}
        </div>
      </div>

      {shown.map((c) => (
        <section key={c.folio} className="cert-item" style={{ maxWidth: "297mm", marginInline: "auto" }}>
          {!only && everyone.length > 1 && (
            <div className="no-print" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "0 4px 8px" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.ink }}>{c.nombre}</span>
              <Link href={`${base}?n=${c.folio}`} style={{ fontSize: 13, fontWeight: 600, color: colors.accentDark, whiteSpace: "nowrap" }}>
                Solo este certificado ›
              </Link>
            </div>
          )}
          {/* En una pantalla angosta la hoja no se encoge (mide lo mismo que impresa): se desplaza. */}
          <div className="cert-scroll" style={{ overflowX: "auto", paddingBottom: 4 }}>
            <CertificateSheet
              brand={brand}
              companyName={company.name}
              activity={mission.title}
              name={c.nombre}
              cargo={c.cargo}
              date={certificateDate(c.completed_at)}
              folio={c.folio}
              config={config}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
