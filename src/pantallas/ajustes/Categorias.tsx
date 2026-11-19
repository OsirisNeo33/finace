import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { SelectorIcono } from '../../components/Selectores';
import { Button, Emoji, Field, Panel, Segmented } from '../../components/ui';
import type { Categoria, TipoCategoria } from '../../domain/tipos';
import { db, nuevoId } from '../../db/db';

const flecha = 'flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2 disabled:opacity-20';

export function Categorias() {
  const [tipo, setTipo] = useState<TipoCategoria>('gasto');
  const [editando, setEditando] = useState<Categoria | 'nueva' | null>(null);
  const todas = useLiveQuery(() => db.categorias.orderBy('orden').toArray(), [], []);
  const lista = todas.filter((c) => c.tipo === tipo);

  async function mover(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= lista.length) return;
    const nueva = [...lista];
    [nueva[i], nueva[j]] = [nueva[j], nueva[i]];
    await db.categorias.bulkPut(nueva.map((c, k) => ({ ...c, orden: k })));
  }

  return (
    <>
      <Segmented
        label="Tipo"
        value={tipo}
        onChange={setTipo}
        options={[
          { value: 'gasto', label: 'Gastos' },
          { value: 'ingreso', label: 'Ingresos' },
        ]}
      />
      <Panel title={tipo === 'gasto' ? 'Categorías de gasto' : 'Categorías de ingreso'} detail={<span className="num">{lista.length}</span>} footer="Al añadir un movimiento, las categorías aparecen ordenadas por las que más usas.">
        {lista.map((c, i) => (
          <div key={c.id} className={`flex min-h-14 items-center gap-1 rounded-[18px] border border-border bg-surface py-1 pr-1 pl-3.5 ${c.archivada ? 'opacity-60' : ''}`}>
            <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditando(c)}>
              <Emoji>{c.icono}</Emoji>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{c.nombre}</span>
                {c.archivada && <span className="block text-[13px] text-muted">Oculta</span>}
              </span>
            </button>
            <button type="button" className={flecha} disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">
              ▲
            </button>
            <button type="button" className={flecha} disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">
              ▼
            </button>
          </div>
        ))}
      </Panel>
      <Button className="w-full" onClick={() => setEditando('nueva')}>
        + Nueva categoría
      </Button>
      {editando && <FormCategoria categoria={editando === 'nueva' ? undefined : editando} tipo={tipo} orden={lista.length} onCerrar={() => setEditando(null)} />}
    </>
  );
}

function FormCategoria({ categoria, tipo, orden, onCerrar }: { categoria?: Categoria; tipo: TipoCategoria; orden: number; onCerrar: () => void }) {
  const { movimientos, avisar } = useDatos();
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [icono, setIcono] = useState(categoria?.icono ?? '📦');
  const usos = categoria ? movimientos.filter((m) => m.categoriaId === categoria.id).length : 0;

  async function guardar() {
    if (!nombre.trim()) return;
    await db.categorias.put({ id: categoria?.id ?? nuevoId(), nombre: nombre.trim(), icono, color: categoria?.color ?? '#2b5ce6', tipo: categoria?.tipo ?? tipo, orden: categoria?.orden ?? orden, archivada: categoria?.archivada ?? false });
    onCerrar();
  }

  return (
    <Hoja titulo={categoria ? 'Editar categoría' : 'Nueva categoría'} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Panel title="Datos">
          <div className="flex items-center gap-2">
            <Emoji grande>{icono}</Emoji>
            <div className="min-w-0 flex-1">
              <Field label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Gimnasio" autoFocus={!categoria} maxLength={24} />
            </div>
          </div>
        </Panel>
        <Panel title="Icono">
          <SelectorIcono valor={icono} onCambio={setIcono} />
        </Panel>
        <Button className="w-full" onClick={guardar} disabled={!nombre.trim()}>
          Guardar
        </Button>
        {categoria && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className={usos > 0 ? 'col-span-2' : undefined}
              onClick={async () => {
                await db.categorias.update(categoria.id, { archivada: !categoria.archivada });
                onCerrar();
              }}
            >
              {categoria.archivada ? 'Mostrar' : 'Ocultar'}
            </Button>
            {usos === 0 && (
              <Button
                variant="danger"
                onClick={async () => {
                  await db.categorias.delete(categoria.id);
                  await db.presupuestos.where('categoriaId').equals(categoria.id).delete();
                  avisar('Categoría eliminada');
                  onCerrar();
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        )}
        {usos > 0 && <p className="px-3 text-[13px] text-muted">Tiene {usos} movimientos: puedes ocultarla, pero no eliminarla.</p>}
      </div>
    </Hoja>
  );
}
