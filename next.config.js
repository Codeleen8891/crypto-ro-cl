// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // ✅ tells Vercel to build for server, not static export
};

module.exports = nextConfig;
