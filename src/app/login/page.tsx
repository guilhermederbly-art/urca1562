'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { F1_LOGO_SRC } from '@/lib/f1logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at top, #1e0a0a 0%, #15151e 50%, #0d0d14 100%)',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Diagonal lines bg */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(-60deg, #e8002d 0, #e8002d 1px, transparent 0, transparent 50%)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-5">
            <img src={F1_LOGO_SRC} alt="F1 Bolão" style={{ height: '40px', width: '40px', borderRadius: '8px' }} />
            <span className="f1-brand text-white text-2xl">
              Bolão
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--f1-muted)', letterSpacing: '0.05em' }}>
            Entre na pista. Prove que você sabe de F1.
          </p>
        </div>

        <div className="card" style={{ borderRadius: '2px' }}>
          <div className="striped-accent-thick" />
          <div className="p-7">
            <h1
              className="f1-heading text-xl mb-6"
              style={{ color: 'var(--f1-red)' }}
            >
              Login
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--f1-muted)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="piloto@email.com"
                />
              </div>

              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--f1-muted)' }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm font-semibold" style={{ color: 'var(--f1-red)' }}>{error}</p>
              )}

              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--f1-muted)' }}>
              Não tem conta?{' '}
              <Link href="/signup" className="font-bold text-white hover:underline" style={{ color: 'var(--f1-red)' }}>
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
