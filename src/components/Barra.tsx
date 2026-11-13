export function Barra({ porcentaje, color }: { porcentaje: number; color?: string }) {
  const c = color ?? (porcentaje > 1 ? 'var(--color-gasto)' : porcentaje >= 0.8 ? '#d97706' : 'var(--color-ingreso)');
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--superficie-2)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, porcentaje * 100)}%`, background: c }} />
    </div>
  );
}
