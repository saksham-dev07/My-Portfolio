import { Resend } from "resend";

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not defined in environment variables");
    return res.status(500).json({
      error: "Server configuration error: RESEND_API_KEY is not defined",
    });
  }

  const resend = new Resend(apiKey);

  try {
    const { name, reply_to, title, message } = req.body || {};

    if (!name || !reply_to || !message) {
      return res
        .status(400)
        .json({ error: "Missing required fields (name, email, message)" });
    }

    const emailSubject = title
      ? `[Portfolio] ${title}`
      : `Portfolio Inquiry from ${name}`;

    const { data, error } = await resend.emails.send({
      from: "Portfolio Inquiry <onboarding@resend.dev>",
      to: ["sakmmm07@gmail.com"],
      replyTo: reply_to,
      subject: emailSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
          <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="font-size: 11px; font-family: monospace; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">New Portfolio Transmission</span>
            <h2 style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">${emailSubject}</h2>
          </div>

          <div style="background-color: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ffffff;">Sender Name:</strong> ${name}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ffffff;">Sender Email:</strong> <a href="mailto:${reply_to}" style="color: #22d3ee; text-decoration: none;">${reply_to}</a></p>
            <p style="margin: 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ffffff;">Subject / Opportunity:</strong> ${title || "General Discussion"}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 11px; font-family: monospace; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Message Body:</p>
            <div style="background-color: #18181b; padding: 18px; border-radius: 8px; border: 1px solid #27272a; font-size: 14px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; font-family: monospace; color: #71717a; text-align: center;">
            Dispatched securely via Resend API &bull; Saksham Agarwal Portfolio Gateway
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return res
        .status(400)
        .json({ error: error.message || "Resend delivery failed" });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Server Handler Error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error" });
  }
}
