'use client';

import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   Mockups fidèles à la vraie app STRYVR (DS v3.0)
   Fond     #0d0d0d  — exact même token que l'app
   Surface  #161616
   Accent   #ffe01e  — jaune STRYVR
   Texte    Barlow Condensed uppercase pour labels
   ═══════════════════════════════════════════════════════ */

const APP_BG    = '#0d0d0d';
const SURFACE   = '#161616';
const SURFACE2  = '#1a1a1a';
const AC        = '#ffe01e';
const BD        = 'rgba(255,255,255,0.06)';

/* ─── Shared atoms ─────────────────────────────────────── */

function TopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', borderBottom: `1px solid ${BD}`, flexShrink: 0,
      backgroundColor: APP_BG,
    }}>
      {/* Logo + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 1080 1080" fill="none">
          <path fillRule="evenodd" fill={AC} d="m952 29c0 0-316 0-323 0-8 0-13 1-22 13-9 11-202 267-202 267l548-0.4"/>
          <path fillRule="evenodd" fill={AC} d="m127 587c0 0 0-233 0-249 0-16 18-30 31-30 13 0 247 0 247 0 0 0 0 217 0 239 0 16-9 40-34 40"/>
          <path fillRule="evenodd" fill={AC} d="m127 1051c0 0 316 0 324 0 7 0 13-1 22-13 9-11 204-266 204-266l-549-0.5"/>
          <path fillRule="evenodd" fill={AC} d="m674 773c0 0 0-233 0-249 0-16 18-30 31-30 13 0 247 0 247 0 0 0 0 217 0 239 0 16-9 40-34 40"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '-0.01em', color: '#fff' }}>STRYVR</span>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

function BottomNav({ active }: { active: 'home' | 'programme' | 'nutrition' | 'progress' }) {
  const items = [
    { id: 'home', label: 'Accueil', icon: HomeIcon },
    { id: 'programme', label: 'Séances', icon: DumbellIcon },
    { id: 'nutrition', label: 'Nutrition', icon: NutritionIcon },
    { id: 'progress', label: 'Progrès', icon: TrendIcon },
  ];
  return (
    <div style={{
      height: 52, display: 'flex', borderTop: `1px solid ${BD}`,
      backgroundColor: APP_BG, flexShrink: 0,
    }}>
      {items.map(it => {
        const isActive = it.id === active;
        return (
          <div key={it.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            <it.icon color={isActive ? AC : 'rgba(255,255,255,0.25)'} />
            <span style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isActive ? AC : 'rgba(255,255,255,0.25)' }}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── SVG icons ────────────────────────────────────────── */
function HomeIcon({ color }: { color: string }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>;
}
function DumbellIcon({ color }: { color: string }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>;
}
function NutritionIcon({ color }: { color: string }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
}
function TrendIcon({ color }: { color: string }) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}

/* ═══════════════════════════════════════════
   SCREEN 1 — HOME (Dashboard séance du jour)
   ═══════════════════════════════════════════ */
function HomeScreen() {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: APP_BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Aujourd'hui" right={
        <div style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>KM</span>
        </div>
      } />

      <div style={{ flex: 1, overflowY: 'hidden', padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Greeting */}
        <div style={{ paddingLeft: 2 }}>
          <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>TABLEAU DE BORD</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Prêt pour<br/>aujourd'hui ?</p>
        </div>

        {/* Progression gamification */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 10, padding: '8px 10px', border: `0.5px solid ${BD}` }}>
          <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>MES PROGRÈS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
            {[{ label: 'POINTS', val: '1 240' }, { label: 'SÉRIE', val: '7j' }, { label: 'RECORD', val: '14j' }].map(s => (
              <div key={s.label} style={{ backgroundColor: SURFACE2, borderRadius: 6, padding: '5px 4px', textAlign: 'center' }}>
                <p style={{ fontSize: 5.5, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#fff', margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: SURFACE2, borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>NIVEAU</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: AC }}>🥇 Gold</span>
          </div>
        </div>

        {/* Séance du jour — hero card */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 10, border: `0.5px solid rgba(255,224,30,0.2)`, overflow: 'hidden', flexShrink: 0 }}>
          {/* Header */}
          <div style={{ padding: '8px 10px 6px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: AC, marginBottom: 2 }}>SÉANCE DU JOUR</p>
              <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>Push — Pectoraux</p>
            </div>
            <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(255,224,30,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DumbellIcon color={AC} />
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${BD}` }}>
            {[{ label: 'DURÉE', val: '52 min' }, { label: 'SETS', val: '24' }, { label: 'EXERCICES', val: '6' }].map((s, i) => (
              <div key={s.label} style={{ padding: '7px 4px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${BD}` : 'none' }}>
                <p style={{ fontSize: 5.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{s.label}</p>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#fff', margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>
          {/* CTA */}
          <div style={{ padding: '7px 10px' }}>
            <div style={{ height: 28, backgroundColor: AC, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 12px' }}>
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0d0d0d' }}>COMMENCER LA SÉANCE</span>
              <span style={{ fontSize: 12, color: '#0d0d0d', lineHeight: 1 }}>›</span>
            </div>
          </div>
        </div>

        {/* Semaine progress */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 10, padding: '7px 10px', border: `0.5px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>SÉANCES CETTE SEMAINE</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[true, true, false, false].map((done, i) => (
              <div key={i} style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: done ? AC : 'rgba(255,255,255,0.1)' }} />
            ))}
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginLeft: 3 }}>2<span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>/4</span></span>
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCREEN 2 — SESSION LOGGER (vue exercice)
   ═══════════════════════════════════════════ */
function SessionScreen() {
  const sets = [
    { n: 1, reps: '10', kg: '80', rir: '3', done: true },
    { n: 2, reps: '10', kg: '80', rir: '2', done: true },
    { n: 3, reps: '—', kg: '80', rir: '—', done: false },
    { n: 4, reps: '—', kg: '80', rir: '—', done: false },
  ];

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: APP_BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Session header */}
      <div style={{ backgroundColor: APP_BG, borderBottom: `1px solid ${BD}`, padding: '10px 10px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: AC }}>SESSION EN COURS — 00:24</p>
          <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>Push — Pectoraux</div>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[true, true, false, false, false, false].map((done, i) => (
            <div key={i} style={{
              width: i === 2 ? 16 : 8, height: 4, borderRadius: 2,
              backgroundColor: done ? AC : i === 2 ? 'rgba(255,224,30,0.3)' : 'rgba(255,255,255,0.1)',
            }} />
          ))}
          <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', marginLeft: 3 }}>3/6</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Exercise name + badge tempo */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>Développé Couché</p>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Pectoraux · Triceps · Deltoïdes ant.</p>
          </div>
          <div style={{ backgroundColor: 'rgba(255,224,30,0.12)', padding: '3px 7px', borderRadius: 5, border: `0.5px solid rgba(255,224,30,0.3)` }}>
            <span style={{ fontSize: 7, fontWeight: 700, color: AC, letterSpacing: '0.06em' }}>3-1-2-0</span>
          </div>
        </div>

        {/* Recommendation banner */}
        <div style={{ backgroundColor: 'rgba(255,224,30,0.07)', border: `0.5px solid rgba(255,224,30,0.2)`, borderRadius: 7, padding: '6px 8px' }}>
          <p style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: AC, marginBottom: 2 }}>RECOMMANDATION IA</p>
          <p style={{ fontSize: 8.5, fontWeight: 600, color: '#fff', margin: 0 }}>↑ 82.5 kg × 10 reps — progression +2.5 kg</p>
        </div>

        {/* Sets table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 1fr 1fr 20px', gap: 4, padding: '0 4px', marginBottom: 2 }}>
            {['SET', 'PRÉVU', 'REPS', 'KG', ''].map(h => (
              <span key={h} style={{ fontSize: 5.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>{h}</span>
            ))}
          </div>
          {sets.map(s => (
            <div key={s.n} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr 1fr 1fr 20px', gap: 4,
              backgroundColor: s.done ? 'rgba(255,224,30,0.05)' : SURFACE,
              borderRadius: 7, padding: '7px 6px',
              border: s.done ? `0.5px solid rgba(255,224,30,0.15)` : `0.5px solid ${BD}`,
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: s.done ? AC : 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{s.n}</span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>10×80</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.done ? '#fff' : 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{s.reps}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.done ? '#fff' : 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{s.kg}</span>
              <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: s.done ? AC : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.done && <span style={{ fontSize: 7, color: '#0d0d0d', fontWeight: 800 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Tempo CTA */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 7, padding: '7px 10px', border: `0.5px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 1 }}>GUIDE TEMPO</p>
            <p style={{ fontSize: 8, fontWeight: 600, color: '#fff', margin: 0 }}>CONTRACTER · FREINER · TENIR</p>
          </div>
          <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: AC, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#0d0d0d', fontWeight: 800 }}>▶</span>
          </div>
        </div>

        {/* Rest timer hint */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 7, padding: '5px 8px', border: `0.5px solid ${BD}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10 }}>⏱</span>
          <p style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Repos : 90s automatique après validation</p>
        </div>
      </div>

      {/* Finish CTA */}
      <div style={{ padding: '0 10px 8px', flexShrink: 0 }}>
        <div style={{ height: 30, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `0.5px solid ${BD}` }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>TERMINER LA SÉANCE</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCREEN 3 — NUTRITION (macros + journal)
   ═══════════════════════════════════════════ */
function NutritionScreen() {
  const macros = [
    { label: 'KCAL', val: '1 840', target: '2 200', pct: 0.84, color: AC },
    { label: 'PROT', val: '142g', target: '180g', pct: 0.79, color: '#60a5fa' },
    { label: 'GLUC', val: '195g', target: '240g', pct: 0.81, color: '#fb923c' },
    { label: 'LIP', val: '52g', target: '65g', pct: 0.80, color: '#a78bfa' },
  ];
  const meals = [
    { name: 'Petit-déjeuner', kcal: 480, items: 'Flocons · Œufs · Whey', done: true },
    { name: 'Déjeuner', kcal: 720, items: 'Riz · Poulet · Légumes', done: true },
    { name: 'Collation', kcal: 220, items: 'Banane · Beurre de cacahuète', done: false },
    { name: 'Dîner', kcal: 420, items: 'Saumon · Patate douce', done: false },
  ];

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: APP_BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Nutrition" />

      <div style={{ flex: 1, overflowY: 'hidden', padding: '8px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Macro summary card */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 10, padding: '8px 10px', border: `0.5px solid ${BD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>BILAN DU JOUR</p>
            <p style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)' }}>Lundi 17 mai</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {macros.map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 5.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{m.label}</span>
                  <span style={{ fontSize: 5.5, fontWeight: 700, color: m.color }}>{m.val}</span>
                </div>
                <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${m.pct * 100}%`, backgroundColor: m.color, borderRadius: 2 }} />
                </div>
                <p style={{ fontSize: 5, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>/ {m.target}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hydration */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 10, padding: '7px 10px', border: `0.5px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>💧</span>
            <div>
              <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>HYDRATATION</p>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#fff', margin: 0 }}>1.4 L <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/ 2.5 L recommandé</span></p>
            </div>
          </div>
          <div style={{ height: 3, width: 60, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: '56%', backgroundColor: '#60a5fa', borderRadius: 2 }} />
          </div>
        </div>

        {/* Repas journal */}
        <p style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>JOURNAL ALIMENTAIRE</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
          {meals.map(m => (
            <div key={m.name} style={{
              backgroundColor: SURFACE, borderRadius: 8, padding: '6px 8px',
              border: `0.5px solid ${m.done ? 'rgba(255,224,30,0.15)' : BD}`,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                backgroundColor: m.done ? 'rgba(255,224,30,0.12)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 9 }}>{m.done ? '✓' : '+'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 8.5, fontWeight: 700, color: m.done ? '#fff' : 'rgba(255,255,255,0.55)', margin: 0 }}>{m.name}</p>
                <p style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.3)', margin: 0, marginTop: 1 }}>{m.items}</p>
              </div>
              <span style={{ fontSize: 8, fontWeight: 700, color: m.done ? AC : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{m.kcal} kcal</span>
            </div>
          ))}
        </div>

        {/* Add meal CTA */}
        <div style={{ height: 26, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 7, border: `0.5px dashed rgba(255,255,255,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>+</span>
          <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Ajouter un repas</span>
        </div>
      </div>

      <BottomNav active="nutrition" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCREEN 4 — AGENDA (vue jour complète)
   ═══════════════════════════════════════════ */
function AgendaScreen() {
  const events = [
    { time: '07:30', label: 'Check-in matinal', meta: 'Énergie · Sommeil · Humeur', status: 'done', icon: '☀' },
    { time: '12:15', label: 'Déjeuner', meta: '720 kcal · 58g protéines', status: 'done', icon: '🍽' },
    { time: '17:30', label: 'Séance Push', meta: '6 exercices · ~52 min', status: 'active', icon: '⚡' },
    { time: '20:00', label: 'Compléments soir', meta: 'Magnésium · Oméga-3 · Vitamine D', status: 'pending', icon: '💊' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: APP_BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Smart Agenda" right={
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{ height: 18, padding: '0 7px', backgroundColor: AC, borderRadius: 5, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 6.5, fontWeight: 800, color: '#0d0d0d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Jour</span>
          </div>
          <div style={{ height: 18, padding: '0 7px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sem</span>
          </div>
        </div>
      } />

      <div style={{ flex: 1, overflow: 'hidden', padding: '8px 10px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>

        {/* Date + score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>LUNDI 17 MAI</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Aujourd'hui</p>
          </div>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="18" cy="18" r="14" fill="none" stroke={AC} strokeWidth="3"
              strokeDasharray="62" strokeDashoffset="15" strokeLinecap="square"
              transform="rotate(-90 18 18)" />
            <text x="18" y="22" textAnchor="middle" style={{ fontSize: 9, fontWeight: 800, fill: '#fff' }}>76</text>
          </svg>
        </div>

        {/* Macro strip */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 8, padding: '6px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, flexShrink: 0 }}>
          {[
            { label: 'KCAL', val: '1 840', pct: 0.84 },
            { label: 'PROT', val: '142g', pct: 0.79 },
            { label: 'EAU', val: '1.4 L', pct: 0.56 },
          ].map(item => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 5.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{item.label}</span>
                <span style={{ fontSize: 5.5, fontWeight: 700, color: AC }}>{item.val}</span>
              </div>
              <div style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1 }}>
                <div style={{ height: '100%', width: `${item.pct * 100}%`, backgroundColor: AC, borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Timeline events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
          {events.map(ev => (
            <div key={ev.label} style={{
              backgroundColor: ev.status === 'active' ? SURFACE : 'rgba(255,255,255,0.02)',
              borderLeft: `2px solid ${ev.status === 'done' ? AC : ev.status === 'active' ? AC : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '0 7px 7px 0',
              padding: '7px 8px',
              display: 'flex', alignItems: 'center', gap: 7,
              opacity: ev.status === 'pending' ? 0.55 : 1,
            }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>{ev.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 8.5, fontWeight: ev.status === 'active' ? 700 : 600, color: ev.status === 'pending' ? 'rgba(255,255,255,0.45)' : '#fff', margin: 0 }}>{ev.label}</p>
                <p style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{ev.meta}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 6, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{ev.time}</p>
                {ev.status === 'done' && <div style={{ width: 6, height: 6, backgroundColor: AC, marginLeft: 'auto', marginTop: 2 }} />}
                {ev.status === 'active' && <div style={{ width: 6, height: 6, backgroundColor: AC, marginLeft: 'auto', marginTop: 2, borderRadius: 3 }} />}
              </div>
            </div>
          ))}
        </div>

        {/* Phase strip */}
        <div style={{ backgroundColor: SURFACE, borderRadius: 7, padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, backgroundColor: AC }} />
            <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', margin: 0 }}>FAT LOSS · SEM. 3/8</p>
          </div>
          <p style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Déload dans 5 sem.</p>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}

/* ═══════════════════════════════════════════
   PHONE SHELL
   ═══════════════════════════════════════════ */
export function AppMockup({ screen = 'agenda' }: { screen?: 'agenda' | 'training' | 'home' | 'nutrition' }) {
  return (
    <div
      className="relative select-none"
      style={{
        width: 260,
        height: 520,
        borderRadius: 34,
        backgroundColor: '#111',
        padding: 8,
        transform: 'perspective(1200px) rotateY(-4deg) rotateX(2deg)',
        boxShadow: '0 48px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Dynamic island */}
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 54, height: 14, backgroundColor: '#111', borderRadius: 8, zIndex: 10 }} />
      {/* Screen */}
      <div style={{ width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden' }}>
        {screen === 'training' && <SessionScreen />}
        {screen === 'agenda' && <AgendaScreen />}
        {screen === 'home' && <HomeScreen />}
        {screen === 'nutrition' && <NutritionScreen />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO PHONE STACK — 3 phones en perspective
   ═══════════════════════════════════════════ */
export function HeroPhoneStack() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 580, width: 380 }}>
      {/* Glow */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 65%, rgba(255,224,30,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Back — Agenda */}
      <motion.div
        initial={{ opacity: 0, x: 80, y: 30 }}
        animate={{ opacity: 0.65, x: 0, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', right: -10, top: 60, zIndex: 1, transform: 'perspective(1200px) rotateY(-10deg) rotateX(3deg) scale(0.82)' }}
      >
        <AppMockup screen="agenda" />
      </motion.div>

      {/* Mid — Nutrition */}
      <motion.div
        initial={{ opacity: 0, x: -60, y: 20 }}
        animate={{ opacity: 0.75, x: 0, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'absolute', left: -10, top: 80, zIndex: 1, transform: 'perspective(1200px) rotateY(6deg) rotateX(2deg) scale(0.84)' }}
      >
        <AppMockup screen="nutrition" />
      </motion.div>

      {/* Front — Home (séance du jour) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <AppMockup screen="training" />
      </motion.div>
    </div>
  );
}
