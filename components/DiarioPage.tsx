'use client'

export default function DiarioPage() {
  return (
    <div className="w-[82%] mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Diário de Campanhas</h2>
        <p className="text-white/20 text-xs mt-1">Daily Wise — em migração</p>
      </div>
      <iframe
        src="https://dailywise.apexgap.com.br"
        className="w-full rounded-xl border border-white/[0.06]"
        style={{ height: 'calc(100vh - 160px)' }}
      />
    </div>
  )
}
