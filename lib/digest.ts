export type DigestExtraction = {
  available: boolean;
  problemStatement?: string;
  asks: string[];
  missingInfo: string[];
  device?: string;
  room?: string;
  neededBy?: string;
  affectedCount?: number;
  confidence: number;
  sources: Record<string, string>;
  failureReason?: string;
};

const devices = ["projector", "chromebook", "printer", "smart board", "wifi", "wi-fi", "powerschool", "teams", "laptop"];
export function extractDigest(text: string): DigestExtraction {
  const clean = text.replace(/\r/g, "").trim();
  if (clean.length < 24) return { available: false, asks: [], missingInfo: [], confidence: 0, sources: {}, failureReason: "Email is too short for a trustworthy digest." };
  const sentences = clean.split(/(?<=[.!?])\s+|\n+/).map((line) => line.trim()).filter((line) => line.length > 8 && !/^(thanks|thank you|sent from|regards)/i.test(line));
  const device = devices.find((candidate) => clean.toLowerCase().includes(candidate));
  const roomMatch = clean.match(/\b(?:room|rm\.?)[\s:#-]*([a-z]?\d{1,4})\b/i);
  const timeMatch = clean.match(/\b(?:by|at|before)\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.)?)\b/i);
  const countMatch = clean.match(/\b(\d{1,3})\s+(?:students|staff|people|devices|chromebooks)\b/i);
  const asks = sentences.filter((line) => /\?|can (?:you|someone)|please|also|need|won't|doesn'?t|cannot|can't/i.test(line)).slice(0, 5);
  const problem = sentences.find((line) => device ? line.toLowerCase().includes(device) : /broken|error|not working|won't|cannot|can't|offline|issue/i.test(line)) ?? sentences[0];
  const problemStatement = problem.split(/\s+/).slice(0, 15).join(" ").replace(/[?.!,]+$/, "");
  const missingInfo = [!roomMatch && "Room or exact location", !/error|says|message/i.test(clean) && "Exact error message", !timeMatch && "When service is needed"].filter(Boolean) as string[];
  return { available: true, problemStatement, asks: asks.length ? asks : [problem], missingInfo, device, room: roomMatch?.[1], neededBy: timeMatch?.[1], affectedCount: countMatch ? Number(countMatch[1]) : undefined, confidence: device ? .84 : .61, sources: { problemStatement: problem, ...(roomMatch ? { room: roomMatch[0] } : {}), ...(timeMatch ? { neededBy: timeMatch[0] } : {}) } };
}
