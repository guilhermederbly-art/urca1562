import PageHero from '@/components/PageHero'

export const metadata = { title: 'Regras — F1 Bolão' }

export default function RegrasPage() {
  return (
    <div>
      <PageHero kicker="F1 Bolão 2026" title="Regras do Bolão" subtitle="Como funciona a pontuação e o jogo" />

      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Como funciona */}
        <section className="card overflow-hidden">
          <div className="striped-accent-thick" />
          <div className="p-6">
            <h2 className="font-black text-white text-lg uppercase tracking-wide mb-4" style={{ letterSpacing: '0.08em' }}>
              🏎 Como funciona
            </h2>
            <div className="flex flex-col gap-3 text-sm" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
              <p>
                Antes de cada Grande Prêmio, você faz seus palpites sobre o que vai acontecer na corrida.
                Após a corrida, os pontos são calculados automaticamente e o ranking é atualizado.
              </p>
              <p>
                No final da temporada, quem tiver mais pontos acumulados <strong className="text-white">vence o bolão</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Prazo */}
        <section className="card p-6">
          <h2 className="font-black text-white text-lg uppercase tracking-wide mb-4" style={{ letterSpacing: '0.08em' }}>
            ⏱ Prazo para palpitar
          </h2>
          <p className="text-sm" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
            Os palpites ficam abertos até o início do{' '}
            <strong className="text-white">1º Treino Livre (FP1)</strong> do fim de semana de corrida.
            Após esse momento, as previsões são bloqueadas e não podem mais ser alteradas.
          </p>
          <div
            className="mt-4 p-3 rounded text-xs font-semibold"
            style={{ background: 'rgba(232,0,45,0.1)', color: 'var(--f1-red)', border: '1px solid rgba(232,0,45,0.25)' }}
          >
            ⚠️ Fique atento: quem não palpitar antes do FP1 fica sem pontos naquela corrida.
          </div>
        </section>

        {/* O que palpitar */}
        <section className="card p-6">
          <h2 className="font-black text-white text-lg uppercase tracking-wide mb-4" style={{ letterSpacing: '0.08em' }}>
            📋 O que você palpita
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: '🥇', label: 'Pole Position',       desc: 'Quem vai largar na pole no sábado?' },
              { icon: '🏆', label: '1º Lugar (P1)',        desc: 'Quem vai cruzar a linha de chegada em primeiro?' },
              { icon: '🥈', label: '2º Lugar (P2)',        desc: 'Quem vai subir no segundo degrau do pódio?' },
              { icon: '🥉', label: '3º Lugar (P3)',        desc: 'Quem vai completar o pódio?' },
              { icon: '🎲', label: 'Posição Aleatória',    desc: 'Uma posição sorteada (P4 a P20) — quem termina nessa posição?' },
              { icon: '🇧🇷', label: 'Posição do Bortoleto', desc: 'Em que posição Gabriel Bortoleto vai terminar a corrida?' },
              { icon: '⚡', label: 'Desafio da Rodada',    desc: 'Uma pergunta surpresa por GP — resposta certa vale 1 ponto extra.' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="font-bold text-white text-sm">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--f1-muted)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pontuação */}
        <section className="card overflow-hidden">
          <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--f1-border)' }}>
            <h2 className="font-black text-white text-lg uppercase tracking-wide" style={{ letterSpacing: '0.08em' }}>
              🏅 Pontuação
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--f1-border)' }}>
            {[
              { cat: 'Pole Position',       exact: '2 pts', partial: '—',    note: 'Acerto exato' },
              { cat: '1º Lugar (P1)',        exact: '3 pts', partial: '1 pt', note: 'Piloto acertado mas em outra posição do pódio' },
              { cat: '2º Lugar (P2)',        exact: '3 pts', partial: '1 pt', note: 'Piloto acertado mas em outra posição do pódio' },
              { cat: '3º Lugar (P3)',        exact: '3 pts', partial: '1 pt', note: 'Piloto acertado mas em outra posição do pódio' },
              { cat: 'Posição Aleatória',    exact: '4 pts', partial: '—',    note: 'Somente acerto exato' },
              { cat: 'Posição do Bortoleto', exact: '4 pts', partial: '—',    note: 'Somente acerto exato' },
              { cat: '⚡ Desafio da Rodada', exact: '1 pt',  partial: '—',    note: 'Somente acerto exato' },
            ].map(({ cat, exact, partial, note }) => (
              <div key={cat} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 text-sm font-semibold text-white">{cat}</div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded"
                    style={{ background: 'rgba(232,0,45,0.15)', color: 'var(--f1-red)' }}
                  >
                    {exact}
                  </span>
                  {partial !== '—' && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,192,0,0.12)', color: '#ffc000' }}
                    >
                      {partial} parcial
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4" style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--f1-border)' }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--f1-muted)' }}>Pontuação máxima por corrida</span>
              <span className="font-black text-white text-base">20 pontos</span>
            </div>
          </div>
        </section>

        {/* Posição aleatória */}
        <section className="card p-6">
          <h2 className="font-black text-white text-lg uppercase tracking-wide mb-3" style={{ letterSpacing: '0.08em' }}>
            🎲 A posição aleatória
          </h2>
          <p className="text-sm" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
            A cada corrida, uma posição entre <strong className="text-white">P4 e P20</strong> é sorteada aleatoriamente
            pelo sistema quando os palpites são abertos. Todos os participantes apostam em qual piloto vai terminar
            nessa posição específica. O sorteio é o mesmo para todo mundo — vale 3 pontos para quem acertar exatamente.
          </p>
        </section>

        {/* Bortoleto */}
        <section className="card p-6" style={{ borderColor: 'rgba(0,210,190,0.3)' }}>
          <h2 className="font-black text-white text-lg uppercase tracking-wide mb-3" style={{ letterSpacing: '0.08em' }}>
            🇧🇷 O palpite especial: Bortoleto
          </h2>
          <p className="text-sm" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
            Gabriel Bortoleto é o único brasileiro no grid da F1 em 2026, correndo pela Sauber.
            Todo GP tem um palpite especial: em que <strong className="text-white">posição exata</strong> Bortoleto vai terminar?
            Vale 3 pontos para quem acertar certinho.
          </p>
        </section>

        {/* Desafio da Rodada */}
        <section className="card overflow-hidden" style={{ borderColor: 'rgba(255,192,0,0.3)' }}>
          <div className="striped-accent-thick" style={{ background: 'linear-gradient(90deg, rgba(255,192,0,0.8) 0%, rgba(255,192,0,0.3) 100%)' }} />
          <div className="p-6">
            <h2 className="font-black text-white text-lg uppercase tracking-wide mb-3" style={{ letterSpacing: '0.08em' }}>
              ⚡ Desafio da Rodada
            </h2>
            <p className="text-sm mb-3" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
              A cada corrida, uma <strong className="text-white">pergunta surpresa</strong> é sorteada automaticamente.
              Ela aparece junto com seus palpites e vale <strong className="text-white">+1 ponto extra</strong> para quem acertar.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
              Exemplos de perguntas: <em>"Haverá Safety Car nesta corrida?"</em>, <em>"O pole vai vencer?"</em>,
              <em>"Quantas paradas vai fazer o vencedor?"</em>. A resposta correta é registrada após a corrida
              e os pontos são distribuídos automaticamente.
            </p>
            <div
              className="p-3 rounded text-xs font-semibold"
              style={{ background: 'rgba(255,192,0,0.08)', color: 'rgba(255,192,0,0.9)', border: '1px solid rgba(255,192,0,0.25)' }}
            >
              ⚡ A pergunta é a mesma para todos — e muda a cada GP!
            </div>
          </div>
        </section>

        {/* Pódio parcial */}
        <section className="card p-6">
          <h2 className="font-black text-white text-lg uppercase tracking-wide mb-3" style={{ letterSpacing: '0.08em' }}>
            💡 Acerto parcial no pódio
          </h2>
          <p className="text-sm mb-3" style={{ color: 'var(--f1-muted)', lineHeight: '1.7' }}>
            Para P1, P2 e P3, mesmo que você erre a posição exata, ainda ganha <strong className="text-white">1 ponto</strong> se
            o piloto que você escolheu terminar em qualquer lugar do pódio.
          </p>
          <div
            className="p-3 rounded text-xs"
            style={{ background: 'rgba(0,210,190,0.07)', border: '1px solid rgba(0,210,190,0.2)', color: 'var(--f1-muted)', lineHeight: '1.6' }}
          >
            <strong className="text-white">Exemplo:</strong> Você palpitou Verstappen em P1, mas ele termina em P2.
            Você ganha <strong className="text-white">1 ponto</strong> pelo acerto parcial — o piloto estava no pódio, só não na posição certa.
          </div>
        </section>

      </div>
    </div>
  )
}
