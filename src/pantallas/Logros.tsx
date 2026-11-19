import { usarJuego } from './usarJuego';
import { IconoFuego } from '../components/Iconos';
import { Cifra, Card, Chip, DataTile, Emoji, Label, Page, PageHeader, Panel, ProgressBar, Tile, cx } from '../components/ui';

export function Logros({ onVolver }: { onVolver: () => void }) {
  const j = usarJuego();
  const conseguidos = j.logros.filter((l) => l.desbloqueado).length;
  // Primero los conseguidos; luego los más cerca de conseguirse
  const logros = [...j.logros].sort((a, b) => Number(b.desbloqueado) - Number(a.desbloqueado) || b.actual / b.meta - a.actual / a.meta);

  return (
    <>
      <PageHeader title="Logros" subtitle="Tu constancia apuntando gastos, en puntos" back={{ label: 'Hoy', onClick: onVolver }} />
      <Page>
        {/* Nivel: la tarjeta negra de la pantalla */}
        <Card dark>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-white/60">Nivel</p>
              <Cifra max={34} data-testid="nivel">{j.nivel}</Cifra>
              <p className="text-[15px] font-semibold">{j.nombre}</p>
            </div>
            <Chip tone="brand" className="num">
              {j.xp} XP
            </Chip>
          </div>
          <div className="mt-4">
            <ProgressBar value={j.progreso} />
          </div>
          <p className="mt-2 text-[13px] text-white/60">
            Te faltan <b className="num text-white">{j.xpParaSubir - j.xpEnNivel} XP</b> para el nivel {j.nivel + 1}
          </p>
        </Card>

        {/* Racha */}
        <div className="grid grid-cols-3 gap-3">
          <Dato icono={<IconoFuego width={20} height={20} className="text-warning" />} valor={j.racha} texto={j.racha === 1 ? 'día de racha' : 'días de racha'} />
          <Dato icono="🏆" valor={j.rachaMax} texto="mejor racha" />
          <Dato icono="🎖️" valor={`${conseguidos}/${j.logros.length}`} texto="insignias" />
        </div>

        {/* Retos */}
        <Panel title="Retos de esta semana" detail={`${j.retosCompletados} completados`} footer="Los retos se renuevan cada lunes.">
          {j.retos.map((r) => (
            <Tile key={r.id} className="flex-col items-stretch gap-2">
              <span className="flex items-center gap-3">
                <Emoji>{r.completado ? '✅' : r.icono}</Emoji>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{r.nombre}</span>
                  <span className="num block text-[13px] text-muted">
                    {r.actual}/{r.meta}
                  </span>
                </span>
                <Chip tone={r.completado ? 'success' : 'brand'} className="num">
                  {r.completado ? 'Hecho' : `+${r.xp} XP`}
                </Chip>
              </span>
              <ProgressBar value={r.actual / r.meta} tone={r.completado ? 'success' : 'brand'} />
            </Tile>
          ))}
        </Panel>

        {/* Insignias */}
        <Panel title="Insignias" detail={`${conseguidos} de ${j.logros.length}`}>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {logros.map((l) => (
              <div key={l.id} className="flex flex-col items-center gap-1 rounded-[18px] border border-border bg-surface p-3 text-center" data-logro={l.id} data-desbloqueado={l.desbloqueado}>
                <span className={cx('text-[30px] leading-none', !l.desbloqueado && 'opacity-40 grayscale')}>{l.icono}</span>
                <span className="mt-1 text-[13px] leading-tight font-semibold">{l.nombre}</span>
                <span className="text-[12px] leading-tight text-muted">{l.descripcion}</span>
                <div className="mt-auto w-full pt-2">
                  {l.desbloqueado ? (
                    <Chip tone="success" className="num">
                      Conseguida · +{l.xp} XP
                    </Chip>
                  ) : (
                    <>
                      <ProgressBar value={l.actual / l.meta} />
                      <span className="num mt-1 block text-[12px] text-muted">
                        {l.actual}/{l.meta}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Cómo ganar XP">
          <DataTile label="✍️ Cada movimiento que apuntas" value="+5 XP" mono />
          <DataTile label="📅 Cada día que apuntas algo" value="+10 XP" mono />
          <DataTile label="🎯 Cada reto semanal" value="+50 XP" mono />
          <DataTile label="🎖️ Cada insignia" value="XP extra" />
        </Panel>
      </Page>
    </>
  );
}

function Dato({ icono, valor, texto }: { icono: React.ReactNode; valor: string | number; texto: string }) {
  return (
    <Card className="flex flex-col items-center p-3 text-center">
      <span className="flex h-6 items-center text-[20px]">{icono}</span>
      <Cifra max={22} className="mt-1 text-center">{valor}</Cifra>
      <Label className="text-[12px] leading-tight">{texto}</Label>
    </Card>
  );
}
