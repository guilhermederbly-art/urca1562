export default function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="spinner" />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--f1-muted)' }}>
        {label}
      </span>
    </div>
  )
}
