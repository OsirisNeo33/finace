import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { SelectorColor, SelectorIcono } from '../../components/Selectores';
import type { Categoria, TipoCategoria } from '../../domain/tipos';
import { db, nuevoId } from '../../db/db';

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
      <div className="flex rounded-xl p-1" style={{ background: 'var(--superficie-2)' }}>
        {(['gasto', 'ingreso'] as const).map((t) => (
          <button key={t} className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${tipo === t ? 'shadow-sm' : 'texto-2'}`} style={tipo === t ? { background: 'var(--superficie)' } : undefined} onClick={() => setTipo(t)}>
            {t === 'gasto' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>
      <p className="texto-2 text-xs">Al añadir un movimiento, las categorías aparecen ordenadas por las que más usas.</p>
      <div className="tarjeta divide-y overflow-hidden">
        {lista.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 px-3 py-2" style={{ borderColor: 'var(--borde)', opacity: c.archivada ? 0.5 : 1 }}>
            <button className="flex flex-1 items-center gap-3 text-left" onClick={() => setEditando(c)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: c.color + '22' }}>
                {c.icono}
              </span>
              <span className="flex-1">
                {c.nombre}
                {c.archivada && <span className="texto-2 block text-xs">Oculta</span>}
              </span>
            </button>
            <button className="texto-2 p-2 disabled:opacity-20" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">
              ▲
            </button>
            <button className="texto-2 p-2 disabled:opacity-20" disabled={i === lista.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">
              ▼
            </button>
          </div>
        ))}
      </div>
      <button className="boton boton-primario" onClick={() => setEditando('nueva')}>
        + Nueva categoría
      </button>
      {editando && <FormCategoria categoria={editando === 'nueva' ? undefined : editando} tipo={tipo} orden={lista.length} onCerrar={() => setEditando(null)} />}
    </>
  );
}

function FormCategoria({ categoria, tipo, orden, onCerrar }: { categoria?: Categoria; tipo: TipoCategoria; orden: number; onCerrar: () => void }) {
  const { movimientos, avisar } = useDatos();
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [icono, setIcono] = useState(categoria?.icono ?? '📦');
  const [color, setColor] = useState(categoria?.color ?? '#2563eb');
  const usos = categoria ? movimientos.filter((m) => m.categoriaId === categoria.id).length : 0;

  async function guardar() {
    if (!nombre.trim()) return;
    await db.categorias.put({ id: categoria?.id ?? nuevoId(), nombre: nombre.trim(), icono, color, tipo: categoria?.tipo ?? tipo, orden: categoria?.orden ?? orden, archivada: categoria?.archivada ?? false });
    onCerrar();
  }

  return (
    <Hoja titulo={categoria ? 'Editar categoría' : 'Nueva categoría'} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4 px-5 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl" style={{ background: color + '22' }}>
            {icono}
          </span>
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" autoFocus={!categoria} maxLength={24} />
        </div>
        <SelectorIcono valor={icono} onCambio={setIcono} />
        <SelectorColor valor={color} onCambio={setColor} />
        <button className="boton boton-primario" onClick={guardar} disabled={!nombre.trim()}>
          Guardar
        </button>
        {categoria && (
          <div className="flex gap-2">
            <button
              className="boton boton-secundario flex-1"
              onClick={async () => {
                await db.categorias.update(categoria.id, { archivada: !categoria.archivada });
                onCerrar();
              }}
            >
              {categoria.archivada ? 'Mostrar' : 'Ocultar'}
            </button>
            {usos === 0 && (
              <button
                className="boton boton-secundario flex-1"
                style={{ color: 'var(--color-gasto)' }}
                onClick={async () => {
                  await db.categorias.delete(categoria.id);
                  await db.presupuestos.where('categoriaId').equals(categoria.id).delete();
                  avisar('Categoría eliminada');
                  onCerrar();
                }}
              >
                Eliminar
              </button>
            )}
          </div>
        )}
        {usos > 0 && <p className="texto-2 text-xs">Tiene {usos} movimientos: puedes ocultarla, pero no eliminarla.</p>}
      </div>
    </Hoja>
  );
}
