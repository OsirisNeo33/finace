import { useState } from 'react';
import { configurarInicial } from '../db/acciones';
import { aCentimos } from '../domain/dinero';
import { CampoImporte } from '../components/Selectores';
import { MONEDAS } from './Ajustes';
import type { TipoCuenta } from '../domain/tipos';

interface CuentaInicial {
  activa: boolean;
  nombre: string;
  tipo: TipoCuenta;
  icono: string;
  color: string;
  saldo: string;
}

export function Bienvenida() {
  const [paso, setPaso] = useState(0);
  const [moneda, setMoneda] = useState('EUR');
  const [cuentas, setCuentas] = useState<CuentaInicial[]>([
    { activa: true, nombre: 'Banco', tipo: 'banco', icono: '🏦', color: '#2563eb', saldo: '' },
    { activa: true, nombre: 'Efectivo', tipo: 'efectivo', icono: '💵', color: '#16a34a', saldo: '' },
    { activa: false, nombre: 'Ahorro', tipo: 'ahorro', icono: '🐷', color: '#db2777', saldo: '' },
  ]);
  const cambiar = (i: number, c: Partial<CuentaInicial>) => setCuentas(cuentas.map((x, j) => (j === i ? { ...x, ...c } : x)));
  const activas = cuentas.filter((c) => c.activa && c.nombre.trim());

  async function terminar() {
    await configurarInicial(
      moneda,
      activas.map((c) => ({ nombre: c.nombre.trim(), tipo: c.tipo, icono: c.icono, color: c.color, saldoInicial: aCentimos(c.saldo) })),
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="mb-8 flex gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= paso ? 'var(--color-marca)' : 'var(--borde)' }} />
        ))}
      </div>

      {paso === 0 && (
        <div className="anim-aparecer flex flex-1 flex-col">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="h-16 w-16" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Hola, esto es Finace</h1>
          <p className="texto-2 mt-3 text-lg">Apunta un gasto en 3 segundos y entiende a dónde va tu dinero cada mes.</p>
          <ul className="mt-6 flex flex-col gap-3">
            <li>⚡ Importe + categoría y listo</li>
            <li>📊 Ve en qué gastas y cuánto te queda al día</li>
            <li>🔒 Sin registro: tus datos se quedan en este dispositivo</li>
          </ul>
          <label className="mt-8 text-sm">
            <span className="texto-2">Tu moneda</span>
            <select className="campo mt-1" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
              {MONEDAS.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex-1" />
          <button className="boton boton-primario mt-8 w-full" onClick={() => setPaso(1)}>
            Empezar
          </button>
        </div>
      )}

      {paso === 1 && (
        <div className="anim-aparecer flex flex-1 flex-col">
          <h1 className="text-2xl font-bold tracking-tight">¿Dónde tienes tu dinero?</h1>
          <p className="texto-2 mt-2">Marca tus cuentas y, si quieres, cuánto tienes ahora en cada una. Puedes cambiarlo después.</p>
          <div className="mt-6 flex flex-col gap-3">
            {cuentas.map((c, i) => (
              <div key={i} className="tarjeta flex items-center gap-3 p-3" style={{ opacity: c.activa ? 1 : 0.55 }}>
                <input type="checkbox" className="h-5 w-5 accent-[var(--color-marca)]" checked={c.activa} onChange={(e) => cambiar(i, { activa: e.target.checked })} aria-label={`Usar ${c.nombre}`} />
                <span className="text-2xl">{c.icono}</span>
                <input className="min-w-0 flex-1 bg-transparent font-medium outline-none" value={c.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value })} />
                <div className="w-28">
                  <CampoImporte valor={c.saldo} onCambio={(v) => cambiar(i, { saldo: v, activa: true })} placeholder="Saldo" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="mt-8 flex gap-2">
            <button className="boton boton-secundario" onClick={() => setPaso(0)}>
              Atrás
            </button>
            <button className="boton boton-primario flex-1" onClick={terminar} disabled={activas.length === 0}>
              ¡Listo!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
