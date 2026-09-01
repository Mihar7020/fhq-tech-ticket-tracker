import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <Suspense fallback={<div className="min-h-screen bg-[var(--ink)]" />}><AppShell>{children}</AppShell></Suspense>;
}
