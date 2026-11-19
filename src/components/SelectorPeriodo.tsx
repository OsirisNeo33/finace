import type { Periodo } from '../domain/fechas';
import { fechaCorta } from '../domain/fechas';
import { IconoAtras, IconoSiguiente } from './Iconos';

const redondo = 'flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-brand shadow-sm active:scale-95 disabled:opacity-40';

export function SelectorPeriodo({ periodo, desplazamiento, setDesplazamiento, diaInicio, permitirFuturo }: { periodo: Periodo; desplazamiento: number; setDesplazamiento: (n: number) => void; diaInicio: number; permitirFuturo?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" className={redondo} onClick={() => setDesplazamiento(desplazamiento - 1)} aria-label="Mes anterior">
        <IconoAtras width={20} height={20} />
      </button>
      <button type="button" className="min-h-11 min-w-0 flex-1 text-center" onClick={() => setDesplazamiento(0)} title="Volver al mes actual">
        <span className="block text-[15px] font-semibold first-letter:uppercase">{periodo.etiqueta}</span>
        {(diaInicio !== 1 || desplazamiento !== 0) && (
          <span className="block text-[12px] text-muted">
            {diaInicio !== 1 ? (
              <span className="num">
                {fechaCorta(periodo.inicio)} – {fechaCorta(periodo.fin)}
              </span>
            ) : (
              'Toca para volver a este mes'
            )}
          </span>
        )}
      </button>
      <button type="button" className={redondo} onClick={() => setDesplazamiento(desplazamiento + 1)} disabled={!permitirFuturo && desplazamiento >= 0} aria-label="Mes siguiente">
        <IconoSiguiente width={20} height={20} />
      </button>
    </div>
  );
}
