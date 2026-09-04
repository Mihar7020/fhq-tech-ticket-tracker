import { describe, expect, it } from "vitest";
import { isActiveTicketStatus } from "@/lib/ticket-status";
import type { TicketStatus } from "@/lib/types";

describe("active ticket status", () => {
  it.each<TicketStatus>(["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT"])("keeps %s in active work", (status) => {
    expect(isActiveTicketStatus(status)).toBe(true);
  });

  it.each<TicketStatus>(["Resolved", "Voided"])("hides %s from active work", (status) => {
    expect(isActiveTicketStatus(status)).toBe(false);
  });
});
