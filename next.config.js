/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure SSR is used instead of static export
  output: "standalone",

  experimental: {
    appDir: true, // Since you’re using the /app directory
  },

  // Optional: If you need to allow images from your API or CDN
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "https://crypto-royal-api.onrender.com", // your backend domain
      },
    ],
  },
};

module.exports = nextConfig;
