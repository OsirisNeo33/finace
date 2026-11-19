import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { IconoAjustes } from './components/Iconos';
import { HeaderButton } from './components/ui';
/** Navegación entre pestañas sin pasar props por toda la app. */
export const NavCtx = createContext(() => { });
export const useNavegar = () => useContext(NavCtx);
/** Botón de ajustes (engranaje) para la cabecera de las pantallas principales. */
export function BotonAjustes() {
    const ir = useNavegar();
    return (_jsx(HeaderButton, { label: "Ajustes", onClick: () => ir('ajustes'), children: _jsx(IconoAjustes, { width: 22, height: 22 }) }));
}
