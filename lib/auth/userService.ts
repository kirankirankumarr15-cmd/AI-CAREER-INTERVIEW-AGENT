import { Client } from 'pg';

export function getDbClient() {
  const host = process.env.SUPABASE_POOLER_HOST || 'aws-0-ap-south-1.pooler.supabase.com';
  const port = process.env.SUPABASE_POOLER_PORT ? parseInt(process.env.SUPABASE_POOLER_PORT, 10) : 6543;
  const user = process.env.SUPABASE_DB_USER || 'postgres.uyyplblmarpifqrftuiq';
  const password = process.env.SUPABASE_DB_PASSWORD || 'Kirankumar@14';
  const database = 'postgres';

  const connectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
}

export async function syncUserCredentials({
  email,
  password,
  fullName,
}: {
  email: string;
  password?: string;
  fullName?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const client = getDbClient();
  const normalizedEmail = email.trim().toLowerCase();
  const name = (fullName || normalizedEmail.split('@')[0] || 'Student').trim();

  try {
    await client.connect();

    // 1. Check if user already exists in auth.users
    const userCheck = await client.query(
      'SELECT id FROM auth.users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    let userId: string;

    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;

      if (password) {
        await client.query(
          `
          UPDATE auth.users
          SET encrypted_password = crypt($2::text, gen_salt('bf')),
              email_confirmed_at = COALESCE(email_confirmed_at, now()),
              raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', $3::text, 'email_verified', true),
              updated_at = now()
          WHERE id = $1::uuid
          `,
          [userId, password, name]
        );
      } else {
        await client.query(
          `
          UPDATE auth.users
          SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
              updated_at = now()
          WHERE id = $1::uuid
          `,
          [userId]
        );
      }
    } else {
      // 2. Create brand-new confirmed user
      const uuidRes = await client.query('SELECT gen_random_uuid() as id');
      userId = uuidRes.rows[0].id;

      const pwd = password || 'password123';

      await client.query(
        `
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          invited_at,
          confirmation_token,
          confirmation_sent_at,
          recovery_token,
          recovery_sent_at,
          email_change_token_new,
          email_change,
          email_change_sent_at,
          last_sign_in_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          created_at,
          updated_at,
          phone,
          phone_confirmed_at,
          phone_change,
          phone_change_token,
          phone_change_sent_at,
          email_change_token_current,
          email_change_confirm_status,
          banned_until,
          reauthentication_token,
          reauthentication_sent_at,
          is_sso_user,
          deleted_at,
          is_anonymous
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1::uuid,
          'authenticated',
          'authenticated',
          $2::varchar,
          crypt($3::text, gen_salt('bf')),
          now(),
          null,
          '',
          null,
          '',
          null,
          '',
          '',
          null,
          null,
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('sub', $1::text, 'email', $2::text, 'full_name', $4::text, 'email_verified', true, 'phone_verified', false),
          null,
          now(),
          now(),
          null,
          null,
          '',
          '',
          null,
          '',
          0,
          null,
          '',
          null,
          false,
          null,
          false
        )
        `,
        [userId, normalizedEmail, pwd, name]
      );

      // Insert identity
      await client.query(
        `
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          jsonb_build_object('sub', $1::text, 'email', $2::text, 'full_name', $3::text, 'email_verified', true, 'phone_verified', false),
          'email',
          $1::text,
          now(),
          now(),
          now()
        )
        `,
        [userId, normalizedEmail, name]
      );
    }

    // 3. Upsert profiles table
    try {
      await client.query(
        `
        INSERT INTO public.profiles (id, email, full_name, updated_at)
        VALUES ($1::uuid, $2, $3, now())
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            updated_at = now()
        `,
        [userId, normalizedEmail, name]
      );
    } catch (profErr) {
      console.warn('Profile upsert warning:', profErr);
    }

    // 4. Upsert user_progress table
    try {
      await client.query(
        `
        INSERT INTO public.user_progress (user_id, updated_at)
        VALUES ($1::uuid, now())
        ON CONFLICT (user_id) DO NOTHING
        `,
        [userId]
      );
    } catch (progErr) {
      console.warn('Progress upsert warning:', progErr);
    }

    await client.end();
    return { success: true, userId };
  } catch (err: unknown) {
    console.error('Error in syncUserCredentials:', err);
    try {
      await client.end();
    } catch {}
    const errMsg = err instanceof Error ? err.message : 'Database synchronization failed.';
    return { success: false, error: errMsg };
  }
}
