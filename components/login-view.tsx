import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

const errorCopy: Record<string, string> = {
  microsoft_setup_needed: "Microsoft sign-in is ready in the app, but the Entra app values still need to be added.",
  microsoft_signin_failed: "Microsoft sign-in did not finish. Try again, or check the Entra redirect URL.",
  not_allowed: "That Microsoft account is not on the FHQ Tech access list.",
};

export function LoginView({ error }: { error?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--ink)] px-4 py-8 text-[var(--text)]">
      <section className="w-full max-w-md">
        <div className="rounded-[2rem] border divider bg-[var(--ink-2)] p-7 shadow-2xl sm:p-8">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">
                <Image src="/fhqtc-logo.png" alt="FHQ Tribal Council" width={48} height={40} priority />
              </span>
              <span>
                <strong className="display block text-xl">FHQ Tech</strong>
                <span className="label">Helpdesk</span>
              </span>
            </Link>
            <span className="rounded-full border divider px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold)]">
              Staff only
            </span>
          </div>

          <div>
            <p className="label gold">Secure access</p>
            <h1 className="display mt-2 text-[clamp(2.2rem,8vw,3.7rem)] leading-[0.95]">
              Sign in to FHQ Tech
            </h1>
            <p className="muted mt-4 leading-relaxed">
              One private workspace for the FHQTC IT team. No public signup, no extra accounts.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
              {errorCopy[error] ?? "Sign-in needs attention. Please try again."}
            </div>
          ) : null}

          <Link href="/api/auth/microsoft" className="btn btn-primary mt-8 w-full justify-center py-4 text-base">
            <LockKeyhole size={18} />
            Continue with Microsoft 365
            <ArrowRight size={18} />
          </Link>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[var(--gold-soft)] p-4">
            <ShieldCheck className="mt-0.5 text-[var(--gold)]" size={18} />
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Access will be limited to approved FHQTC IT accounts through Microsoft Entra ID.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
