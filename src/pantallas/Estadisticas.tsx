import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { eachDayOfInterval, getISODay, parseISO, differenceInCalendarDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { Anillo } from '../components/Anillo';
import { Barra } from '../components/Barra';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { enPeriodo, progresoPresupuestos, resumen, totalesPorCategoria } from '../domain/calculos';
import { aISO, fechaLarga, hoyISO, mesCorto, periodoDe } from '../domain/fechas';
import { db } from '../db/db';
import type { PropsPantalla } from './tipos';

export function Estadisticas({ periodo, desplazamiento, setDesplazamiento, ir }: PropsPantalla) {
  const { movimientos, categoriaPorId, dinero, ajustes } = useDatos();
  const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);
  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>('gasto');
  const [diaSel, setDiaSel] = useState<string>();

  const anterior = useMemo(() => periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento - 1), [ajustes.diaInicioMes, desplazamiento]);
  const movs = useMemo(() => movimientos.filter((m) => enPeriodo(m, periodo)), [movimientos, periodo]);
  const movsAnt = useMemo(() => movimientos.filter((m) => enPeriodo(m, anterior)), [movimientos, anterior]);
  const r = resumen(movs);
  const rAnt = resumen(movsAnt);

  const categorias = useMemo(() => {
    const act = totalesPorCategoria(movs, tipo);
    const ant = totalesPorCategoria(movsAnt, tipo);
    return [...act]
      .map(([id, valor]) => {
        const c = categoriaPorId.get(id);
        return { id, valor, previo: ant.get(id) ?? 0, nombre: c?.nombre ?? 'Sin categoría', icono: c?.icono ?? '❔', color: c?.color ?? '#94a3b8' };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [movs, movsAnt, tipo, categoriaPorId]);
  const total = tipo === 'gasto' ? r.gastos : r.ingresos;

  // Evolución de los últimos 6 periodos
  const evolucion = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const p = periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento - 5 + i);
        const rr = resumen(movimientos.filter((m) => enPeriodo(m, p)));
        return { mes: mesCorto(ajustes.diaInicioMes === 1 ? p.inicio : p.fin), Ingresos: rr.ingresos / 100, Gastos: rr.gastos / 100 };
      }),
    [movimientos, ajustes.diaInicioMes, desplazamiento],
  );

  // Calendario
  const dias = useMemo(() => eachDayOfInterval({ start: parseISO(periodo.inicio), end: parseISO(periodo.fin) }).map(aISO), [periodo]);
  const gastoDia = useMemo(() => {
    const g = new Map<string, number>();
    for (const m of movs) if (m.tipo === 'gasto') g.set(m.fecha, (g.get(m.fecha) ?? 0) + m.importe);
    return g;
  }, [movs]);
  const maxDia = Math.max(1, ...gastoDia.values());
  const hoy = hoyISO();
  const diasTranscurridos = hoy < periodo.inicio ? 0 : Math.min(dias.length, differenceInCalendarDays(parseISO(hoy), parseISO(periodo.inicio)) + 1);
  const mediaDiaria = diasTranscurridos ? Math.round(r.gastos / diasTranscurridos) : 0;
  const diaMax = [...gastoDia].sort((a, b) => b[1] - a[1])[0];
  const variacion = rAnt.gastos ? (r.gastos - rAnt.gastos) / rAnt.gastos : null;

  // Los atributos SVG no admiten var(--…): colores reales según el tema
  const oscuro = document.documentElement.classList.contains('dark');
  const col = oscuro ? { ingreso: '#34d399', gasto: '#f87171', eje: '#94a3b8', rejilla: '#263040' } : { ingreso: '#059669', gasto: '#dc2626', eje: '#64748b', rejilla: '#e5e7eb' };

  const progreso = progresoPresupuestos(presupuestos, movs).sort((a, b) => (a.presupuesto.categoriaId === null ? -1 : b.presupuesto.categoriaId === null ? 1 : b.porcentaje - a.porcentaje));

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Análisis</h1>
      <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />

      {/* Datos clave */}
      <div className="grid grid-cols-2 gap-3">
        <Dato titulo="Gasto medio diario" valor={dinero(mediaDiaria)} />
        <Dato titulo="Tasa de ahorro" valor={r.ingresos ? `${Math.round((r.balance / r.ingresos) * 100)} %` : '—'} />
        <Dato titulo="Día de más gasto" valor={diaMax ? dinero(diaMax[1]) : '—'} detalle={diaMax ? fechaLarga(diaMax[0]) : undefined} />
        <Dato
          titulo="Vs. mes anterior"
          valor={variacion === null ? '—' : `${variacion > 0 ? '+' : ''}${Math.round(variacion * 100)} %`}
          detalle={variacion === null ? undefined : variacion > 0 ? 'Has gastado más' : 'Has gastado menos'}
          color={variacion === null ? undefined : variacion > 0 ? 'var(--color-gasto)' : 'var(--color-ingreso)'}
        />
      </div>

      {/* Por categoría */}
      <section className="tarjeta p-4">
        <div className="mb-2 flex rounded-xl p-1" style={{ background: 'var(--superficie-2)' }}>
          {(['gasto', 'ingreso'] as const).map((t) => (
            <button key={t} className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${tipo === t ? 'shadow-sm' : 'texto-2'}`} style={tipo === t ? { background: 'var(--superficie)' } : undefined} onClick={() => setTipo(t)}>
              {t === 'gasto' ? 'Gastos' : 'Ingresos'}
            </button>
          ))}
        </div>
        {categorias.length === 0 ? (
          <p className="texto-2 py-8 text-center text-sm">Sin {tipo === 'gasto' ? 'gastos' : 'ingresos'} este mes.</p>
        ) : (
          <>
            <Anillo
              datos={categorias}
              onTocar={(id) => ir('movimientos', { categoriaId: id, periodo: true })}
              centro={
                <>
                  <span className="texto-2 text-xs">Total</span>
                  <span className="importe text-xl font-bold">{dinero(total)}</span>
                </>
              }
            />
            <ul className="mt-3 flex flex-col gap-3">
              {categorias.map((c) => {
                const cambio = c.previo ? (c.valor - c.previo) / c.previo : null;
                return (
                  <li key={c.id}>
                    <button className="w-full text-left" onClick={() => ir('movimientos', { categoriaId: c.id, periodo: true })}>
                      <div className="mb-1 flex items-center gap-2 text-sm">
                        <span>{c.icono}</span>
                        <span className="flex-1 truncate">{c.nombre}</span>
                        {cambio !== null && Math.abs(cambio) >= 0.05 && (
                          <span className="text-xs" style={{ color: (cambio > 0) === (tipo === 'gasto') ? 'var(--color-gasto)' : 'var(--color-ingreso)' }}>
                            {cambio > 0 ? '▲' : '▼'} {Math.abs(Math.round(cambio * 100))} %
                          </span>
                        )}
                        <span className="importe font-medium">{dinero(c.valor)}</span>
                      </div>
                      <Barra porcentaje={c.valor / total} color={c.color} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* Presupuestos */}
      <section className="tarjeta p-4">
        <h2 className="mb-3 font-semibold">Presupuestos</h2>
        {progreso.length === 0 ? (
          <p className="texto-2 text-sm">Aún no tienes presupuestos. Créalos en Ajustes → Presupuestos para recibir avisos al acercarte al límite.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {progreso.map((p) => {
              const c = p.presupuesto.categoriaId ? categoriaPorId.get(p.presupuesto.categoriaId) : undefined;
              return (
                <div key={p.presupuesto.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className={c ? '' : 'font-semibold'}>{c ? `${c.icono} ${c.nombre}` : 'Total del mes'}</span>
                    <span className="importe" style={{ color: p.estado === 'superado' ? 'var(--color-gasto)' : 'var(--texto-2)' }}>
                      {p.restante >= 0 ? `Quedan ${dinero(p.restante)}` : `Pasado ${dinero(-p.restante)}`}
                    </span>
                  </div>
                  <Barra porcentaje={p.porcentaje} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Calendario */}
      <section className="tarjeta p-4">
        <h2 className="mb-3 font-semibold">Calendario de gastos</h2>
        <div className="texto-2 mb-1 grid grid-cols-7 text-center text-xs">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getISODay(parseISO(dias[0])) - 1 }, (_, i) => (
            <span key={'v' + i} />
          ))}
          {dias.map((d) => {
            const g = gastoDia.get(d) ?? 0;
            const intensidad = g ? 0.15 + 0.85 * (g / maxDia) : 0;
            return (
              <button
                key={d}
                className="flex aspect-square flex-col items-center justify-center rounded-lg text-xs"
                style={{
                  background: g ? `color-mix(in srgb, var(--color-gasto) ${Math.round(intensidad * 100)}%, transparent)` : 'var(--superficie-2)',
                  color: intensidad > 0.55 ? 'white' : undefined,
                  outline: d === diaSel ? '2px solid var(--color-marca)' : d === hoy ? '1px solid var(--texto-2)' : undefined,
                  opacity: d > hoy ? 0.4 : 1,
                }}
                onClick={() => setDiaSel(diaSel === d ? undefined : d)}
                aria-label={`${fechaLarga(d)}: ${dinero(g)}`}
              >
                <span className="font-medium">{parseISO(d).getDate()}</span>
                {g > 0 && <span className="importe hidden text-[9px] sm:block">{dinero(g, { sinDecimales: true })}</span>}
              </button>
            );
          })}
        </div>
        {diaSel && (
          <div className="-mx-4 mt-3 border-t pt-2" style={{ borderColor: 'var(--borde)' }}>
            <p className="texto-2 px-4 text-xs font-medium">{fechaLarga(diaSel)}</p>
            {movs.filter((m) => m.fecha === diaSel).length === 0 ? (
              <p className="texto-2 px-4 py-3 text-sm">Sin movimientos.</p>
            ) : (
              movs.filter((m) => m.fecha === diaSel).map((m) => <FilaMovimiento key={m.id} m={m} />)
            )}
          </div>
        )}
      </section>

      {/* Evolución */}
      <section className="tarjeta p-4">
        <h2 className="mb-3 font-semibold">Últimos 6 meses</h2>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={evolucion} margin={{ left: -10, right: 0, top: 4 }}>
              <CartesianGrid vertical={false} stroke={col.rejilla} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: col.eje, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: col.eje, fontSize: 11 }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k` : String(v))} />
              <Tooltip
                cursor={{ fill: oscuro ? '#1e2630' : '#f1f3f5' }}
                contentStyle={{ background: 'var(--superficie)', border: '1px solid var(--borde)', borderRadius: 12, color: 'var(--texto)' }}
                formatter={(v) => dinero(Math.round(Number(v) * 100))}
              />
              <Bar dataKey="Ingresos" fill={col.ingreso} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Gastos" fill={col.gasto} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Dato({ titulo, valor, detalle, color }: { titulo: string; valor: string; detalle?: string; color?: string }) {
  return (
    <div className="tarjeta p-3">
      <p className="texto-2 text-xs">{titulo}</p>
      <p className="importe text-lg font-semibold" style={{ color }}>
        {valor}
      </p>
      {detalle && <p className="texto-2 truncate text-xs">{detalle}</p>}
    </div>
  );
}
