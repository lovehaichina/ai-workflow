import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['vm2', 'degenerator', 'pac-resolver', 'pac-proxy-agent', 'proxy-agent'],
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: '/history',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
