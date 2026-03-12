import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.jsdelivr.net storage.googleapis.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "media-src 'self' blob:",
              "connect-src 'self' https://*.supabase.co cdn.jsdelivr.net storage.googleapis.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
