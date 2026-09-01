import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return <div className="grid min-h-screen place-items-center p-6"><div className="card max-w-lg p-10 text-center"><SearchX className="gold mx-auto mb-5" size={42} /><p className="label">404 · no signal</p><h1 className="display mt-2 text-4xl">That page is off the network.</h1><p className="muted mt-3">It may have moved, or your saved view no longer exists.</p><Link href="/dashboard" className="btn btn-primary mt-6"><ArrowLeft size={16} /> Back to command center</Link></div></div>;
}
