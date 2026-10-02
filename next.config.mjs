import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'phet.colorado.edu', pathname: '/sims/html/**' }
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
};

export default withNextIntl(nextConfig);
