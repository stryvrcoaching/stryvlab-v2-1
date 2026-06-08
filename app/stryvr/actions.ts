// app/stryvr/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendBetaWaitlistEmail } from '@/lib/email/mailer';

export type WaitlistResult =
  | { success: true; alreadyExists: false }
  | { success: true; alreadyExists: true }
  | { success: false; error: string };

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  try {
    const firstName = (formData.get('first_name') as string | null)?.trim() ?? '';
    const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? '';
    const role = (formData.get('role') as string | null) === 'coach' ? 'coach' : 'athlete';

    if (!firstName || firstName.length < 2) {
      return { success: false, error: 'Prénom requis (min. 2 caractères).' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Adresse email invalide.' };
    }

    // Env guards — fail explicit if missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error('[joinWaitlist] Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return { success: false, error: 'Configuration serveur manquante. Contacte-nous directement.' };
    }

    // Service role — bypass RLS, route publique sans session auth
    const supabase = createServiceClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase
      .from('beta_waitlist')
      .insert({ first_name: firstName, email, role, source: 'stryvr-landing' });

    if (insertError) {
      if (insertError.code === '23505') {
        return { success: true, alreadyExists: true };
      }
      console.error('[joinWaitlist] Supabase error:', insertError.code, insertError.message);
      return { success: false, error: 'Erreur lors de l\'inscription. Réessaie.' };
    }

    // Fire-and-forget — email non-bloquant, jamais throw vers le client
    try {
      await sendBetaWaitlistEmail({ to: email, firstName, role });
    } catch (emailErr) {
      console.error('[joinWaitlist] Email error (non-blocking):', emailErr);
    }

    // Refresh count on landing — non-bloquant
    try { revalidatePath('/stryvr'); } catch {}

    return { success: true, alreadyExists: false };
  } catch (err) {
    console.error('[joinWaitlist] Unexpected error:', err);
    return { success: false, error: 'Erreur inattendue. Réessaie dans un instant.' };
  }
}

export async function getBetaCount(): Promise<number> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return 0;

    const supabase = createServiceClient(supabaseUrl, serviceKey);
    const { count } = await supabase
      .from('beta_waitlist')
      .select('*', { count: 'exact', head: true });
    const raw = count ?? 0;
    return Math.floor(raw / 10) * 10;
  } catch (err) {
    console.error('[getBetaCount] Error:', err);
    return 0;
  }
}
