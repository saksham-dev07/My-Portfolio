import { randomUUID } from "node:crypto";
import { Resend } from "resend";

export const CONTACT_BODY_LIMIT = 16384;
const fields = new Set(["name", "reply_to", "title", "message", "website"]);

export function validateContactEnvelope(body, contentLength) {
  if (contentLength !== undefined) {
    const length = Number(contentLength);
    if (!Number.isSafeInteger(length) || length < 0)
      return { status: 400, error: "Please provide a valid message." };
    if (length > CONTACT_BODY_LIMIT)
      return { status: 413, error: "Message is too large." };
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return { status: 400, error: "Please provide a valid message." };
  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > CONTACT_BODY_LIMIT)
      return { status: 413, error: "Message is too large." };
  } catch {
    return { status: 400, error: "Please provide a valid message." };
  }
  if (Object.keys(body).some((field) => !fields.has(field)))
    return { status: 400, error: "Unexpected message fields." };
  if (body.website !== undefined && typeof body.website !== "string")
    return { status: 400, error: "Please provide a valid message." };
  return null;
}

export function validateContact(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return { error: "Please provide a valid message." };
  const limits = {
    name: [2, 100],
    reply_to: [3, 254],
    title: [3, 150],
    message: [10, 2000],
  };
  const values = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (typeof body[key] !== "string")
      return { error: "Please complete all required fields." };
    const value = body[key].trim();
    if (value.length < min || value.length > max)
      return { error: "Please check the length of your message fields." };
    values[key] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.reply_to))
    return { error: "Please enter a valid email address." };
  if (
    [...(values.name + values.title + values.reply_to)].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return { error: "Please use a single line for your name and subject." };
  return { values };
}

// Defense in depth behind the shared Vercel Firewall POST /api/send limit.
// This map is deliberately not presented as a cross-instance limiter.
export function createContactHandler({
  send,
  now = Date.now,
  log = () => {},
  production = process.env.VERCEL === "1",
  allowedOrigins = [
    "https://saksham-dev07.me",
    "https://sakshamdev-portfolio.vercel.app",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
} = {}) {
  const attempts = new Map();
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const requestId = randomUUID();
    res.setHeader("X-Request-ID", requestId);
    const record = (outcome, status) => {
      // Never record payloads, IPs, email addresses, keys or provider exceptions.
      try {
        log({ event: "contact_outcome", requestId, outcome, status });
      } catch {
        // Telemetry cannot change message-delivery behavior.
      }
    };
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    const contentType = String(req.headers?.["content-type"] || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (contentType !== "application/json")
      return res.status(415).json({ error: "Please send a JSON message." });
    const origin = req.headers?.origin;
    if (production && origin && !allowedOrigins.includes(origin)) {
      record("origin_rejected", 403);
      return res.status(403).json({ error: "Please use the contact form." });
    }
    const envelope = validateContactEnvelope(
      req.body,
      req.headers?.["content-length"],
    );
    if (envelope)
      return res.status(envelope.status).json({ error: envelope.error });
    if (typeof req.body?.website === "string" && req.body.website.trim())
      return res.status(200).json({ success: true });
    const validation = validateContact(req.body);
    if (validation.error)
      return res.status(400).json({ error: validation.error });
    const time = now();
    for (const [key, value] of attempts)
      if (time - value.start >= 60000) attempts.delete(key);
    // Vercel overwrites this header. A direct local server must use the socket.
    const forwarded = production ? req.headers?.["x-forwarded-for"] : null;
    const ip =
      (typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : req.socket?.remoteAddress) || "unknown";
    const attempt = attempts.get(ip) || { count: 0, start: time };
    if (attempt.count >= 5) {
      record("rate_limited", 429);
      res.setHeader(
        "Retry-After",
        String(Math.ceil((60000 - (time - attempt.start)) / 1000)),
      );
      return res
        .status(429)
        .json({ error: "Please wait a minute before trying again." });
    }
    if (attempts.size >= 10000 && !attempts.has(ip)) {
      record("limiter_capacity", 503);
      return res.status(503).json({ error: "Please try again shortly." });
    }
    attempt.count++;
    attempts.set(ip, attempt);
    const { name, reply_to, title, message } = validation.values;
    try {
      const result = await send({
        from: "Portfolio Inquiry <onboarding@resend.dev>",
        to: ["sakmmm07@gmail.com"],
        replyTo: reply_to,
        subject: `[Portfolio] ${title}`,
        text: `From: ${name}\nReply to: ${reply_to}\nSubject: ${title}\n\n${message}`,
      });
      if (result?.error || !result?.data?.id) {
        record("provider_rejected", 502);
        return res.status(502).json({
          error: "The message couldn't be delivered. Please email me directly.",
        });
      }
      record("provider_accepted", 200);
      return res.status(200).json({ success: true });
    } catch {
      record("provider_unavailable", 503);
      return res.status(503).json({
        error:
          "Messaging is temporarily unavailable. Please email me directly.",
      });
    }
  };
}

export default createContactHandler({
  log: (event) => console.info(JSON.stringify(event)),
  send: async (payload) => {
    if (!process.env.RESEND_API_KEY) throw new Error("Email is not configured");
    return new Resend(process.env.RESEND_API_KEY).emails.send(payload);
  },
});
