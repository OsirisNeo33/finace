import { useState } from 'react';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora } from '../../db/db';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, aISO } from '../../domain/fechas';
import { TIPOS_INVERSION } from '../../domain/salud';
import type { Inversion, TipoInversion } from '../../domain/tipos';
import { Hoja } from '../../components/Hoja';
import { AmountField, Button, Card, Chip, ChipButton, Cifra, Emoji, EmptyState, Field, FieldRow, Panel, ProgressBar, SelectField, Tile, TileButton } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';

const PLATAFORMAS = ['MyInvestor', 'Trade Republic', 'Indexa Capital', 'Finizens', 'Openbank', 'BBVA', 'ING', 'Revolut', 'Interactive Brokers', 'DEGIRO', 'eToro', 'Binance', 'Coinbase', 'Bit2Me'];
const aTexto = (c: number) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
const porcentaje = (x: number) => `${x > 0 ? '+' : ''}${(x * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;

export function Inversiones() {
  const { dinero } = useDatos();
  const { inversiones } = usarFinanzas();
  const [form, setForm] = useState<Inversion | 'nueva' | null>(null);
  const valor = inversiones.reduce((s, x) => s + x.valor, 0);
  const aportado = inversiones.reduce((s, x) => s + x.aportado, 0);
  const ganancia = valor - aportado;

  const porTipo = [...inversiones.reduce((m, x) => m.set(x.tipo, (m.get(x.tipo) ?? 0) + x.valor), new Map<TipoInversion, number>())].sort((a, b) => b[1] - a[1]);
  const ordenadas = [...inversiones].sort((a, b) => b.valor - a.valor);

  return (
    <>
      <Card dark>
        <p className="text-[13px] text-white/60">Valor de tus inversiones</p>
        <Cifra max={34} className="mt-1" data-testid="valor-inversiones">
          {dinero(valor)}
        </Cifra>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]">
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Dinero aportado</span>
            <span className="num font-semibold">{dinero(aportado)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/70">Rentabilidad</span>
            <span className="num font-semibold">
              {dinero(ganancia, { signo: true })}
              {aportado > 0 && <span className="text-white/60"> ({porcentaje(ganancia / aportado)})</span>}
            </span>
          </div>
        </div>
      </Card>

      <Button className="w-full" onClick={() => setForm('nueva')}>
        + Añadir inversión
      </Button>

      {inversiones.length === 0 ? (
        <EmptyState icon="📈" title="Aún no has apuntado inversiones">
          Apunta tus fondos, ETF, acciones, cripto, plan de pensiones o depósitos, estén donde estén. Verás cuánto tienes, cuánto has ganado y cómo está repartido.
        </EmptyState>
      ) : (
        <>
          <Panel title="Reparto" detail="por tipo">
            {porTipo.map(([tipo, v]) => (
              <Tile key={tipo} className="flex-col items-stretch gap-2">
                <span className="flex items-center gap-3">
                  <Emoji>{TIPOS_INVERSION[tipo].icono}</Emoji>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{TIPOS_INVERSION[tipo].nombre}</span>
                  <span className="num text-[12px] text-muted">{valor ? Math.round((v / valor) * 100) : 0} %</span>
                  <span className="num text-[15px] font-semibold">{dinero(v)}</span>
                </span>
                <ProgressBar value={valor ? v / valor : 0} />
              </Tile>
            ))}
          </Panel>

          <Panel title="Tus inversiones" detail={<span className="num">{inversiones.length}</span>} footer="Actualiza el valor de vez en cuando con lo que te diga tu bróker o tu banco. Las rentabilidades pasadas no garantizan las futuras.">
            {ordenadas.map((x) => {
              const g = x.valor - x.aportado;
              return (
                <TileButton
                  key={x.id}
                  icon={<Emoji>{TIPOS_INVERSION[x.tipo].icono}</Emoji>}
                  title={x.nombre}
                  subtitle={`${x.plataforma ? `${x.plataforma} · ` : ''}actualizado ${fechaCorta(aISO(new Date(x.actualizadoEn)))}`}
                  detail={
                    <span className="flex flex-col items-end gap-1">
                      <span className="num text-[15px] font-semibold text-text">{dinero(x.valor)}</span>
                      {x.aportado > 0 && (
                        <Chip tone={g >= 0 ? 'success' : 'danger'} className="num">
                          {porcentaje(g / x.aportado)}
                        </Chip>
                      )}
                    </span>
                  }
                  chevron
                  onClick={() => setForm(x)}
                />
              );
            })}
          </Panel>
        </>
      )}

      {form && <FormInversion inversion={form === 'nueva' ? undefined : form} onCerrar={() => setForm(null)} />}
    </>
  );
}

function FormInversion({ inversion, onCerrar }: { inversion?: Inversion; onCerrar: () => void }) {
  const { avisar } = useDatos();
  const [tipo, setTipo] = useState<TipoInversion>(inversion?.tipo ?? 'fondo');
  const [nombre, setNombre] = useState(inversion?.nombre ?? '');
  const [plataforma, setPlataforma] = useState(inversion?.plataforma ?? '');
  const [aportado, setAportado] = useState(aTexto(inversion?.aportado ?? 0));
  const [valor, setValor] = useState(aTexto(inversion?.valor ?? 0));
  const v = aCentimos(valor);

  async function guardar() {
    if (!nombre.trim() || v <= 0) return;
    await db.inversiones.put({
      id: inversion?.id ?? nuevoId(),
      nombre: nombre.trim(),
      tipo,
      plataforma: plataforma.trim() || undefined,
      aportado: aCentimos(aportado) || v,
      valor: v,
      notas: inversion?.notas,
      creadoEn: inversion?.creadoEn ?? ahora(),
      actualizadoEn: ahora(),
    });
    avisar(inversion ? 'Inversión actualizada' : `${nombre.trim()} añadida`);
    onCerrar();
  }

  return (
    <Hoja titulo={inversion ? inversion.nombre : 'Nueva inversión'} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Panel title="Qué es">
          <SelectField label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoInversion)}>
            {(Object.keys(TIPOS_INVERSION) as TipoInversion[]).map((k) => (
              <option key={k} value={k}>
                {TIPOS_INVERSION[k].icono} {TIPOS_INVERSION[k].nombre}
              </option>
            ))}
          </SelectField>
          <Field label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={tipo === 'cripto' ? 'Ej. Bitcoin' : tipo === 'acciones' ? 'Ej. Acciones de Inditex' : 'Ej. Fondo indexado MSCI World'} maxLength={40} />
          <Field label="Dónde la tienes (opcional)" value={plataforma} onChange={(e) => setPlataforma(e.target.value)} placeholder="Bróker, banco o app" maxLength={30} />
          <div className="sin-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 pb-1">
            {PLATAFORMAS.map((p) => (
              <ChipButton key={p} active={plataforma === p} onClick={() => setPlataforma(p)}>
                {p}
              </ChipButton>
            ))}
          </div>
        </Panel>
        <Panel title="Importes" footer="Aportado es el dinero que has metido. Valor actual, lo que vale hoy según tu bróker o banco.">
          <FieldRow>
            <AmountField label="Dinero aportado" value={aportado} onChange={setAportado} />
            <AmountField label="Valor actual" value={valor} onChange={setValor} autoFocus={!!inversion} />
          </FieldRow>
        </Panel>
        <Button className="w-full" onClick={guardar} disabled={!nombre.trim() || v <= 0}>
          Guardar
        </Button>
        {inversion && (
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              if (!confirm(`¿Eliminar «${inversion.nombre}»?`)) return;
              await db.inversiones.delete(inversion.id);
              onCerrar();
            }}
          >
            Eliminar inversión
          </Button>
        )}
      </div>
    </Hoja>
  );
}
