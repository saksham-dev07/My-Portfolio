import { describe, expect, test } from "bun:test";
import { createContactHandler, validateContactEnvelope } from "../api/send.js";
import { verifyBracesMitigation } from "../scripts/security/audit-dependencies.mjs";
import { inlineScriptHashes } from "../scripts/security/csp.mjs";
import { secretTypes } from "../scripts/security/scan-secrets.mjs";
import { readContactResponse } from "../src/utils/contactDelivery.js";

const valid = {
  name: "Alex Morgan",
  reply_to: "alex@example.com",
  title: "A project",
  message: "Discuss a useful project.",
  website: "",
};
const response = () => ({
  headers: {},
  statusCode: 200,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
const request = (body = valid, headers = {}) => ({
  method: "POST",
  body,
  headers: { "content-type": "application/json", ...headers },
  socket: { remoteAddress: "192.0.2.1" },
});

describe("contact security boundaries", () => {
  test("rejects oversized parsed JSON without relying on Content-Length", () => {
    expect(
      validateContactEnvelope({ ...valid, extra: "x".repeat(20000) }).status,
    ).toBe(413);
    expect(validateContactEnvelope({ ...valid, extra: "tiny" }).status).toBe(
      400,
    );
    expect(
      validateContactEnvelope(JSON.parse('{"__proto__":{},"name":"A"}')).status,
    ).toBe(400);
    expect(validateContactEnvelope(valid)).toBeNull();
  });
  test("counts multibyte JSON and rejects malformed length/honeypot types", () => {
    expect(
      validateContactEnvelope({ ...valid, message: "界".repeat(6000) }).status,
    ).toBe(413);
    for (const length of ["NaN", "-1", "1.5", "Infinity"])
      expect(validateContactEnvelope(valid, length).status).toBe(400);
    expect(validateContactEnvelope({ ...valid, website: {} }).status).toBe(400);
  });
  test("rejects type confusion and header controls before the provider", async () => {
    let sends = 0;
    const handler = createContactHandler({
      send: async () => {
        sends++;
        return { data: { id: "accepted" } };
      },
    });
    for (const [req, status] of [
      [request(valid, { "content-type": "application/jsonp" }), 415],
      [request({ ...valid, title: "Subject\u0000injected" }), 400],
      [request({ ...valid, name: "Alex\tMorgan" }), 400],
      [request({ ...valid, to: "unexpected@example.com" }), 400],
    ]) {
      const res = response();
      await handler(req, res);
      expect(res.statusCode).toBe(status);
    }
    expect(sends).toBe(0);
    const good = response();
    await handler(
      request(valid, { "content-type": "Application/JSON; charset=utf-8" }),
      good,
    );
    expect(good.statusCode).toBe(200);
  });
  test("production browser origins are explicit; direct clients still need the shared WAF limiter", async () => {
    let sends = 0;
    const handler = createContactHandler({
      production: true,
      allowedOrigins: ["https://saksham-dev07.me"],
      send: async () => {
        sends++;
        return { data: { id: "accepted" } };
      },
    });
    const foreign = response();
    await handler(
      request(valid, { origin: "https://untrusted.example" }),
      foreign,
    );
    expect(foreign.statusCode).toBe(403);
    expect(sends).toBe(0);
    const good = response();
    await handler(request(valid, { origin: "https://saksham-dev07.me" }), good);
    expect(good.statusCode).toBe(200);
  });
  test("local requests cannot rotate spoofed forwarding headers to bypass throttling", async () => {
    const handler = createContactHandler({
      production: false,
      now: () => 100000,
      send: async () => ({ data: { id: "accepted" } }),
    });
    for (let i = 0; i < 5; i++)
      await handler(
        request(valid, { "x-forwarded-for": `192.0.2.${i}` }),
        response(),
      );
    const blocked = response();
    await handler(
      request(valid, { "x-forwarded-for": "203.0.113.9" }),
      blocked,
    );
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers["Retry-After"]).toBe("60");
  });
  test("logs only outcomes and generated correlation IDs, keeping provider secrets private", async () => {
    const events = [];
    const handler = createContactHandler({
      log: (event) => events.push(event),
      send: async () => {
        throw new Error("private credential and message");
      },
    });
    const res = response();
    await handler(request(), res);
    expect(res.statusCode).toBe(503);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event: "contact_outcome",
      outcome: "provider_unavailable",
      status: 503,
    });
    const serialized = JSON.stringify(events);
    for (const privateValue of [
      valid.name,
      valid.reply_to,
      valid.message,
      "credential",
      "192.0.2.1",
    ])
      expect(serialized).not.toContain(privateValue);
    expect(res.headers["X-Request-ID"]).toBe(events[0].requestId);
  });
  test("a failing logging sink cannot change a successful send", async () => {
    const res = response();
    await createContactHandler({
      log: () => {
        throw new Error("logger offline");
      },
      send: async () => ({ data: { id: "accepted" } }),
    })(request(), res);
    expect(res.statusCode).toBe(200);
  });
});

test("the installed braces patch blocks deep strings and cyclic ASTs without changing normal globs", () => {
  expect(verifyBracesMitigation()).toBe(true);
  const braces = require("braces");
  const cyclic = { type: "root", nodes: [] };
  cyclic.nodes.push(cyclic);
  for (const action of ["compile", "expand", "stringify"])
    expect(() => braces[action](cyclic)).toThrow("cyclic or shared brace AST");
});

test("CSP hashes cover exact inline content without hashing external script tags", () => {
  const first = inlineScriptHashes(
    '<script>window.test = 1;</script><script src="/app.js"></script>',
  );
  expect(first).toHaveLength(1);
  expect(first[0]).toMatch(/^'sha256-/);
  expect(inlineScriptHashes("<script>window.test = 2;</script>")[0]).not.toBe(
    first[0],
  );
});

test("secret detection recognizes underscore-bearing keys and classifies without echoing values", () => {
  const token = ["re_", "a".repeat(15), "_", "b".repeat(15)].join("");
  expect(secretTypes(token)).toEqual(["Resend credential"]);
  expect(JSON.stringify(secretTypes(token))).not.toContain(token);
  expect(secretTypes("RESEND_API_KEY=your_resend_api_key_here")).toEqual([]);
});

test("an HTML edge 429 preserves a retry result without requiring JSON", async () => {
  const result = await readContactResponse(
    new Response("<html>Too Many Requests</html>", { status: 429 }),
  );
  expect(result).toEqual({ limited: true, retrySeconds: 60 });
  expect(
    await readContactResponse(
      new Response("", { status: 429, headers: { "Retry-After": "25" } }),
    ),
  ).toEqual({ limited: true, retrySeconds: 25 });
});

test("contact responses require provider-confirmed success and bound retry hints", async () => {
  for (const value of ["0", "-5", "invalid"])
    expect(
      (
        await readContactResponse(
          new Response("", { status: 429, headers: { "Retry-After": value } }),
        )
      ).retrySeconds,
    ).toBe(60);
  expect(
    (
      await readContactResponse(
        new Response("", { status: 429, headers: { "Retry-After": "10000" } }),
      )
    ).retrySeconds,
  ).toBe(3600);
  expect(await readContactResponse(Response.json({ success: true }))).toEqual({
    limited: false,
  });
  await expect(
    readContactResponse(Response.json({ success: true }, { status: 502 })),
  ).rejects.toThrow("Delivery failed");
  await expect(readContactResponse(Response.json({}))).rejects.toThrow(
    "Delivery failed",
  );
});
