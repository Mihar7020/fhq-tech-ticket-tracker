import { describe, expect, it } from "vitest";
import { formatBytes, normalizeCid, pickGraphAttachment, splitEmailText } from "@/lib/email-display";

const logo = { id: "a1", filename: "image001.png", contentType: "image/png", sizeBytes: 5120, contentId: "<image001.png@01DD5588.25BD9E80>" };
const pdf = { id: "a2", filename: "Graduates.pdf", contentType: "application/pdf", sizeBytes: 3_400_000 };

describe("splitEmailText", () => {
  it("puts an inline image where Outlook's [cid:] placeholder was", () => {
    const { segments, others } = splitEmailText("Thanks\n[cid:image001.png@01DD5588.25BD9E80]\nSierra", [logo, pdf]);
    expect(segments).toEqual([{ kind: "text", value: "Thanks\n" }, { kind: "image", attachment: logo }, { kind: "text", value: "\nSierra" }]);
    expect(others).toEqual([pdf]);
  });
  it("drops placeholders it can't resolve and the duplicated <mailto:> links", () => {
    const { segments } = splitEmailText("[cid:missing@x]Email: a@fhqtc.net<mailto:a@fhqtc.net>", []);
    expect(segments).toEqual([{ kind: "text", value: "Email: a@fhqtc.net" }]);
  });
  it("lists every attachment when the text has no placeholders", () => {
    expect(splitEmailText("Hello", [logo, pdf]).others).toEqual([logo, pdf]);
  });
});

describe("pickGraphAttachment", () => {
  it("matches by Content-ID first, ignoring angle brackets and case", () => {
    const graph = [{ id: "g1", name: "image001.png", contentId: "other@x" }, { id: "g2", name: "image001.png", contentId: "IMAGE001.png@01DD5588.25BD9E80" }];
    expect(pickGraphAttachment(logo, graph)?.id).toBe("g2");
  });
  it("falls back to the file name", () => {
    expect(pickGraphAttachment(pdf, [{ id: "g3", name: "Graduates.pdf" }])?.id).toBe("g3");
  });
  it("returns nothing when there is no match", () => {
    expect(pickGraphAttachment(pdf, [{ id: "g4", name: "other.pdf" }])).toBeUndefined();
  });
});

describe("helpers", () => {
  it("normalises content ids and formats sizes", () => {
    expect(normalizeCid(" <A@B> ")).toBe("a@b");
    expect([formatBytes(900), formatBytes(5120), formatBytes(3_400_000)]).toEqual(["900 B", "5 KB", "3.2 MB"]);
  });
});
