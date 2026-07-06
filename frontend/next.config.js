/** @type {import('next').NextConfig} */
const apiProxyTarget =
  process.env.API_INTERNAL_URL ||
  (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== "/api"
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:9001");

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${apiProxyTarget}/health`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
