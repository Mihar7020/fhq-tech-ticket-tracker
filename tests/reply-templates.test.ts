import { describe, expect, it } from "vitest";
import { fillTemplate, replyTemplates } from "@/lib/reply-templates";

describe("reply templates", () => {
  it("fills placeholders", () => {
    expect(fillTemplate("Hi {{firstName}} ({{name}}) at {{school}} re {{ticket}}", { name: "Annie Ewenin", school: "OMEC", ticket: "FHQ-0045" })).toBe("Hi Annie (Annie Ewenin) at OMEC re FHQ-0045");
  });
  it("falls back when name or school is missing", () => {
    expect(fillTemplate("Hi {{firstName}} at {{school}}", { name: "", ticket: "FHQ-1" })).toBe("Hi there at your school");
  });
  it("every template has a unique id and no unknown placeholders", () => {
    expect(new Set(replyTemplates.map((t) => t.id)).size).toBe(replyTemplates.length);
    for (const t of replyTemplates) expect(t.body.replace(/\{\{(firstName|name|school|ticket)\}\}/g, "")).not.toMatch(/\{\{/);
  });
});
