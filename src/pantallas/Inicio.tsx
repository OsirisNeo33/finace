import { BotonAjustes } from '../navegacion';
import { TarjetaSalud, TarjetaTeDeben } from './Finanzas';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { FormCuenta, TIPOS_CUENTA } from './ajustes/Cuentas';
import type { Cuenta } from '../domain/tipos';
import { addDays, format, startOfISOWeek } from 'date-fns';
import { TiraSemana } from '../components/TiraSemana';
import { es } from 'date-fns/locale';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { IconoBajar, IconoCalendario, IconoMas, IconoSubir, IconoTransferir } from '../components/Iconos';
import { Cifra, LogoCuenta, Button, Card, CardTitle, Chip, Emoji, EmptyState, Label, Page, PageHeader, Panel, PanelLink, ProgressBar, Tile, TileButton, cx, tonoPresupuesto } from '../components/ui';
import { agruparPorDia, enPeriodo, progresoPresupuestos, resumen, saldosCuentas, totalesPorCategoria } from '../domain/calculos';
import { aISO, diasRestantes, fechaLarga, hoyISO } from '../domain/fechas';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { PropsPantalla } from './tipos';
import { usarPagos } from './usarPagos';
import { usarJuego } from './usarJuego';
import { FilaPago } from './Pagos';

export function Inicio({ periodo, desplazamiento, setDesplazamiento, ir }: PropsPantalla) {
  const { movimientos, cuentas, todasCuentas, categoriaPorId, dinero, ajustes, abrirEditor } = useDatos();
  const hoy = hoyISO();
  const { pagos } = usarPagos(aISO(addDays(new Date(), -31)), aISO(addDays(new Date(), 7)));
  const proximos = pagos.filter((p) => (p.fecha >= hoy && p.estado !== 'pagado') || p.estado === 'vencido').slice(0, 4);
  const [cuentaAbierta, setCuentaAbierta] = useState<Cuenta | 'nueva' | null>(null);
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

  const porCategoria = useMemo(
    () =>
      [...totalesPorCategoria(movsPeriodo, 'gasto')]
        .map(([id, valor]) => {
          const c = categoriaPorId.get(id);
          return { id, valor, nombre: c?.nombre ?? 'Sin categoría', icono: c?.icono ?? '❔' };
        })
        .sort((a, b) => b.valor - a.valor),
    [movsPeriodo, categoriaPorId],
  );

  const juego = usarJuego();
  const reto = juego.retos.find((r) => !r.completado);
  const lunes = aISO(startOfISOWeek(new Date()));
  const diasConMovs = useMemo(() => new Set(movimientos.filter((m) => m.fecha >= lunes).map((m) => m.fecha)), [movimientos, lunes]);
  const movsSemana = movimientos.filter((m) => m.fecha >= lunes && m.fecha <= hoy).length;

  // Los 5 movimientos más recientes, agrupados por día
  const recientes = useMemo(() => {
    let quedan = 5;
    return agruparPorDia(movsPeriodo)
      .map((g) => {
        const items = g.items.slice(0, quedan);
        quedan -= items.length;
        return { ...g, items };
      })
      .filter((g) => g.items.length > 0);
  }, [movsPeriodo]);
  const hayDatos = movimientos.length > 0;

  return (
    <>
      <PageHeader title={saludo()} action={<BotonAjustes />} subtitle={<span className="inline-block first-letter:uppercase">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>} />
      <Page>
        <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />

        {/* 1. ¿Cómo voy este mes? La tarjeta negra de la pantalla */}
        <Card dark>
          <p className="text-[13px] text-white/60">{esActual ? 'Balance de este mes' : 'Balance del mes'}</p>
          <Cifra max={34} className="mt-1" data-testid="balance">{dinero(r.balance)}</Cifra>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <button type="button" className="min-w-0 rounded-xl text-left tarjeta-tactil" onClick={() => ir('movimientos', { tipo: 'ingreso', periodo: true })} aria-label="Ver ingresos del mes">
              <span className="flex items-center gap-1 text-[13px] text-white/60">
                <IconoSubir width={14} height={14} className="text-success" /> Ingresos
              </span>
              <Cifra max={20} className="mt-0.5">{dinero(r.ingresos, { signo: true })}</Cifra>
            </button>
            <button type="button" className="min-w-0 rounded-xl text-left tarjeta-tactil" onClick={() => ir('movimientos', { tipo: 'gasto', periodo: true })} aria-label="Ver gastos del mes">
              <span className="flex items-center gap-1 text-[13px] text-white/60">
                <IconoBajar width={14} height={14} className="text-danger" /> Gastos
              </span>
              <Cifra max={20} className="mt-0.5" data-testid="gastos">{dinero(-r.gastos)}</Cifra>
            </button>
          </div>
          {esActual && dias > 0 && (r.ingresos > 0 || global) && (
            <p className="mt-4 rounded-2xl bg-white/8 px-3.5 py-2.5 text-[14px] text-white/80">
              {disponible > 0 ? (
                <>
                  Te quedan <b className="num text-white">{dinero(disponible)}</b>
                  {global ? ' de presupuesto' : ''} para {dias} {dias === 1 ? 'día' : 'días'}: unos <b className="num text-white">{dinero(porDia)}</b> al día.
                </>
              ) : (
                <span className="font-medium text-danger">
                  {global ? 'Has superado tu presupuesto' : 'Estás gastando más de lo que ingresas'} en {dinero(-disponible)}.
                </span>
              )}
            </p>
          )}
          {global && (
            <div className="mt-3">
              <ProgressBar value={global.importe ? r.gastos / global.importe : 0} tone={tonoPresupuesto(global.importe ? r.gastos / global.importe : 0)} />
            </div>
          )}
        </Card>

        {/* 2. Acciones rápidas: lo que más se hace, a un toque */}
        {esActual && (
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Acciones rápidas">
            <Accion etiqueta="Gasto" tono="danger" onClick={() => abrirEditor({ tipo: 'gasto' })}>
              <IconoBajar width={20} height={20} />
            </Accion>
            <Accion etiqueta="Ingreso" tono="success" onClick={() => abrirEditor({ tipo: 'ingreso' })}>
              <IconoSubir width={20} height={20} />
            </Accion>
            <Accion etiqueta="Mover" tono="brand" onClick={() => abrirEditor({ tipo: 'transferencia' })} disabled={cuentas.length < 2} aria-label="Transferir entre cuentas">
              <IconoTransferir width={20} height={20} />
            </Accion>
            <Accion etiqueta="Pagos" tono="warning" onClick={() => ir('calendario')} aria-label="Ver calendario de pagos">
              <IconoCalendario width={20} height={20} />
            </Accion>
          </div>
        )}

        {!hayDatos && (
          <EmptyState icon="👋" title="Apunta tu primer gasto">
            <p>Toca «Gasto» arriba o el botón + de abajo, escribe el importe y elige una categoría. Así de rápido.</p>
            <Button className="mx-auto mt-4" onClick={() => abrirEditor()}>
              Añadir gasto
            </Button>
          </EmptyState>
        )}

        {/* 3. Lo urgente: pagos que vencen pronto */}
        {proximos.length > 0 && esActual && (
          <Panel title="Próximos pagos" detail={<PanelLink onClick={() => ir('calendario')}>Ver calendario</PanelLink>}>
            {proximos.map((p) => (
              <FilaPago key={p.clave} p={p} mostrarFecha onEditar={() => ir('calendario')} />
            ))}
          </Panel>
        )}

        {/* 4. Lo último que he apuntado */}
        {recientes.length > 0 && (
          <Panel title="Últimos movimientos" detail={<PanelLink onClick={() => ir('movimientos', { periodo: true })}>Ver todos</PanelLink>}>
            {recientes.map((g) => (
              <div key={g.fecha} className="space-y-1.5">
                <div className="flex justify-between px-3 pt-1.5 text-[12px] font-medium text-muted">
                  <span className="first-letter:uppercase">{fechaLarga(g.fecha)}</span>
                  <span className="num">{dinero(g.neto, { signo: true })}</span>
                </div>
                {g.items.map((m) => (
                  <FilaMovimiento key={m.id} m={m} />
                ))}
              </div>
            ))}
          </Panel>
        )}

        {!esActual && movsPeriodo.length === 0 && hayDatos && (
          <Card className="text-center">
            <CardTitle>Sin movimientos</CardTitle>
            <Label>No apuntaste nada en este mes.</Label>
          </Card>
        )}

        {/* 5. ¿En qué se me va el dinero? */}
        {porCategoria.length > 0 && (
          <Panel title="¿En qué gasto?" detail={<PanelLink onClick={() => ir('estadisticas')}>Ver análisis</PanelLink>}>
            {porCategoria.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full flex-col gap-2 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2"
                onClick={() => ir('movimientos', { categoriaId: p.id, periodo: true })}
              >
                <span className="flex w-full items-center gap-3">
                  <Emoji>{p.icono}</Emoji>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{p.nombre}</span>
                  <span className="num text-[12px] text-muted">{Math.round((p.valor / r.gastos) * 100)} %</span>
                  <span className="num text-[15px] font-semibold">{dinero(p.valor)}</span>
                </span>
                <ProgressBar value={p.valor / porCategoria[0].valor} />
              </button>
            ))}
          </Panel>
        )}

        {/* 6. Presupuestos más ajustados */}
        {progreso.length > 0 && (
          <Panel title="Presupuestos" detail={<PanelLink onClick={() => ir('estadisticas')}>Ver todos</PanelLink>}>
            {progreso.map((p) => {
              const c = categoriaPorId.get(p.presupuesto.categoriaId!);
              return (
                <Tile key={p.presupuesto.id} className="flex-col items-stretch gap-2">
                  <span className="flex items-center gap-3">
                    <Emoji>{c?.icono}</Emoji>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{c?.nombre}</span>
                    <span className="num text-[13px] text-muted">
                      {dinero(p.gastado, { sinDecimales: true })} / {dinero(p.presupuesto.importe, { sinDecimales: true })}
                    </span>
                  </span>
                  <ProgressBar value={p.porcentaje} tone={tonoPresupuesto(p.porcentaje)} />
                </Tile>
              );
            })}
          </Panel>
        )}

        {/* 7. Mi dinero: cuentas */}
        <Panel title="Mis cuentas" detail={<span className="num">Total {dinero(patrimonio)}</span>} footer="Toca una cuenta para actualizar su saldo.">
          {cuentas.map((c) => {
            const saldo = saldos.get(c.id) ?? 0;
            return (
              <TileButton
                key={c.id}
                icon={<LogoCuenta nombre={c.nombre} icono={c.icono} />}
                title={c.nombre}
                subtitle={TIPOS_CUENTA.find((t) => t[0] === c.tipo)?.[1]}
                detail={<span className={cx('num text-[15px] font-semibold', saldo < 0 ? 'text-danger' : 'text-text')}>{dinero(saldo)}</span>}
                chevron
                onClick={() => setCuentaAbierta(c)}
                aria-label={`${c.nombre}: actualizar saldo`}
              />
            );
          })}
          <TileButton
            icon={
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <IconoMas width={20} height={20} />
              </span>
            }
            title={<span className="text-brand">Añadir banco</span>}
            onClick={() => setCuentaAbierta('nueva')}
          />
        </Panel>
        {cuentaAbierta && <FormCuenta cuenta={cuentaAbierta === 'nueva' ? undefined : cuentaAbierta} onCerrar={() => setCuentaAbierta(null)} />}

        {/* 8. Salud financiera y lo que me deben */}
        {hayDatos && esActual && <TarjetaSalud compacta onClick={() => ir('finanzas')} />}
        {esActual && <TarjetaTeDeben onClick={() => ir('cobros')} />}

        {/* 9. Constancia: reto de la semana y días apuntados */}
        {hayDatos && esActual && (
          <button type="button" className="block w-full rounded-[26px] border border-border bg-surface p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] tarjeta-tactil" onClick={() => ir('logros')} aria-label={`${reto ? `Reto de la semana: ${reto.nombre}` : 'Retos completados'}. Ver logros`}>
            <span className="flex items-center gap-3">
              <Emoji>{reto ? reto.icono : '🏆'}</Emoji>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-muted">{reto ? 'Reto de la semana' : `Nivel ${juego.nivel} · ${juego.nombre}`}</span>
                <span className="block truncate text-[15px] font-medium">{reto ? reto.nombre : '¡Retos de la semana completados!'}</span>
              </span>
              <Chip tone="brand" className="num">
                {reto ? `+${reto.xp} XP` : `${juego.xpEnNivel}/${juego.xpParaSubir}`}
              </Chip>
            </span>
            <span className="mt-3 flex items-center gap-3">
              <span className="flex-1">
                <ProgressBar value={reto ? reto.actual / reto.meta : juego.progreso} />
              </span>
              {reto && (
                <span className="num text-[12px] text-muted">
                  {reto.actual}/{reto.meta}
                </span>
              )}
            </span>
          </button>
        )}
        {hayDatos && esActual && <TiraSemana hoy={hoy} ocupados={diasConMovs} detalle={`${movsSemana} ${movsSemana === 1 ? 'movimiento' : 'movimientos'} esta semana`} />}
      </Page>
    </>
  );
}

function saludo() {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

const TONOS_ACCION = {
  danger: 'bg-danger-soft text-danger',
  success: 'bg-success-soft text-success',
  brand: 'bg-brand-soft text-brand',
  warning: 'bg-warning-soft text-warning',
} as const;

/** Botón de acción rápida: icono de color con su etiqueta debajo. */
function Accion({ etiqueta, tono, children, ...props }: Omit<ComponentProps<'button'>, 'children'> & { etiqueta: string; tono: keyof typeof TONOS_ACCION; children: ReactNode }) {
  return (
    <button type="button" {...props} className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[20px] border border-border bg-surface px-1 py-2.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(16,24,40,0.04)] tarjeta-tactil disabled:opacity-40">
      <span className={cx('flex size-9 items-center justify-center rounded-xl', TONOS_ACCION[tono])}>{children}</span>
      {etiqueta}
    </button>
  );
}
