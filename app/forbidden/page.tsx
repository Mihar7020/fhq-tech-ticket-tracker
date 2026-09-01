import Link from "next/link";
import { LockKeyhole } from "lucide-react";
export default function ForbiddenPage() { return <main className="grid min-h-screen place-items-center p-6"><div className="card max-w-md p-8 text-center"><LockKeyhole className="gold mx-auto mb-4" /><p className="label">Permission required</p><h1 className="display mt-2 text-3xl">This control is admin-only.</h1><p className="muted mt-3">Your account can still triage tickets and see the queue.</p><Link href="/dashboard" className="btn btn-primary mt-6">Back to command center</Link></div></main>; }
