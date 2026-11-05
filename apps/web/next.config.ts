import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required for production builds. Set it to the deployed API origin.",
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
