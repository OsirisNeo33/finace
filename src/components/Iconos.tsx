import type { SVGProps } from 'react';

const base = (d: React.ReactNode) =>
  function Icono(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        {d}
      </svg>
    );
  };

export const IconoInicio = base(<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />);
export const IconoLista = base(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />);
export const IconoGrafico = base(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const IconoAjustes = base(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </>,
);
export const IconoMas = base(<path d="M12 5v14M5 12h14" />);
export const IconoCerrar = base(<path d="M18 6L6 18M6 6l12 12" />);
export const IconoAtras = base(<path d="M15 18l-6-6 6-6" />);
export const IconoSiguiente = base(<path d="M9 18l6-6-6-6" />);
export const IconoBorrar = base(<path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2zM18 9l-6 6M12 9l6 6" />);
export const IconoBuscar = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>,
);
export const IconoPapelera = base(<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />);
export const IconoFlechas = base(<path d="M7 17l-4-4 4-4M3 13h13M17 7l4 4-4 4M21 11H8" />);
export const IconoCheck = base(<path d="M20 6L9 17l-5-5" />);
export const IconoFuego = base(<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-6 6-6 9-1-1-2-2-2-3-1 2-1 4-1 6 0 4 3 7 7 7z" />);
