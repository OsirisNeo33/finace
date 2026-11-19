import { useDatos } from '../contexto';

export function Aviso() {
  const { aviso } = useDatos();
  if (!aviso) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4" style={{ bottom: 'calc(10.5rem + env(safe-area-inset-bottom))' }} role="status" aria-live="polite">
      <div key={aviso.id} className="anim-aparecer pointer-events-auto flex min-h-12 max-w-md items-center gap-4 rounded-2xl bg-surface-dark px-4 py-2 text-[14px] text-white shadow-[0_10px_30px_-12px_rgba(16,24,40,0.25)]">
        <span>{aviso.texto}</span>
        {aviso.accion && (
          <button type="button" className="min-h-11 shrink-0 font-semibold text-white underline underline-offset-2" onClick={aviso.accion.hacer}>
            {aviso.accion.etiqueta}
          </button>
        )}
      </div>
    </div>
  );
}
