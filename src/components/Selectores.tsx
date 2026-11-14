export const COLORES = ['#16a34a', '#059669', '#0d9488', '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#db2777', '#e11d48', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#92400e', '#64748b'];

export const ICONOS = ['🛒', '🍽️', '☕', '🍺', '🍔', '🚌', '🚗', '⛽', '🚕', '✈️', '🏠', '💡', '💧', '📱', '🌐', '💊', '🏥', '🦷', '🏋️', '🎬', '🎮', '🎵', '📚', '🎓', '👕', '👟', '💄', '💇', '🛍️', '🎁', '🐾', '👶', '🧸', '🔧', '🧹', '📺', '💳', '🏦', '💼', '💻', '🏷️', '📈', '💰', '🪙', '💵', '🧾', '🚬', '⚽', '🏖️', '❤️', '🙏', '📦'];

export function SelectorColor({ valor, onCambio }: { valor: string; onCambio: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORES.map((c) => (
        <button key={c} className="h-8 w-8 rounded-full" style={{ background: c, outline: valor === c ? `3px solid ${c}` : undefined, outlineOffset: 2 }} onClick={() => onCambio(c)} aria-label={`Color ${c}`} />
      ))}
    </div>
  );
}

export function SelectorIcono({ valor, onCambio }: { valor: string; onCambio: (c: string) => void }) {
  return (
    <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto">
      {ICONOS.map((i) => (
        <button key={i} className="flex h-10 items-center justify-center rounded-lg text-xl" style={{ background: valor === i ? 'var(--color-marca-suave)' : undefined }} onClick={() => onCambio(i)}>
          {i}
        </button>
      ))}
    </div>
  );
}

export function CampoImporte({ valor, onCambio, autoFocus, placeholder = '0,00' }: { valor: string; onCambio: (v: string) => void; autoFocus?: boolean; placeholder?: string }) {
  return <input className="campo importe" inputMode="decimal" placeholder={placeholder} value={valor} autoFocus={autoFocus} onChange={(e) => onCambio(e.target.value.replace(/[^\d.,-]/g, ''))} />;
}
