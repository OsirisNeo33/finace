import type { SVGProps } from 'react';

/** Iconos de trazo 24 × 24, grosor 1.8, extremos redondeados y currentColor. */
const base = (d: React.ReactNode, grosor = 1.8) =>
  function Icono(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        {d}
      </svg>
    );
  };

export const IconoInicio = base(<path d="M3.5 10.5L12 3.5l8.5 7M5.5 9v10.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9" />);
export const IconoLista = base(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />);
export const IconoGrafico = base(<path d="M4 20V10M10 20V4M16 20v-7M21.5 20.5h-19" />);
export const IconoAjustes = base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>,
);
export const IconoMas = base(<path d="M12 5v14M5 12h14" />, 2.2);
export const IconoCerrar = base(<path d="M18 6L6 18M6 6l12 12" />);
export const IconoAtras = base(<path d="M15 5l-7 7 7 7" />);
export const IconoSiguiente = base(<path d="M9 5l7 7-7 7" />);
export const IconoBorrar = base(<path d="M21 4.5H8.5L2.5 12l6 7.5H21a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 21 4.5zM17.5 9l-6 6M11.5 9l6 6" />);
export const IconoBuscar = base(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </>,
);
export const IconoPapelera = base(<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />);
export const IconoCheck = base(<path d="M5 12.5l4.5 4.5L19 7.5" />, 2.4);
export const IconoFuego = base(<path d="M12 21.5c3.9 0 6.5-2.8 6.5-6.5 0-4.8-4.6-6.6-4.6-11.5-2.9 1.9-5.6 5.6-5.6 8.6-.9-.9-1.8-1.9-1.8-2.9-.9 1.9-1 3.8-1 5.8 0 3.7 2.6 6.5 6.5 6.5z" />);
export const IconoCalendario = base(
  <>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </>,
);
export const IconoTrofeo = base(<path d="M8 4.5h8v5a4 4 0 0 1-8 0zM8 6.5H4.5v1.5A3 3 0 0 0 8 11M16 6.5h3.5v1.5A3 3 0 0 1 16 11M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z" />);
