import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { CampoImporte, SelectorColor, SelectorIcono } from '../../components/Selectores';
import { saldosCuentas } from '../../domain/calculos';
import { aCentimos } from '../../domain/dinero';
import type { Cuenta, TipoCuenta } from '../../domain/tipos';
import { db, nuevoId } from '../../db/db';

const TIPOS: [TipoCuenta, string, string][] = [
  ['efectivo', 'Efectivo', '💵'],
  ['banco', 'Banco', '🏦'],
  ['tarjeta', 'Tarjeta', '💳'],
  ['ahorro', 'Ahorro', '🐷'],
];

export function Cuentas() {
  const { todasCuentas, movimientos, dinero } = useDatos();
  const [editando, setEditando] = useState<Cuenta | 'nueva' | null>(null);
  const saldos = useMemo(() => saldosCuentas(todasCuentas, movimientos), [todasCuentas, movimientos]);

  return (
    <>
      <div className="tarjeta divide-y overflow-hidden">
        {todasCuentas.map((c) => (
          <button key={c.id} className="flex w-full items-center gap-3 px-4 py-3 text-left" style={{ borderColor: 'var(--borde)', opacity: c.archivada ? 0.5 : 1 }} onClick={() => setEditando(c)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: c.color + '22' }}>
              {c.icono}
            </span>
            <span className="flex-1">
              <span className="block font-medium">{c.nombre}</span>
              <span className="texto-2 text-xs">{c.archivada ? 'Archivada' : TIPOS.find((t) => t[0] === c.tipo)?.[1]}</span>
            </span>
            <span className="importe font-semibold">{dinero(saldos.get(c.id) ?? 0)}</span>
          </button>
        ))}
      </div>
      <button className="boton boton-primario" onClick={() => setEditando('nueva')}>
        + Nueva cuenta
      </button>
      <p className="texto-2 text-xs">Para mover dinero entre cuentas (por ejemplo, sacar del cajero), usa «Transferencia» al añadir un movimiento. No cuenta como gasto.</p>
      {editando && <FormCuenta cuenta={editando === 'nueva' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  );
}

function FormCuenta({ cuenta, onCerrar }: { cuenta?: Cuenta; onCerrar: () => void }) {
  const { todasCuentas, movimientos, avisar } = useDatos();
  const [nombre, setNombre] = useState(cuenta?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta?.tipo ?? 'banco');
  const [icono, setIcono] = useState(cuenta?.icono ?? '🏦');
  const [color, setColor] = useState(cuenta?.color ?? '#2563eb');
  const [saldo, setSaldo] = useState(cuenta ? (cuenta.saldoInicial / 100).toString().replace('.', ',') : '');
  const usada = cuenta && movimientos.some((m) => m.cuentaId === cuenta.id || m.cuentaDestinoId === cuenta.id);

  async function guardar() {
    if (!nombre.trim()) return;
    const datos: Cuenta = {
      id: cuenta?.id ?? nuevoId(),
      nombre: nombre.trim(),
      tipo,
      icono,
      color,
      saldoInicial: aCentimos(saldo),
      orden: cuenta?.orden ?? todasCuentas.length,
      archivada: cuenta?.archivada ?? false,
    };
    await db.cuentas.put(datos);
    onCerrar();
  }

  return (
    <Hoja titulo={cuenta ? 'Editar cuenta' : 'Nueva cuenta'} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4 px-5 pb-5">
        <label className="text-sm">
          <span className="texto-2">Nombre</span>
          <input className="campo mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. BBVA, Revolut, Hucha" autoFocus={!cuenta} />
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(([t, n, i]) => (
            <button
              key={t}
              className="chip"
              aria-pressed={tipo === t}
              onClick={() => {
                setTipo(t);
                setIcono(i);
              }}
            >
              {i} {n}
            </button>
          ))}
        </div>
        <label className="text-sm">
          <span className="texto-2">Saldo inicial (lo que tenías al empezar a usar Finace)</span>
          <div className="mt-1">
            <CampoImporte valor={saldo} onCambio={setSaldo} />
          </div>
        </label>
        <div className="text-sm">
          <span className="texto-2">Icono</span>
          <div className="mt-1">
            <SelectorIcono valor={icono} onCambio={setIcono} />
          </div>
        </div>
        <SelectorColor valor={color} onCambio={setColor} />
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
