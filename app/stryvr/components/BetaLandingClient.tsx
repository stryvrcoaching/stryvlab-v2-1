'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeroPhoneStack, AppMockup } from './AppMockup';
import { BetaForm } from './BetaForm';

/* ═══════════════════════════════════════════
   DS v3.0 STRYVR — tokens stricts
   Fond     #0a0a0a
   Surface  #161616  (cards, modals)
   Accent   #F5D800  CTA jaune uniquement
   Border   rgba(255,255,255,0.08)
   Radius   2xl=16px cards | xl=12px boutons/inputs | lg=8px badges | full=pills
   ═══════════════════════════════════════════ */
const BG   = '#0a0a0a';
const CARD = '#161616';
const BD   = 'rgba(255,255,255,0.08)';
const AC   = '#F5D800';

/* Radius tokens DS v3.0 */
const R = {
  card: 16,   // rounded-2xl — cards, modals, sheets
  btn:  12,   // rounded-xl  — boutons, inputs, items liste
  badge: 8,   // rounded-lg  — icônes, badges
  pill: 999,  // rounded-full — dots, pills
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── SECTION WRAPPER ─────────────────────── */
function Section({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ padding: '72px 0', borderTop: `1px solid ${BD}`, ...style }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        {children}
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: AC, marginBottom: 14 }}>
      {children}
    </p>
  );
}

function SectionH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="section-h2" style={{ fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#ffffff', marginBottom: 14 }}>
      {children}
    </h2>
  );
}

function OutlineBtn({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        height: 48, padding: '0 24px',
        border: `1px solid rgba(255,255,255,0.25)`,
        borderRadius: R.btn,
        color: '#ffffff',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        textDecoration: 'none',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      › {children}
    </a>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════ */
function Navbar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: 'rgba(10,10,10,0.94)',
      borderBottom: `1px solid ${BD}`,
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo/Logo STRYVR.svg" alt="STRYVR" width={26} height={26} style={{ display: 'block' }} />
          <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>STRYVR</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: AC, border: `1px solid rgba(245,216,0,0.3)`,
            padding: '3px 8px', borderRadius: R.badge,
          }}>
            BÊTA
          </span>
        </div>
        {/* CTA desktop */}
        <a
          href="#waitlist"
          className="navbar-cta"
          style={{
            height: 38, padding: '0 20px',
            backgroundColor: AC, color: '#0a0a0a',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
            textDecoration: 'none',
            alignItems: 'center', gap: 8,
            borderRadius: R.btn,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ffe040'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = AC; }}
        >
          › ACCÈS BÊTA
        </a>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════ */
function HeroSection({ betaCount }: { betaCount: number }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 20px 80px' }}>
      <div className="hero-grid" style={{ display: 'grid', gap: 56, alignItems: 'center' }}>
        {/* Left */}
        <div>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
              border: `1px solid rgba(245,216,0,0.2)`, padding: '6px 14px',
              borderRadius: R.pill, backgroundColor: 'rgba(245,216,0,0.05)',
            }}>
            <div style={{ width: 6, height: 6, backgroundColor: AC, borderRadius: R.pill }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: AC }}>
              BELGIQUE · FRANCE — PLACES LIMITÉES
            </span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="hero-h1"
            style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, color: '#ffffff', marginBottom: 22 }}
          >
            PAS UN<br />
            TRACKER.<br />
            <span style={{ color: AC }}>TON COACH</span><br />
            PHYSIOLOGIQUE.
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.7, color: 'rgba(255,255,255,0.5)', maxWidth: 420, marginBottom: 36 }}
          >
            STRYVR comprend ta physiologie, s'adapte à ton rythme, et prend des décisions coaching fondées sur la science. Pas un générateur de programmes — un moteur vivant.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} id="waitlist">
            <BetaForm />
          </motion.div>

          {betaCount > 0 && (
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={4}
              style={{ marginTop: 16, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
              <span style={{ color: '#ffffff' }}>{betaCount}+</span> PERSONNES SUR LA LISTE
            </motion.p>
          )}
        </div>

        {/* Right — phones */}
        <div className="hero-phones" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <HeroPhoneStack />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STATS BAR
   ═══════════════════════════════════════════ */
function StatsSection() {
  const stats = [
    { value: '95%', label: 'ABANDONNENT EN 12 SEMAINES', sub: 'Le statu quo actuel' },
    { value: '5 MIN', label: 'PAR JOUR', sub: 'Check-in + log complet' },
    { value: '8', label: 'FLUX PHYSIOLOGIQUES', sub: 'Du check-in au bilan mensuel' },
  ];

  return (
    <div style={{ borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}` }}>
      <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.value}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="stat-item"
            style={{ padding: '44px 28px' }}
          >
            <p style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#ffffff', marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>
              {s.value}
            </p>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: AC, marginBottom: 5 }}>{s.label}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   BÊTA TESTEUR SECTION
   ═══════════════════════════════════════════ */
function BetaTesterSection() {
  return (
    <Section>
      <div style={{ marginBottom: 44 }}>
        <Eyebrow>Programme bêta testeur</Eyebrow>
        <SectionH2>ON CONSTRUIT<br />ENSEMBLE.</SectionH2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 520, marginTop: 10, lineHeight: 1.7 }}>
          On cherche des coachs et des athlètes prêts à tester STRYVR avant tout le monde — en échange d'un accès gratuit complet et de ton retour structuré.
        </p>
      </div>

      <div className="beta-grid" style={{ display: 'grid', gap: 12 }}>
        {/* Ce qu'on offre */}
        <div style={{ backgroundColor: CARD, padding: '32px 28px', borderRadius: R.card, border: `1px solid ${BD}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: AC, marginBottom: 20 }}>CE QU'ON T'OFFRE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Accès gratuit complet — 0 €, zéro CB requise',
              'Coach : plateforme IA de génération de programmes',
              'Athlète : ton coach physiologique dans la poche',
              'Accès direct à l\'équipe — tu parles aux fondateurs',
              'Ton retour façonne la prochaine version du produit',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: R.badge, backgroundColor: 'rgba(245,216,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ color: AC, fontSize: 9, fontWeight: 800 }}>✦</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ce qu'on demande */}
        <div style={{ backgroundColor: CARD, padding: '32px 28px', borderRadius: R.card, border: `1px solid ${BD}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>CE QU'ON TE DEMANDE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Tester l\'app pendant 4 à 8 semaines',
              'Répondre à des questionnaires courts — 2 min / semaine',
              'Partager ton expérience honnêtement — le bon comme le moins bon',
              'Signaler les bugs et incohérences que tu repères',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: R.badge, backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>→</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, margin: 0 }}>
              Pas de contrat. Pas d'engagement. Tu peux arrêter quand tu veux.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES — 3 cartes
   ═══════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      num: '01',
      title: 'SMART AGENDA',
      desc: 'Ton agenda orchestré par ton moteur physiologique. Check-in, repas, séance, compléments — dans le bon ordre, au bon moment.',
    },
    {
      num: '02',
      title: 'NUTRITION COMPOSER',
      desc: '4 couches de saisie. Portions calibrées sur ta morphologie. Macros calculés en temps réel. Sans peser, sans compter.',
    },
    {
      num: '03',
      title: 'MOTEUR ADAPTATIF',
      desc: 'Cycle féminin, surmenage, rebond post-cut — le moteur détecte les phénomènes physiologiques et ajuste sans que tu aies à y penser.',
    },
  ];

  return (
    <Section>
      <div style={{ marginBottom: 48 }}>
        <Eyebrow>Ce qui change tout</Eyebrow>
        <SectionH2>CONÇU POUR TA BIOLOGIE.<br />PAS POUR LA MOYENNE.</SectionH2>
      </div>

      <div className="features-grid" style={{ display: 'grid', gap: 12 }}>
        {features.map((f, i) => (
          <motion.div
            key={f.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            style={{ backgroundColor: CARD, padding: '32px 28px', borderRadius: R.card, border: `1px solid ${BD}` }}
          >
            <div style={{ display: 'inline-flex', width: 32, height: 32, borderRadius: R.badge, backgroundColor: 'rgba(245,216,0,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: AC, margin: 0 }}>{f.num}</p>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff', marginBottom: 12, textTransform: 'uppercase' }}>{f.title}</p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   APP SECTION — mockup séance + texte
   ═══════════════════════════════════════════ */
function AppSection() {
  return (
    <Section>
      <div className="app-grid" style={{ display: 'grid', gap: 56, alignItems: 'center' }}>
        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <AppMockup screen="home" />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <Eyebrow>Smart Workout</Eyebrow>
          <SectionH2>LOG EN 30 SECONDES.<br />ANALYSE EN CONTINU.</SectionH2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
            Log ta séance pendant que tu t'entraînes. Le moteur analyse la progression, détecte le surmenage et planifie les semaines suivantes — tout en arrière-plan.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 32 }}>
            {[
              ['Charge de travail', 'Calculée depuis ton historique réel'],
              ['Détection surmenage', 'Bascule automatique en récupération'],
              ['Mésocycle', '4–6 semaines + déload planifié'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, backgroundColor: BD, borderRadius: R.btn, overflow: 'hidden' }}>
                <div style={{ backgroundColor: BG, padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{k}</p>
                </div>
                <div style={{ backgroundColor: CARD, padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', margin: 0 }}>{v}</p>
                </div>
              </div>
            ))}
          </div>

          <OutlineBtn href="#waitlist">ACCÈS BÊTA</OutlineBtn>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   NUTRITION SECTION
   ═══════════════════════════════════════════ */
function NutritionSection() {
  return (
    <Section>
      <div className="app-grid app-grid-reverse" style={{ display: 'grid', gap: 56, alignItems: 'center' }}>
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Eyebrow>Nutrition Composer</Eyebrow>
          <SectionH2>4 COUCHES.<br />ZÉRO BALANCE.</SectionH2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
            Estime tes portions avec ta main — calibrée sur ta morphologie. Le moteur calcule les macros selon ton objectif du jour, ton cycle et ton activité réelle.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { n: '1', label: 'CATÉGORIE', sub: 'Protéines · Glucides · Lipides · Légumes · Extras' },
              { n: '2', label: 'ALIMENT', sub: 'Recherche full-text + scan code-barres' },
              { n: '3', label: 'PORTION', sub: 'Paume · Poing · Pouce · Cuillère · Pincée' },
              { n: '4', label: 'CONFIRMATION', sub: 'Macros calculés en temps réel — 2 taps' },
            ].map(l => (
              <div key={l.n} style={{ display: 'flex', alignItems: 'center', gap: 0, backgroundColor: CARD, borderRadius: R.btn, overflow: 'hidden', border: `1px solid ${BD}` }}>
                <div style={{ width: 40, padding: '13px 0', backgroundColor: 'rgba(245,216,0,0.08)', textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: AC }}>{l.n}</span>
                </div>
                <div style={{ flex: 1, padding: '13px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 2 }}>{l.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{l.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <AppMockup screen="nutrition" />
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SAFETY SECTION
   ═══════════════════════════════════════════ */
function SafetySection() {
  const items = [
    { code: 'TCA', title: 'PROFILS SENSIBLES', desc: 'En mode TCA-safe, aucun chiffre de poids ni calorie affiché. Le moteur adapte son comportement sans jamais exposer l\'utilisateur à un risque.' },
    { code: 'GLP-1', title: 'CONDITIONS MÉDICALES', desc: 'GLP-1, post-bariatrique, grossesse — les planchers caloriques, les protocoles et les alertes s\'ajustent automatiquement selon le profil.' },
    { code: 'CYCLE', title: 'CYCLE FÉMININ', desc: 'Nutrition et training modulés par phase hormonale. Folliculaire, ovulatoire, lutéale, menstruelle — chaque phase a ses recommandations propres.' },
    { code: 'RED-S', title: 'SURMENAGE', desc: 'Le moteur détecte l\'overreaching et le RED-S. Bascule automatique en mode Recovery — sans validation manuelle requise.' },
  ];

  return (
    <Section>
      <div style={{ marginBottom: 44 }}>
        <Eyebrow>Safety Layer</Eyebrow>
        <SectionH2>CONÇU POUR<br />TOUS LES PROFILS.</SectionH2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 480, marginTop: 10, lineHeight: 1.7 }}>
          Le moteur tourne en continu. Il détecte les situations à risque et adapte le protocole en silence — sans t'alarmer, sans t'exposer.
        </p>
      </div>

      <div className="safety-grid" style={{ display: 'grid', gap: 12 }}>
        {items.map((it, i) => (
          <motion.div
            key={it.code}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            style={{ backgroundColor: CARD, padding: '28px 24px', borderRadius: R.card, border: `1px solid ${BD}` }}
          >
            <div style={{ display: 'inline-flex', padding: '4px 10px', backgroundColor: 'rgba(245,216,0,0.07)', border: `1px solid rgba(245,216,0,0.18)`, borderRadius: R.badge, marginBottom: 14 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: AC }}>{it.code}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 10 }}>{it.title}</p>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{it.desc}</p>
          </motion.div>
        ))}
      </div>

      <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
        STRYVR n'est pas un dispositif médical. Toujours consulter un professionnel de santé pour toute condition médicale sérieuse.
      </p>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   CTA FINAL
   ═══════════════════════════════════════════ */
function FinalCTA() {
  return (
    <div style={{ padding: '80px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ backgroundColor: AC, borderRadius: R.card, padding: '56px 48px' }} className="cta-inner">
          <div className="cta-grid" style={{ display: 'grid', gap: 48, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 14 }}>
                ACCÈS BÊTA
              </p>
              <h2 className="cta-h2" style={{ fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.0, color: '#0a0a0a', marginBottom: 16 }}>
                TU ES ENCORE LÀ ?<br />C'EST BON SIGNE.
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: 1.65, margin: 0 }}>
                Lancement Belgique & France. Places bêta limitées. Tu seras parmi les premiers à tester le moteur.
              </p>
            </div>
            <div style={{ backgroundColor: '#0a0a0a', padding: '32px 28px', borderRadius: R.card }}>
              <BetaForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
function Footer() {
  const cols = [
    { title: 'PRODUIT', links: ['Smart Agenda', 'Nutrition Composer', 'Training', 'Safety Layer', 'Insights'] },
    { title: 'SUPPORT', links: ['Contact', 'FAQ', 'Status'] },
    { title: 'LÉGAL', links: ['Mentions légales', 'Confidentialité', 'CGU'] },
  ];

  return (
    <footer style={{ backgroundColor: BG, borderTop: `1px solid ${BD}` }}>
      <div className="footer-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 20px 40px', display: 'grid', gap: 40 }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Image src="/logo/Logo STRYVR.svg" alt="STRYVR" width={22} height={22} />
            <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff', margin: 0 }}>STRYVR</p>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.35)', maxWidth: 260, marginBottom: 24 }}>
            Le coach physiologique intelligent dans ta poche. Pas un tracker. Un moteur fondé sur la science.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['INSTAGRAM', 'TIKTOK', 'LINKEDIN'].map(s => (
              <a key={s} href="#"
                style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)',
                  textDecoration: 'none', transition: 'color 0.15s',
                  padding: '5px 10px', borderRadius: R.pill,
                  border: `1px solid rgba(255,255,255,0.08)`,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Cols */}
        <div className="footer-cols">
          {cols.map(col => (
            <div key={col.title}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 16 }}>{col.title}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                    {l}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BD}`, maxWidth: 1200, margin: '0 auto', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>© 2026 STRYVR — by STRYVLAB</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: 0 }}>🇧🇪 BELGIQUE · 🇫🇷 FRANCE</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════ */
export function BetaLandingClient({ betaCount }: { betaCount: number }) {
  return (
    <div style={{ backgroundColor: BG, color: '#ffffff', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection betaCount={betaCount} />
      <StatsSection />
      <BetaTesterSection />
      <FeaturesSection />
      <AppSection />
      <NutritionSection />
      <SafetySection />
      <FinalCTA />
      <Footer />

      {/* ─── Responsive ────────────────────────── */}
      <style>{`
        .navbar-cta { display: none; }
        @media (min-width: 640px) { .navbar-cta { display: flex; } }

        .hero-h1 { font-size: clamp(42px, 9vw, 72px); }
        .hero-grid { grid-template-columns: 1fr; }
        .hero-phones { display: none !important; }
        @media (min-width: 900px) {
          .hero-grid { grid-template-columns: 1fr 1fr; }
          .hero-phones { display: flex !important; }
        }

        .section-h2 { font-size: clamp(28px, 5vw, 48px); }

        .stats-grid { display: grid; grid-template-columns: 1fr; }
        .stat-item { border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left !important; }
        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
          .stat-item { border-bottom: none; }
          .stat-item:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.06); }
        }

        .beta-grid { grid-template-columns: 1fr; }
        @media (min-width: 768px) { .beta-grid { grid-template-columns: 1fr 1fr; } }

        .features-grid { grid-template-columns: 1fr; }
        @media (min-width: 768px) { .features-grid { grid-template-columns: repeat(3, 1fr); } }

        .app-grid { grid-template-columns: 1fr; }
        @media (min-width: 900px) { .app-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 899px) {
          .app-grid-reverse > *:first-child { order: 1; }
          .app-grid-reverse > *:last-child { order: 2; }
        }

        .safety-grid { grid-template-columns: 1fr; }
        @media (min-width: 640px) { .safety-grid { grid-template-columns: 1fr 1fr; } }

        .cta-inner { padding: 40px 24px !important; }
        .cta-grid { grid-template-columns: 1fr; }
        .cta-h2 { font-size: clamp(28px, 5vw, 52px); }
        @media (min-width: 768px) {
          .cta-inner { padding: 56px 48px !important; }
          .cta-grid { grid-template-columns: 1fr 1fr; }
        }

        .footer-grid { grid-template-columns: 1fr; }
        .footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (min-width: 768px) { .footer-grid { grid-template-columns: 1.5fr 1fr; } }
        @media (max-width: 480px) { .footer-cols { grid-template-columns: 1fr 1fr; } }

        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        @media (max-width: 640px) { button, a { min-height: 44px; } }
      `}</style>
    </div>
  );
}
