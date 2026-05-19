'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SetupForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    fetch(`/api/user-auth/setup?token=${token}`)
      .then(r => r.json())
      .then((d: { valid: boolean; name?: string }) => {
        if (d.valid) { setState('valid'); setName(d.name ?? '') }
        else setState('invalid')
      })
      .catch(() => setState('invalid'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    if (password.length < 8) { setError('Senha deve ter ao menos 8 caracteres'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/user-auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    if (res.ok) {
      router.push('/login')
    } else {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Erro ao salvar senha')
      setSaving(false)
    }
  }

  if (state === 'loading') return <p className="text-white/25 text-sm text-center">Verificando link…</p>

  if (state === 'invalid') return (
    <div className="text-center space-y-3">
      <p className="text-red-400/80 text-sm">Link inválido ou expirado.</p>
      <p className="text-white/20 text-xs">Solicite um novo convite ao administrador.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-white/40 text-sm text-center mb-6">
        Olá, <span className="text-white/70 font-medium">{name}</span>! Crie sua senha de acesso.
      </p>

      <div>
        <label className="text-[10px] text-white/35 uppercase tracking-wider block mb-2">Nova senha</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="text-[10px] text-white/35 uppercase tracking-wider block mb-2">Confirmar senha</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/15 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="Repita a senha"
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-xs text-red-400/80 text-center">{error}</p>}

      <button
        type="submit"
        disabled={saving || !password || !confirm}
        className="w-full mt-2 bg-violet-600/80 hover:bg-violet-600 rounded-xl py-3 text-sm text-white font-medium transition-all disabled:opacity-30"
      >
        {saving ? 'Salvando…' : 'Criar senha e acessar'}
      </button>
    </form>
  )
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/25">
            APEXGAP · Hub
          </span>
        </div>
        <Suspense fallback={<p className="text-white/25 text-sm text-center">Carregando…</p>}>
          <SetupForm />
        </Suspense>
      </div>
    </div>
  )
}
