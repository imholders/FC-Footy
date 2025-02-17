/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallback for Node built-ins not available in the browser.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Alias the problematic module to our empty file.
      config.resolve.alias["@connectrpc/connect-node"] = require.resolve("./empty.js");
    }
    return config;
  },
};

module.exports = nextConfig;
