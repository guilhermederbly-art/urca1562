'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { F1_LOGO_SRC } from '@/lib/f1logo'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (username.trim().length < 2) {
      setError('Nome de piloto deve ter ao menos 2 caracteres.')
      return
    }
    setLoading(true)
    const supabase = createClient()

    // Check if username is already taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    if (existing) {
      setError('Esse nome de piloto já está em uso. Escolha outro.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    })
    if (error) {
      if (error.message === 'User already registered') {
        setError('Email já cadastrado.')
      } else if (error.message.includes('already')) {
        setError('Nome de piloto já em uso. Escolha outro.')
      } else {
        setError(`Erro ao criar conta: ${error.message}`)
      }
      setLoading(false)
      return
    }

    // If session is null, email confirmation is required
    if (!data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'radial-gradient(ellipse at top, #1e0a0a 0%, #15151e 50%, #0d0d14 100%)' }}
      >
        <div className="w-full max-w-sm text-center">
          <div className="card" style={{ borderRadius: '2px' }}>
            <div className="striped-accent-thick" />
            <div className="p-8">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="f1-heading text-xl mb-3" style={{ color: 'var(--f1-red)' }}>
                Verifique seu email!
              </h2>
              <p className="text-sm mb-2" style={{ color: 'var(--f1-muted)' }}>
                Enviamos um link de confirmação para:
              </p>
              <p className="font-bold text-white mb-5">{email}</p>
              <p className="text-sm" style={{ color: 'var(--f1-muted)' }}>
                Clique no link do email para ativar sua conta e entrar no bolão.
              </p>
              <div className="mt-6">
                <Link href="/login" className="btn-primary w-full block text-center">
                  Ir para Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
            <img src={F1_LOGO_SRC} alt="F1 Bolão" style={{ height: '40px', width: '40px', borderRadius: '8px' }} />
            <span className="f1-brand text-white text-2xl">
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
                {loading ? 'Criando...' : 'Criar Conta'}
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
