"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Command, Gauge, Inbox, Map, Search, ShieldAlert, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const actions = [
  { label: "Open dashboard", hint: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Open tickets", hint: "Tickets", href: "/tickets", icon: Inbox },
  { label: "Open school board", hint: "Schools", href: "/board", icon: Map },
  { label: "Manage staff directory", hint: "Admin", href: "/directory", icon: Users },
  { label: "Review active incidents", hint: "Incidents", href: "/incidents", icon: ShieldAlert },
  { label: "Search the knowledge base", hint: "Knowledge", href: "/knowledge", icon: BookOpen },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => actions.filter((action) => `${action.label} ${action.hint}`.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    if (open) window.setTimeout(() => { setQuery(""); inputRef.current?.focus(); }, 80);
  }, [open]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  function visit(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-start bg-black/45 px-4 pt-[14vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label="Command palette" className="card w-full max-w-[640px] overflow-hidden shadow-2xl" initial={{ y: -18, scale: .97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -10, scale: .98, opacity: 0 }} transition={{ duration: .2 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b divider px-4">
              <Search size={19} className="muted" />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && results[0]) visit(results[0].href); }} className="h-14 flex-1 bg-transparent outline-none" placeholder="Search tickets, people, schools, or actions..." />
              <button className="icon-btn btn h-8 min-h-8 w-8" onClick={onClose} aria-label="Close command palette"><X size={15} /></button>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              <p className="label px-3 py-2">Quick actions</p>
              {results.length ? results.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.href} onClick={() => visit(action.href)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[var(--ink-3)] focus:bg-[var(--ink-3)]">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border divider bg-[var(--ink-3)]"><Icon size={17} /></span>
                    <span className="flex-1 font-semibold">{action.label}</span>
                    <span className="muted text-xs">{action.hint}</span>
                  </button>
                );
              }) : <div className="py-12 text-center"><Command className="mx-auto mb-3 muted" /><p className="font-semibold">No command found</p><p className="muted mt-1 text-sm">Try a ticket number, school, or teammate.</p></div>}
            </div>
            <div className="flex gap-4 border-t divider px-4 py-3 text-[11px] muted"><span><kbd>Enter</kbd> Open</span><span><kbd>esc</kbd> Close</span><span className="ml-auto">FHQ Tech Search</span></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
