import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/.prisma/client/**"],
  },
};

// Only run in development
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform().catch(() => {});
}

export default nextConfig;
