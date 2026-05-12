/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Convex File Storage — photos uploaded via /admin or the import script.
      { protocol: "https", hostname: "*.convex.cloud" },
      // Legacy hosts kept so any old image_url that still points here keeps working.
      {
        protocol: "https",
        hostname: "scv4alvjgyc18iwi.public.blob.vercel-storage.com",
      },
      { protocol: "https", hostname: "*.edgestore.dev" },
    ],
  },
};

export default nextConfig;
