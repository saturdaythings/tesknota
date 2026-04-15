import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton browser client — stores auth session in cookies for SSR/middleware access
export const supabase = createBrowserClient(url, key);
