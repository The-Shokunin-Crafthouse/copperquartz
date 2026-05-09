import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* Decodes a Supabase JWT and asserts the `role` claim is `service_role`.
   Catches the common misconfiguration of pasting the anon key into the
   SUPABASE_SERVICE_ROLE_KEY env var — anon-keyed queries fail at the
   Postgres GRANT layer with a confusing "permission denied for table X",
   far from the env var that's actually wrong. */
function assertServiceRoleKey(key: string): void {
  const segments = key.split('.');
  if (segments.length !== 3) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not a JWT');
  }
  let payload: unknown;
  try {
    const b64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    payload = JSON.parse(atob(padded));
  } catch {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY payload is not decodable JSON');
  }
  const role =
    payload && typeof payload === 'object' && 'role' in payload
      ? (payload as { role: unknown }).role
      : undefined;
  if (role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY has role="${String(role)}" — expected "service_role". The anon key was likely pasted into this env var.`,
    );
  }
}

export function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  assertServiceRoleKey(serviceRoleKey);

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
