import { describe, expect, it } from "vitest";
import { needsReply, repliesFirst } from "@/lib/needs-reply";

describe("repliesFirst", () => {
  it("moves tickets with a new reply or reopen to the top, keeping order inside each group", () => {
    const list = [{ id: "a" }, { id: "b", awaitingReply: true }, { id: "c" }, { id: "d", reopenedBy: { name: "Gord", at: "x" } }];
    expect(repliesFirst(list).map((t) => t.id)).toEqual(["b", "d", "a", "c"]);
  });
  it("flags only tickets waiting on IT", () => {
    expect(needsReply({})).toBe(false);
    expect(needsReply({ awaitingReply: true })).toBe(true);
  });
});
