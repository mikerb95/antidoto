import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/queries";
import { buildTexts } from "@/lib/bricks/challenges";
import { BRICKS_VISIBLE } from "@/lib/bricks/visible";
import { loadBuildOverride, missionBuild, watchWorks } from "@/lib/build-data";
import WatchShell from "@/components/bricks/watch/WatchShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visor en vivo",
  robots: { index: false, follow: false },
};

// Fuera del layout del portal: pantalla completa, para seguir la actividad o proyectarla.
export default async function VisorPage({ params }: { params: Promise<{ missionId: string; companyId: string }> }) {
  if (!BRICKS_VISIBLE) notFound();
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const { missionId, companyId: rawCompany } = await params;
  const companyId = Number(rawCompany);
  if (!Number.isInteger(companyId) || companyId <= 0) notFound();
  const [company, def] = await Promise.all([getCompany(companyId), missionBuild(missionId)]);
  if (!company || company.archived || !def) notFound();
  const res = await watchWorks(missionId, companyId, user, null);
  if (!res.ok) notFound();
  const texts = buildTexts(def, await loadBuildOverride(def.key));

  return (
    <WatchShell
      title={texts.title}
      company={company.name}
      missionId={missionId}
      companyId={companyId}
      backHref={`/admin/empresas/${companyId}`}
      initial={{ now: res.now, base: res.base, works: res.works }}
    />
  );
}
