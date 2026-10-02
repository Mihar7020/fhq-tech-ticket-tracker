"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Command, Gauge, Inbox, Map, Plus, Settings, ShieldAlert, Users } from "lucide-react";
import clsx from "clsx";
import { CommandPalette } from "@/components/command-palette";

const primaryBase = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Tickets", href: "/tickets", icon: Inbox },
  { label: "Schools", href: "/board", icon: Map },
  { label: "Incidents", href: "/incidents", icon: ShieldAlert },
];

const intelligenceBase = [
  { label: "Directory", href: "/directory", icon: Users },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

type NavItem = { label: string; href: string; icon: typeof Gauge; count?: number };

export function AppShell({ children, session, counts }: { children: React.ReactNode; session: { name: string; email: string; role: string }; counts: { tickets: number; incidents: number; directory: number } }) {
  const pathname = usePathname();
  const primary: NavItem[] = primaryBase.map((item) => ({ ...item, count: item.href === "/tickets" ? counts.tickets : item.href === "/incidents" ? counts.incidents : undefined }));
  const intelligence: NavItem[] = intelligenceBase.map((item) => ({ ...item, count: item.href === "/directory" ? counts.directory : undefined }));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), [setPaletteOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openPalette]);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={clsx(
          "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-all",
          active ? "bg-[var(--gold-soft)] text-[var(--gold-bright)]" : "muted hover:bg-[var(--ink-3)] hover:text-[var(--text)]",
        )}
      >
        <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
        <span className="flex-1">{item.label}</span>
        {item.count ? <span className={clsx("min-w-5 rounded-md px-1.5 py-0.5 text-center text-[10px]", active ? "bg-[var(--gold)] text-white" : "bg-[var(--ink-3)]")}>{item.count}</span> : null}
      </Link>
    );
  };

  const mobile = primary.slice(0, 4);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r divider bg-[color:var(--ink)] p-4 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-white">
            <Image src="/fhqtc-logo.png" alt="FHQ Tribal Council" width={45} height={38} priority />
          </span>
          <span>
            <strong className="display block text-[19px] leading-none">FHQ Tech</strong>
            <span className="label text-[8px]">Helpdesk</span>
          </span>
        </Link>

        <Link href="/tickets/new" className="btn btn-primary mt-4 w-full text-sm">
          <Plus size={16} /> New request
        </Link>
        <button onClick={openPalette} className="my-3 flex h-10 items-center gap-2 rounded-lg border divider bg-[var(--ink-2)] px-3 text-left muted transition hover:border-[color:var(--line-strong)] hover:text-[var(--text)]">
          <Command size={15} />
          <span className="flex-1 text-xs">Search tickets</span>
          <kbd className="rounded border divider px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </button>

        <nav aria-label="Main navigation" className="flex-1 space-y-6 overflow-y-auto">
          <div>
            <p className="label mb-2 px-3">Work</p>
            <div className="space-y-1">{primary.map((item) => <NavLink item={item} key={item.href} />)}</div>
          </div>
          <div>
            <p className="label mb-2 px-3">Reference</p>
            <div className="space-y-1">{intelligence.map((item) => <NavLink item={item} key={item.href} />)}</div>
          </div>
        </nav>

        <div className="mt-3 border-t divider pt-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold)] text-xs font-black text-white">{session.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs">{session.name}</strong>
              <span className="muted text-[10px]">{session.role === "ADMIN" ? "Administrator" : "Technician"}</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-[var(--green)]" />
          </div>
          <Link href="/settings" className="btn w-full text-xs"><Settings size={14} /> Settings</Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b divider bg-[color:var(--ink)]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white"><Image src="/fhqtc-logo.png" alt="FHQTC" width={38} height={31} /></span>
          <strong className="display text-lg">FHQ Tech</strong>
        </Link>
        <div className="flex gap-2">
          <Link href="/tickets/new" className="btn icon-btn" aria-label="New request"><Plus size={17} /></Link>
          <button className="btn icon-btn" onClick={openPalette} aria-label="Open search"><Command size={17} /></button>
        </div>
      </header>

      <main className="shell-main">{children}</main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t divider bg-[color:var(--ink)]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden">
        {mobile.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={clsx("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold", active ? "gold" : "muted")}>
              <Icon size={19} />
              <span>{item.label.replace("Dashboard", "Home").replace("Tickets", "Queue").replace("Schools", "Sites")}</span>
            </Link>
          );
        })}
      </nav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
