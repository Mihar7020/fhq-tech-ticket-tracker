import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production deployment safety", () => {
  it("does not seed or bootstrap data during a Vercel build", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(packageJson.scripts["vercel-build"]).toBe("prisma generate && prisma migrate deploy && next build");
    expect(packageJson.scripts["vercel-build"]).not.toMatch(/seed|bootstrap/);
  });

  it("keeps the destructive demo seed blocked in production", () => {
    const seed = readFileSync("prisma/seed.ts", "utf8");
    expect(seed).toContain('if (process.env.NODE_ENV === "production") throw new Error("Seed is disabled in production.");');
  });
});
