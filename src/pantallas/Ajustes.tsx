import { useEffect, useRef, useState } from 'react';
import { useDatos } from '../contexto';
import { Button, Emoji, Page, PageHeader, Panel, Segmented, SelectField, Tile, TileButton } from '../components/ui';
import { guardarAjustes, exportarCSV, exportarJSON, importarJSON, borrarTodo, descargar } from '../db/acciones';
import { hoyISO } from '../domain/fechas';
import { Cuentas } from './ajustes/Cuentas';
import { Categorias } from './ajustes/Categorias';
import { Presupuestos } from './ajustes/Presupuestos';
import { Recurrentes } from './ajustes/Recurrentes';

type Sub = 'cuentas' | 'categorias' | 'presupuestos' | 'recurrentes' | null;

export const MONEDAS = [
  ['EUR', 'Euro (€)'],
  ['USD', 'Dólar estadounidense ($)'],
  ['MXN', 'Peso mexicano ($)'],
  ['COP', 'Peso colombiano ($)'],
  ['ARS', 'Peso argentino ($)'],
  ['CLP', 'Peso chileno ($)'],
  ['PEN', 'Sol peruano (S/)'],
  ['GBP', 'Libra esterlina (£)'],
  ['CHF', 'Franco suizo'],
];

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
}

export function Ajustes({ irA }: { irA: (p: 'logros') => void }) {
  const [sub, setSub] = useState<Sub>(null);
  const { ajustes, cuentas, categorias, avisar } = useDatos();
  const archivo = useRef<HTMLInputElement>(null);
  const [instalar, setInstalar] = useState<EventoInstalar | null>(null);

  useEffect(() => {
    const f = (e: Event) => {
      e.preventDefault();
      setInstalar(e as EventoInstalar);
    };
    window.addEventListener('beforeinstallprompt', f);
    return () => window.removeEventListener('beforeinstallprompt', f);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sub]);

  if (sub) {
    const titulos = { cuentas: 'Cuentas', categorias: 'Categorías', presupuestos: 'Presupuestos', recurrentes: 'Recurrentes' };
    const subtitulos = { cuentas: 'Tus bancos, efectivo y tarjetas', categorias: 'Cómo agrupas tus gastos e ingresos', presupuestos: 'Límites mensuales de gasto', recurrentes: 'Nómina, alquiler, suscripciones…' };
    return (
      <>
        <PageHeader title={titulos[sub]} subtitle={subtitulos[sub]} back={{ label: 'Ajustes', onClick: () => setSub(null) }} />
        <Page>
          {sub === 'cuentas' && <Cuentas />}
          {sub === 'categorias' && <Categorias />}
          {sub === 'presupuestos' && <Presupuestos />}
          {sub === 'recurrentes' && <Recurrentes />}
        </Page>
      </>
    );
  }

  async function restaurar(f: File) {
    try {
      const copia = JSON.parse(await f.text());
      if (!confirm('Esto sustituirá TODOS tus datos actuales por los de la copia. ¿Continuar?')) return;
      await importarJSON(copia);
      avisar('Copia restaurada');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo leer el archivo.');
    }
  }

  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalada = window.matchMedia('(display-mode: standalone)').matches || 'Capacitor' in window;

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Organización, preferencias y tus datos" />
      <Page>
        <Panel title="Organización">
          <TileButton icon={<Emoji>🏆</Emoji>} title="Logros y nivel" chevron onClick={() => irA('logros')} />
          <TileButton icon={<Emoji>🏦</Emoji>} title="Cuentas" detail={<span className="num">{cuentas.length}</span>} chevron onClick={() => setSub('cuentas')} />
          <TileButton icon={<Emoji>🏷️</Emoji>} title="Categorías" detail={<span className="num">{categorias.length}</span>} chevron onClick={() => setSub('categorias')} />
          <TileButton icon={<Emoji>🎯</Emoji>} title="Presupuestos" chevron onClick={() => setSub('presupuestos')} />
          <TileButton icon={<Emoji>🔁</Emoji>} title="Recurrentes" subtitle="Nómina, alquiler, suscripciones…" chevron onClick={() => setSub('recurrentes')} />
        </Panel>

        <Panel title="Preferencias">
          <SelectField label="Moneda" value={ajustes.moneda} onChange={(e) => guardarAjustes({ moneda: e.target.value })}>
            {MONEDAS.map(([c, n]) => (
              <option key={c} value={c}>
                {n}
              </option>
            ))}
          </SelectField>
          <SelectField label="El mes empieza el día" hint="Útil si cobras, por ejemplo, el día 25." value={ajustes.diaInicioMes} onChange={(e) => guardarAjustes({ diaInicioMes: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </SelectField>
          <Tile className="flex-col items-stretch gap-2">
            <span className="text-[12px] font-medium text-muted">Tema</span>
            <Segmented
              label="Tema"
              value={ajustes.tema}
              onChange={(t) => guardarAjustes({ tema: t })}
              options={[
                { value: 'sistema', label: 'Sistema' },
                { value: 'claro', label: 'Claro' },
                { value: 'oscuro', label: 'Oscuro' },
              ]}
            />
          </Tile>
        </Panel>

        <Panel title="Tus datos" footer="Todo se guarda solo en este dispositivo. Haz una copia de seguridad de vez en cuando (por ejemplo, a Google Drive o iCloud) para no perder nada si cambias de móvil.">
          <TileButton icon={<Emoji>📊</Emoji>} title="Exportar a Excel (CSV)" chevron onClick={async () => descargar(`finace-${hoyISO()}.csv`, await exportarCSV(), 'text/csv;charset=utf-8').catch(() => {})} />
          <TileButton
            icon={<Emoji>💾</Emoji>}
            title="Crear copia de seguridad"
            detail={ajustes.copias ? <span className="num">{ajustes.copias} hechas</span> : undefined}
            chevron
            onClick={async () => {
              try {
                await descargar(`finace-copia-${hoyISO()}.json`, JSON.stringify(await exportarJSON()), 'application/json');
                await guardarAjustes({ copias: (ajustes.copias ?? 0) + 1 });
                avisar('Copia creada');
              } catch {
                /* el usuario cerró el menú Compartir */
              }
            }}
          />
          <TileButton icon={<Emoji>📥</Emoji>} title="Restaurar copia de seguridad" chevron onClick={() => archivo.current?.click()} />
          <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && restaurar(e.target.files[0]).finally(() => (e.target.value = ''))} />
        </Panel>

        {!instalada && (
          <Panel title="Instalar en el móvil">
            {instalar ? (
              <Button className="w-full" onClick={() => instalar.prompt().then(() => setInstalar(null))}>
                Instalar Finace
              </Button>
            ) : (
              <Tile>
                <p className="text-[14px] text-muted">
                  {esIOS ? (
                    <>
                      En Safari, toca <b className="text-text">Compartir</b> y luego <b className="text-text">«Añadir a pantalla de inicio»</b>. Se abrirá como una app y funcionará sin conexión.
                    </>
                  ) : (
                    <>
                      En Chrome, abre el menú <b className="text-text">⋮</b> y elige <b className="text-text">«Instalar aplicación»</b> o <b className="text-text">«Añadir a pantalla de inicio»</b>.
                    </>
                  )}
                </p>
              </Tile>
            )}
          </Panel>
        )}

        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (!confirm('¿Seguro que quieres borrar TODOS tus datos? No se puede deshacer.')) return;
            if (!confirm('Última confirmación: se borrarán cuentas, categorías y movimientos.')) return;
            await borrarTodo();
          }}
        >
          Borrar todos los datos
        </Button>

        <p className="pt-2 text-center text-[12px] text-muted">Finace · sin anuncios, sin cuentas, tus datos en tu dispositivo</p>
      </Page>
    </>
  );
}
