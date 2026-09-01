import type { Priority } from "@/lib/types";

export function triageEmail(text: string, affectedCount = 1, minutesUntilNeeded?: number) {
  const lower = text.toLowerCase();
  let category = "Other";
  let service = "Unknown";
  if (/wi-?fi|internet|network|offline/.test(lower)) { category = "Network"; service = "Wireless network"; }
  else if (/projector|smart ?board|hdmi|display/.test(lower)) { category = "AV & displays"; service = /smart ?board/.test(lower) ? "SMART Board" : "Classroom projector"; }
  else if (/chromebook|laptop|computer|tablet/.test(lower)) { category = "Student devices"; service = "End-user computing"; }
  else if (/password|sign.?in|login|account/.test(lower)) { category = "Accounts"; service = /powerschool/.test(lower) ? "PowerSchool" : "Microsoft 365"; }
  else if (/printer|print|toner/.test(lower)) { category = "Printing"; service = "Printing"; }
  const urgency = minutesUntilNeeded !== undefined && minutesUntilNeeded <= 60 ? 4 : /urgent|asap|class.*(?:minute|hour)|principal/.test(lower) ? 3 : 2;
  const impact = affectedCount >= 50 ? 4 : affectedCount >= 10 ? 3 : affectedCount > 1 ? 2 : 1;
  const score = urgency + impact;
  const priority: Priority = score >= 7 ? "Critical" : score >= 5 ? "High" : score >= 3 ? "Normal" : "Low";
  return { category, service, urgency, impact, priority, confidence: category === "Other" ? .42 : .86 };
}
