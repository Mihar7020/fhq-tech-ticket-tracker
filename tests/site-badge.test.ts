import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteBadge } from "@/components/site-badge";

const office = { id: "db-office-id", code: "OFFICE", name: "Office" };
const render = (props: Parameters<typeof SiteBadge>[0]) => renderToStaticMarkup(createElement(SiteBadge, props));

describe("SiteBadge", () => {
  it("shows a school that only exists in the database (like Office)", () => {
    expect(render({ siteId: "db-office-id", sites: [office], compact: true })).toContain("OFFICE");
    expect(render({ siteId: "db-office-id", site: office })).toContain("Office");
  });
  it("never says Unrouted when a school is assigned, even if its details are missing", () => {
    expect(render({ siteId: "unknown-id" })).not.toContain("Unrouted");
  });
  it("says Unrouted only when no school is assigned", () => {
    expect(render({})).toContain("Unrouted");
  });
});
