import { useMemo, useState } from 'react';
import { useDatos } from '../contexto';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { IconoBuscar, IconoCerrar } from '../components/Iconos';
import { agruparPorDia, enPeriodo, resumen } from '../domain/calculos';
import { fechaLarga } from '../domain/fechas';
import type { TipoMovimiento } from '../domain/tipos';
import type { PropsPantalla } from './tipos';

export interface Filtro {
  texto?: string;
  tipo?: TipoMovimiento;
  categoriaId?: string;
  cuentaId?: string;
  etiqueta?: string;
  periodo?: boolean; // true = solo el mes seleccionado
}

export function Movimientos({ periodo, desplazamiento, setDesplazamiento, filtro, setFiltro }: PropsPantalla & { filtro: Filtro; setFiltro: (f: Filtro) => void }) {
  const { movimientos, categorias, categoriaPorId, cuentas, cuentaPorId, dinero, ajustes } = useDatos();
  const [limite, setLimite] = useState(30);
  const set = (cambios: Partial<Filtro>) => {
    setFiltro({ ...filtro, ...cambios });
    setLimite(30);
  };

  const etiquetas = useMemo(() => [...new Set(movimientos.flatMap((m) => m.etiquetas))].sort(), [movimientos]);

  const filtrados = useMemo(() => {
    const t = filtro.texto?.trim().toLowerCase();
    return movimientos.filter((m) => {
      if (filtro.periodo && !enPeriodo(m, periodo)) return false;
      if (filtro.tipo && m.tipo !== filtro.tipo) return false;
      if (filtro.categoriaId && (m.categoriaId ?? 'sin') !== filtro.categoriaId) return false;
      if (filtro.cuentaId && m.cuentaId !== filtro.cuentaId && m.cuentaDestinoId !== filtro.cuentaId) return false;
      if (filtro.etiqueta && !m.etiquetas.includes(filtro.etiqueta)) return false;
      if (t) {
        const cat = m.categoriaId ? categoriaPorId.get(m.categoriaId)?.nombre : '';
        const texto = [m.nota, cat, cuentaPorId.get(m.cuentaId)?.nombre, ...m.etiquetas, (m.importe / 100).toFixed(2).replace('.', ',')].join(' ').toLowerCase();
        if (!texto.includes(t)) return false;
      }
      return true;
    });
  }, [movimientos, filtro, periodo, categoriaPorId, cuentaPorId]);

  const grupos = useMemo(() => agruparPorDia(filtrados), [filtrados]);
  const r = resumen(filtrados);
  const hayFiltros = Boolean(filtro.tipo || filtro.categoriaId || filtro.cuentaId || filtro.etiqueta || filtro.texto);

  return (
    <div className="flex flex-col gap-3 px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>

      <div className="relative">
        <IconoBuscar className="texto-2 absolute top-1/2 left-3 -translate-y-1/2" width={18} height={18} />
        <input className="campo pl-10" type="search" placeholder="Buscar por nota, categoría, importe…" value={filtro.texto ?? ''} onChange={(e) => set({ texto: e.target.value })} />
      </div>

      <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <button className="chip" aria-pressed={!filtro.periodo} onClick={() => set({ periodo: false })}>
          Todo
        </button>
        <button className="chip" aria-pressed={!!filtro.periodo} onClick={() => set({ periodo: true })}>
          Por mes
        </button>
        <span className="mx-1 w-px shrink-0" style={{ background: 'var(--borde)' }} />
        {(['gasto', 'ingreso', 'transferencia'] as const).map((t) => (
          <button key={t} className="chip" aria-pressed={filtro.tipo === t} onClick={() => set({ tipo: filtro.tipo === t ? undefined : t })}>
            {t === 'gasto' ? 'Gastos' : t === 'ingreso' ? 'Ingresos' : 'Transferencias'}
          </button>
        ))}
        <select className="chip" value={filtro.categoriaId ?? ''} onChange={(e) => set({ categoriaId: e.target.value || undefined })} aria-label="Categoría">
          <option value="">Categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icono} {c.nombre} ({c.tipo})
            </option>
          ))}
        </select>
        {cuentas.length > 1 && (
          <select className="chip" value={filtro.cuentaId ?? ''} onChange={(e) => set({ cuentaId: e.target.value || undefined })} aria-label="Cuenta">
            <option value="">Cuenta</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
        {etiquetas.length > 0 && (
          <select className="chip" value={filtro.etiqueta ?? ''} onChange={(e) => set({ etiqueta: e.target.value || undefined })} aria-label="Etiqueta">
            <option value="">#Etiqueta</option>
            {etiquetas.map((e) => (
              <option key={e} value={e}>
                #{e}
              </option>
            ))}
          </select>
        )}
        {hayFiltros && (
          <button className="chip flex items-center gap-1" onClick={() => setFiltro({ periodo: filtro.periodo })}>
            <IconoCerrar width={14} height={14} /> Limpiar
          </button>
        )}
      </div>

      {filtro.periodo && <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />}

      <div className="tarjeta grid grid-cols-3 gap-2 p-3 text-center text-sm">
        <div>
          <p className="texto-2 text-xs">Ingresos</p>
          <p className="importe font-semibold" style={{ color: 'var(--color-ingreso)' }}>
            {dinero(r.ingresos)}
          </p>
        </div>
        <div>
          <p className="texto-2 text-xs">Gastos</p>
          <p className="importe font-semibold" style={{ color: 'var(--color-gasto)' }}>
            {dinero(r.gastos)}
          </p>
        </div>
        <div>
          <p className="texto-2 text-xs">{filtrados.length} mov.</p>
          <p className="importe font-semibold">{dinero(r.balance)}</p>
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="texto-2 py-12 text-center">No hay movimientos{hayFiltros ? ' con estos filtros' : ''}.</p>
      ) : (
        <section className="tarjeta overflow-hidden py-1">
          {grupos.slice(0, limite).map((g) => (
            <div key={g.fecha}>
              <div className="texto-2 sticky top-0 z-10 flex justify-between px-4 pt-3 pb-1 text-xs font-medium" style={{ background: 'var(--superficie)' }}>
                <span>{fechaLarga(g.fecha)}</span>
                <span className="importe">{dinero(g.neto, { signo: true })}</span>
              </div>
              {g.items.map((m) => (
                <FilaMovimiento key={m.id} m={m} />
              ))}
            </div>
          ))}
          {grupos.length > limite && (
            <button className="w-full py-3 text-sm font-medium text-[var(--color-marca)]" onClick={() => setLimite(limite + 30)}>
              Ver más
            </button>
          )}
        </section>
      )}
    </div>
  );
}
