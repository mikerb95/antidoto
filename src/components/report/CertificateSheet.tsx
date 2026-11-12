import { brandPalette, type PublicBrand } from "@/lib/brand-palette";
import { nameFontSize } from "@/lib/certificate";
import { rosettePath } from "@/lib/guilloche";
import { colors, calSans, LOGO_SRC } from "@/lib/theme";
import BrandLogo from "@/components/BrandLogo";

// Rosetas de guilloche (las de los billetes y diplomas): se calculan una vez por proceso.
const BACKDROP = [
  rosettePath({ R: 420, r: 165, d: 150, steps: 64 }),
  rosettePath({ R: 420, r: 165, d: 95, steps: 64 }),
];
const SEAL = rosettePath({ R: 400, r: 80, d: 70, steps: 48 });

interface Props {
  brand: PublicBrand | null;
  companyName: string;
  activity: string;
  name: string;
  cargo: string | null;
  /** Fecha en que terminó, ya escrita ("12 de noviembre de 2026"). */
  date: string;
  folio: string;
}

/**
 * Un certificado de participación: una hoja A4 horizontal con la marca de la empresa. Mide lo
 * mismo en pantalla que impresa (todo en mm y pt), así lo que se ve es lo que sale en el PDF.
 */
export default function CertificateSheet({ brand, companyName, activity, name, cargo, date, folio }: Props) {
  const p = brandPalette(brand);
  return (
    <article
      className="cert-sheet"
      style={{
        position: "relative",
        width: "297mm",
        height: "210mm",
        flexShrink: 0,
        overflow: "hidden",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 18px 50px rgba(15,24,29,0.14)",
        padding: "19mm 23mm 17mm",
        display: "flex",
        flexDirection: "column",
        color: colors.ink,
      }}
    >
      <svg aria-hidden viewBox="-480 -480 960 960" style={{ position: "absolute", right: "-62mm", top: "-48mm", width: "190mm", height: "190mm", opacity: 0.2 }}>
        <path d={BACKDROP[0]} fill="none" stroke={p.graphic} strokeWidth={1.1} />
        <path d={BACKDROP[1]} fill="none" stroke={p.soft} strokeWidth={1.1} />
      </svg>
      <div aria-hidden style={{ position: "absolute", inset: "7mm", border: `0.5mm solid ${p.graphic}`, borderRadius: "3mm" }} />
      <div aria-hidden style={{ position: "absolute", inset: "8.6mm", border: `0.2mm solid ${p.soft}`, borderRadius: "2mm" }} />

      <header style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10mm" }}>
        {brand ? (
          <BrandLogo brand={brand} surface="claro" height={50} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={LOGO_SRC} alt="Antídoto" style={{ height: 40 }} />
        )}
        <span style={{ fontSize: "8.5pt", fontWeight: 700, letterSpacing: 1.2, color: colors.muted, textTransform: "uppercase" }}>N.º {folio}</span>
      </header>

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "205mm" }}>
        <span style={{ fontSize: "10.5pt", fontWeight: 700, letterSpacing: 3, color: p.accent }}>CERTIFICADO DE PARTICIPACIÓN</span>
        <span style={{ fontSize: "12pt", color: colors.muted, marginTop: "7mm" }}>Se otorga a</span>
        <h2 style={{ ...calSans, fontSize: `${nameFontSize(name)}pt`, fontWeight: 400, lineHeight: 1.1, margin: "1.5mm 0 0", color: colors.ink, overflowWrap: "anywhere" }}>{name}</h2>
        {cargo && <span style={{ fontSize: "11pt", color: colors.inkSoft, marginTop: "2mm" }}>{cargo}</span>}
        <div aria-hidden style={{ width: "58mm", height: "1.1mm", borderRadius: "1mm", margin: "6mm 0", background: `linear-gradient(90deg, ${p.graphic}, ${p.soft})` }} />
        <span style={{ fontSize: "12pt", color: colors.inkSoft }}>por haber participado y completado la actividad</span>
        <span style={{ ...calSans, fontSize: "21pt", lineHeight: 1.2, margin: "1.5mm 0 3mm", color: p.strong }}>{activity}</span>
        <span style={{ fontSize: "12pt", color: colors.inkSoft, lineHeight: 1.5 }}>
          realizada con <b style={{ color: colors.ink }}>{companyName}</b> y finalizada el <b style={{ color: colors.ink }}>{date}</b>.
        </span>
      </div>

      <footer style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "10mm" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5mm" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Antídoto" style={{ height: "8mm", width: "auto", alignSelf: "flex-start" }} />
          <span style={{ fontSize: "8.5pt", color: colors.muted, lineHeight: 1.5 }}>
            Certificado emitido por Antídoto
            <br />
            antidotocolombia.com
          </span>
        </div>
        <svg role="img" aria-label="Sello de actividad completada" viewBox="-480 -480 960 960" style={{ width: "34mm", height: "34mm", flexShrink: 0 }}>
          <path d={SEAL} fill="none" stroke={p.graphic} strokeWidth={5} />
          <circle r={250} fill="#fff" stroke={p.graphic} strokeWidth={9} />
          <circle r={214} fill={p.tint} />
          <path d="M-100 8 L-30 78 L108 -70" fill="none" stroke={p.strong} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </footer>
    </article>
  );
}
