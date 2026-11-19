import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora, CATEGORIA_DEVOLUCIONES } from '../../db/db';
import { compartirTexto, crearMovimiento } from '../../db/acciones';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, hoyISO } from '../../domain/fechas';
import { devolucionesDe, mensajeRecordatorio, pendienteCobro, porPersona, type Persona } from '../../domain/cobros';
import type { Cobro } from '../../domain/tipos';
import { Hoja } from '../../components/Hoja';
import { AmountField, Button, Card, Chip, ChipButton, Cifra, EmptyState, Field, Panel, Tile, Toggle, cx } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';

const aTexto = (c: number) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
const hace = (dias: number) => (dias === 0 ? 'desde hoy' : dias === 1 ? 'desde ayer' : `hace ${dias} días`);

/** Cuadradito con las iniciales de la persona. */
function Iniciales({ nombre }: { nombre: string }) {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-[12px] font-semibold text-brand">{letras || '?'}</span>;
}

export function MeDeben() {
  const { movimientos, dinero } = useDatos();
  const { cobros } = usarFinanzas();
  const [nuevo, setNuevo] = useState<{ persona?: string } | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const personas = useMemo(() => porPersona(cobros, movimientos), [cobros, movimientos]);
  const total = personas.reduce((s, p) => s + p.pendiente, 0);
  const saldados = cobros.filter((c) => pendienteCobro(c, movimientos) === 0).sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn));
  const persona = personas.find((p) => p.nombre.toLowerCase() === abierta);
  const antigua = personas.reduce((m, p) => Math.max(m, p.dias), 0);

  return (
    <>
      <Card dark>
        <p className="text-[13px] text-white/60">Te deben en total</p>
        <Cifra max={34} className="mt-1" data-testid="te-deben">
          {dinero(total)}
        </Cifra>
        {personas.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]">
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Personas</span>
              <span className="num font-semibold">{personas.length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Lo más antiguo</span>
              <span className="font-semibold">{hace(antigua)}</span>
            </div>
          </div>
        )}
      </Card>

      <Button className="w-full" onClick={() => setNuevo({})}>
        + Alguien me debe dinero
      </Button>

      {personas.length === 0 ? (
        <EmptyState icon="🤝" title="Nadie te debe nada">
          Apunta aquí cuando prestes dinero o pagues la parte de otra persona (una cena, unas entradas, un regalo compartido…). Te ayuda a acordarte y a recordárselo.
        </EmptyState>
      ) : (
        <Panel title="Quién te debe" detail="de más a menos" footer="Toca una persona para ver el detalle, cobrar o enviarle un recordatorio.">
          {personas.map((p) => (
            <button
              key={p.nombre}
              type="button"
              className="flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2"
              onClick={() => setAbierta(p.nombre.toLowerCase())}
              aria-label={`${p.nombre}: te debe ${dinero(p.pendiente)}`}
            >
              <Iniciales nombre={p.nombre} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{p.nombre}</span>
                <span className="block truncate text-[13px] text-muted">
                  {p.cobros.length === 1 ? p.cobros[0].concepto : `${p.cobros.length} cosas`} · {hace(p.dias)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="num text-[15px] font-semibold">{dinero(p.pendiente)}</span>
                {p.dias >= 30 && <Chip tone="warning">Reclamar</Chip>}
              </span>
            </button>
          ))}
        </Panel>
      )}

      {saldados.length > 0 && (
        <Panel title="Ya te lo devolvieron" detail={<span className="num">{saldados.length}</span>}>
          {saldados.slice(0, 5).map((c) => (
            <Tile key={c.id} className="opacity-80">
              <Iniciales nombre={c.persona} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{c.persona}</span>
                <span className="block truncate text-[13px] text-muted">{c.concepto}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="num text-[15px] text-muted">{dinero(c.importe)}</span>
                <Chip tone="success">Devuelto</Chip>
              </span>
            </Tile>
          ))}
        </Panel>
      )}

      {persona && <DetallePersona p={persona} onCerrar={() => setAbierta(null)} onAnadir={() => (setAbierta(null), setNuevo({ persona: persona.nombre }))} />}
      {nuevo && <FormCobro persona={nuevo.persona} onCerrar={() => setNuevo(null)} />}
    </>
  );
}

function DetallePersona({ p, onCerrar, onAnadir }: { p: Persona; onCerrar: () => void; onAnadir: () => void }) {
  const { movimientos, dinero, categorias, cuentas, ajustes, avisar } = useDatos();
  const [cobrando, setCobrando] = useState<string | null>(p.cobros.length === 1 ? p.cobros[0].id : null);
  const elegido = p.cobros.find((c) => c.id === cobrando);
  const [importe, setImporte] = useState(elegido ? aTexto(elegido.pendiente) : '');
  const [comoIngreso, setComoIngreso] = useState(true);
  const categoriaId = categorias.find((c) => c.tipo === 'ingreso' && c.nombre === CATEGORIA_DEVOLUCIONES)?.id;
  const cuentaId = cuentas.find((c) => c.id === ajustes.ultimaCuentaId)?.id ?? cuentas[0]?.id;

  const elegir = (c: Cobro & { pendiente: number }) => {
    setCobrando(c.id);
    setImporte(aTexto(c.pendiente));
  };

  /** Registra una devolución; si `todo`, salda todo lo de esta persona. */
  async function cobrar(lista: (Cobro & { pendiente: number })[], cantidad?: number) {
    const ids: string[] = [];
    const anteriores = new Map(lista.map((c) => [c.id, c.devoluciones]));
    for (const c of lista) {
      const c2 = cantidad ?? c.pendiente;
      if (c2 <= 0) continue;
      if (comoIngreso && cuentaId) ids.push(await crearMovimiento({ tipo: 'ingreso', importe: c2, fecha: hoyISO(), cuentaId, categoriaId, nota: `${p.nombre}: ${c.concepto}`, etiquetas: [], cobroId: c.id }));
      else await db.cobros.update(c.id, { devoluciones: [...c.devoluciones, { fecha: hoyISO(), importe: c2, creadoEn: ahora() }], actualizadoEn: ahora() });
      await db.cobros.update(c.id, { actualizadoEn: ahora() });
    }
    const suma = cantidad ?? lista.reduce((s, c) => s + c.pendiente, 0);
    avisar(`${p.nombre} te ha devuelto ${dinero(suma)}`, {
      etiqueta: 'Deshacer',
      hacer: async () => {
        await db.movimientos.bulkDelete(ids);
        for (const [id, devs] of anteriores) await db.cobros.update(id, { devoluciones: devs });
      },
    });
    if (suma >= p.pendiente) onCerrar();
    else setCobrando(null);
  }

  return (
    <Hoja titulo={p.nombre} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-muted">Te debe</p>
              <Cifra max={34} className="mt-1" data-testid="persona-pendiente">
                {dinero(p.pendiente)}
              </Cifra>
              <p className="mt-1 text-[13px] text-muted">{hace(p.dias)}</p>
            </div>
            {p.dias >= 30 ? <Chip tone="warning">Reclamar</Chip> : <Chip tone="brand">Pendiente</Chip>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" className="px-3" onClick={() => compartirTexto(mensajeRecordatorio(p, dinero)).catch(() => {})}>
              Recordar
            </Button>
            <Button className="px-3" onClick={() => cobrar(p.cobros)}>
              Cobrar todo
            </Button>
          </div>
        </Card>

        <Panel title="Qué te debe" detail={<span className="num">{p.cobros.length}</span>}>
          {p.cobros.map((c) => {
            const devs = devolucionesDe(c, movimientos);
            return (
              <button
                key={c.id}
                type="button"
                className={cx('flex min-h-14 w-full items-center gap-3 rounded-[18px] border bg-surface px-3.5 py-3 text-left tarjeta-tactil', cobrando === c.id ? 'border-brand' : 'border-border')}
                onClick={() => elegir(c)}
                aria-pressed={cobrando === c.id}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{c.concepto}</span>
                  <span className="block truncate text-[13px] text-muted">
                    <span className="num">{fechaCorta(c.fecha)}</span>
                    {devs.length > 0 ? ` · ya devolvió ${dinero(c.importe - c.pendiente)} de ${dinero(c.importe)}` : ''}
                  </span>
                </span>
                <span className="num shrink-0 text-[15px] font-semibold">{dinero(c.pendiente)}</span>
              </button>
            );
          })}
        </Panel>

        {elegido ? (
          <Panel title={`Cobrar «${elegido.concepto}»`}>
            <AmountField label="Te ha devuelto" value={importe} onChange={setImporte} />
            <Tile>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">Apuntarlo como ingreso</span>
                <span className="block text-[13px] text-muted">{comoIngreso ? `En ${CATEGORIA_DEVOLUCIONES}, en tu cuenta` : 'Solo baja lo que te debe (ej. te pagó en efectivo y no lo apuntas)'}</span>
              </span>
              <Toggle checked={comoIngreso} onChange={setComoIngreso} label="Apuntarlo como ingreso" />
            </Tile>
            <Button className="w-full" disabled={aCentimos(importe) <= 0} onClick={() => cobrar([elegido], Math.min(aCentimos(importe), elegido.pendiente))}>
              Registrar devolución
            </Button>
          </Panel>
        ) : (
          <p className="px-3 text-[13px] text-muted">Toca una de la lista para cobrar solo esa (o una parte).</p>
        )}

        <Button variant="secondary" className="w-full" onClick={onAnadir}>
          + Apuntar otra cosa a {p.nombre.split(/\s+/)[0]}
        </Button>
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (!confirm(`¿Olvidar lo que te debe ${p.nombre}? Se marcará como saldado sin apuntar ningún ingreso.`)) return;
            for (const c of p.cobros) await db.cobros.update(c.id, { saldado: true, actualizadoEn: ahora() });
            onCerrar();
          }}
        >
          Perdonar la deuda
        </Button>
      </div>
    </Hoja>
  );
}

function FormCobro({ persona, onCerrar }: { persona?: string; onCerrar: () => void }) {
  const { avisar, dinero } = useDatos();
  const { cobros } = usarFinanzas();
  const [nombre, setNombre] = useState(persona ?? '');
  const [concepto, setConcepto] = useState('');
  const [importe, setImporte] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const conocidas = [...new Set(cobros.map((c) => c.persona.trim()))].slice(0, 12);
  const c = aCentimos(importe);

  async function guardar() {
    if (!nombre.trim() || c <= 0) return;
    await db.cobros.add({ id: nuevoId(), persona: nombre.trim(), concepto: concepto.trim() || 'Dinero prestado', importe: c, fecha, devoluciones: [], saldado: false, creadoEn: ahora(), actualizadoEn: ahora() });
    avisar(`Apuntado: ${nombre.trim()} te debe ${dinero(c)}`);
    onCerrar();
  }

  return (
    <Hoja titulo="Alguien me debe" onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Panel title="Quién">
          <Field label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana" autoFocus={!persona} maxLength={40} />
          {conocidas.length > 0 && !persona && (
            <div className="sin-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 pb-1">
              {conocidas.map((n) => (
                <ChipButton key={n} active={nombre === n} onClick={() => setNombre(n)}>
                  {n}
                </ChipButton>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Qué y cuánto">
          <Field label="Por qué te lo debe" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. Cena del sábado, entradas, préstamo…" maxLength={60} />
          <AmountField label="Cuánto te debe" value={importe} onChange={setImporte} autoFocus={!!persona} />
          <Field label="Desde" type="date" value={fecha} max={hoyISO()} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </Panel>
        <p className="px-3 text-[13px] leading-snug text-muted">Si pagaste tú toda la cuenta, apunta el gasto completo como siempre y aquí solo la parte que te deben.</p>
        <Button className="w-full" onClick={guardar} disabled={!nombre.trim() || c <= 0}>
          Guardar
        </Button>
      </div>
    </Hoja>
  );
}
