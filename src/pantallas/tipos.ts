import type { Periodo } from '../domain/fechas';
import type { Pestana } from '../App';
import type { Filtro } from './Movimientos';

export interface PropsPantalla {
  periodo: Periodo;
  desplazamiento: number;
  setDesplazamiento: (n: number) => void;
  ir: (p: Pestana, f?: Filtro) => void;
}
