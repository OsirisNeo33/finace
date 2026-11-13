import { useMemo } from 'react';
import { addDays, parseISO } from 'date-fns';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { Anillo, type Porcion } from '../components/Anillo';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { Barra } from '../components/Barra';
import { IconoFuego } from '../components/Iconos';
import { agruparPorDia, enPeriodo, progresoPresupuestos, racha, resumen, saldosCuentas, totalesPorCategoria } from '../domain/calculos';
import { aISO, diasRestantes, fechaLarga, hoyISO } from '../domain/fechas';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { PropsPantalla } from './tipos';

export function Inicio({ periodo, desplazamiento, setDesplazamiento, ir }: PropsPantalla) {
  const { movimientos, cuentas, todasCuentas, categoriaPorId, dinero, ajustes, abrirEditor } = useDatos();
  const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);

  const movsPeriodo = useMemo(() => movimientos.filter((m) => enPeriodo(m, periodo)), [movimientos, periodo]);
  const r = resumen(movsPeriodo);
  const saldos = useMemo(() => saldosCuentas(todasCuentas, movimientos), [todasCuentas, movimientos]);
  const patrimonio = cuentas.reduce((s, c) => s + (saldos.get(c.id) ?? 0), 0);
  const esActual = desplazamiento === 0;
  const dias = diasRestantes(periodo);

  const global = presupuestos.find((p) => p.categoriaId === null);
  const disponible = global ? global.importe - r.gastos : r.balance;
  const porDia = dias > 0 ? Math.floor(Math.max(0, disponible) / dias) : 0;

  const progreso = useMemo(
    () =>
      progresoPresupuestos(
        presupuestos.filter((p) => p.categoriaId !== null),
        movsPeriodo,
      )
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 3),
    [presupuestos, movsPeriodo],
  );

  const porciones: Porcion[] = useMemo(
    () =>
      [...totalesPorCategoria(movsPeriodo, 'gasto')]
        .map(([id, valor]) => {
          const c = categoriaPorId.get(id);
          return { id, valor, nombre: c?.nombre ?? 'Sin categoría', color: c?.color ?? '#94a3b8', icono: c?.icono ?? '❔' };
        })
        .sort((a, b) => b.valor - a.valor),
    [movsPeriodo, categoriaPorId],
  );

  // Racha: días seguidos en los que has apuntado algo (los recurrentes automáticos no cuentan)
  const nRacha = useMemo(() => {
    const dias = new Set(movimientos.filter((m) => !m.recurrenteId).map((m) => aISO(new Date(m.creadoEn))));
    return racha(dias, hoyISO(), (d) => aISO(addDays(parseISO(d), -1)));
  }, [movimientos]);

  const grupos = agruparPorDia(movsPeriodo).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Finace</h1>
        {nRacha > 0 && (
          <span className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-orange-600 dark:text-orange-400" style={{ background: 'var(--superficie)' }} title="Días seguidos apuntando movimientos">
            <IconoFuego width={16} height={16} /> {nRacha} {nRacha === 1 ? 'día' : 'días'}
          </span>
        )}
      </header>

      <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />

      {/* Resumen */}
      <section className="tarjeta p-5">
        <p className="texto-2 text-sm">Balance del mes</p>
        <p className="importe text-4xl font-bold" style={{ color: r.balance < 0 ? 'var(--color-gasto)' : undefined }} data-testid="balance">
          {dinero(r.balance)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3" style={{ background: 'var(--superficie-2)' }}>
            <p className="texto-2 text-xs">Ingresos</p>
            <p className="importe text-lg font-semibold" style={{ color: 'var(--color-ingreso)' }}>
              {dinero(r.ingresos, { signo: true })}
            </p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'var(--superficie-2)' }}>
            <p className="texto-2 text-xs">Gastos</p>
            <p className="importe text-lg font-semibold" style={{ color: 'var(--color-gasto)' }} data-testid="gastos">
              {dinero(-r.gastos)}
            </p>
          </div>
        </div>
        {esActual && dias > 0 && (r.ingresos > 0 || global) && (
          <p className="mt-4 text-sm">
            {disponible > 0 ? (
              <>
                Te quedan <b className="importe">{dinero(disponible)}</b>
                {global ? ' de presupuesto' : ''} para {dias} {dias === 1 ? 'día' : 'días'}: unos <b className="importe">{dinero(porDia)}</b> al día.
              </>
            ) : (
              <span style={{ color: 'var(--color-gasto)' }}>
                {global ? 'Has superado tu presupuesto' : 'Estás gastando más de lo que ingresas'} en {dinero(-disponible)}.
              </span>
            )}
          </p>
        )}
        {global && <div className="mt-2"><Barra porcentaje={global.importe ? r.gastos / global.importe : 0} /></div>}
      </section>

      {movimientos.length === 0 && (
        <section className="tarjeta p-6 text-center">
          <p className="text-4xl">👋</p>
          <p className="mt-2 font-semibold">Apunta tu primer gasto</p>
          <p className="texto-2 mt-1 text-sm">Pulsa el botón + de abajo, escribe el importe y toca una categoría. Así de rápido.</p>
          <button className="boton boton-primario mt-4" onClick={() => abrirEditor()}>
            Añadir gasto
          </button>
        </section>
      )}

      {/* Presupuestos */}
      {progreso.length > 0 && (
        <section className="tarjeta p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Presupuestos</h2>
            <button className="text-sm text-[var(--color-marca)]" onClick={() => ir('estadisticas')}>
              Ver todos
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {progreso.map((p) => {
              const c = categoriaPorId.get(p.presupuesto.categoriaId!);
              return (
                <div key={p.presupuesto.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>
                      {c?.icono} {c?.nombre}
                    </span>
                    <span className="importe texto-2">
                      {dinero(p.gastado, { sinDecimales: true })} / {dinero(p.presupuesto.importe, { sinDecimales: true })}
                    </span>
                  </div>
                  <Barra porcentaje={p.porcentaje} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gastos por categoría */}
      {porciones.length > 0 && (
        <section className="tarjeta p-4">
          <h2 className="mb-2 font-semibold">¿En qué gasto?</h2>
          <Anillo
            datos={porciones}
            onTocar={(id) => ir('movimientos', { categoriaId: id, periodo: true })}
            centro={
              <>
                <span className="texto-2 text-xs">Gastado</span>
                <span className="importe text-xl font-bold">{dinero(r.gastos, { sinDecimales: r.gastos >= 100000 })}</span>
              </>
            }
          />
          <ul className="mt-3 flex flex-col">
            {porciones.slice(0, 6).map((p) => (
              <li key={p.id}>
                <button className="flex w-full items-center gap-3 py-1.5 text-left" onClick={() => ir('movimientos', { categoriaId: p.id, periodo: true })}>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 truncate text-sm">
                    {categoriaPorId.get(p.id)?.icono} {p.nombre}
                  </span>
                  <span className="texto-2 text-xs">{Math.round((p.valor / r.gastos) * 100)} %</span>
                  <span className="importe w-24 text-right text-sm font-medium">{dinero(p.valor)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cuentas */}
      {cuentas.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 className="font-semibold">Cuentas</h2>
            <span className="importe texto-2 text-sm">Total {dinero(patrimonio)}</span>
          </div>
          <div className="sin-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {cuentas.map((c) => (
              <button key={c.id} className="tarjeta min-w-36 shrink-0 p-3 text-left" onClick={() => ir('movimientos', { cuentaId: c.id })}>
                <span className="text-xl">{c.icono}</span>
                <p className="texto-2 mt-1 truncate text-sm">{c.nombre}</p>
                <p className="importe font-semibold" style={{ color: (saldos.get(c.id) ?? 0) < 0 ? 'var(--color-gasto)' : undefined }}>
                  {dinero(saldos.get(c.id) ?? 0)}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Últimos movimientos */}
      {grupos.length > 0 && (
        <section className="tarjeta overflow-hidden py-2">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="font-semibold">Últimos movimientos</h2>
            <button className="text-sm text-[var(--color-marca)]" onClick={() => ir('movimientos', { periodo: true })}>
              Ver todos
            </button>
          </div>
          {grupos.map((g) => (
            <div key={g.fecha}>
              <div className="texto-2 flex justify-between px-4 pt-2 text-xs font-medium">
                <span>{fechaLarga(g.fecha)}</span>
                <span className="importe">{dinero(g.neto, { signo: true })}</span>
              </div>
              {g.items.map((m) => (
                <FilaMovimiento key={m.id} m={m} />
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
