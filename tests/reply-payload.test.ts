import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendThreadedReply", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

  it("uses one-step /reply with line breaks, escaped text, signature and CC (never message.body)", async () => {
    vi.stubEnv("GRAPH_MAILBOX", "FHQTCTech@fhqtc.net");
    vi.stubEnv("GRAPH_TENANT_ID", "t"); vi.stubEnv("GRAPH_CLIENT_ID", "c"); vi.stubEnv("GRAPH_CLIENT_SECRET", "s");
    const calls: Array<{ url: string; body?: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body?.toString() });
      if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "x", expires_in: 3600 }));
      return new Response(null, { status: 202 });
    }));
    const { sendThreadedReply } = await import("@/lib/email/graph");
    await sendThreadedReply({ messageId: "AAMk-graph-id", comment: "Hi <b>there</b>\nLine two", signatureHtml: "<p>Mihar</p>", cc: ["a@fhqtc.net"] });

    const reply = calls.find((call) => call.url.endsWith("/reply"))!;
    expect(reply.url).toContain("/users/FHQTCTech%40fhqtc.net/messages/AAMk-graph-id/reply");
    expect(calls.some((call) => call.url.includes("createReply") || call.url.endsWith("/send"))).toBe(false);
    const payload = JSON.parse(reply.body!);
    expect(payload.comment).toContain("Hi &lt;b&gt;there&lt;/b&gt;<br>Line two");
    expect(payload.comment).toContain("<p>Mihar</p>");
    expect(payload.message).toEqual({ ccRecipients: [{ emailAddress: { address: "a@fhqtc.net" } }] });
    expect(payload.message.body).toBeUndefined();
  });

  it("omits message entirely when there is no CC", async () => {
    vi.stubEnv("GRAPH_MAILBOX", "FHQTCTech@fhqtc.net");
    vi.stubEnv("GRAPH_TENANT_ID", "t"); vi.stubEnv("GRAPH_CLIENT_ID", "c"); vi.stubEnv("GRAPH_CLIENT_SECRET", "s");
    let body = "";
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "x", expires_in: 3600 }));
      body = init?.body?.toString() ?? ""; return new Response(null, { status: 202 });
    }));
    const { sendThreadedReply } = await import("@/lib/email/graph");
    await sendThreadedReply({ messageId: "AAMk", comment: "Thanks" });
    expect(JSON.parse(body)).toEqual({ comment: "<div>Thanks</div>" });
  });
});
