"use client";

import { useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Person } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = { people: Person[]; value: string[]; onChange: (emails: string[]) => void; exclude?: string[] };

/** Type-to-search CC field: no list until 2+ characters, max 6 matches, keyboard friendly. */
export function CcPicker({ people, value, onChange, exclude = [] }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const blocked = useMemo(() => new Set([...exclude, ...value].map((email) => email.toLowerCase())), [exclude, value]);
  const nameFor = (email: string) => people.find((person) => person.email.toLowerCase() === email)?.name;

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (q.length < 2) return [];
    const score = (person: Person) => {
      const name = person.name.toLowerCase(); const email = person.email.toLowerCase();
      if (name.startsWith(q)) return 0;
      if (name.split(/[\s-]+/).some((part) => part.startsWith(q))) return 1;
      if (email.startsWith(q)) return 2;
      if (name.includes(q) || email.includes(q) || person.aliases.some((alias) => alias.toLowerCase().includes(q))) return 3;
      return -1;
    };
    return people
      .filter((person) => person.email && person.active !== false && !blocked.has(person.email.toLowerCase()))
      .map((person) => ({ person, rank: score(person) }))
      .filter((row) => row.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.person.name.localeCompare(b.person.name))
      .slice(0, 6)
      .map((row) => row.person);
  }, [people, blocked, q]);
  const typedEmail = EMAIL.test(q) && !blocked.has(q) && !matches.some((person) => person.email.toLowerCase() === q) ? q : null;
  const options = [...matches.map((person) => ({ email: person.email.toLowerCase(), name: person.name, detail: person.role })), ...(typedEmail ? [{ email: typedEmail, name: `Add ${typedEmail}`, detail: "Not in directory" }] : [])];

  const add = (email: string) => {
    if (!blocked.has(email)) onChange([...value, email]);
    setQuery(""); setActive(0); setOpen(false);
  };

  return (
    <div className="relative">
      <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5 py-1.5" onClick={() => inputRef.current?.focus()}>
        {value.map((email) => (
          <span key={email} className="chip gap-1.5" title={email}>
            {nameFor(email) ?? email}
            <button type="button" aria-label={`Remove ${email}`} onClick={(event) => { event.stopPropagation(); onChange(value.filter((item) => item !== email)); }}><X size={11} /></button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="min-w-[160px] flex-1 bg-transparent text-sm outline-none"
          value={query}
          placeholder={value.length ? "Add another…" : "Type a name or email to CC"}
          onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(i + 1, options.length - 1)); }
            else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
            else if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
              const pick = options[active];
              if (pick) { event.preventDefault(); add(pick.email); } else if (event.key === "Enter") event.preventDefault();
            }
            else if (event.key === "Escape") setOpen(false);
            else if (event.key === "Backspace" && !query && value.length) onChange(value.slice(0, -1));
          }}
          role="combobox"
          aria-controls={listId}
          aria-expanded={open && options.length > 0}
          aria-autocomplete="list"
        />
      </div>
      {open && q.length >= 2 ? (
        <div id={listId} role="listbox" className="card absolute left-0 right-0 z-30 mt-1 overflow-hidden bg-[var(--ink-3)] p-1">
          {options.length ? options.map((option, index) => (
            <button
              key={option.email}
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => { event.preventDefault(); add(option.email); }}
              onMouseEnter={() => setActive(index)}
              className={`flex w-full items-baseline justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${index === active ? "bg-[var(--gold-soft)]" : ""}`}
            >
              <span className="min-w-0"><span className="block truncate font-semibold">{option.name}</span><span className="muted block truncate text-xs">{option.email}</span></span>
              {option.detail ? <span className="muted shrink-0 text-xs">{option.detail}</span> : null}
            </button>
          )) : <p className="muted px-3 py-2 text-xs">No matches. Type a full email address to add someone outside the directory.</p>}
        </div>
      ) : null}
    </div>
  );
}
