'use client'

export default function DashboardPage() {
  return (
    <div className="w-[82%] mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Dashboard de Métricas</h2>
        <p className="text-white/20 text-xs mt-1">Meta Ads · Google Ads — em construção</p>
      </div>
      <div className="h-96 rounded-xl border border-white/[0.04] bg-white/[0.02] flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">📊</span>
        <p className="text-white/30 text-sm">Dashboard em construção</p>
        <p className="text-white/15 text-xs">Integração Meta Ads + Google Ads via API routes</p>
      </div>
    </div>
  )
}
