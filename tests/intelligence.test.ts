import { describe, expect, it } from "vitest";
import { extractDigest } from "@/lib/digest";
import { triageEmail } from "@/lib/triage";
import { predictSlaRisk } from "@/lib/sla";
import { findRippleClusters } from "@/lib/ripple";

describe("digest extraction", () => {
  it("finds device, location, timing, asks, and provenance", () => { const result = extractDigest("The projector in room 204 says no signal. Can someone fix it before 10:40 AM? There are 28 students."); expect(result.available).toBe(true); expect(result.device).toBe("projector"); expect(result.room).toBe("204"); expect(result.neededBy).toMatch(/10:40/i); expect(result.affectedCount).toBe(28); expect(result.problemStatement!.split(" ").length).toBeLessThanOrEqual(15); expect(result.sources.room).toBeTruthy(); });
  it("fails gracefully instead of inventing data", () => { const result = extractDigest("Help"); expect(result.available).toBe(false); expect(result.room).toBeUndefined(); expect(result.failureReason).toBeTruthy(); });
});

describe("triage and predictive SLA", () => {
  it("raises a classroom-wide imminent outage", () => { const result = triageEmail("Wi-Fi is offline and class starts soon", 74, 20); expect(result.category).toBe("Network"); expect(result.priority).toBe("Critical"); });
  it("includes travel, bell timing, and workload in risk", () => { const calm = predictSlaRisk({ ageMinutes: 10, targetMinutes: 240, queueLoad: .5, assigneeLoad: .4, historicalFixMinutes: 20, travelMinutes: 0 }); const pressured = predictSlaRisk({ ageMinutes: 160, targetMinutes: 240, queueLoad: 1.4, assigneeLoad: 1, historicalFixMinutes: 60, travelMinutes: 35, minutesUntilBell: 30 }); expect(pressured.risk).toBeGreaterThan(calm.risk); expect(pressured.reason).toMatch(/bell/); });
  it("pauses while waiting on staff", () => { expect(predictSlaRisk({ ageMinutes: 200, targetMinutes: 240, queueLoad: 2, assigneeLoad: 1, historicalFixMinutes: 80, travelMinutes: 20, paused: true }).risk).toBe(0); });
});

describe("ripple clustering", () => {
  it("promotes cross-site signatures to division-wide", () => { const now = Date.now(); const clusters = findRippleClusters([{ id: "1", siteId: "sb", fingerprint: "wifi-auth", createdAt: now }, { id: "2", siteId: "pvl", fingerprint: "wifi-auth", createdAt: now - 1000 }, { id: "3", siteId: "musk", fingerprint: "wifi-auth", createdAt: now - 2000 }]); expect(clusters[0].scope).toBe("division-wide"); });
  it("does not promote two related complaints", () => { expect(findRippleClusters([{ id: "1", siteId: "sb", fingerprint: "x", createdAt: 1 }, { id: "2", siteId: "sb", fingerprint: "x", createdAt: 2 }])).toEqual([]); });
});
