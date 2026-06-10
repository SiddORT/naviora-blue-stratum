import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy all /api/v1 requests to the FastAPI backend
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
  },

  // Allow Replit's proxy domain in development
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN ?? "",
    ...(process.env.REPLIT_DOMAINS?.split(",") ?? []),
  ].filter(Boolean),
};

export default nextConfig;
