import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cPanel only serves files, so it needs the static export. Vercel sets VERCEL=1 and
  // runs a server, so projects created later render on first visit without a rebuild.
  output: process.env.VERCEL ? undefined : "export",
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
