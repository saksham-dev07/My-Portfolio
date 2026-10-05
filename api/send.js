import { Resend } from "resend";

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
  if (/[\r\n]/.test(values.name + values.title))
    return { error: "Please use a single line for your name and subject." };
  return { values };
}

// Best-effort per-instance throttling. A durable limiter can be added at the host.
export function createContactHandler({ send, now = Date.now } = {}) {
  const attempts = new Map();
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    if (
      !req.headers?.["content-type"]
        ?.toLowerCase()
        .startsWith("application/json")
    )
      return res.status(415).json({ error: "Please send a JSON message." });
    if (Number(req.headers?.["content-length"] || 0) > 16384)
      return res.status(413).json({ error: "Message is too large." });
    if (typeof req.body?.website === "string" && req.body.website.trim())
      return res.status(200).json({ success: true });
    const validation = validateContact(req.body);
    if (validation.error)
      return res.status(400).json({ error: validation.error });
    const time = now();
    for (const [key, value] of attempts)
      if (time - value.start >= 60000) attempts.delete(key);
    const forwarded = req.headers?.["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string"
        ? forwarded.split(",")[0].trim()
        : req.socket?.remoteAddress) || "unknown";
    const attempt = attempts.get(ip) || { count: 0, start: time };
    if (attempt.count >= 5) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((60000 - (time - attempt.start)) / 1000)),
      );
      return res
        .status(429)
        .json({ error: "Please wait a minute before trying again." });
    }
    if (attempts.size >= 10000 && !attempts.has(ip))
      return res.status(503).json({ error: "Please try again shortly." });
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
      if (result.error)
        return res.status(502).json({
          error: "The message couldn't be delivered. Please email me directly.",
        });
      return res.status(200).json({ success: true });
    } catch {
      return res.status(503).json({
        error:
          "Messaging is temporarily unavailable. Please email me directly.",
      });
    }
  };
}

export default createContactHandler({
  send: async (payload) => {
    if (!process.env.RESEND_API_KEY) throw new Error("Email is not configured");
    return new Resend(process.env.RESEND_API_KEY).emails.send(payload);
  },
});
