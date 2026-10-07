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

  it("creates and sends a new tracked email for a manual ticket", async () => {
    vi.stubEnv("GRAPH_MAILBOX", "FHQTCTech@fhqtc.net");
    vi.stubEnv("GRAPH_TENANT_ID", "t"); vi.stubEnv("GRAPH_CLIENT_ID", "c"); vi.stubEnv("GRAPH_CLIENT_SECRET", "s");
    const calls: Array<{ url: string; method?: string; body?: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method, body: init?.body?.toString() });
      if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "x", expires_in: 3600 }));
      if (url.endsWith("/messages")) return new Response(JSON.stringify({ id: "immutable-draft-id", internetMessageId: "<manual-public-comment@outlook.com>" }), { status: 201 });
      return new Response(null, { status: 202 });
    }));
    const { sendNewTicketEmail } = await import("@/lib/email/graph");
    const result = await sendNewTicketEmail({
      to: "requester@example.com",
      subject: "Laptop setup",
      ticketNumber: "FHQ-0042",
      comment: "Hi there\nYour laptop is ready.",
      cc: ["principal@example.com"],
      signatureHtml: "<p>FHQ Tech</p>",
    });

    const draft = calls.find((call) => call.url.endsWith("/messages"))!;
    const send = calls.find((call) => call.url.endsWith("/immutable-draft-id/send"))!;
    const payload = JSON.parse(draft.body!);
    expect(payload.subject).toBe("[FHQ-0042] Laptop setup");
    expect(payload.body.content).toContain("Hi there<br>Your laptop is ready.");
    expect(payload.toRecipients[0].emailAddress.address).toBe("requester@example.com");
    expect(payload.ccRecipients[0].emailAddress.address).toBe("principal@example.com");
    expect(payload.internetMessageHeaders).toEqual([{ name: "X-FHQ-Ticket", value: "FHQ-0042" }]);
    expect(send.method).toBe("POST");
    expect(result.internetMessageId).toBe("<manual-public-comment@outlook.com>");
  });
});
