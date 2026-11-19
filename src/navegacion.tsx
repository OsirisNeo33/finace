import { createContext, useContext } from 'react';
import type { Pestana } from './App';
import { IconoAjustes } from './components/Iconos';
import { HeaderButton } from './components/ui';

/** Navegación entre pestañas sin pasar props por toda la app. */
export const NavCtx = createContext<(p: Pestana) => void>(() => {});
export const useNavegar = () => useContext(NavCtx);

/** Botón de ajustes (engranaje) para la cabecera de las pantallas principales. */
export function BotonAjustes() {
  const ir = useNavegar();
  return (
    <HeaderButton label="Ajustes" onClick={() => ir('ajustes')}>
      <IconoAjustes width={22} height={22} />
    </HeaderButton>
  );
}
