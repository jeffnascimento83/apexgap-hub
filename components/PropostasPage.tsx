'use client'

export default function PropostasPage() {
  return (
    <div className="w-[82%] mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Propostas</h2>
        <p className="text-white/20 text-xs mt-1">Sistema de propostas comerciais</p>
      </div>
      <div className="h-96 rounded-xl border border-white/[0.04] bg-white/[0.02] flex flex-col items-center justify-center gap-4">
        <span className="text-4xl">📄</span>
        <p className="text-white/50 text-sm">Sistema de Propostas</p>
        <p className="text-white/20 text-xs text-center max-w-xs">
          O sistema de propostas requer autenticação própria.<br />
          Clique abaixo para abrir em nova aba.
        </p>
        <a
          href="https://propostas.apexgap.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium tracking-wide transition-all"
        >
          Abrir Propostas →
        </a>
      </div>
    </div>
  )
}
