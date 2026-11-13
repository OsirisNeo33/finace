import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { CampoImporte } from '../../components/Selectores';
import { aCentimos } from '../../domain/dinero';
import type { Presupuesto } from '../../domain/tipos';
import { db, nuevoId } from '../../db/db';

export function Presupuestos() {
  const { categorias, categoriaPorId, dinero } = useDatos();
  const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);
  const [editando, setEditando] = useState<Partial<Presupuesto> | null>(null);
  const global = presupuestos.find((p) => p.categoriaId === null);
  const porCategoria = presupuestos.filter((p) => p.categoriaId !== null);
  const libres = categorias.filter((c) => c.tipo === 'gasto' && !presupuestos.some((p) => p.categoriaId === c.id));

  return (
    <>
      <p className="texto-2 text-sm">Pon un límite mensual. Verás una barra verde, ámbar al 80 % y roja si te pasas.</p>
      <section className="tarjeta p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Presupuesto total del mes</p>
            <p className="texto-2 text-xs">Con él, el inicio te dice cuánto puedes gastar al día.</p>
          </div>
          <button className="chip" onClick={() => setEditando(global ?? { categoriaId: null })}>
            {global ? dinero(global.importe) : 'Definir'}
          </button>
        </div>
      </section>
      {porCategoria.length > 0 && (
        <div className="tarjeta divide-y overflow-hidden">
          {porCategoria.map((p) => {
            const c = categoriaPorId.get(p.categoriaId!);
            return (
              <button key={p.id} className="flex w-full items-center gap-3 px-4 py-3 text-left" style={{ borderColor: 'var(--borde)' }} onClick={() => setEditando(p)}>
                <span className="text-xl">{c?.icono}</span>
                <span className="flex-1">{c?.nombre}</span>
                <span className="importe font-semibold">{dinero(p.importe)}</span>
              </button>
            );
          })}
        </div>
      )}
      {libres.length > 0 && (
        <label className="text-sm">
          <span className="texto-2">Añadir presupuesto para una categoría</span>
          <select className="campo mt-1" value="" onChange={(e) => e.target.value && setEditando({ categoriaId: e.target.value })}>
            <option value="">Elige una categoría…</option>
            {libres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono} {c.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      {editando && <FormPresupuesto p={editando} onCerrar={() => setEditando(null)} />}
    </>
  );
}

function FormPresupuesto({ p, onCerrar }: { p: Partial<Presupuesto>; onCerrar: () => void }) {
  const { categoriaPorId } = useDatos();
  const [valor, setValor] = useState(p.importe ? (p.importe / 100).toString().replace('.', ',') : '');
  const c = p.categoriaId ? categoriaPorId.get(p.categoriaId) : undefined;
  return (
    <Hoja titulo={c ? `${c.icono} ${c.nombre}` : 'Presupuesto total'} onCerrar={onCerrar}>
      <div className="flex flex-col gap-3 px-5 pb-5">
        <label className="text-sm">
          <span className="texto-2">Límite mensual</span>
          <div className="mt-1">
            <CampoImporte valor={valor} onCambio={setValor} autoFocus />
          </div>
        </label>
        <button
          className="boton boton-primario"
          disabled={aCentimos(valor) <= 0}
          onClick={async () => {
            await db.presupuestos.put({ id: p.id ?? nuevoId(), categoriaId: p.categoriaId ?? null, importe: aCentimos(valor) });
            onCerrar();
          }}
        >
          Guardar
        </button>
        {p.id && (
          <button
            className="boton boton-secundario"
            style={{ color: 'var(--color-gasto)' }}
            onClick={async () => {
              await db.presupuestos.delete(p.id!);
              onCerrar();
            }}
          >
            Quitar presupuesto
          </button>
        )}
      </div>
    </Hoja>
  );
}
