import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useDatos } from '../contexto';
import { IconoAtras, IconoSiguiente } from '../components/Iconos';
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

export function Ajustes() {
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
    const titulos = { cuentas: 'Cuentas', categorias: 'Categorías', presupuestos: 'Presupuestos', recurrentes: 'Movimientos recurrentes' };
    return (
      <div className="flex flex-col gap-3 px-4 pt-4">
        <button className="texto-2 -ml-2 flex items-center gap-1 self-start text-sm" onClick={() => setSub(null)}>
          <IconoAtras width={18} height={18} /> Ajustes
        </button>
        <h1 className="text-2xl font-bold tracking-tight">{titulos[sub]}</h1>
        {sub === 'cuentas' && <Cuentas />}
        {sub === 'categorias' && <Categorias />}
        {sub === 'presupuestos' && <Presupuestos />}
        {sub === 'recurrentes' && <Recurrentes />}
      </div>
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
  const instalada = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>

      <Grupo titulo="Organización">
        <Fila icono="🏦" texto="Cuentas" detalle={String(cuentas.length)} onClick={() => setSub('cuentas')} />
        <Fila icono="🏷️" texto="Categorías" detalle={String(categorias.length)} onClick={() => setSub('categorias')} />
        <Fila icono="🎯" texto="Presupuestos" onClick={() => setSub('presupuestos')} />
        <Fila icono="🔁" texto="Recurrentes" detalle="Nómina, alquiler, suscripciones…" onClick={() => setSub('recurrentes')} />
      </Grupo>

      <Grupo titulo="Preferencias">
        <label className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">💱</span>
          <span className="flex-1">Moneda</span>
          <select className="campo w-auto py-1.5" value={ajustes.moneda} onChange={(e) => guardarAjustes({ moneda: e.target.value })}>
            {MONEDAS.map(([c, n]) => (
              <option key={c} value={c}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">📆</span>
          <span className="flex-1">
            El mes empieza el día
            <span className="texto-2 block text-xs">Útil si cobras, por ejemplo, el día 25</span>
          </span>
          <select className="campo w-auto py-1.5" value={ajustes.diaInicioMes} onChange={(e) => guardarAjustes({ diaInicioMes: Number(e.target.value) })}>
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="text-xl">🌓</span>
          <span className="flex-1">Tema</span>
          <div className="flex gap-1">
            {(['sistema', 'claro', 'oscuro'] as const).map((t) => (
              <button key={t} className="chip" aria-pressed={ajustes.tema === t} onClick={() => guardarAjustes({ tema: t })}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Grupo>

      <Grupo titulo="Tus datos" pie="Todo se guarda solo en este dispositivo. Haz una copia de seguridad de vez en cuando (por ejemplo, a Google Drive o iCloud) para no perder nada si cambias de móvil.">
        <Fila icono="📊" texto="Exportar a Excel (CSV)" onClick={async () => descargar(`finace-${hoyISO()}.csv`, await exportarCSV(), 'text/csv;charset=utf-8')} />
        <Fila
          icono="💾"
          texto="Crear copia de seguridad"
          onClick={async () => {
            descargar(`finace-copia-${hoyISO()}.json`, JSON.stringify(await exportarJSON()), 'application/json');
            avisar('Copia descargada');
          }}
        />
        <Fila icono="📥" texto="Restaurar copia de seguridad" onClick={() => archivo.current?.click()} />
        <input ref={archivo} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && restaurar(e.target.files[0]).finally(() => (e.target.value = ''))} />
        <Fila
          icono="🗑️"
          texto="Borrar todos los datos"
          peligro
          onClick={async () => {
            if (!confirm('¿Seguro que quieres borrar TODOS tus datos? No se puede deshacer.')) return;
            if (!confirm('Última confirmación: se borrarán cuentas, categorías y movimientos.')) return;
            await borrarTodo();
          }}
        />
      </Grupo>

      {!instalada && (
        <Grupo titulo="Instalar en el móvil">
          <div className="px-4 py-3 text-sm">
            {instalar ? (
              <button className="boton boton-primario w-full" onClick={() => instalar.prompt().then(() => setInstalar(null))}>
                📲 Instalar Finace
              </button>
            ) : esIOS ? (
              <p>
                En Safari, toca <b>Compartir</b> <span aria-hidden>⬆️</span> y luego <b>«Añadir a pantalla de inicio»</b>. Se abrirá como una app y funcionará sin conexión.
              </p>
            ) : (
              <p>
                En Chrome, abre el menú <b>⋮</b> y elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.
              </p>
            )}
          </div>
        </Grupo>
      )}

      <p className="texto-2 pb-4 text-center text-xs">Finace · sin anuncios, sin cuentas, tus datos en tu dispositivo</p>
    </div>
  );
}

export function Grupo({ titulo, pie, children }: { titulo?: string; pie?: string; children: ReactNode }) {
  return (
    <section>
      {titulo && <h2 className="texto-2 mb-1.5 px-1 text-xs font-semibold tracking-wide uppercase">{titulo}</h2>}
      <div className="tarjeta divide-y overflow-hidden" style={{ borderColor: 'var(--borde)' }}>
        {children}
      </div>
      {pie && <p className="texto-2 mt-1.5 px-1 text-xs">{pie}</p>}
    </section>
  );
}

export function Fila({ icono, texto, detalle, onClick, peligro }: { icono?: ReactNode; texto: ReactNode; detalle?: ReactNode; onClick: () => void; peligro?: boolean }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3 text-left active:opacity-60" style={{ borderColor: 'var(--borde)', color: peligro ? 'var(--color-gasto)' : undefined }} onClick={onClick}>
      {icono && <span className="text-xl">{icono}</span>}
      <span className="min-w-0 flex-1 truncate">{texto}</span>
      {detalle && <span className="texto-2 max-w-[45%] truncate text-sm">{detalle}</span>}
      <IconoSiguiente className="texto-2 shrink-0" width={18} height={18} />
    </button>
  );
}
