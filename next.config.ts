import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Skip static pre-rendering for all pages - the app is fully dynamic
  // because it requires Supabase auth and user data.
  output: undefined,
  experimental: {
    // Allow build even when some env vars are missing
  },
};

export default nextConfig;
