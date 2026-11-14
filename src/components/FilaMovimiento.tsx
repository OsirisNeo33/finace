import type { Movimiento } from '../domain/tipos';
import { useDatos } from '../contexto';

export function FilaMovimiento({ m }: { m: Movimiento }) {
  const { categoriaPorId, cuentaPorId, dinero, abrirEditor, cuentas } = useDatos();
  const cat = m.categoriaId ? categoriaPorId.get(m.categoriaId) : undefined;
  const cuenta = cuentaPorId.get(m.cuentaId);
  const esTransf = m.tipo === 'transferencia';
  const titulo = esTransf ? 'Transferencia' : cat?.nombre ?? 'Sin categoría';
  const detalle = esTransf
    ? `${cuenta?.nombre ?? '?'} → ${m.cuentaDestinoId ? cuentaPorId.get(m.cuentaDestinoId)?.nombre ?? '?' : '?'}`
    : [m.nota, cuentas.length > 1 ? cuenta?.nombre : undefined].filter(Boolean).join(' · ');
  const color = m.tipo === 'gasto' ? 'var(--texto)' : m.tipo === 'ingreso' ? 'var(--color-ingreso)' : 'var(--texto-2)';

  return (
    <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:opacity-60" onClick={() => abrirEditor(m)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg" style={{ background: (cat?.color ?? '#64748b') + '22' }}>
        {esTransf ? '🔁' : cat?.icono ?? '❔'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{titulo}</span>
        {detalle && <span className="texto-2 block truncate text-sm">{detalle}</span>}
        {m.etiquetas.length > 0 && <span className="block truncate text-xs text-[var(--color-marca)]">{m.etiquetas.map((e) => '#' + e).join(' ')}</span>}
      </span>
      <span className="importe shrink-0 font-semibold" style={{ color }}>
        {m.tipo === 'gasto' ? dinero(-m.importe) : m.tipo === 'ingreso' ? dinero(m.importe, { signo: true }) : dinero(m.importe)}
      </span>
    </button>
  );
}
