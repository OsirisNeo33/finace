import { useMemo, useState } from 'react';
import { useDatos } from '../contexto';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { IconoCerrar, IconoLista } from '../components/Iconos';
import { Cifra, Button, Card, Chip, ChipButton, ChipSelect, EmptyState, Label, Page, PageHeader, Panel, SearchField } from '../components/ui';
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
    <>
      <PageHeader title="Movimientos" subtitle={`${filtrados.length} ${filtrados.length === 1 ? 'movimiento' : 'movimientos'}${hayFiltros || filtro.periodo ? ' con estos filtros' : ''}`} />
      <Page>
        <SearchField placeholder="Buscar por nota, categoría, importe…" value={filtro.texto ?? ''} onChange={(e) => set({ texto: e.target.value })} />

        <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <ChipButton active={!filtro.periodo} onClick={() => set({ periodo: false })}>
            Todo
          </ChipButton>
          <ChipButton active={!!filtro.periodo} onClick={() => set({ periodo: true })}>
            Por mes
          </ChipButton>
          <span className="mx-1 w-px shrink-0 bg-border" />
          {(['gasto', 'ingreso', 'transferencia'] as const).map((t) => (
            <ChipButton key={t} active={filtro.tipo === t} onClick={() => set({ tipo: filtro.tipo === t ? undefined : t })}>
              {t === 'gasto' ? 'Gastos' : t === 'ingreso' ? 'Ingresos' : 'Transferencias'}
            </ChipButton>
          ))}
          <ChipSelect active={!!filtro.categoriaId} value={filtro.categoriaId ?? ''} onChange={(e) => set({ categoriaId: e.target.value || undefined })} aria-label="Categoría">
            <option value="">Categoría ▾</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono} {c.nombre} ({c.tipo})
              </option>
            ))}
          </ChipSelect>
          {cuentas.length > 1 && (
            <ChipSelect active={!!filtro.cuentaId} value={filtro.cuentaId ?? ''} onChange={(e) => set({ cuentaId: e.target.value || undefined })} aria-label="Cuenta">
              <option value="">Cuenta ▾</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </ChipSelect>
          )}
          {etiquetas.length > 0 && (
            <ChipSelect active={!!filtro.etiqueta} value={filtro.etiqueta ?? ''} onChange={(e) => set({ etiqueta: e.target.value || undefined })} aria-label="Etiqueta">
              <option value="">#Etiqueta ▾</option>
              {etiquetas.map((e) => (
                <option key={e} value={e}>
                  #{e}
                </option>
              ))}
            </ChipSelect>
          )}
          {hayFiltros && (
            <ChipButton onClick={() => setFiltro({ periodo: filtro.periodo })}>
              <IconoCerrar width={14} height={14} /> Limpiar
            </ChipButton>
          )}
        </div>

        {filtro.periodo && <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />}

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <Label>Ingresos</Label>
            <Cifra max={22} className="mt-1">{dinero(r.ingresos)}</Cifra>
          </Card>
          <Card className="p-4">
            <Label>Gastos</Label>
            <Cifra max={22} className="mt-1">{dinero(r.gastos)}</Cifra>
            <Chip tone={r.balance < 0 ? 'danger' : 'success'} className="num mt-1.5">
              Balance {dinero(r.balance, { signo: true })}
            </Chip>
          </Card>
        </div>

        {grupos.length === 0 ? (
          <EmptyState icon={<IconoLista />} title={hayFiltros ? 'Nada con estos filtros' : 'Aún no hay movimientos'}>
            {hayFiltros ? 'Prueba con otra búsqueda o pulsa «Limpiar».' : 'Pulsa el botón + para apuntar tu primer gasto o ingreso.'}
          </EmptyState>
        ) : (
          <>
            {grupos.slice(0, limite).map((g) => (
              <Panel key={g.fecha} title={<span className="first-letter:uppercase">{fechaLarga(g.fecha)}</span>} detail={<span className="num">{dinero(g.neto, { signo: true })}</span>}>
                {g.items.map((m) => (
                  <FilaMovimiento key={m.id} m={m} />
                ))}
              </Panel>
            ))}
            {grupos.length > limite && (
              <Button variant="secondary" className="w-full" onClick={() => setLimite(limite + 30)}>
                Ver más
              </Button>
            )}
          </>
        )}
      </Page>
    </>
  );
}
