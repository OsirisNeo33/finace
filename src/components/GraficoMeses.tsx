import { useState } from 'react';
import { cx } from './ui';

export interface PuntoMes {
  clave: string;
  corto: string; // "nov"
  nombre: string; // "noviembre 2026"
  ingresos: number; // céntimos
  gastos: number;
  actual?: boolean;
}

/** Abrevia importes del eje: 12.500 -> "12,5k". */
function eje(centimos: number) {
  const u = centimos / 100;
  if (u >= 1000) return `${(u / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k`;
  return Math.round(u).toLocaleString('es-ES');
}

/**
 * Barras agrupadas de ingresos y gastos por mes. Al tocar un mes se muestran
 * sus importes; debajo hay una tabla con los mismos datos.
 */
export function GraficoMeses({ datos, formatear }: { datos: PuntoMes[]; formatear: (c: number) => string }) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.gastos]));
  const H = 140;
  const anchoGrupo = 100 / datos.length;
  const anchoBarra = Math.min(anchoGrupo * 0.32, 7);
  const sel = activo !== null ? datos[activo] : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-chart-income" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-chart-expense" /> Gastos
          </span>
        </div>
        <span className="num text-[11px] text-muted">máx. {eje(max)}</span>
      </div>

      <div className="relative">
        {sel && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-surface-dark px-3 py-2 text-[12px] whitespace-nowrap text-white shadow-lg"
            style={{ left: `clamp(76px, ${(activo! + 0.5) * anchoGrupo}%, calc(100% - 76px))` }}
            role="status"
          >
            <p className="mb-1 text-white/60 first-letter:uppercase">{sel.nombre}</p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded bg-chart-income" />
              <span className="num font-semibold">{formatear(sel.ingresos)}</span>
              <span className="text-white/60">ingresos</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded bg-chart-expense" />
              <span className="num font-semibold">{formatear(sel.gastos)}</span>
              <span className="text-white/60">gastos</span>
            </p>
          </div>
        )}
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="block h-36 w-full" role="img" aria-label="Ingresos y gastos por mes">
          <line x1="0" x2="100" y1={H / 2} y2={H / 2} className="stroke-border" strokeWidth="0.4" vectorEffect="non-scaling-stroke" strokeDasharray="2 3" />
          {datos.map((d, i) => {
            const c = (i + 0.5) * anchoGrupo;
            const hi = (d.ingresos / max) * (H - 4);
            const hg = (d.gastos / max) * (H - 4);
            const atenuado = activo !== null && activo !== i;
            return (
              <g key={d.clave} opacity={activo === i ? 1 : atenuado ? 0.45 : d.actual ? 1 : 0.55}>
                <rect x={c - anchoBarra - 0.4} y={H - hi} width={anchoBarra} height={Math.max(hi, d.ingresos ? 1 : 0)} rx="1.2" className="fill-chart-income" />
                <rect x={c + 0.4} y={H - hg} width={anchoBarra} height={Math.max(hg, d.gastos ? 1 : 0)} rx="1.2" className="fill-chart-expense" />
              </g>
            );
          })}
          <line x1="0" x2="100" y1={H} y2={H} className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Zonas táctiles: todo el ancho de cada mes. */}
        <div className="absolute inset-0 flex">
          {datos.map((d, i) => (
            <button
              key={d.clave}
              type="button"
              aria-label={`${d.nombre}: ingresos ${formatear(d.ingresos)}, gastos ${formatear(d.gastos)}`}
              className="h-full flex-1"
              onPointerEnter={(e) => e.pointerType === 'mouse' && setActivo(i)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && setActivo(null)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              onClick={() => setActivo(i)}
            />
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex">
        {datos.map((d) => (
          <span key={d.clave} className={cx('flex-1 text-center text-[10.5px] text-muted', d.actual && 'font-semibold text-text')}>
            {d.corto}
          </span>
        ))}
      </div>

      <details className="mt-3 text-[13px]">
        <summary className="min-h-11 cursor-pointer content-center text-muted">Ver en tabla</summary>
        <table className="num mt-1 w-full text-right">
          <thead className="text-muted">
            <tr>
              <th className="text-left font-medium">Mes</th>
              <th className="font-medium">Ingresos</th>
              <th className="font-medium">Gastos</th>
              <th className="font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((d) => (
              <tr key={d.clave} className="border-t border-border">
                <td className="py-1 text-left font-sans">{d.corto}</td>
                <td>{formatear(d.ingresos)}</td>
                <td>{formatear(d.gastos)}</td>
                <td className={d.ingresos - d.gastos < 0 ? 'text-danger' : undefined}>{formatear(d.ingresos - d.gastos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
