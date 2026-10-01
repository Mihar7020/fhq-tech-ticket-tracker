import { expect, test } from "@playwright/test";
import path from "node:path";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Work email").fill("mihar@fhqtc.net");
  await page.getByLabel("Password").fill("fhqtechdemo");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("triage, assign, reply, and resolve an email-ingested ticket", async ({ page }) => {
  await page.getByRole("link", { name: /Triage queue|Queue/ }).click();
  await expect(page.getByRole("heading", { name: "Live queue" })).toBeVisible();
  await page.getByText("Projector shows ‘No signal’ before period three", { exact: true }).click();
  await expect(page.getByText("Email Digest", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Take ticket" }).click();
  await expect(page.getByText(/Ticket is yours/)).toBeVisible();
  await page.getByLabel("Reply text").fill("Hi Tara, we are on the way and will update you before class. — FHQ Tech");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText(/Reply queued/)).toBeVisible();
  await page.getByLabel("Status").selectOption("Resolved");
  await expect(page.getByText("Clean close.")).toBeVisible();
});

test("imports a messy directory file through map, validate, and diff", async ({ page }) => {
  await page.goto("/directory/import");
  await page.locator('input[type="file"]').setInputFiles(path.resolve("public/sample-staff.csv"));
  await expect(page.getByRole("heading", { name: "Map your headers" })).toBeVisible();
  await page.getByRole("button", { name: /Validate rows/ }).click();
  await expect(page.getByText(/staff records checked/)).toBeVisible();
  await page.getByRole("button", { name: /Review exact diff/ }).click();
  await expect(page.getByRole("heading", { name: "Ready to create snapshot" })).toBeVisible();
});

test("supports keyboard-only queue triage", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page.getByRole("heading", { name: "Live queue" })).toBeVisible();
  await page.getByRole("button", { name: "Start triage" }).press("Enter");
  await page.keyboard.press("j");
  await page.keyboard.press("a");
  await expect(page.getByText(/assigned to you/i)).toBeVisible();
});

test("manual reroute stays explainable and offers directory learning", async ({ page }) => {
  await page.goto("/tickets/1048");
  await page.getByLabel("Re-route ticket").selectOption("olc");
  await expect(page.getByText(/Site corrected/)).toBeVisible();
  await expect(page.getByText(/Manually corrected/)).toBeVisible();
});
