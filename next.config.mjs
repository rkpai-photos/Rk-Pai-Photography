/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["scv4alvjgyc18iwi.public.blob.vercel-storage.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.edgestore.dev", // This will match any subdomain of edgestore.dev
      },
    ],
  },
};

export default nextConfig;
