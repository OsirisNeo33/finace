import { useMemo, useState } from 'react';
import { eachDayOfInterval, getISODay, parseISO, differenceInCalendarDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { GraficoMeses, type PuntoMes } from '../components/GraficoMeses';
import { Card, CardTitle, Chip, Emoji, EmptyState, Label, Page, PageHeader, Panel, ProgressBar, Segmented, Tile, cx, tonoPresupuesto } from '../components/ui';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { enPeriodo, progresoPresupuestos, resumen, totalesPorCategoria } from '../domain/calculos';
import { aISO, fechaLarga, hoyISO, mesCorto, periodoDe } from '../domain/fechas';
import { IconoGrafico } from '../components/Iconos';
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
        return { id, valor, previo: ant.get(id) ?? 0, nombre: c?.nombre ?? 'Sin categoría', icono: c?.icono ?? '❔' };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [movs, movsAnt, tipo, categoriaPorId]);
  const total = tipo === 'gasto' ? r.gastos : r.ingresos;

  // Evolución de los últimos 6 periodos
  const evolucion = useMemo<PuntoMes[]>(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const p = periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento - 5 + i);
        const rr = resumen(movimientos.filter((m) => enPeriodo(m, p)));
        return { clave: p.inicio, corto: mesCorto(ajustes.diaInicioMes === 1 ? p.inicio : p.fin), nombre: p.etiqueta, ingresos: rr.ingresos, gastos: rr.gastos, actual: i === 5 };
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

  const progreso = progresoPresupuestos(presupuestos, movs).sort((a, b) => (a.presupuesto.categoriaId === null ? -1 : b.presupuesto.categoriaId === null ? 1 : b.porcentaje - a.porcentaje));

  return (
    <>
      <PageHeader title="Análisis" subtitle="En qué se va tu dinero y cómo evoluciona" />
      <Page>
        <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />

        {/* Datos clave */}
        <div className="grid grid-cols-2 gap-3">
          <Card dark className="p-4">
            <p className="text-[13px] text-white/60">Gasto medio diario</p>
            <p className="num mt-1 text-[22px] font-semibold">{dinero(mediaDiaria)}</p>
            <p className="mt-1 text-[12px] text-white/60">{diasTranscurridos ? `En ${diasTranscurridos} ${diasTranscurridos === 1 ? 'día' : 'días'}` : 'Mes sin empezar'}</p>
          </Card>
          <Card className="p-4">
            <Label>Tasa de ahorro</Label>
            <p className="num mt-1 text-[22px] font-semibold">{r.ingresos ? `${Math.round((r.balance / r.ingresos) * 100)} %` : '—'}</p>
            {r.ingresos > 0 && (
              <Chip tone={r.balance >= 0 ? 'success' : 'danger'} className="mt-1.5">
                {r.balance >= 0 ? 'Ahorras' : 'Gastas de más'}
              </Chip>
            )}
          </Card>
          <Card className="p-4">
            <Label>Día de más gasto</Label>
            <p className="num mt-1 text-[22px] font-semibold">{diaMax ? dinero(diaMax[1]) : '—'}</p>
            {diaMax && <p className="mt-1 truncate text-[12px] text-muted first-letter:uppercase">{fechaLarga(diaMax[0])}</p>}
          </Card>
          <Card className="p-4">
            <Label>Vs. mes anterior</Label>
            <p className="num mt-1 text-[22px] font-semibold">{variacion === null ? '—' : `${variacion > 0 ? '+' : ''}${Math.round(variacion * 100)} %`}</p>
            {variacion !== null && (
              <Chip tone={variacion > 0 ? 'danger' : 'success'} className="mt-1.5">
                {variacion > 0 ? '▲ Has gastado más' : '▼ Has gastado menos'}
              </Chip>
            )}
          </Card>
        </div>

        {/* Por categoría */}
        <Segmented
          label="Tipo"
          value={tipo}
          onChange={setTipo}
          options={[
            { value: 'gasto', label: 'Gastos' },
            { value: 'ingreso', label: 'Ingresos' },
          ]}
        />
        {categorias.length === 0 ? (
          <EmptyState icon={<IconoGrafico />} title={`Sin ${tipo === 'gasto' ? 'gastos' : 'ingresos'} este mes`}>
            Cuando apuntes movimientos verás aquí en qué categorías se reparten.
          </EmptyState>
        ) : (
          <Panel title="Por categoría" detail={<span className="num">Total {dinero(total)}</span>}>
            {categorias.map((c) => {
              const cambio = c.previo ? (c.valor - c.previo) / c.previo : null;
              const malo = cambio !== null && cambio > 0 === (tipo === 'gasto');
              return (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full flex-col gap-2 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left transition active:scale-[0.99] active:bg-surface-2"
                  onClick={() => ir('movimientos', { categoriaId: c.id, periodo: true })}
                >
                  <span className="flex w-full items-center gap-3">
                    <Emoji>{c.icono}</Emoji>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{c.nombre}</span>
                      <span className="num block text-[13px] text-muted">{Math.round((c.valor / total) * 100)} %</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="num text-[15px] font-semibold">{dinero(c.valor)}</span>
                      {cambio !== null && Math.abs(cambio) >= 0.05 && (
                        <Chip tone={malo ? 'danger' : 'success'} className="num">
                          {cambio > 0 ? '▲' : '▼'} {Math.abs(Math.round(cambio * 100))} %
                        </Chip>
                      )}
                    </span>
                  </span>
                  <ProgressBar value={c.valor / categorias[0].valor} />
                </button>
              );
            })}
          </Panel>
        )}

        {/* Presupuestos */}
        <Panel title="Presupuestos" footer={progreso.length === 0 ? 'Aún no tienes presupuestos. Créalos en Ajustes → Presupuestos para recibir avisos al acercarte al límite.' : undefined}>
          {progreso.map((p) => {
            const c = p.presupuesto.categoriaId ? categoriaPorId.get(p.presupuesto.categoriaId) : undefined;
            return (
              <Tile key={p.presupuesto.id} className="flex-col items-stretch gap-2">
                <span className="flex items-center gap-3">
                  <Emoji>{c ? c.icono : '🎯'}</Emoji>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{c ? c.nombre : 'Total del mes'}</span>
                  <Chip tone={p.estado === 'superado' ? 'danger' : p.porcentaje >= 0.8 ? 'warning' : 'success'} className="num">
                    {p.restante >= 0 ? `Quedan ${dinero(p.restante)}` : `Pasado ${dinero(-p.restante)}`}
                  </Chip>
                </span>
                <ProgressBar value={p.porcentaje} tone={tonoPresupuesto(p.porcentaje)} />
              </Tile>
            );
          })}
        </Panel>

        {/* Calendario */}
        <Card className="p-4">
          <CardTitle detail="Más color, más gasto">Calendario de gastos</CardTitle>
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-muted">
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
                  type="button"
                  className={cx('flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-[13px] transition active:scale-95', !g && 'bg-surface-2', d === diaSel ? 'ring-2 ring-brand' : d === hoy && 'ring-1 ring-muted', d > hoy && 'opacity-40')}
                  style={{
                    background: g ? `color-mix(in srgb, var(--chart-expense) ${Math.round(intensidad * 100)}%, var(--surface))` : undefined,
                    color: intensidad > 0.55 ? 'white' : undefined,
                  }}
                  onClick={() => setDiaSel(diaSel === d ? undefined : d)}
                  aria-label={`${fechaLarga(d)}: ${dinero(g)}`}
                  aria-pressed={d === diaSel}
                >
                  <span className="num font-medium">{parseISO(d).getDate()}</span>
                  {g > 0 && <span className="num hidden text-[9px] sm:block">{dinero(g, { sinDecimales: true })}</span>}
                </button>
              );
            })}
          </div>
        </Card>
        {diaSel && (
          <Panel title={<span className="first-letter:uppercase">{fechaLarga(diaSel)}</span>}>
            {movs.filter((m) => m.fecha === diaSel).length === 0 ? (
              <Tile>
                <span className="text-[14px] text-muted">Sin movimientos.</span>
              </Tile>
            ) : (
              movs.filter((m) => m.fecha === diaSel).map((m) => <FilaMovimiento key={m.id} m={m} />)
            )}
          </Panel>
        )}

        {/* Evolución */}
        <Card>
          <CardTitle>Últimos 6 meses</CardTitle>
          <GraficoMeses datos={evolucion} formatear={(c) => dinero(c)} />
        </Card>
      </Page>
    </>
  );
}
