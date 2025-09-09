/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚨 Force all pages to render dynamically at runtime
  experimental: {},
  output: "standalone",
};

module.exports = nextConfig;
