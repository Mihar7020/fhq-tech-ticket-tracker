import Image from "next/image";
import Link from "next/link";
import { Clock3, HardHat, MailCheck, ShieldCheck, Wrench } from "lucide-react";

const errorCopy: Record<string, string> = {
  microsoft_setup_needed: "Microsoft sign-in is ready in the app, but the Entra app values still need to be added.",
  microsoft_signin_failed: "Microsoft sign-in did not finish. Try again, or check the Entra redirect URL.",
  not_allowed: "That Microsoft account is not on the FHQ Tech access list.",
};

export function LoginView({ error }: { error?: string }) {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[var(--ink)] px-4 py-8 text-[var(--text)]">
      <section className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-[2rem] border divider bg-[var(--ink-2)] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-9 lg:p-10">
            <div className="mb-10 flex items-center justify-between gap-4">
              <Link href="/login" className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">
                  <Image src="/fhqtc-logo.png" alt="FHQ Tribal Council" width={48} height={40} priority />
                </span>
                <span>
                  <strong className="display block text-xl">FHQ Tech</strong>
                  <span className="label">Helpdesk</span>
                </span>
              </Link>
              <span className="rounded-full border divider px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold-bright)]">
                Maintenance
              </span>
            </div>

            <div>
              <p className="label gold">Temporary pause</p>
              <h1 className="display mt-2 text-[clamp(2.6rem,8vw,5.25rem)] leading-[0.92]">
                Tracker under maintenance
              </h1>
              <p className="muted mt-5 max-w-xl text-base leading-7">
                FHQ Tech is tuning the ticket mailbox and reply flow. The tracker will be back after the maintenance window is complete.
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
                {errorCopy[error] ?? "Sign-in needs attention. Please try again."}
              </div>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border divider bg-[var(--ink-3)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]">
                  <Clock3 size={20} />
                </div>
                <p className="font-bold">Access is paused</p>
                <p className="muted mt-1 text-sm leading-6">Sign-in is temporarily unavailable while the system is being adjusted.</p>
              </div>
              <div className="rounded-lg border divider bg-[var(--ink-3)] p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]">
                  <MailCheck size={20} />
                </div>
                <p className="font-bold">Requests still count</p>
                <p className="muted mt-1 text-sm leading-6">Keep critical notes handy so they can be entered once the tracker returns.</p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg bg-[var(--gold-soft)] p-4">
              <ShieldCheck className="mt-0.5 text-[var(--gold-bright)]" size={18} />
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                Staff access remains limited to approved FHQTC IT accounts when the maintenance screen is removed.
              </p>
            </div>
          </div>

          <div className="relative min-h-[360px] border-t divider bg-[var(--ink-3)] p-8 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
            <div className="relative flex h-full min-h-[320px] items-center justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--gold-soft)]" aria-hidden="true" />
                <svg className="relative z-10 h-auto w-full" viewBox="0 0 420 340" role="img" aria-labelledby="maintenance-title maintenance-desc">
                  <title id="maintenance-title">Maintenance tools around a helpdesk monitor</title>
                  <desc id="maintenance-desc">A stylized FHQ Tech maintenance illustration with animated signal lines.</desc>
                  <defs>
                    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#184f56" floodOpacity=".14" />
                    </filter>
                  </defs>
                  <g filter="url(#softShadow)">
                    <rect x="86" y="66" width="248" height="168" rx="18" fill="#fbfaf7" stroke="#d8d1c5" strokeWidth="3" />
                    <rect x="105" y="86" width="210" height="104" rx="10" fill="#256b73" />
                    <path d="M129 122h66M129 146h118M129 170h86" stroke="#fbfaf7" strokeWidth="10" strokeLinecap="round" opacity=".92" />
                    <path d="M258 118l20 20-36 36-20-20z" fill="#f4f1ea" opacity=".95" />
                    <path d="M271 105l20 20-13 13-20-20z" fill="#d94a3a" />
                    <rect x="180" y="234" width="60" height="34" rx="7" fill="#34302a" />
                    <rect x="145" y="268" width="130" height="18" rx="9" fill="#191714" />
                  </g>
                  <g className="origin-center animate-[pulse_1.8s_ease-in-out_infinite]">
                    <path d="M82 103c-16 14-24 33-22 54" stroke="#256b73" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".45" />
                    <path d="M338 103c16 14 24 33 22 54" stroke="#256b73" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".45" />
                  </g>
                  <g>
                    <circle cx="94" cy="266" r="28" fill="#fbfaf7" stroke="#d8d1c5" strokeWidth="3" />
                    <path d="M81 269l12 12 24-30" stroke="#256b73" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <circle cx="326" cy="266" r="28" fill="#fbfaf7" stroke="#d8d1c5" strokeWidth="3" />
                    <path d="M313 266h26M326 253v26" stroke="#d94a3a" strokeWidth="8" strokeLinecap="round" />
                  </g>
                  <g className="animate-[bounce_2.4s_ease-in-out_infinite]">
                    <path d="M204 36l16 28h-32z" fill="#d94a3a" />
                    <rect x="198" y="60" width="12" height="28" rx="6" fill="#d94a3a" />
                  </g>
                </svg>

                <div className="relative z-20 mx-auto -mt-2 flex w-fit items-center gap-2 rounded-full border divider bg-[var(--ink-2)] px-4 py-2 text-sm font-bold shadow-lg">
                  <HardHat size={17} className="text-[var(--gold-bright)]" />
                  Maintenance crew active
                  <Wrench size={16} className="text-[var(--gold-bright)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
