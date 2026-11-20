import { useState } from 'react';
import { configurarInicial } from '../db/acciones';
import { aCentimos } from '../domain/dinero';
import { ENTIDADES } from '../domain/bancos';
import { BrandHero, Button, ChipButton, LogoCuenta, Field, IconBadge, Panel, SelectField, Tile, claseBoton } from '../components/ui';
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
    <div className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8">
      <div className="mt-4 mb-5 flex gap-1.5 px-1" aria-label={`Paso ${paso + 1} de 2`}>
        {[0, 1].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= paso ? 'bg-brand' : 'bg-border'}`} />
        ))}
      </div>

      {paso === 0 && (
        <div className="anim-aparecer flex flex-1 flex-col space-y-3">
          <BrandHero name="Finace">Tus gastos e ingresos, en tu móvil</BrandHero>
          <div className="px-1 pt-2">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Hola, esto es Finace</h1>
            <p className="mt-1 text-[15px] text-muted">Apunta un gasto en 3 segundos y entiende a dónde va tu dinero cada mes.</p>
          </div>
          <Panel>
            <Tile>
              <IconBadge>⚡</IconBadge>
              <span className="text-[15px] font-medium">Importe + categoría y listo</span>
            </Tile>
            <Tile>
              <IconBadge tone="success">📊</IconBadge>
              <span className="text-[15px] font-medium">Ve en qué gastas y cuánto te queda</span>
            </Tile>
            <Tile>
              <IconBadge tone="dark">🔒</IconBadge>
              <span className="text-[15px] font-medium">Sin registro: tus datos se quedan aquí</span>
            </Tile>
          </Panel>
          <Panel title="Preferencias">
            <SelectField label="Tu moneda" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
              {MONEDAS.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </SelectField>
          </Panel>
          <div className="flex-1" />
          <Button className="w-full" onClick={() => setPaso(1)}>
            Empezar
          </Button>
        </div>
      )}

      {paso === 1 && (
        <div className="anim-aparecer flex flex-1 flex-col space-y-3">
          <div className="px-1">
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight">¿Dónde tienes tu dinero?</h1>
            <p className="mt-1 text-[15px] text-muted">Toca tus bancos y escribe cuánto tienes hoy en cada uno. Podrás cambiarlo después.</p>
          </div>

          <Panel title="Añade tus bancos">
            <div className="flex flex-wrap gap-1.5 px-1">
              {ENTIDADES.filter((e) => !tiene(e.nombre)).map((e) => (
                <ChipButton key={e.nombre} className="pl-1.5" onClick={() => anadir({ ...e, saldo: '' })}>
                  <LogoCuenta nombre={e.nombre} icono={e.icono} tamano="mini" />+ {e.nombre}
                </ChipButton>
              ))}
            </div>
            <form
              className="flex items-end gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (otro.trim()) anadir({ nombre: otro.trim(), tipo: 'banco', icono: '🏦', color: '#2b5ce6', saldo: '' });
                setOtro('');
              }}
            >
              <div className="min-w-0 flex-1">
                <Field label="Otro banco o cuenta" placeholder="Otro banco o cuenta" value={otro} onChange={(e) => setOtro(e.target.value)} maxLength={30} />
              </div>
              <button type="submit" className={`${claseBoton('secondary')} min-h-[62px] rounded-[18px]`} disabled={!otro.trim()}>
                Añadir
              </button>
            </form>
          </Panel>

          <Panel title="Saldo de hoy" detail={<span className="num">{validas.length}</span>}>
            {cuentas.map((c, i) => (
              <Tile key={c.nombre + i} className="flex-wrap gap-y-2 py-2">
                <LogoCuenta nombre={c.nombre} icono={c.icono} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{c.nombre}</span>
                <input
                  className="num order-last min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-right text-[16px] focus:border-brand focus:outline-none min-[375px]:order-none min-[375px]:w-32"
                  inputMode="decimal"
                  placeholder="Saldo"
                  aria-label={`Saldo de ${c.nombre}`}
                  value={c.saldo}
                  onChange={(e) => cambiar(i, { saldo: e.target.value.replace(/[^\d.,-]/g, '') })}
                />
                <button type="button" className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2" onClick={() => quitar(i)} aria-label={`Quitar ${c.nombre}`}>
                  <IconoCerrar width={18} height={18} />
                </button>
              </Tile>
            ))}
          </Panel>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPaso(0)}>
              Atrás
            </Button>
            <Button className="flex-1" onClick={terminar} disabled={validas.length === 0}>
              ¡Listo!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
