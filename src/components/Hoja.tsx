import { useEffect, type ReactNode } from 'react';
import { IconoCerrar } from './Iconos';

/** Hoja que sube desde abajo (en escritorio, ventana centrada) sobre el fondo gris. */
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
      <div className={`anim-subir relative flex max-h-[94dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-[26px] bg-bg sm:rounded-[26px]`}>
        {titulo !== undefined && (
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
            <h2 className="min-w-0 truncate text-[20px] font-semibold tracking-tight">{titulo}</h2>
            <button type="button" className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted active:scale-95" onClick={onCerrar} aria-label="Cerrar">
              <IconoCerrar width={20} height={20} />
            </button>
          </div>
        )}
        <div className="pb-safe overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
