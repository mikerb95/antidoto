import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AdminLoginScreen from "@/components/AdminLoginScreen";
import PassBackdrop from "@/components/motion/PassBackdrop";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  if (await currentUser()) redirect("/admin");
  // Llega aquí quien abrió el portal desde el panel de Antídoto con un pase vencido o ya usado.
  const notice = (await searchParams).aviso === "pase" ? "El acceso desde el panel venció o ya se usó. Ábrelo de nuevo desde el panel, o entra con tu usuario." : undefined;
  return <AdminLoginScreen backdrop={<PassBackdrop />} notice={notice} />;
}
