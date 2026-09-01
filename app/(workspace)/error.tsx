"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-wrap grid min-h-[70vh] place-items-center"><div className="card max-w-md p-8 text-center"><span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--red-soft)] danger"><AlertTriangle /></span><h1 className="display text-3xl">The queue hit a snag.</h1><p className="muted mt-3">Your work is safe. Reload this section and keep triaging.</p><button className="btn btn-primary mt-6" onClick={reset}><RotateCcw size={16} /> Try again</button></div></div>;
}
