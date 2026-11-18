import { usarJuego } from './usarJuego';
import { Barra } from '../components/Barra';
import { IconoFuego } from '../components/Iconos';

export function Logros() {
  const j = usarJuego();
  const conseguidos = j.logros.filter((l) => l.desbloqueado).length;
  // Primero los conseguidos; luego los más cerca de conseguirse
  const logros = [...j.logros].sort((a, b) => Number(b.desbloqueado) - Number(a.desbloqueado) || b.actual / b.meta - a.actual / a.meta);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Logros</h1>

      {/* Nivel */}
      <section className="tarjeta flex items-center gap-4 p-5">
        <Anillo progreso={j.progreso}>
          <span className="texto-2 text-[10px] leading-none">NIVEL</span>
          <span className="text-3xl font-bold leading-none" data-testid="nivel">
            {j.nivel}
          </span>
        </Anillo>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{j.nombre}</p>
          <p className="texto-2 text-sm">
            <span className="importe">{j.xp}</span> XP en total
          </p>
          <div className="mt-2">
            <Barra porcentaje={j.progreso} color="var(--color-marca)" />
          </div>
          <p className="texto-2 mt-1 text-xs">
            Te faltan <b>{j.xpParaSubir - j.xpEnNivel} XP</b> para el nivel {j.nivel + 1}
          </p>
        </div>
      </section>

      {/* Racha */}
      <section className="grid grid-cols-3 gap-3">
        <Cifra icono={<IconoFuego className="text-orange-500" />} valor={j.racha} texto={j.racha === 1 ? 'día de racha' : 'días de racha'} />
        <Cifra icono="🏆" valor={j.rachaMax} texto="mejor racha" />
        <Cifra icono="🎖️" valor={`${conseguidos}/${j.logros.length}`} texto="insignias" />
      </section>

      {/* Retos */}
      <section className="tarjeta p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Retos de esta semana</h2>
          <span className="texto-2 text-xs">{j.retosCompletados} completados en total</span>
        </div>
        <div className="flex flex-col gap-4">
          {j.retos.map((r) => (
            <div key={r.id}>
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="text-lg">{r.completado ? '✅' : r.icono}</span>
                <span className="flex-1">{r.nombre}</span>
                <span className="texto-2 text-xs">
                  {r.actual}/{r.meta} · +{r.xp} XP
                </span>
              </div>
              <Barra porcentaje={r.actual / r.meta} color={r.completado ? 'var(--color-ingreso)' : 'var(--color-marca)'} />
            </div>
          ))}
        </div>
        <p className="texto-2 mt-3 text-xs">Los retos se renuevan cada lunes.</p>
      </section>

      {/* Insignias */}
      <section>
        <h2 className="mb-2 px-1 font-semibold">Insignias</h2>
        <div className="grid grid-cols-3 gap-2">
          {logros.map((l) => (
            <div key={l.id} className="tarjeta flex flex-col items-center gap-1 p-3 text-center" style={{ opacity: l.desbloqueado ? 1 : 0.7 }} data-logro={l.id} data-desbloqueado={l.desbloqueado}>
              <span className="text-3xl" style={l.desbloqueado ? undefined : { filter: 'grayscale(1)', opacity: 0.45 }}>
                {l.icono}
              </span>
              <span className="text-xs leading-tight font-semibold">{l.nombre}</span>
              <span className="texto-2 text-[10px] leading-tight">{l.descripcion}</span>
              {l.desbloqueado ? (
                <span className="mt-auto text-[10px] font-semibold text-[var(--color-ingreso)]">+{l.xp} XP</span>
              ) : (
                <div className="mt-auto w-full pt-1">
                  <Barra porcentaje={l.actual / l.meta} color="var(--color-marca)" />
                  <span className="texto-2 text-[10px]">
                    {l.actual}/{l.meta}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="tarjeta p-4 text-sm">
        <h2 className="mb-2 font-semibold">Cómo ganar XP</h2>
        <ul className="texto-2 flex flex-col gap-1">
          <li>✍️ +5 XP por cada movimiento que apuntas</li>
          <li>📅 +10 XP por cada día que apuntas algo</li>
          <li>🎯 +50 XP por cada reto semanal completado</li>
          <li>🎖️ XP extra con cada insignia</li>
        </ul>
      </section>
    </div>
  );
}

function Cifra({ icono, valor, texto }: { icono: React.ReactNode; valor: React.ReactNode; texto: string }) {
  return (
    <div className="tarjeta flex flex-col items-center p-3 text-center">
      <span className="text-xl">{icono}</span>
      <span className="importe text-xl font-bold">{valor}</span>
      <span className="texto-2 text-[11px] leading-tight">{texto}</span>
    </div>
  );
}

export function Anillo({ progreso, children, tam = 88 }: { progreso: number; children: React.ReactNode; tam?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tam, height: tam }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={tam} height={tam} aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" style={{ stroke: 'var(--superficie-2)' }} />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, progreso))} style={{ stroke: 'var(--color-marca)', transition: 'stroke-dashoffset .4s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
