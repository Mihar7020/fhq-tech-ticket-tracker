export function predictSlaRisk(input: { ageMinutes: number; targetMinutes: number; queueLoad: number; assigneeLoad: number; historicalFixMinutes: number; travelMinutes: number; minutesUntilBell?: number; paused?: boolean }) {
  if (input.paused) return { risk: 0, minutesToDoom: Math.max(0, input.targetMinutes - input.ageMinutes), reason: "SLA paused while waiting on staff" };
  const remaining = input.targetMinutes - input.ageMinutes;
  const expectedWork = input.historicalFixMinutes * (1 + Math.max(0, input.queueLoad - 1) * .18 + Math.max(0, input.assigneeLoad - .75) * .45) + input.travelMinutes;
  const bellPressure = input.minutesUntilBell !== undefined && input.minutesUntilBell < expectedWork ? 18 : 0;
  const risk = Math.max(1, Math.min(99, 50 + ((expectedWork - remaining) / Math.max(input.targetMinutes, 1)) * 65 + bellPressure));
  return { risk: Math.round(risk), minutesToDoom: Math.max(0, Math.round(remaining - expectedWork)), reason: bellPressure ? "Expected work extends past the next class bell" : risk >= 80 ? "Current load and travel make breach likely" : "Within predicted capacity" };
}
