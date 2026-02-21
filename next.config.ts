import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent mongoose, mongodb and related packages from being bundled
  // into the Edge Runtime. They run only in the Node.js server runtime.
  serverExternalPackages: ["mongoose", "mongodb", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
