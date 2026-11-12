"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one, run } from "./db";
import { audit, requireUser } from "./admin-guard";
import { checkLogo } from "./logo-file";
import { parseCertificateForm, type CertificateField } from "./certificate-config";

export type CertificateFormState = { error: string; field?: CertificateField } | null;

/** Guarda el certificado de una empresa. El admin de empresa solo el de la suya. */
export async function saveCertificateConfig(_prev: CertificateFormState, formData: FormData): Promise<CertificateFormState> {
  const user = await requireUser();
  const companyId = user.role === "super" ? Number(formData.get("companyId")) : user.company_id;
  if (!companyId || !Number.isInteger(companyId) || companyId <= 0) return { error: "Empresa no válida." };
  const company = await one<{ name: string }>("SELECT name FROM companies WHERE id = ?", [companyId]);
  if (!company) return { error: "La empresa ya no existe." };

  const parsed = parseCertificateForm((key) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : null;
  });
  if (!parsed.ok) return { error: parsed.error, field: parsed.field };
  const c = parsed.value;

  // La firma, igual que el logo: el navegador la recorta y comprime, el servidor no se fía.
  const change = String(formData.get("signatureChange") ?? "keep");
  let signature: { bytes: Uint8Array | null; mime: string | null; version: string | null } | null = null;
  if (change === "replace") {
    const file = formData.get("signature");
    if (!(file instanceof File)) return { error: "No llegó la imagen de la firma. Vuelve a elegirla.", field: "signature" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkLogo(bytes);
    if (!check.ok) return { error: check.error.replace("logo", "firma"), field: "signature" };
    signature = { bytes, mime: check.mime, version: createHash("sha256").update(bytes).digest("hex").slice(0, 12) };
  } else if (change === "remove") {
    signature = { bytes: null, mime: null, version: null };
  }

  const sigColumns = signature ? ", signature, signature_mime, signature_version" : "";
  const sigValues = signature ? ", ?, ?, ?" : "";
  const sigUpdate = signature
    ? ", signature = excluded.signature, signature_mime = excluded.signature_mime, signature_version = excluded.signature_version"
    : "";
  const sigArgs = signature ? [signature.bytes, signature.mime, signature.version] : [];
  const bit = (b: boolean) => (b ? 1 : 0);

  try {
    await run(
      `INSERT INTO company_certificate (company_id, title, intro, reason, show_date, show_cargo, show_folio, show_logo,
         show_decor, show_seal, primary_color, secondary_color, signer_name, signer_role, updated_by, updated_at${sigColumns})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')${sigValues})
       ON CONFLICT(company_id) DO UPDATE SET
         title = excluded.title, intro = excluded.intro, reason = excluded.reason,
         show_date = excluded.show_date, show_cargo = excluded.show_cargo, show_folio = excluded.show_folio,
         show_logo = excluded.show_logo, show_decor = excluded.show_decor, show_seal = excluded.show_seal,
         primary_color = excluded.primary_color, secondary_color = excluded.secondary_color,
         signer_name = excluded.signer_name, signer_role = excluded.signer_role,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at${sigUpdate}`,
      [
        companyId,
        c.title,
        c.intro,
        c.reason,
        bit(c.showDate),
        bit(c.showCargo),
        bit(c.showFolio),
        bit(c.showLogo),
        bit(c.showDecor),
        bit(c.showSeal),
        c.primary,
        c.secondary,
        c.signerName,
        c.signerRole,
        user.id,
        ...sigArgs,
      ]
    );
  } catch {
    return { error: "No pudimos guardar el certificado. Inténtalo de nuevo." };
  }

  await audit(`Certificado de "${company.name}" actualizado.`, user, companyId);
  revalidatePath(`/admin/empresas/${companyId}`);
  revalidatePath(`/admin/empresas/${companyId}/certificado`);
  redirect(`/admin/empresas/${companyId}/certificado?guardado=1`);
}
