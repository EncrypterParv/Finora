/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel's multi-service deployment does not reliably expose Next's image
  // optimizer route. Serve checked-in public images directly instead of
  // generating `/_next/image` URLs that can resolve to the service 404 page.
  images: {
    unoptimized: true,
  },
  experimental: {
    agentUpgrade: "security",
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
