import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { resolveClientFromUser } from '@/lib/client/resolve-client'
import { ct, type ClientLang } from '@/lib/i18n/clientTranslations'
import { Utensils, Droplets, BookOpen, ChevronRight } from 'lucide-react'
import ClientTopBar from '@/components/client/ClientTopBar'
import Link from 'next/link'

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9
  if (total === 0) return null
  const pPct = Math.round((protein * 4 / total) * 100)
  const cPct = Math.round((carbs * 4 / total) * 100)
  const fPct = 100 - pPct - cPct

  return (
    <div className="space-y-1.5">
      <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
        <div className="bg-blue-500 rounded-full" style={{ width: `${pPct}%` }} />
        <div className="bg-amber-500 rounded-full" style={{ width: `${cPct}%` }} />
        <div className="bg-red-500 rounded-full" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex gap-4">
        <span className="flex items-center gap-1 text-[10px] text-white/45">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          P <span className="text-white/70 font-semibold">{protein}g</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-white/45">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          G <span className="text-white/70 font-semibold">{carbs}g</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-white/45">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          L <span className="text-white/70 font-semibold">{fat}g</span>
        </span>
      </div>
    </div>
  )
}

export default async function ClientNutritionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const client = await resolveClientFromUser(user!.id, user!.email, service, 'id, gender')

  const prefsRes = client
    ? await service.from('client_preferences').select('language').eq('client_id', client.id).maybeSingle()
    : { data: null }
  const rawLang = (prefsRes as any)?.data?.language
  const lang: ClientLang = ['fr', 'en', 'es'].includes(rawLang) ? rawLang as ClientLang : 'fr'

  const isFemale = (client as any)?.gender === 'female'

  const { data: protocolData } = client
    ? await service
        .from('nutrition_protocols')
        .select('id, name, notes, nutrition_protocol_days(*)')
        .eq('client_id', client.id)
        .eq('status', 'shared')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const protocol = protocolData as any
  const days: any[] = protocol
    ? [...(protocol.nutrition_protocol_days ?? [])].sort((a: any, b: any) => a.position - b.position)
    : []

  return (
    <div className="min-h-screen bg-[#121212]">
      <ClientTopBar section="Nutrition" title={protocol?.name ?? ct(lang, 'nutrition.section')} />

      <main className="max-w-lg mx-auto px-4 pt-[88px] pb-28 space-y-4">

        {/* Journal alimentaire — CTA toujours visible */}
        <Link
          href="/client/checkin/meals"
          className="flex items-center justify-between bg-[#1f8a65]/[0.08] border-[0.3px] border-[#1f8a65]/25 rounded-2xl px-4 py-3.5 hover:bg-[#1f8a65]/[0.12] transition-colors active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1f8a65]/20 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-[#1f8a65]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Journal alimentaire</p>
              <p className="text-[11px] text-white/40">Loguer mes repas du jour</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/30 shrink-0" />
        </Link>

        {/* Pas de protocole */}
        {!protocol && (
          <div className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-8 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Utensils size={20} className="text-white/20" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/40">{ct(lang, 'nutrition.noProtocol')}</p>
              <p className="text-[11px] text-white/25 mt-1">{ct(lang, 'nutrition.noProtocol.desc')}</p>
            </div>
          </div>
        )}

        {/* Protocole nutritionnel */}
        {protocol && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35 font-semibold px-1">
              Protocole coach
            </p>

            {protocol.notes && (
              <p className="text-[12px] text-white/40 px-1 leading-relaxed">{protocol.notes}</p>
            )}

            {days.map((day: any, i: number) => {
              const cal   = day.calories   ? Number(day.calories)   : null
              const prot  = day.protein_g  ? Number(day.protein_g)  : null
              const carbs = day.carbs_g    ? Number(day.carbs_g)    : null
              const fat   = day.fat_g      ? Number(day.fat_g)      : null
              const hydml = day.hydration_ml ? Number(day.hydration_ml) : null
              const hasMacros = prot !== null && carbs !== null && fat !== null

              return (
                <div key={day.id ?? i} className="bg-white/[0.02] border-[0.3px] border-white/[0.06] rounded-2xl p-4 space-y-3">
                  {/* Header jour */}
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{day.name}</p>
                    {day.carb_cycle_type && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-400/70 bg-amber-500/[0.08] border-[0.3px] border-amber-500/20 rounded-full px-2 py-0.5">
                        {day.carb_cycle_type}
                      </span>
                    )}
                  </div>

                  {/* Calories */}
                  {cal && (
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-[28px] font-black text-white leading-none">{cal}</p>
                      <p className="text-[11px] text-white/35 font-medium">{ct(lang, 'nutrition.kcal')}</p>
                    </div>
                  )}

                  {/* Macros bar */}
                  {hasMacros && <MacroBar protein={prot!} carbs={carbs!} fat={fat!} />}

                  {/* Hydratation */}
                  {hydml && (
                    <div className="flex items-center gap-2 pt-1 border-t-[0.3px] border-white/[0.04]">
                      <Droplets size={13} className="text-blue-400/60 shrink-0" />
                      <p className="text-[12px] text-white/45">
                        {ct(lang, 'nutrition.hydration')} :{' '}
                        <span className="text-white/70 font-semibold">{(hydml / 1000).toFixed(1)} L</span>
                      </p>
                    </div>
                  )}

                  {/* Cycle Sync (female only) */}
                  {isFemale && day.cycle_sync_phase && (
                    <div className="bg-[#8b5cf6]/[0.06] border-[0.3px] border-[#8b5cf6]/20 rounded-xl px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8b5cf6]/60 mb-0.5">
                        {ct(lang, 'nutrition.cycleSync')}
                      </p>
                      <p className="text-[12px] text-[#a78bfa]/80 font-medium capitalize">{day.cycle_sync_phase}</p>
                    </div>
                  )}

                  {/* Recommandations */}
                  {day.recommendations && (
                    <div className="border-t-[0.3px] border-white/[0.05] pt-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1.5">
                        {ct(lang, 'nutrition.recommendations')}
                      </p>
                      <p className="text-[12px] text-white/50 leading-[1.6] whitespace-pre-line">{day.recommendations}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
