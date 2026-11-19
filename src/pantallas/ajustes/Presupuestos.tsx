import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { AmountField, Button, Emoji, Panel, SelectField, TileButton } from '../../components/ui';
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
      <Panel title="Total del mes" footer="Con un presupuesto total, el inicio te dice cuánto puedes gastar al día. La barra se pone naranja al 80 % y roja si te pasas.">
        <TileButton
          icon={<Emoji>🎯</Emoji>}
          title="Presupuesto total del mes"
          subtitle={global ? 'Toca para cambiarlo' : 'Sin definir'}
          detail={global ? <span className="num text-[15px] font-semibold text-text">{dinero(global.importe)}</span> : <span className="font-semibold text-brand">Definir</span>}
          chevron
          aria-label={global ? `Presupuesto total: ${dinero(global.importe)}` : 'Definir'}
          onClick={() => setEditando(global ?? { categoriaId: null })}
        />
      </Panel>
      <Panel title="Por categoría" detail={porCategoria.length ? <span className="num">{porCategoria.length}</span> : undefined}>
        {porCategoria.map((p) => {
          const c = categoriaPorId.get(p.categoriaId!);
          return <TileButton key={p.id} icon={<Emoji>{c?.icono}</Emoji>} title={c?.nombre} detail={<span className="num text-[15px] font-semibold text-text">{dinero(p.importe)}</span>} chevron onClick={() => setEditando(p)} />;
        })}
        {libres.length > 0 && (
          <SelectField label="Añadir presupuesto para una categoría" value="" onChange={(e) => e.target.value && setEditando({ categoriaId: e.target.value })}>
            <option value="">Elige una categoría…</option>
            {libres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono} {c.nombre}
              </option>
            ))}
          </SelectField>
        )}
      </Panel>
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
      <div className="space-y-3 px-4 pb-5">
        <Panel title="Límite">
          <AmountField label="Límite mensual" value={valor} onChange={setValor} autoFocus />
        </Panel>
        <Button
          className="w-full"
          disabled={aCentimos(valor) <= 0}
          onClick={async () => {
            await db.presupuestos.put({ id: p.id ?? nuevoId(), categoriaId: p.categoriaId ?? null, importe: aCentimos(valor) });
            onCerrar();
          }}
        >
          Guardar
        </Button>
        {p.id && (
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              await db.presupuestos.delete(p.id!);
              onCerrar();
            }}
          >
            Quitar presupuesto
          </Button>
        )}
      </div>
    </Hoja>
  );
}
