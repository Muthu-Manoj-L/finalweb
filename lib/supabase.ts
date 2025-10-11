import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// If environment variables are not set (e.g., on Netlify before configuration),
// export a safe shim that provides the minimal client interface used by the app.
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Using shimbed client.');

  const shim = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ data: null, error: null }),
    },
    from: (_: string) => {
      // return a chainable object with common query methods that resolve to null data
      const chain: any = {
        select: async () => ({ data: null, error: null }),
        eq: function () { return this; },
        maybeSingle: async () => ({ data: null, error: null }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        order: function () { return this; },
        limit: function () { return this; },
      };
      return chain;
    },
  } as any;

  supabase = shim as any;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };
