import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

// Vite dev server middleware to handle /api/send locally using Resend
function resendLocalPlugin() {
  return {
    name: 'resend-local-api',
    configureServer(server) {
      server.middlewares.use('/api/send', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { Resend } = await import('resend');
            const env = loadEnv('development', process.cwd(), '');
            const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY || '';
            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'RESEND_API_KEY is not defined in environment variables' }));
              return;
            }
            const resend = new Resend(apiKey);
            const data = JSON.parse(body || '{}');

            if (!data.name || !data.reply_to || !data.message) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing required fields (name, email, message)' }));
              return;
            }

            const emailSubject = data.title ? `[Portfolio] ${data.title}` : `Portfolio Inquiry from ${data.name}`;

            const result = await resend.emails.send({
              from: 'Portfolio Inquiry <onboarding@resend.dev>',
              to: ['sakmmm07@gmail.com'],
              replyTo: data.reply_to,
              subject: emailSubject,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #09090b; color: #f4f4f5; border-radius: 12px; border: 1px solid #27272a;">
                  <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
                    <span style="font-size: 11px; font-family: monospace; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">New Portfolio Transmission</span>
                    <h2 style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">${emailSubject}</h2>
                  </div>
                  <div style="background-color: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ffffff;">Sender Name:</strong> ${data.name}</p>
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ffffff;">Sender Email:</strong> <a href="mailto:${data.reply_to}" style="color: #22d3ee; text-decoration: none;">${data.reply_to}</a></p>
                    <p style="margin: 0; font-size: 13px; color: #a1a1aa;"><strong style="color: #ffffff;">Subject / Opportunity:</strong> ${data.title || 'General Discussion'}</p>
                  </div>
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-family: monospace; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Message Body:</p>
                    <div style="background-color: #18181b; padding: 18px; border-radius: 8px; border: 1px solid #27272a; font-size: 14px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap;">${data.message}</div>
                  </div>
                  <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; font-family: monospace; color: #71717a; text-align: center;">
                    Dispatched securely via Resend API &bull; Saksham Agarwal Portfolio Gateway
                  </div>
                </div>
              `
            });

            if (result.error) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, id: result.data?.id }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/Components/**'],
    },
  },
  plugins: [
    react(),
    resendLocalPlugin(),
    // Pre-compress all assets with Brotli (best ratio) and Gzip (fallback)
    // Vercel serves pre-compressed files automatically when available
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br|gz)$/i, /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i],
      threshold: 1024,  // Only compress files > 1KB
    }),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br|gz)$/i, /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i],
      threshold: 1024,
    }),
  ],
  build: {
    target: 'es2020',
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],  // Strip console.log & debugger in production
      legalComments: 'none',          // Remove license comments
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-core': ['three'],
          'three-drei': ['@react-three/drei', '@react-three/fiber'],
          'framer-motion': ['framer-motion'],
          'icons-vendor': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1200,
    assetsInlineLimit: 4096,   // Inline tiny assets < 4KB as base64 (saves HTTP requests)
    reportCompressedSize: true, // Show gzip sizes in build output
  },
})
