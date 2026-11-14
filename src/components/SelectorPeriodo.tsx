import type { Periodo } from '../domain/fechas';
import { fechaCorta } from '../domain/fechas';
import { IconoAtras, IconoSiguiente } from './Iconos';

export function SelectorPeriodo({ periodo, desplazamiento, setDesplazamiento, diaInicio, permitirFuturo }: { periodo: Periodo; desplazamiento: number; setDesplazamiento: (n: number) => void; diaInicio: number; permitirFuturo?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <button className="rounded-full p-2 texto-2" onClick={() => setDesplazamiento(desplazamiento - 1)} aria-label="Mes anterior">
        <IconoAtras />
      </button>
      <button className="text-center" onClick={() => setDesplazamiento(0)} title="Volver al mes actual">
        <div className="font-semibold">{periodo.etiqueta}</div>
        {diaInicio !== 1 && (
          <div className="texto-2 text-xs">
            {fechaCorta(periodo.inicio)} – {fechaCorta(periodo.fin)}
          </div>
        )}
      </button>
      <button className="rounded-full p-2 texto-2 disabled:opacity-30" onClick={() => setDesplazamiento(desplazamiento + 1)} disabled={!permitirFuturo && desplazamiento >= 0} aria-label="Mes siguiente">
        <IconoSiguiente />
      </button>
    </div>
  );
}
