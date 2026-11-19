import { useEffect, useRef, useState } from 'react';

/** true si el usuario pidió reducir el movimiento (Ajustes › Accesibilidad del iPhone). */
export const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// «−1.234,56 €», «+12,00 €», «73», «Nivel 4»…: prefijo, número en formato español y sufijo.
const PATRON = /^(.*?)(\d[\d.]*(?:,\d+)?)(.*)$/s;

function formatear(valor: number, decimales: number, agrupar: boolean) {
  const [ent, dec] = valor.toFixed(decimales).split('.');
  const entero = agrupar ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ent;
  return dec ? `${entero},${dec}` : entero;
}

/**
 * Devuelve el texto de una cifra que «cuenta» hasta su valor al aparecer y al cambiar.
 * Si el texto no contiene un número, o se pidió reducir el movimiento, lo devuelve tal cual.
 */
export function useNumeroAnimado(texto: string, duracion = 700) {
  const [mostrado, setMostrado] = useState(() => {
    const m = PATRON.exec(texto);
    if (!m || sinMovimiento()) return texto;
    const dec = m[2].split(',')[1]?.length ?? 0;
    return m[1] + formatear(0, dec, m[2].includes('.')) + m[3];
  });
  // Valor que se ve ahora mismo: la siguiente animación parte de él.
  const actual = useRef(0);

  useEffect(() => {
    const m = PATRON.exec(texto);
    if (!m || sinMovimiento()) {
      setMostrado(texto);
      return;
    }
    const [, pre, num, suf] = m;
    const dec = num.split(',')[1]?.length ?? 0;
    const agrupar = num.includes('.');
    const destino = Number(num.replace(/\./g, '').replace(',', '.'));
    const desde = actual.current;
    if (desde === destino) {
      setMostrado(texto);
      return;
    }
    const inicio = performance.now();
    let marco = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - inicio) / duracion);
      const suave = 1 - Math.pow(1 - k, 3);
      if (k >= 1) {
        actual.current = destino;
        setMostrado(texto);
      } else {
        actual.current = desde + (destino - desde) * suave;
        setMostrado(pre + formatear(actual.current, dec, agrupar) + suf);
        marco = requestAnimationFrame(paso);
      }
    };
    marco = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(marco);
  }, [texto, duracion]);

  return mostrado;
}
