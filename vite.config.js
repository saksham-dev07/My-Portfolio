import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import contactHandler from "./api/send.js";

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
        let body = "";
        try {
          for await (const chunk of req) {
            body += chunk;
            if (Buffer.byteLength(body, "utf8") > 16384)
              return adapter
                .status(413)
                .json({ error: "Message is too large." });
          }
          req.body = JSON.parse(body || "{}");
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
  plugins: [react(), contactApi()],
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
