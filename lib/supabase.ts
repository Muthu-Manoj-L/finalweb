<<<<<<< HEAD
=======
import { createClient } from '@supabase/supabase-js';
>>>>>>> origin/main
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

<<<<<<< HEAD
// Detect web at runtime. When running on web, avoid importing '@supabase/supabase-js'
// because it dynamically imports `@supabase/node-fetch` which is node-only and
// breaks the web bundler. On native or node environments, require the package.
const isWeb = typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.product === 'ReactNative' ? false : typeof window !== 'undefined';

=======
// If environment variables are not set (e.g., on Netlify before configuration),
// export a safe shim that provides the minimal client interface used by the app.
>>>>>>> origin/main
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
<<<<<<< HEAD
=======
      // return a chainable object with common query methods that resolve to null data
>>>>>>> origin/main
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
<<<<<<< HEAD
} else if (isWeb) {
  // For web builds, export a lightweight shim that exposes the methods the app expects.
  // This prevents the bundler from pulling in node-only dependencies.
  // eslint-disable-next-line no-console
  console.warn('[supabase] Running on web - exporting minimal supabase shim to avoid node-only imports.');

  const webShim = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase disabled on web (shim)') }),
      signUp: async () => ({ data: null, error: new Error('Supabase disabled on web (shim)') }),
      signOut: async () => ({ data: null, error: null }),
    },
    from: (_: string) => {
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

  supabase = webShim as any;
} else {
  // Native or Node environment: dynamically require the package so that web bundlers
  // won't try to resolve node-only imports at build time.
  // eslint-disable-next-line global-require
  const { createClient } = require('@supabase/supabase-js');

=======
} else {
>>>>>>> origin/main
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };
