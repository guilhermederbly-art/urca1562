'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) {
      setError(error.message === 'User already registered' ? 'Email já cadastrado.' : 'Erro ao criar conta.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at top, #1e0a0a 0%, #15151e 50%, #0d0d14 100%)',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(-60deg, #e8002d 0, #e8002d 1px, transparent 0, transparent 50%)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-5">
            <div
              className="flex items-center justify-center h-10 px-3"
              style={{
                backgroundColor: 'var(--f1-red)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
            >
              <span className="font-black text-white text-xl" style={{ fontStyle: 'italic' }}>F1</span>
            </div>
            <span
              className="font-black text-white text-2xl"
              style={{ fontStyle: 'italic', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              Bolão
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--f1-muted)', letterSpacing: '0.05em' }}>
            Crie sua conta e entre no grid de largada.
          </p>
        </div>

        <div className="card" style={{ borderRadius: '2px' }}>
          <div className="striped-accent-thick" />
          <div className="p-7">
            <h1 className="f1-heading text-xl mb-6" style={{ color: 'var(--f1-red)' }}>
              Criar Conta
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {[
                { label: 'Nome de piloto', type: 'text', value: username, onChange: setUsername, placeholder: 'ex: guilherme', min: 3, max: 20 },
                { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'piloto@email.com' },
                { label: 'Senha', type: 'password', value: password, onChange: setPassword, placeholder: 'Mínimo 6 caracteres' },
              ].map(({ label, type, value, onChange, placeholder, min, max }) => (
                <div key={label}>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--f1-muted)' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    className="input-field"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required
                    placeholder={placeholder}
                    minLength={min}
                    maxLength={max}
                  />
                </div>
              ))}

              {error && <p className="text-sm font-semibold" style={{ color: 'var(--f1-red)' }}>{error}</p>}

              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Criando...' : '▶ Criar Conta'}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: 'var(--f1-muted)' }}>
              Já tem conta?{' '}
              <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--f1-red)' }}>
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
