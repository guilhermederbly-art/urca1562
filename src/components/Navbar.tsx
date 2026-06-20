'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Corridas' },
    { href: '/leaderboard', label: 'Ranking' },
    { href: '/participantes', label: 'Participantes' },
  ]

  return (
    <nav style={{ backgroundColor: '#0d0d14', borderBottom: '1px solid #2a2a3e' }}>
      {/* Top red stripe */}
      <div className="striped-accent-thick" />

      <div className="container mx-auto max-w-4xl flex items-center h-12 px-4 gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mr-4 flex-shrink-0">
          {/* F1 logo mark */}
          <div className="relative flex items-center">
            <div
              className="flex items-center justify-center h-7 px-2"
              style={{
                backgroundColor: 'var(--f1-red)',
                clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
              }}
            >
              <span className="font-black text-white text-sm tracking-wider" style={{ fontStyle: 'italic' }}>F1</span>
            </div>
          </div>
          <span
            className="font-black text-white tracking-wider hidden sm:block"
            style={{ fontSize: '1.1rem', fontStyle: 'italic', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Bolão
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          {links.map(l => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors relative"
                style={{
                  color: active ? 'white' : 'var(--f1-muted)',
                  letterSpacing: '0.1em',
                  borderBottom: active ? '2px solid var(--f1-red)' : '2px solid transparent',
                  paddingBottom: '0.35rem',
                }}
              >
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* User area */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-xs font-semibold uppercase tracking-widest hidden sm:block"
            style={{ color: 'var(--f1-muted)' }}
          >
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="btn-secondary text-xs"
            style={{ padding: '0.3rem 0.75rem', letterSpacing: '0.08em' }}
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
