import { useMemo, useState } from 'react';
import { eachDayOfInterval, getISODay, parseISO } from 'date-fns';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { FormRecurrente } from './ajustes/Recurrentes';
import { aISO, fechaLarga, hoyISO, periodoDe } from '../domain/fechas';
import { db } from '../db/db';
import { marcarPagado, usarPagos, type Pago } from './usarPagos';
import type { Recurrente } from '../domain/tipos';

const ESTILO: Record<Pago['estado'], { texto: string; color: string }> = {
  pagado: { texto: 'Pagado', color: 'var(--color-ingreso)' },
  hoy: { texto: 'Hoy', color: '#d97706' },
  pendiente: { texto: 'Pendiente', color: 'var(--texto-2)' },
  vencido: { texto: 'Sin pagar', color: 'var(--color-gasto)' },
};

export function Pagos() {
  const { dinero, categoriaPorId } = useDatos();
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [diaSel, setDiaSel] = useState<string>();
  const [form, setForm] = useState<{ r?: Recurrente; inicio?: string } | null>(null);
  const periodo = useMemo(() => periodoDe(new Date(), 1, desplazamiento), [desplazamiento]);
  const { pagos } = usarPagos(periodo.inicio, periodo.fin);
  const hoy = hoyISO();

  const gastos = pagos.filter((p) => p.recurrente.tipo === 'gasto');
  const total = gastos.reduce((s, p) => s + p.recurrente.importe, 0);
  const pagado = gastos.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.recurrente.importe, 0);
  const ingresos = pagos.filter((p) => p.recurrente.tipo === 'ingreso').reduce((s, p) => s + p.recurrente.importe, 0);

  const dias = useMemo(() => eachDayOfInterval({ start: parseISO(periodo.inicio), end: parseISO(periodo.fin) }).map(aISO), [periodo]);
  const porDia = useMemo(() => {
    const m = new Map<string, Pago[]>();
    for (const p of pagos) m.set(p.fecha, [...(m.get(p.fecha) ?? []), p]);
    return m;
  }, [pagos]);
  const visibles = diaSel ? porDia.get(diaSel) ?? [] : pagos;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="texto-2 text-sm">Suscripciones, recibos y pagos que se repiten.</p>
      </header>
      <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={(n) => { setDesplazamiento(n); setDiaSel(undefined); }} diaInicio={1} permitirFuturo />

      <section className="tarjeta p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="texto-2 text-xs">Pagos fijos este mes</p>
            <p className="importe text-3xl font-bold" data-testid="total-pagos">{dinero(total)}</p>
          </div>
          {ingresos > 0 && (
            <div className="text-right">
              <p className="texto-2 text-xs">Ingresos fijos</p>
              <p className="importe font-semibold" style={{ color: 'var(--color-ingreso)' }}>{dinero(ingresos, { signo: true })}</p>
            </div>
          )}
        </div>
        {total > 0 && (
          <>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--superficie-2)' }}>
              <div className="h-full rounded-full" style={{ width: `${(pagado / total) * 100}%`, background: 'var(--color-ingreso)' }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs">
              <span style={{ color: 'var(--color-ingreso)' }}>Pagado {dinero(pagado)}</span>
              <span className="texto-2">Falta {dinero(total - pagado)}</span>
            </div>
          </>
        )}
      </section>

      {/* Calendario */}
      <section className="tarjeta p-3">
        <div className="texto-2 mb-1 grid grid-cols-7 text-center text-xs">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getISODay(parseISO(dias[0])) - 1 }, (_, i) => <span key={'v' + i} />)}
          {dias.map((d) => {
            const ps = porDia.get(d) ?? [];
            const vencido = ps.some((p) => p.estado === 'vencido');
            const todoPagado = ps.length > 0 && ps.every((p) => p.estado === 'pagado');
            return (
              <button
                key={d}
                className="flex min-h-14 flex-col items-center gap-0.5 rounded-lg pt-1 text-xs"
                style={{
                  background: ps.length ? (vencido ? 'color-mix(in srgb, var(--color-gasto) 16%, transparent)' : todoPagado ? 'color-mix(in srgb, var(--color-ingreso) 14%, transparent)' : 'var(--color-marca-suave)') : 'var(--superficie-2)',
                  outline: d === diaSel ? '2px solid var(--color-marca)' : d === hoy ? '1px solid var(--texto-2)' : undefined,
                }}
                onClick={() => setDiaSel(diaSel === d ? undefined : d)}
                aria-label={`${fechaLarga(d)}: ${ps.length} pagos`}
              >
                <span className={d === hoy ? 'font-bold' : 'font-medium'}>{parseISO(d).getDate()}</span>
                <span className="flex flex-wrap justify-center text-[13px] leading-none">
                  {ps.slice(0, 2).map((p) => (
                    <span key={p.clave}>{(p.recurrente.categoriaId && categoriaPorId.get(p.recurrente.categoriaId)?.icono) || '🔁'}</span>
                  ))}
                  {ps.length > 2 && <span className="texto-2 text-[10px]">+{ps.length - 2}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="texto-2 mt-2 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[11px]">
          <span>🟢 pagado</span>
          <span>🟦 pendiente</span>
          <span>🔴 sin pagar</span>
          <span>Toca un día para ver o añadir</span>
        </div>
      </section>

      {/* Lista */}
      <section className="tarjeta overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h2 className="font-semibold">{diaSel ? fechaLarga(diaSel) : 'Este mes'}</h2>
          {diaSel && (
            <button className="text-sm text-[var(--color-marca)]" onClick={() => setDiaSel(undefined)}>
              Ver todo el mes
            </button>
          )}
        </div>
        {visibles.length === 0 && <p className="texto-2 px-4 py-4 text-sm">{diaSel ? 'Ningún pago este día.' : 'Aún no tienes pagos fijos. Añade tus suscripciones (Netflix, Spotify, gimnasio…) y recibos (alquiler, luz, móvil…).'}</p>}
        {visibles.map((p) => <FilaPago key={p.clave} p={p} onEditar={() => setForm({ r: p.recurrente })} />)}
        <div className="p-3">
          <button className="boton boton-primario w-full" onClick={() => setForm({ inicio: diaSel })}>
            + {diaSel ? `Añadir pago el día ${parseISO(diaSel).getDate()}` : 'Añadir suscripción o pago'}
          </button>
        </div>
      </section>

      {form && <FormRecurrente r={form.r} inicioInicial={form.inicio} onCerrar={() => setForm(null)} />}
    </div>
  );
}

export function FilaPago({ p, onEditar, mostrarFecha }: { p: Pago; onEditar?: () => void; mostrarFecha?: boolean }) {
  const { categoriaPorId, dinero, avisar } = useDatos();
  const r = p.recurrente;
  const c = r.categoriaId ? categoriaPorId.get(r.categoriaId) : undefined;
  const e = ESTILO[p.estado];
  const manual = r.automatico === false;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onEditar}>
        <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full text-lg leading-none" style={{ background: (c?.color ?? '#64748b') + '22' }}>
          {c?.icono ?? '🔁'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{r.nota || c?.nombre}</span>
          <span className="block truncate text-xs" style={{ color: e.color }}>
            {mostrarFecha ? `${fechaLarga(p.fecha)} · ` : `Día ${parseISO(p.fecha).getDate()} · `}
            {e.texto}
            {manual ? ' · 🔔' : ''}
          </span>
        </span>
      </button>
      <span className="text-right">
        <span className="importe block font-semibold" style={{ color: r.tipo === 'ingreso' ? 'var(--color-ingreso)' : undefined }}>
          {r.tipo === 'ingreso' ? dinero(r.importe, { signo: true }) : dinero(-r.importe)}
        </span>
        {manual && p.estado !== 'pagado' && (
          <button
            className="text-xs font-semibold text-[var(--color-marca)]"
            onClick={async () => {
              const id = await marcarPagado(p);
              avisar(`${r.nota || c?.nombre} marcado como pagado`, { etiqueta: 'Deshacer', hacer: () => db.movimientos.delete(id) });
            }}
          >
            ✓ Marcar pagado
          </button>
        )}
      </span>
    </div>
  );
}
