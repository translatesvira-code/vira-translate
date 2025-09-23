import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/mamzi/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
