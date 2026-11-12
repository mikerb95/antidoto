import CertificateSheet from "@/components/report/CertificateSheet";

const brand = { companyId: 1, name: "Juan Valdez", primary: "#B3122B", secondary: null, welcome: null, logoUrl: null, logoSurface: "claro" as const };
const people = [
  { name: "Ana Ruiz", cargo: "Barista", brand },
  { name: "María Fernanda de los Ángeles Rodríguez Santamaría", cargo: null, brand: null },
];

export default function Prueba() {
  return (
    <div className="report-page cert-page" style={{ background: "#E9EEF0", padding: "24px 16px 48px" }}>
      <style>{"@page { size: A4 landscape; margin: 0; }"}</style>
      {people.map((x) => (
        <section key={x.name} className="cert-item" style={{ maxWidth: "297mm", margin: "0 auto" }}>
          <div className="cert-scroll" style={{ overflowX: "auto", paddingBottom: 4 }}>
            <CertificateSheet brand={x.brand} companyName="Juan Valdez" activity="La ruta del café: riesgos en cada estación" name={x.name} cargo={x.cargo} date="12 de noviembre de 2026" folio="7F3A-91C2" />
          </div>
        </section>
      ))}
    </div>
  );
}
