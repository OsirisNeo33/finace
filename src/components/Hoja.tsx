import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { IconoCerrar } from './Iconos';
import { sinMovimiento } from './animacion';

const SALIDA_MS = 220;

/**
 * Hoja que sube desde abajo (en escritorio, ventana centrada) sobre el fondo gris.
 * Al cerrarla baja con animación, y en el móvil se puede arrastrar hacia abajo desde la cabecera.
 */
export function Hoja({ titulo, onCerrar, children, ancho = 'max-w-lg' }: { titulo?: ReactNode; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  const [saliendo, setSaliendo] = useState(false);
  const [arrastre, setArrastre] = useState(0);
  const [tocando, setTocando] = useState(false);
  const inicioY = useRef<number | null>(null);
  const temporizador = useRef<number>(undefined);

  const cerrar = useCallback(() => {
    if (sinMovimiento()) return onCerrar();
    setSaliendo(true);
    clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(onCerrar, SALIDA_MS);
  }, [onCerrar]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', tecla);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = prev;
    };
  }, [cerrar]);

  const empezar = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    inicioY.current = e.clientY;
    setTocando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (inicioY.current !== null) setArrastre(Math.max(0, e.clientY - inicioY.current));
  };
  const soltar = () => {
    if (inicioY.current === null) return;
    inicioY.current = null;
    setTocando(false);
    if (arrastre > 90) cerrar();
    else setArrastre(0);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className={`${saliendo ? 'anim-desaparecer' : 'anim-aparecer'} absolute inset-0 bg-black/40`} style={{ opacity: arrastre ? Math.max(0.3, 1 - arrastre / 400) : undefined }} onClick={cerrar} />
      <div
        className={`${saliendo ? 'anim-bajar' : 'anim-subir'} relative flex max-h-[94dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-[26px] bg-bg shadow-[0_-10px_40px_-20px_rgba(16,24,40,0.35)] sm:rounded-[26px]`}
        style={{ transform: arrastre && !saliendo ? `translateY(${arrastre}px)` : undefined, transition: tocando ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.1)' }}
      >
        <div className="shrink-0 touch-none select-none" onPointerDown={empezar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
          {titulo !== undefined && (
            <div className="flex items-center justify-between gap-3 px-5 pt-2 pb-2 sm:pt-4">
              <h2 className="min-w-0 truncate text-[20px] font-semibold tracking-tight">{titulo}</h2>
              <button type="button" className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted transition active:scale-90 active:rotate-90" onClick={cerrar} aria-label="Cerrar">
                <IconoCerrar width={20} height={20} />
              </button>
            </div>
          )}
        </div>
        <div className="pb-safe overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
