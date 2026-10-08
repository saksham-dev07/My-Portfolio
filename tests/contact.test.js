import { describe, expect, test } from "bun:test";
import { createContactHandler, validateContact } from "../api/send";

const valid = {
  name: "Alex Morgan",
  reply_to: "alex@example.com",
  title: "Project collaboration",
  message: "I would like to discuss a new project.",
  website: "",
};
function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}
function request(body = valid, overrides = {}) {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body,
    ...overrides,
  };
}
describe("contact validation", () => {
  test("rejects missing, malformed, oversized and whitespace-only fields", () => {
    for (const body of [
      null,
      [],
      {},
      { ...valid, name: "  " },
      { ...valid, reply_to: "invalid" },
      { ...valid, reply_to: "alex@example.com\nBcc: bad@example.com" },
      { ...valid, title: "Hi\nInjected" },
      { ...valid, message: "a".repeat(2001) },
      { ...valid, name: 123 },
    ])
      expect(validateContact(body).error).toBeString();
  });
  test("trims fields while preserving message line breaks", () => {
    expect(
      validateContact({
        ...valid,
        name: " Alex ",
        message: "\nHello there\nThis is a message.\n",
      }).values,
    ).toMatchObject({
      name: "Alex",
      message: "Hello there\nThis is a message.",
    });
  });
});
describe("contact API", () => {
  test("sends plain text and only reports success when the provider accepts it", async () => {
    let payload;
    const handler = createContactHandler({
      send: async (value) => {
        payload = value;
        return { data: { id: "test" } };
      },
    });
    const res = response();
    await handler(
      request({
        ...valid,
        message: "<img src=x onerror=alert(1)> Hello there",
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(payload.html).toBeUndefined();
    expect(payload.text).toContain("<img");
    expect(payload.replyTo).toBe(valid.reply_to);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });
  test("refuses invalid methods and content types without contacting the provider", async () => {
    let calls = 0;
    const handler = createContactHandler({
      send: async () => {
        calls++;
        return {};
      },
    });
    for (const [req, status] of [
      [request(valid, { method: "GET" }), 405],
      [request(valid, { headers: { "content-type": "text/plain" } }), 415],
      [request({}), 400],
      [
        request(valid, {
          headers: {
            "content-type": "application/json",
            "content-length": "20000",
          },
        }),
        413,
      ],
    ]) {
      const res = response();
      await handler(req, res);
      expect(res.statusCode).toBe(status);
    }
    expect(calls).toBe(0);
  });
  test("discards honeypot submissions", async () => {
    const handler = createContactHandler({
      send: async () => {
        throw new Error("Must not send");
      },
    });
    const res = response();
    await handler(request({ ...valid, website: "spam.example" }), res);
    expect(res.body.success).toBe(true);
  });
  test("keeps provider and configuration errors private", async () => {
    for (const send of [
      async () => ({ error: { message: "private provider details" } }),
      async () => {
        throw new Error("secret config");
      },
    ]) {
      const res = response();
      await createContactHandler({ send })(request(), res);
      expect(res.statusCode).toBeGreaterThanOrEqual(500);
      expect(JSON.stringify(res.body)).not.toContain("private");
      expect(JSON.stringify(res.body)).not.toContain("secret");
    }
  });
  test("does not confirm a message without provider acceptance", async () => {
    for (const result of [undefined, {}, { data: {} }, { data: { id: "" } }]) {
      const res = response();
      await createContactHandler({ send: async () => result })(request(), res);
      expect(res.statusCode).toBe(502);
      expect(res.body.success).toBeUndefined();
    }
  });
  test("throttles repeated requests and recovers after the window", async () => {
    let time = 100000;
    let sends = 0;
    const handler = createContactHandler({
      now: () => time,
      send: async () => {
        sends++;
        return { data: { id: "accepted" } };
      },
    });
    for (let i = 0; i < 5; i++) await handler(request(), response());
    const blocked = response();
    await handler(request(), blocked);
    expect(blocked.statusCode).toBe(429);
    expect(sends).toBe(5);
    expect(blocked.headers["Retry-After"]).toBe("60");
    time += 60000;
    const next = response();
    await handler(request(), next);
    expect(next.statusCode).toBe(200);
    expect(sends).toBe(6);
  });
});
