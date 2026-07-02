import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Pinger from '@/components/Pinger'
import { ADMIN_EMAIL } from '@/lib/config'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const isAdmin = user.email === ADMIN_EMAIL

  return (
    <div className="min-h-screen flex flex-col">
      <Pinger />
      <Navbar username={profile?.username ?? user.email ?? ''} isAdmin={isAdmin} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
