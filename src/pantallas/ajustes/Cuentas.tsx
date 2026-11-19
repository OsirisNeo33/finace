import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { SelectorIcono } from '../../components/Selectores';
import { Cifra, AmountField, Button, Card, ChipButton, Emoji, Field, Panel, SelectField, TileButton, cx } from '../../components/ui';
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
      <Card dark>
        <p className="text-[13px] text-white/60">Total en todas tus cuentas</p>
        <Cifra max={34} className="mt-1">{dinero(total)}</Cifra>
        <p className="mt-1 text-[13px] text-white/60">
          {todasCuentas.filter((c) => !c.archivada).length} {todasCuentas.filter((c) => !c.archivada).length === 1 ? 'cuenta' : 'cuentas'}
        </p>
      </Card>
      <Panel
        title="Tus cuentas"
        footer="Toca una cuenta para poner el saldo que ves hoy en tu banco. Para mover dinero entre cuentas (por ejemplo, de BBVA a Revolut o sacar del cajero), usa «Transferencia» al añadir un movimiento: no cuenta como gasto."
      >
        {todasCuentas.map((c) => {
          const saldo = saldos.get(c.id) ?? 0;
          return (
            <TileButton
              key={c.id}
              className={c.archivada ? 'opacity-60' : undefined}
              icon={<Emoji>{c.icono}</Emoji>}
              title={c.nombre}
              subtitle={c.archivada ? 'Archivada' : TIPOS_CUENTA.find((t) => t[0] === c.tipo)?.[1]}
              detail={<span className={cx('num text-[15px] font-semibold', saldo < 0 ? 'text-danger' : 'text-text')}>{dinero(saldo)}</span>}
              chevron
              onClick={() => setEditando(c)}
            />
          );
        })}
      </Panel>
      <Button className="w-full" onClick={() => setEditando('nueva')}>
        + Añadir banco o cuenta
      </Button>
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
  const [verIcono, setVerIcono] = useState(false);
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

  const libres = ENTIDADES.filter((e) => !usados.has(e.nombre.toLowerCase()));

  return (
    <Hoja titulo={cuenta ? cuenta.nombre : 'Añadir banco o cuenta'} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        {!cuenta && libres.length > 0 && (
          <Panel title="Elige tu banco">
            <div className="flex flex-wrap gap-1.5 px-1 pb-1">
              {libres.map((e) => (
                <ChipButton
                  key={e.nombre}
                  active={nombre === e.nombre}
                  onClick={() => {
                    setNombre(e.nombre);
                    setTipo(e.tipo);
                    setIcono(e.icono);
                    setColor(e.color);
                  }}
                >
                  {e.nombre}
                </ChipButton>
              ))}
            </div>
          </Panel>
        )}
        <Panel title="Datos">
          <Field label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="O escribe otro: Hucha, Cuenta nómina…" maxLength={30} />
          <AmountField
            label={cuenta ? 'Saldo actual (el que ves hoy en tu banco)' : '¿Cuánto tienes ahora en esta cuenta?'}
            value={saldo}
            onChange={setSaldo}
            autoFocus={!!cuenta}
            hint={
              cuenta && deseado !== saldoActual
                ? `Antes: ${dinero(saldoActual)} → ahora: ${dinero(deseado)}. No cuenta como gasto ni ingreso.`
                : tipo === 'tarjeta'
                  ? 'Si debes dinero en la tarjeta, ponlo en negativo (ej. -250).'
                  : undefined
            }
            hintTone={cuenta && deseado !== saldoActual ? 'brand' : undefined}
          />
          <SelectField
            label="Tipo de cuenta"
            value={tipo}
            onChange={(e) => {
              const t = e.target.value as TipoCuenta;
              setTipo(t);
              if (!ENTIDADES.some((x) => x.nombre === nombre)) setIcono(TIPOS_CUENTA.find((x) => x[0] === t)![2]);
            }}
          >
            {TIPOS_CUENTA.map(([t, n, i]) => (
              <option key={t} value={t}>
                {i} {n}
              </option>
            ))}
          </SelectField>
          <TileButton icon={<Emoji>{icono}</Emoji>} title="Icono" detail={verIcono ? 'Ocultar' : 'Cambiar'} onClick={() => setVerIcono((v) => !v)} />
          {verIcono && <SelectorIcono valor={icono} onCambio={setIcono} />}
        </Panel>
        <Button className="w-full" onClick={guardar} disabled={!nombre.trim()}>
          Guardar
        </Button>
        {cuenta && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className={usada ? 'col-span-2' : undefined}
              onClick={async () => {
                await db.cuentas.update(cuenta.id, { archivada: !cuenta.archivada });
                onCerrar();
              }}
            >
              {cuenta.archivada ? 'Desarchivar' : 'Archivar'}
            </Button>
            {!usada && (
              <Button
                variant="danger"
                onClick={async () => {
                  await db.cuentas.delete(cuenta.id);
                  avisar('Cuenta eliminada');
                  onCerrar();
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        )}
        {usada && <p className="px-3 text-[13px] text-muted">Esta cuenta tiene movimientos: puedes archivarla para ocultarla, pero no eliminarla.</p>}
      </div>
    </Hoja>
  );
}
