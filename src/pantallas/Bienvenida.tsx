import { useState } from 'react';
import { configurarInicial } from '../db/acciones';
import { aCentimos } from '../domain/dinero';
import { ENTIDADES } from '../domain/bancos';
import { CampoImporte } from '../components/Selectores';
import { IconoCerrar } from '../components/Iconos';
import { MONEDAS } from './Ajustes';
import type { TipoCuenta } from '../domain/tipos';

interface CuentaInicial {
  nombre: string;
  tipo: TipoCuenta;
  icono: string;
  color: string;
  saldo: string;
}

const EFECTIVO: CuentaInicial = { nombre: 'Efectivo', tipo: 'efectivo', icono: '💵', color: '#16a34a', saldo: '' };

export function Bienvenida() {
  const [paso, setPaso] = useState(0);
  const [moneda, setMoneda] = useState('EUR');
  const [cuentas, setCuentas] = useState<CuentaInicial[]>([EFECTIVO]);
  const [otro, setOtro] = useState('');
  const cambiar = (i: number, c: Partial<CuentaInicial>) => setCuentas(cuentas.map((x, j) => (j === i ? { ...x, ...c } : x)));
  const tiene = (n: string) => cuentas.some((c) => c.nombre.toLowerCase() === n.toLowerCase());
  const anadir = (c: CuentaInicial) => !tiene(c.nombre) && setCuentas([...cuentas, c]);
  const quitar = (i: number) => setCuentas(cuentas.filter((_, j) => j !== i));
  const validas = cuentas.filter((c) => c.nombre.trim());

  async function terminar() {
    await configurarInicial(
      moneda,
      validas.map((c) => ({ nombre: c.nombre.trim(), tipo: c.tipo, icono: c.icono, color: c.color, saldoInicial: aCentimos(c.saldo) })),
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
          <p className="texto-2 mt-2">Toca tus bancos y escribe cuánto tienes hoy en cada uno. Podrás cambiarlo después.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {ENTIDADES.filter((e) => !tiene(e.nombre)).map((e) => (
              <button key={e.nombre} className="chip" onClick={() => anadir({ ...e, saldo: '' })}>
                + {e.nombre}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (otro.trim()) anadir({ nombre: otro.trim(), tipo: 'banco', icono: '🏦', color: '#2563eb', saldo: '' });
              setOtro('');
            }}
          >
            <input className="campo" placeholder="Otro banco o cuenta" value={otro} onChange={(e) => setOtro(e.target.value)} maxLength={30} />
            <button className="boton boton-secundario" disabled={!otro.trim()}>
              Añadir
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2">
            {cuentas.map((c, i) => (
              <div key={c.nombre + i} className="tarjeta flex items-center gap-3 p-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="text-xl">{c.icono}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{c.nombre}</span>
                <div className="w-28">
                  <CampoImporte valor={c.saldo} onCambio={(v) => cambiar(i, { saldo: v })} placeholder="Saldo" />
                </div>
                <button className="texto-2 -mr-1 p-1" onClick={() => quitar(i)} aria-label={`Quitar ${c.nombre}`}>
                  <IconoCerrar width={18} height={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="mt-8 flex gap-2">
            <button className="boton boton-secundario" onClick={() => setPaso(0)}>
              Atrás
            </button>
            <button className="boton boton-primario flex-1" onClick={terminar} disabled={validas.length === 0}>
              ¡Listo!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
