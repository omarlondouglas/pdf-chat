import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "@anthropic-ai/claude-agent-sdk",
  ],
};

export default nextConfig;
