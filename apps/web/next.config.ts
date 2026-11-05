import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required for production builds. Set it to the deployed API origin.",
  );
}

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages direct-upload
  // (build with PAGES_EXPORT=1). No next/image or route handlers in use.
  ...(process.env.PAGES_EXPORT === "1" ? { output: "export" as const } : {}),
};

export default nextConfig;
