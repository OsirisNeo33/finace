import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { CampoImporte, SelectorColor, SelectorIcono } from '../../components/Selectores';
import { saldosCuentas } from '../../domain/calculos';
import { aCentimos } from '../../domain/dinero';
import { ENTIDADES, saldoInicialPara } from '../../domain/bancos';
import type { Cuenta, TipoCuenta } from '../../domain/tipos';
import { db, nuevoId } from '../../db/db';

export const TIPOS_CUENTA: [TipoCuenta, string, string][] = [
  ['banco', 'Banco', '🏦'],
  ['efectivo', 'Efectivo', '💵'],
  ['tarjeta', 'Tarjeta de crédito', '💳'],
  ['ahorro', 'Ahorro / inversión', '🐷'],
];

const aTexto = (c: number) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');

export function Cuentas() {
  const { todasCuentas, movimientos, dinero } = useDatos();
  const [editando, setEditando] = useState<Cuenta | 'nueva' | null>(null);
  const saldos = useMemo(() => saldosCuentas(todasCuentas, movimientos), [todasCuentas, movimientos]);
  const total = todasCuentas.filter((c) => !c.archivada).reduce((s, c) => s + (saldos.get(c.id) ?? 0), 0);

  return (
    <>
      <div className="tarjeta p-4">
        <p className="texto-2 text-xs">Total en todas tus cuentas</p>
        <p className="importe text-2xl font-bold" style={{ color: total < 0 ? 'var(--color-gasto)' : undefined }}>
          {dinero(total)}
        </p>
      </div>
      <div className="tarjeta divide-y overflow-hidden">
        {todasCuentas.map((c) => (
          <button key={c.id} className="flex w-full items-center gap-3 px-4 py-3 text-left" style={{ borderColor: 'var(--borde)', opacity: c.archivada ? 0.5 : 1 }} onClick={() => setEditando(c)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: c.color + '22' }}>
              {c.icono}
            </span>
            <span className="flex-1">
              <span className="block font-medium">{c.nombre}</span>
              <span className="texto-2 text-xs">{c.archivada ? 'Archivada' : TIPOS_CUENTA.find((t) => t[0] === c.tipo)?.[1]}</span>
            </span>
            <span className="text-right">
              <span className="importe block font-semibold" style={{ color: (saldos.get(c.id) ?? 0) < 0 ? 'var(--color-gasto)' : undefined }}>
                {dinero(saldos.get(c.id) ?? 0)}
              </span>
              <span className="text-xs text-[var(--color-marca)]">Actualizar saldo</span>
            </span>
          </button>
        ))}
      </div>
      <button className="boton boton-primario" onClick={() => setEditando('nueva')}>
        + Añadir banco o cuenta
      </button>
      <p className="texto-2 text-xs">
        Toca una cuenta para poner el saldo que ves hoy en tu banco. Para mover dinero entre cuentas (por ejemplo, de BBVA a Revolut o sacar del cajero), usa «Transferencia» al añadir un movimiento: no cuenta como gasto.
      </p>
      {editando && <FormCuenta cuenta={editando === 'nueva' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  );
}

export function FormCuenta({ cuenta, onCerrar }: { cuenta?: Cuenta; onCerrar: () => void }) {
  const { todasCuentas, movimientos, avisar, dinero } = useDatos();
  const saldoActual = useMemo(() => (cuenta ? saldosCuentas([cuenta], movimientos).get(cuenta.id) ?? 0 : 0), [cuenta, movimientos]);
  const [nombre, setNombre] = useState(cuenta?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta?.tipo ?? 'banco');
  const [icono, setIcono] = useState(cuenta?.icono ?? '🏦');
  const [color, setColor] = useState(cuenta?.color ?? '#2563eb');
  const [saldo, setSaldo] = useState(aTexto(saldoActual));
  const [verPersonalizar, setVerPersonalizar] = useState(false);
  const usada = cuenta && movimientos.some((m) => m.cuentaId === cuenta.id || m.cuentaDestinoId === cuenta.id);
  const deseado = aCentimos(saldo);
  const usados = new Set(todasCuentas.map((c) => c.nombre.toLowerCase()));

  async function guardar() {
    if (!nombre.trim()) return;
    await db.cuentas.put({
      id: cuenta?.id ?? nuevoId(),
      nombre: nombre.trim(),
      tipo,
      icono,
      color,
      saldoInicial: saldoInicialPara(deseado, saldoActual, cuenta?.saldoInicial ?? 0),
      orden: cuenta?.orden ?? todasCuentas.length,
      archivada: cuenta?.archivada ?? false,
    });
    avisar(cuenta ? `${nombre.trim()}: saldo ${dinero(deseado)}` : `${nombre.trim()} añadida`);
    onCerrar();
  }

  return (
    <Hoja titulo={cuenta ? cuenta.nombre : 'Añadir banco o cuenta'} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4 px-5 pb-5">
        {!cuenta && (
          <div>
            <p className="texto-2 mb-2 text-sm">Elige tu banco</p>
            <div className="flex flex-wrap gap-2">
              {ENTIDADES.filter((e) => !usados.has(e.nombre.toLowerCase())).map((e) => (
                <button
                  key={e.nombre}
                  className="chip"
                  aria-pressed={nombre === e.nombre}
                  onClick={() => {
                    setNombre(e.nombre);
                    setTipo(e.tipo);
                    setIcono(e.icono);
                    setColor(e.color);
                  }}
                >
                  {e.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="text-sm">
          <span className="texto-2">Nombre</span>
          <input className="campo mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="O escribe otro: Hucha, Cuenta nómina…" maxLength={30} />
        </label>
        <label className="text-sm">
          <span className="texto-2">{cuenta ? 'Saldo actual (el que ves hoy en tu banco)' : '¿Cuánto tienes ahora en esta cuenta?'}</span>
          <div className="mt-1">
            <CampoImporte valor={saldo} onCambio={setSaldo} autoFocus={!!cuenta} />
          </div>
          {tipo === 'tarjeta' && <span className="texto-2 mt-1 block text-xs">Si debes dinero en la tarjeta, ponlo en negativo (ej. -250).</span>}
          {cuenta && deseado !== saldoActual && (
            <span className="mt-1 block text-xs" style={{ color: 'var(--color-marca)' }}>
              Antes: {dinero(saldoActual)} → ahora: {dinero(deseado)}. No cuenta como gasto ni ingreso.
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_CUENTA.map(([t, n, i]) => (
            <button
              key={t}
              className="chip"
              aria-pressed={tipo === t}
              onClick={() => {
                setTipo(t);
                if (!ENTIDADES.some((e) => e.nombre === nombre)) setIcono(i);
              }}
            >
              {i} {n}
            </button>
          ))}
        </div>
        <button className="texto-2 self-start text-sm underline" onClick={() => setVerPersonalizar((v) => !v)}>
          {verPersonalizar ? 'Ocultar icono y color' : 'Cambiar icono y color'}
        </button>
        {verPersonalizar && (
          <>
            <SelectorIcono valor={icono} onCambio={setIcono} />
            <SelectorColor valor={color} onCambio={setColor} />
          </>
        )}
        <button className="boton boton-primario" onClick={guardar} disabled={!nombre.trim()}>
          Guardar
        </button>
        {cuenta && (
          <div className="flex gap-2">
            <button
              className="boton boton-secundario flex-1"
              onClick={async () => {
                await db.cuentas.update(cuenta.id, { archivada: !cuenta.archivada });
                onCerrar();
              }}
            >
              {cuenta.archivada ? 'Desarchivar' : 'Archivar'}
            </button>
            {!usada && (
              <button
                className="boton boton-secundario flex-1"
                style={{ color: 'var(--color-gasto)' }}
                onClick={async () => {
                  await db.cuentas.delete(cuenta.id);
                  avisar('Cuenta eliminada');
                  onCerrar();
                }}
              >
                Eliminar
              </button>
            )}
          </div>
        )}
        {usada && <p className="texto-2 text-xs">Esta cuenta tiene movimientos: puedes archivarla para ocultarla, pero no eliminarla.</p>}
      </div>
    </Hoja>
  );
}
