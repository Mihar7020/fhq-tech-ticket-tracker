import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";
import { MaintenanceView } from "@/components/maintenance-view";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

// Set MAINTENANCE_MODE=true in Vercel to show the maintenance screen instead of sign-in.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (process.env.MAINTENANCE_MODE === "true") return <MaintenanceView error={params.error} />;
  return <LoginView error={params.error} />;
}
