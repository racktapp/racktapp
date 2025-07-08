
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'lh3.googleusercontent.com' as const,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'firebasestorage.googleapis.com' as const,
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
