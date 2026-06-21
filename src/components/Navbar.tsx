'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({ username, isAdmin }: { username: string; isAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard',    label: 'Corridas' },
    { href: '/leaderboard',  label: 'Ranking' },
    { href: '/regras',       label: 'Regras' },
    { href: '/perfil',       label: 'Perfil' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <>
      <nav style={{ backgroundColor: '#0d0d14', borderBottom: '1px solid #2a2a3e' }}>
        <div className="striped-accent-thick" />

        <div className="container mx-auto max-w-4xl flex items-center h-12 px-4 gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <div
              className="flex items-center justify-center h-7 px-2"
              style={{
                backgroundColor: 'var(--f1-red)',
                clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
              }}
            >
              <span className="font-black text-white text-sm tracking-wider" style={{ fontStyle: 'italic' }}>F1</span>
            </div>
            <span
              className="font-black text-white tracking-wider hidden sm:block"
              style={{ fontSize: '1.1rem', fontStyle: 'italic', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              Bolão
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1 flex-1">
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

          {/* Desktop user area */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0 ml-auto">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
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

          {/* Mobile: username + hamburger */}
          <div className="flex sm:hidden items-center gap-3 ml-auto">
            <span className="text-xs font-semibold uppercase tracking-widest truncate max-w-24" style={{ color: 'var(--f1-muted)' }}>
              {username}
            </span>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex flex-col justify-center items-center gap-1.5 w-8 h-8 flex-shrink-0"
              aria-label="Menu"
            >
              <span
                className="block w-5 h-0.5 transition-all duration-200"
                style={{
                  background: 'white',
                  transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none',
                }}
              />
              <span
                className="block w-5 h-0.5 transition-all duration-200"
                style={{
                  background: 'white',
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-5 h-0.5 transition-all duration-200"
                style={{
                  background: 'white',
                  transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none',
                }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40"
          style={{ top: '49px' }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="flex flex-col border-b"
            style={{ backgroundColor: '#0d0d14', borderColor: '#2a2a3e' }}
            onClick={e => e.stopPropagation()}
          >
            {links.map(l => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-5 py-4 text-sm font-bold uppercase tracking-widest border-b"
                  style={{
                    color: active ? 'white' : 'var(--f1-muted)',
                    borderColor: '#2a2a3e',
                    borderLeft: active ? '3px solid var(--f1-red)' : '3px solid transparent',
                    backgroundColor: active ? 'rgba(232,0,45,0.06)' : 'transparent',
                  }}
                >
                  {l.label}
                </Link>
              )
            })}
            <button
              onClick={() => { setMenuOpen(false); handleLogout() }}
              className="flex items-center px-5 py-4 text-sm font-bold uppercase tracking-widest text-left"
              style={{ color: 'var(--f1-red)' }}
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  )
}
