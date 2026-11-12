import "server-only";
import { one } from "./db";
import { DEFAULT_CERTIFICATE, signatureUrl, type CertificateConfig } from "./certificate-config";

// Lectura de la configuración del certificado (tabla company_certificate). La escritura vive
// en certificate-actions.ts. La columna signature solo se lee en readSignature: pesa.

interface Row {
  title: string;
  intro: string;
  reason: string;
  show_date: number;
  show_cargo: number;
  show_folio: number;
  show_logo: number;
  show_decor: number;
  show_seal: number;
  primary_color: string | null;
  secondary_color: string | null;
  signer_name: string | null;
  signer_role: string | null;
  signature_version: string | null;
}

/** Configuración del certificado de la empresa, o la de siempre si nunca lo ha ajustado. */
export async function getCertificateConfig(companyId: number): Promise<CertificateConfig> {
  const row = await one<Row>(
    `SELECT title, intro, reason, show_date, show_cargo, show_folio, show_logo, show_decor, show_seal,
            primary_color, secondary_color, signer_name, signer_role, signature_version
     FROM company_certificate WHERE company_id = ?`,
    [companyId]
  );
  if (!row) return DEFAULT_CERTIFICATE;
  return {
    title: row.title,
    intro: row.intro,
    reason: row.reason,
    showDate: !!Number(row.show_date),
    showCargo: !!Number(row.show_cargo),
    showFolio: !!Number(row.show_folio),
    showLogo: !!Number(row.show_logo),
    showDecor: !!Number(row.show_decor),
    showSeal: !!Number(row.show_seal),
    primary: row.primary_color,
    secondary: row.secondary_color,
    signerName: row.signer_name,
    signerRole: row.signer_role,
    signatureUrl: row.signature_version ? signatureUrl(companyId, row.signature_version) : null,
  };
}

export async function readSignature(companyId: number): Promise<{ bytes: Uint8Array; mime: string; version: string } | null> {
  const row = await one<{ signature: ArrayBuffer | null; signature_mime: string | null; signature_version: string | null }>(
    "SELECT signature, signature_mime, signature_version FROM company_certificate WHERE company_id = ?",
    [companyId]
  );
  if (!row?.signature || !row.signature_mime || !row.signature_version) return null;
  return { bytes: new Uint8Array(row.signature), mime: row.signature_mime, version: row.signature_version };
}
