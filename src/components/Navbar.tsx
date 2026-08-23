'use client'

import { useState } from 'react'
import { F1_LOGO_SRC } from '@/lib/f1logo'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

function initials(username: string): string {
  const words = username.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return username.trim().slice(0, 2).toUpperCase()
}

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
    { href: '/campeonato',   label: 'F1' },
    { href: '/regras',       label: 'Regras' },
    { href: '/perfil',       label: 'Perfil' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <div className="relative">
      <nav
        style={{
          backgroundColor: '#0d0d14',
          borderBottom: '1px solid #2a2a3e',
          // Instalado como PWA no iOS o conteudo comeca embaixo da barra de
          // status; sem isso a navbar fica parcialmente escondida no notch
          paddingTop: 'env(safe-area-inset-top)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div className="container mx-auto max-w-6xl flex items-center h-14 px-4 gap-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <img src={F1_LOGO_SRC} alt="F1 Bolão" style={{ height: '34px', width: '34px', borderRadius: '8px' }} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-2 flex-1 self-stretch">
            {links.map(l => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center px-3 text-xs font-black uppercase transition-colors self-stretch"
                  style={{
                    color: active ? 'white' : 'var(--f1-muted)',
                    letterSpacing: '0.14em',
                    borderBottom: active ? '3px solid var(--f1-red)' : '3px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop user area */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0 ml-auto">
            <Bell size={16} style={{ color: 'var(--f1-muted)' }} aria-hidden />
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-black flex-shrink-0"
              style={{ border: '1px solid var(--f1-border-light)', background: 'rgba(255,255,255,0.04)', color: 'white', letterSpacing: '0.05em' }}
              title={username}
            >
              {initials(username)}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-black uppercase px-4 py-2 rounded"
              style={{ border: '1px solid var(--f1-border-light)', color: 'white', letterSpacing: '0.12em', background: 'rgba(255,255,255,0.03)' }}
            >
              Sair
            </button>
          </div>

          {/* Mobile: avatar + hamburger */}
          <div className="flex sm:hidden items-center gap-3 ml-auto">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-black flex-shrink-0"
              style={{ border: '1px solid var(--f1-border-light)', background: 'rgba(255,255,255,0.04)', color: 'white' }}
              title={username}
            >
              {initials(username)}
            </span>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex flex-col justify-center items-center gap-1.5 w-11 h-11 -mr-2 flex-shrink-0"
              aria-label="Menu"
              aria-expanded={menuOpen}
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

      {/* Mobile dropdown menu — ancorado no rodape da navbar em vez de um
          offset fixo em px, que nao acompanhava a altura real da barra */}
      {menuOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0"
            style={{ zIndex: 1 }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="sm:hidden absolute left-0 right-0 flex flex-col border-b"
            style={{ top: '100%', backgroundColor: '#0d0d14', borderColor: '#2a2a3e', zIndex: 2 }}
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
        </>
      )}
    </div>
  )
}
