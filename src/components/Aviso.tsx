import { useDatos } from '../contexto';

export function Aviso() {
  const { aviso } = useDatos();
  if (!aviso) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <div key={aviso.id} className="anim-aparecer pointer-events-auto flex max-w-md items-center gap-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
        <span>{aviso.texto}</span>
        {aviso.accion && (
          <button className="font-semibold text-teal-300 dark:text-teal-700" onClick={aviso.accion.hacer}>
            {aviso.accion.etiqueta}
          </button>
        )}
      </div>
    </div>
  );
}
