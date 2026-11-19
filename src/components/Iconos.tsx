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
export const IconoEdificio = base(
  <>
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2.5 21h19" />
    <path d="M8 7h4M8 11h4M8 15h4" />
  </>,
);
export const IconoEtiqueta = base(
  <>
    <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8" cy="8" r="1.4" />
  </>,
);
export const IconoDiana = base(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </>,
);
export const IconoRepetir = base(<path d="M20 11A8 8 0 0 0 5.6 6.4L3.5 8.5M3.5 3.5v5h5M4 13a8 8 0 0 0 14.4 4.6l2.1-2.1M20.5 20.5v-5h-5" />);
export const IconoDescargar = base(<path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15" />);
export const IconoCompartir = base(<path d="M12 15V3M8 7l4-4 4 4M7.5 10.5H6A2 2 0 0 0 4 12.5v7A2 2 0 0 0 6 21.5h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" />);
export const IconoSubir = base(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IconoBajar = base(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IconoMovil = base(
  <>
    <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
    <path d="M11 18.5h2" />
  </>,
);
export const IconoMoneda = base(<path d="M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9" />);
export const IconoHoy = base(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
);
export const IconoEscudo = base(<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6zM8.8 12l2.2 2.2 4.4-4.4" />);
export const IconoTarjeta = base(
  <>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19M6.5 15h4" />
  </>,
);
export const IconoAlerta = base(<path d="M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2v.1" />);
export const IconoTendencia = base(<path d="M3.5 17.5l6-6 4 4 7-7.5M15 8h5.5v5.5" />);
export const IconoCartera = base(
  <>
    <path d="M4 7.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5h11" />
    <path d="M16 13.5h.1" />
  </>,
);
