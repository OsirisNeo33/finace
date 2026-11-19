import type { ReactNode } from 'react';
import { useNavegar, BotonAjustes } from '../navegacion';
import { Card, Chip, Cifra, IconBadge, Label, Page, PageHeader, Panel, PanelLink, ProgressBar, Segmented, Tile, cx } from '../components/ui';
import { IconoAlerta, IconoEscudo, IconoMoneda, IconoTarjeta, IconoTendencia } from '../components/Iconos';
import { useDatos } from '../contexto';
import type { Destino, Indicador } from '../domain/salud';
import { ESTADOS, NIVELES, usarFinanzas } from './usarFinanzas';
import { Deudas } from './finanzas/Deudas';
import { Inversiones } from './finanzas/Inversiones';

export type VistaFinanzas = 'resumen' | 'deudas' | 'inversiones';

const ICONOS: Record<Indicador['id'], ReactNode> = {
  ahorro: <IconoMoneda width={20} height={20} />,
  colchon: <IconoEscudo width={20} height={20} />,
  deuda: <IconoTarjeta width={20} height={20} />,
  caras: <IconoAlerta width={20} height={20} />,
  inversion: <IconoTendencia width={20} height={20} />,
};

export function Finanzas({ vista, setVista }: { vista: VistaFinanzas; setVista: (v: VistaFinanzas) => void }) {
  return (
    <>
      <PageHeader title="Mis finanzas" subtitle="Tu salud financiera, patrimonio, deudas e inversiones" action={<BotonAjustes />} />
      <Page>
        <Segmented
          label="Vista"
          value={vista}
          onChange={setVista}
          options={[
            { value: 'resumen', label: 'Resumen' },
            { value: 'deudas', label: 'Deudas' },
            { value: 'inversiones', label: 'Inversiones' },
          ]}
        />
        {vista === 'resumen' && <Resumen setVista={setVista} />}
        {vista === 'deudas' && <Deudas />}
        {vista === 'inversiones' && <Inversiones />}
      </Page>
    </>
  );
}

/** Tarjeta de la puntuación (también se usa en Hoy). */
export function TarjetaSalud({ onClick, compacta }: { onClick?: () => void; compacta?: boolean }) {
  const { salud } = usarFinanzas();
  const nivel = salud.nivel ? NIVELES[salud.nivel] : null;
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label>Salud financiera</Label>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="num text-[34px] leading-none font-semibold" data-testid="salud">
              {salud.puntos ?? '—'}
            </span>
            <span className="num text-[15px] text-muted">/100</span>
          </p>
        </div>
        {nivel ? <Chip tone={nivel.tono}>{nivel.texto}</Chip> : <Chip>Faltan datos</Chip>}
      </div>
      <div className="mt-3">
        <ProgressBar value={(salud.puntos ?? 0) / 100} tone={nivel?.tono === 'danger' ? 'danger' : nivel?.tono === 'warning' ? 'warning' : nivel?.tono === 'success' ? 'success' : 'brand'} />
      </div>
      {compacta ? (
        <p className="mt-3 text-[14px]">
          <span className="font-medium">{salud.consejos[0].titulo}</span>
          <span className="text-muted"> · Ver consejos ›</span>
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-muted">Calculada con tus últimos 3 meses, tus cuentas, deudas e inversiones.</p>
      )}
    </>
  );
  if (!onClick) return <Card>{contenido}</Card>;
  return (
    <button type="button" className="block w-full rounded-[26px] border border-border bg-surface p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition active:scale-[0.99]" onClick={onClick}>
      {contenido}
    </button>
  );
}

const TEXTO_DESTINO: Record<Destino, string> = { deudas: 'Ver deudas', inversiones: 'Ver inversiones', contabilidad: 'Ir a Contabilidad', movimientos: 'Ver movimientos' };

function Resumen({ setVista }: { setVista: (v: VistaFinanzas) => void }) {
  const { dinero } = useDatos();
  const ir = useNavegar();
  const { salud } = usarFinanzas();
  const c = salud.cifras;

  const irA = (d: Destino) => (d === 'deudas' || d === 'inversiones' ? setVista(d) : ir(d === 'contabilidad' ? 'pagos' : 'movimientos'));

  return (
    <>
      {/* Patrimonio neto: la tarjeta negra de la vista */}
      <Card dark>
        <p className="text-[13px] text-white/60">Patrimonio neto</p>
        <Cifra max={34} className="mt-1" data-testid="patrimonio">
          {dinero(c.patrimonio)}
        </Cifra>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]">
          <Linea texto="Dinero en cuentas" valor={dinero(c.cuentasTotal)} />
          <Linea texto="Inversiones" valor={dinero(c.inversiones)} onClick={() => setVista('inversiones')} />
          <Linea texto="Deudas" valor={dinero(-c.deudaTotal)} onClick={() => setVista('deudas')} />
        </div>
      </Card>

      <TarjetaSalud />

      <Panel title="Indicadores">
        {salud.indicadores.map((i) => {
          const e = ESTADOS[i.estado];
          return (
            <Tile key={i.id} className="items-start">
              <IconBadge tone={e.badge}>{ICONOS[i.id]}</IconBadge>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="text-[15px] font-medium">{i.nombre}</span>
                  <span className="num ml-auto text-[15px] font-semibold">{i.valor}</span>
                </span>
                <span className="mt-0.5 flex items-start justify-between gap-2">
                  <span className="text-[13px] leading-snug text-muted">{i.detalle}</span>
                  <Chip tone={e.tono} className="shrink-0">
                    {e.texto}
                  </Chip>
                </span>
              </span>
            </Tile>
          );
        })}
      </Panel>

      <Panel title="Qué te recomiendo" detail={`${salud.consejos.length} ${salud.consejos.length === 1 ? 'consejo' : 'consejos'}`} footer="Orientación general calculada con tus datos. No sustituye el asesoramiento personalizado de un profesional financiero.">
        {salud.consejos.map((k, n) => (
          <Tile key={k.id} className="items-start" data-consejo={k.id}>
            <span className={cx('num flex size-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold', n === 0 ? 'bg-brand text-on-brand' : 'bg-brand-soft text-brand')}>{n + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{k.titulo}</span>
              <span className="mt-0.5 block text-[14px] leading-snug text-muted">{k.texto}</span>
              {k.destino && (
                <span className="mt-1 block">
                  <PanelLink onClick={() => irA(k.destino!)}>{TEXTO_DESTINO[k.destino]} ›</PanelLink>
                </span>
              )}
            </span>
          </Tile>
        ))}
      </Panel>
    </>
  );
}

function Linea({ texto, valor, onClick }: { texto: string; valor: string; onClick?: () => void }) {
  const dentro = (
    <>
      <span className="text-white/70">{texto}</span>
      <span className="num font-semibold">{valor}</span>
    </>
  );
  return onClick ? (
    <button type="button" className="-my-1.5 flex min-h-10 w-full items-center justify-between gap-3 text-left" onClick={onClick}>
      {dentro}
    </button>
  ) : (
    <div className="flex items-center justify-between gap-3">{dentro}</div>
  );
}
