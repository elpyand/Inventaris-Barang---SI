// supabase-edge/create_profile_webhook.ts
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const event = req.body; // sesuaikan payload webhook dari Supabase Auth
    const user = event?.user;
    if (!user?.id) return res.status(400).send('no user');

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      student_id: user.user_metadata?.student_id || null,
      role: 'student'
    };

    await client.from('profiles').upsert(payload);
    return res.status(200).send('profile created');
  } catch (err) {
    console.error(err);
    return res.status(500).send('error');
  }
}
