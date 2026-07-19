// This file forces all routes under /dashboard to be dynamic (server-side rendered)
// preventing build-time errors when SUPABASE_URL is not available.
export const dynamic = 'force-dynamic';
