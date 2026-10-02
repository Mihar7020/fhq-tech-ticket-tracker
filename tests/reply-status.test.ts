import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));

describe("replyStatusChange", () => {
  it("reopens resolved tickets as New", async () => {
    const { replyStatusChange } = await import("@/lib/email/prisma-repository");
    expect(replyStatusChange("RESOLVED")).toMatchObject({ status: "NEW", action: "REOPENED_BY_REQUESTER_REPLY" });
  });
  it("moves Waiting on requester back to In progress", async () => {
    const { replyStatusChange } = await import("@/lib/email/prisma-repository");
    expect(replyStatusChange("WAITING_ON_STAFF")).toMatchObject({ status: "IN_PROGRESS", action: "REQUESTER_REPLIED" });
  });
  it("leaves every other status alone, including voided and merged", async () => {
    const { replyStatusChange } = await import("@/lib/email/prisma-repository");
    for (const status of ["NEW", "TRIAGE", "IN_PROGRESS", "WAITING_ON_IT", "CLOSED", "MERGED"]) expect(replyStatusChange(status)).toBeNull();
  });
});
