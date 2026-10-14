import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import contactHandler, { CONTACT_BODY_LIMIT } from "./api/send.js";

const securityHeaders = JSON.parse(
  readFileSync(new URL("./vercel.json", import.meta.url), "utf8"),
).headers.find((rule) => rule.source === "/(.*)").headers;

function previewSecurity() {
  return {
    name: "production-preview-security",
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        for (const { key, value } of securityHeaders) res.setHeader(key, value);
        next();
      });
    },
  };
}

// Run the same validated contact handler in development and on Vercel.
function contactApi() {
  return {
    name: "portfolio-contact-api",
    configureServer(server) {
      const env = loadEnv("development", process.cwd(), "");
      if (!process.env.RESEND_API_KEY && env.RESEND_API_KEY)
        process.env.RESEND_API_KEY = env.RESEND_API_KEY;
      server.middlewares.use("/api/send", async (req, res) => {
        const adapter = {
          setHeader: (name, value) => res.setHeader(name, value),
          status(code) {
            res.statusCode = code;
            return this;
          },
          json(value) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(value));
          },
        };
        if (req.method !== "POST") return contactHandler(req, adapter);
        const chunks = [];
        let bytes = 0;
        try {
          for await (const chunk of req) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            bytes += buffer.length;
            if (bytes > CONTACT_BODY_LIMIT)
              return adapter
                .status(413)
                .json({ error: "Message is too large." });
            chunks.push(buffer);
          }
          req.body = JSON.parse(
            Buffer.concat(chunks, bytes).toString("utf8") || "{}",
          );
        } catch {
          return adapter
            .status(400)
            .json({ error: "Please provide valid JSON." });
        }
        return contactHandler(req, adapter);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), contactApi(), previewSecurity()],
  build: {
    target: "es2020",
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replace(/\\/g, "/");
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path))
            return "react-vendor";
          if (path.includes("/node_modules/lucide-react/"))
            return "icons-vendor";
        },
      },
    },
    // Responsive variants must stay cacheable files, not eager data in JS.
    assetsInlineLimit: 0,
  },
});
