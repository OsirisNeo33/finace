import { useEffect, type ReactNode } from 'react';
import { IconoCerrar } from './Iconos';

/** Panel que sube desde abajo (en escritorio, ventana centrada). */
export function Hoja({ titulo, onCerrar, children, ancho = 'max-w-lg' }: { titulo?: ReactNode; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = prev;
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="anim-aparecer absolute inset-0 bg-black/40" onClick={onCerrar} />
      <div
        className={`anim-subir relative flex max-h-[94dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl`}
        style={{ background: 'var(--superficie)' }}
      >
        {titulo !== undefined && (
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button className="texto-2 -mr-2 rounded-full p-2" onClick={onCerrar} aria-label="Cerrar">
              <IconoCerrar />
            </button>
          </div>
        )}
        <div className="pb-seguro overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
