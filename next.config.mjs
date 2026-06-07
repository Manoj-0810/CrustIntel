/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Clearbit logo images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
    ],
  },
};

export default nextConfig;
