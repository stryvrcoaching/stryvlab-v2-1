'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState, useTransition } from 'react';
import { joinWaitlist, WaitlistResult } from '../actions';

type Role = 'coach' | 'athlete';

type FormState =
  | { type: 'idle' }
  | { type: 'success'; firstName: string; alreadyExists: boolean; role: Role }
  | { type: 'error'; message: string };

/* DS v3.0 radius */
const R = { card: 16, btn: 12, badge: 8, pill: 999 };

export function BetaForm() {
  const [state, setState] = useState<FormState>({ type: 'idle' });
  const [role, setRole] = useState<Role>('athlete');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('role', role);
    const firstName = (formData.get('first_name') as string)?.trim() ?? '';
    startTransition(async () => {
      const result: WaitlistResult = await joinWaitlist(formData);
      if (result.success) {
        setState({ type: 'success', firstName, alreadyExists: result.alreadyExists, role });
      } else {
        setState({ type: 'error', message: result.error });
      }
    });
  }

  if (state.type === 'success') {
    const roleLabel = state.role === 'coach' ? 'Coach' : 'Athlète';
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          border: '1px solid rgba(245,216,0,0.25)',
          backgroundColor: 'rgba(245,216,0,0.06)',
          borderRadius: R.card,
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: R.pill, backgroundColor: 'rgba(245,216,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <span style={{ fontSize: 16 }}>✓</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F5D800', marginBottom: 6 }}>
          {state.alreadyExists ? 'Déjà enregistré' : `Accès confirmé — ${roleLabel}`}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
          {state.alreadyExists
            ? 'Tu seras parmi les premiers contactés au lancement.'
            : `${state.firstName} — tu es sur la liste. On te contacte en premier.`}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Role toggle — DS v3.0 rounded-xl */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {(['coach', 'athlete'] as Role[]).map(r => {
          const active = role === r;
          const label = r === 'coach' ? 'JE SUIS COACH' : 'JE VEUX ÊTRE COACHÉ';
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                height: 44,
                backgroundColor: active ? '#F5D800' : '#161616',
                border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: R.btn,
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: active ? '#0a0a0a' : 'rgba(255,255,255,0.35)',
                transition: 'background-color 0.15s, color 0.15s',
                fontFamily: 'inherit',
                padding: '0 8px',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Inputs — DS v3.0 rounded-xl */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <input
          name="first_name"
          type="text"
          required
          minLength={2}
          placeholder="PRÉNOM"
          style={{
            height: 52,
            backgroundColor: '#161616',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: R.btn,
            outline: 'none',
            padding: '0 16px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#ffffff',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
        <input
          name="email"
          type="email"
          required
          placeholder="EMAIL"
          style={{
            height: 52,
            backgroundColor: '#161616',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: R.btn,
            outline: 'none',
            padding: '0 16px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#ffffff',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
      </div>

      <AnimatePresence>
        {state.type === 'error' && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, letterSpacing: '0.06em', margin: 0, paddingTop: 2 }}
          >
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA — DS v3.0 rounded-xl */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          height: 52,
          width: '100%',
          backgroundColor: isPending ? 'rgba(245,216,0,0.7)' : '#F5D800',
          border: 'none',
          borderRadius: R.btn,
          cursor: isPending ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px 0 22px',
          transition: 'background-color 0.15s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (!isPending) e.currentTarget.style.backgroundColor = '#ffe040'; }}
        onMouseLeave={e => { if (!isPending) e.currentTarget.style.backgroundColor = '#F5D800'; }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a' }}>
          {isPending ? 'Inscription...' : 'Rejoindre la liste bêta'}
        </span>
        <div style={{ width: 32, height: 32, borderRadius: R.badge, backgroundColor: 'rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16, color: '#0a0a0a', lineHeight: 1 }}>›</span>
        </div>
      </button>

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em', textAlign: 'center', margin: 0 }}>
        ZÉRO SPAM — DÉSABONNEMENT EN 1 CLIC
      </p>
    </form>
  );
}
