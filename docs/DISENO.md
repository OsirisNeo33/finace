# Sistema de diseño (app RGM)

> **Para el otro chat de Claude Code** (versión en un solo archivo: el código de `codigo/` va al final, en el Anexo): este documento describe un sistema de diseño ya hecho y probado en una PWA para iPhone (Next.js + Tailwind CSS 4). Tu tarea es **replicar este mismo aspecto** en otra aplicación. Copia los *tokens* (sección 2) y los componentes de `codigo/` y úsalos en todas las pantallas. No inventes colores, radios ni sombras nuevas: usa los de aquí. Las capturas de `capturas/` son la referencia visual. Si la otra app no usa Tailwind 4, ve a la sección 11.

---

## 1. Idea general

Es un estilo de **panel limpio tipo "fintech"**, pensado primero para el móvil:

- **Fondo gris muy claro** y encima **tarjetas blancas muy redondeadas** (26 px), con un borde finísimo y una sombra casi imperceptible.
- **Paneles grises que agrupan filas blancas** (como una lista de ajustes de iOS, pero con cada fila como una tarjetita independiente).
- **Un único color de marca, azul intenso** (`#2b5ce6`). El resto es gris y negro. Verde, naranja y rojo coral solo se usan para estados (cobrado, aviso, error o gasto).
- **Cifras en tipografía monoespaciada** (importes, fechas, números), con números tabulares. El texto normal usa la fuente del sistema (SF Pro en el iPhone).
- **Una tarjeta negra** como mucho por pantalla, para destacar la cifra clave (por ejemplo, "Pendiente de cobro" o "Resultado").
- **Barra de pestañas flotante** abajo, redondeada, con la pestaña activa sobre un fondo azul suave.
- **Modo oscuro** con la misma estructura, cambiando solo los valores de los tokens.

Sensación buscada: ordenado, aireado, táctil, sin adornos. Mucho espacio en blanco, jerarquía clara y una cifra protagonista.

## 2. Tokens (colores)

Se definen como variables CSS en `:root` y se redefinen en modo oscuro. En Tailwind 4 se exponen con `@theme inline` (ver `codigo/globals.css`). **Úsalos siempre por su nombre** (`bg-surface`, `text-muted`…), nunca con el hexadecimal directamente.

| Token | Uso | Claro | Oscuro |
|---|---|---|---|
| `--bg` | Fondo de la página | `#eceef1` | `#0b0c0e` |
| `--surface` | Tarjetas y filas | `#ffffff` | `#17181c` |
| `--surface-2` | Paneles grises que agrupan filas, zonas hundidas | `#f5f6f8` | `#111215` |
| `--surface-dark` | Tarjeta negra destacada | `#141518` | `#000000` |
| `--text` | Texto principal | `#121317` | `#f2f3f5` |
| `--muted` | Texto secundario, etiquetas | `#747a86` | `#9298a3` |
| `--border` | Bordes de 1 px | `#e3e5e9` | `#262830` |
| `--brand` | Color de marca: botón principal, enlaces, pestaña activa | `#2b5ce6` | `#5482ff` |
| `--brand-strong` | Marca al pulsar | `#1f47c2` | `#7a9dff` |
| `--brand-soft` | Fondo suave de marca (chips, pestaña activa) | `#e7edfd` | `#18203a` |
| `--on-brand` | Texto sobre la marca | `#ffffff` | `#ffffff` |
| `--accent` | Naranja secundario (iconos, avisos suaves) | `#f09a4f` | `#f5aa66` |
| `--success` / `--success-soft` | Cobrado, aceptado, sincronizado | `#1e8a5a` / `#e3f4ec` | `#4cc48a` / `#12261d` |
| `--warning` / `--warning-soft` | Pendiente, sin conexión, caducado | `#c26a12` / `#fdf0e1` | `#f0a94d` / `#2a1f10` |
| `--danger` / `--danger-soft` | Error, vencido, borrar | `#e0533d` / `#fce9e6` | `#ff7a66` / `#2c1512` |
| `--chart-income` | Serie 1 de los gráficos (ingresos) | `#2b5ce6` | `#5482ff` |
| `--chart-expense` | Serie 2 de los gráficos (gastos) | `#eb6834` | `#d95926` |

Los colores de los gráficos están **validados** para el daltonismo y el contraste sobre su superficie en cada modo. Si añades más series, valídalas igual.

## 3. Tipografía

- **Texto:** fuente del sistema (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto…`). No hace falta cargar fuentes externas.
- **Cifras:** clase `.num`, con `ui-monospace, "SF Mono", Menlo…`, `font-variant-numeric: tabular-nums` y `letter-spacing: -0.02em`. Úsala en importes, fechas, números de documento, horas y contadores.
- **Escala** (en px):

| Elemento | Tamaño | Peso |
|---|---|---|
| Título de página (`h1`) | 28 | 600, `tracking-tight` |
| Cifra protagonista en una tarjeta | 30–34 (`.num`) | 600 |
| Cifra secundaria (tarjetas de resumen) | 22–24 (`.num`) | 600 |
| Título de tarjeta o panel | 15 | 600 |
| Texto de fila o botón | 15–16 | 500–600 |
| Texto secundario o subtítulo | 13–14 | 400, `text-muted` |
| Etiqueta de campo o chip | 12 | 500 |
| Etiqueta de pestaña | 10.5 | 500 |

- Los campos de formulario llevan **siempre 16 px** o más, porque si no iOS hace zoom al enfocarlos.
- Las etiquetas de los campos van en minúscula normal (no en mayúsculas), en gris y a 12 px, encima del valor.

## 4. Forma, espaciado y profundidad

- **Radios:** tarjeta y panel, **26 px** (`rounded-[26px]`); fila dentro de un panel, **18 px**; botón, **16 px** (`rounded-2xl`); cuadradito de icono, **12 px** (`rounded-xl`); chip, pastilla completa (`rounded-full`).
- **Bordes:** 1 px con `--border` en tarjetas, filas, campos y botones secundarios. El borde del campo pasa a `--brand` al enfocarlo.
- **Sombras:**
  - Tarjeta: `0 1px 2px rgba(16,24,40,0.04)`.
  - Botón principal: `0 6px 16px -6px rgba(43,92,230,0.6)`, un brillo azul bajo el botón.
  - Barra de pestañas: `0 10px 30px -12px rgba(16,24,40,0.25)`.
  - No hay más sombras.
- **Espaciado:** el contenido va centrado con `max-w-2xl`, márgenes laterales de 16 px (`px-4`) y **12 px entre bloques** (`space-y-3`). Dentro de un panel, 6 px entre filas (`space-y-1.5`) con un relleno de 8 px. Las tarjetas llevan 20 px de relleno (`p-5`); las de resumen pequeñas, 16 px (`p-4`).
- **Táctil:** todo elemento pulsable mide **44 px de alto o más**. Las filas, 56 px (`min-h-14`) y los botones, 48 px (`min-h-12`).
- **Respuesta al toque:** `active:scale-[0.98]` en botones y `active:scale-[0.99]` en filas, con `transition`. Sin animaciones largas.

## 5. Estructura de una pantalla

```
┌──────────────────────────────┐  ← área segura superior (pt-safe)
│ ‹ Volver            [chip][+]│  PageHeader: fila de 44 px (volver / acciones)
│ Título grande                │  h1 de 28 px + subtítulo gris
│ Subtítulo                    │  (pegajoso, con desenfoque de fondo)
├──────────────────────────────┤
│ ┌──────────────────────────┐ │  Page: max-w-2xl, px-4, space-y-3
│ │ Tarjeta / Panel          │ │
│ └──────────────────────────┘ │
│ ┌────────────┐┌────────────┐ │  resúmenes en grid-cols-2 gap-3
│ │ Tarjeta    ││ Tarjeta    │ │  (una de ellas puede ser la negra)
│ └────────────┘└────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Panel gris               │ │
│ │ ┌──────────────────────┐ │ │  filas blancas (Tile / TileLink)
│ │ └──────────────────────┘ │ │
│ └──────────────────────────┘ │
│                              │  relleno inferior para no tapar con la barra
│ ╭──────────────────────────╮ │
│ │ ☀  📅  👥  📄  📊         │ │  TabBar flotante (pb-safe)
│ ╰──────────────────────────╯ │
└──────────────────────────────┘
```

- El `<main>` lleva `padding-bottom: calc(6.5rem + env(safe-area-inset-bottom))` para que la barra flotante no tape el contenido.
- La cabecera es `sticky`, con `bg-bg/85 backdrop-blur-xl`.
- Las pantallas de detalle llevan "‹ Volver" a la izquierda; las acciones (editar, +) van a la derecha como botones redondos de 44 px (`HeaderButton`).
- `viewport-fit=cover`, más las clases `.pt-safe` y `.pb-safe` (`env(safe-area-inset-*)`), para el notch y la barra de inicio del iPhone.

## 6. Catálogo de componentes (`codigo/ui.tsx`)

| Componente | Para qué | Notas |
|---|---|---|
| `PageHeader` | Cabecera de pantalla | `title`, `subtitle`, `back={{href,label}}` y `action` (chips o botones) |
| `Page` | Contenedor del contenido | `max-w-2xl px-4 space-y-3` |
| `Card` | Tarjeta blanca | `dark` la convierte en la tarjeta negra destacada |
| `CardTitle` | Título de tarjeta | Título a 15 px a la izquierda y un detalle gris opcional a la derecha |
| `Label` | Etiqueta gris pequeña | Encima de una cifra: "Total", "Fecha"… |
| `Panel` | Grupo gris de filas | `title`, `detail` y `footer` (texto explicativo gris debajo) |
| `Tile` / `TileLink` / `TileButton` | Fila blanca dentro de un Panel | Admite `icon`, `title`, `subtitle` y `detail` a la derecha; el enlace lleva un chevron |
| `DataTile` | Fila de dato | Etiqueta a la izquierda y valor a la derecha (`mono` para cifras) |
| `IconBadge` | Cuadradito de color con un icono blanco | Tonos `brand`, `success`, `warning`, `danger` y `dark`; va al principio de una fila |
| `Initials` | Cuadradito con iniciales | Para personas o empresas en las listas ("AL", "CR") |
| `Button` | Botón | `primary` (azul con brillo), `secondary` (blanco con borde), `danger` (texto rojo) y `dark` (negro) |
| `ButtonLink` | Enlace con aspecto de botón | Mismas variantes que `Button` |
| `HeaderButton` | Botón redondo de 44 px en la cabecera | Para "+", editar o ajustes |
| `ActionButton` | Botón redondo con texto debajo | Llamar, WhatsApp, Mapa…, en una fila dentro de una `Card` |
| `Segmented` | Control segmentado | Fondo gris; la opción activa es una pastilla blanca con sombra |
| `Toggle` | Interruptor | Azul cuando está activo |
| `ProgressBar` | Barra de progreso fina (6 px) | Tonos `brand`, `success`, `danger` y `warning` |
| `Chip` | Etiqueta de estado | Fondo suave y texto del tono (`success`, `warning`, `danger`, `brand` o `neutral`) |
| `Field` / `TextAreaField` / `SelectField` | Campos de formulario | Tarjeta blanca con la etiqueta encima. `hint` muestra ayuda gris, y `hintTone` la pone en rojo o naranja |
| `FieldRow` | Dos campos en la misma fila | `grid-cols-2 gap-1.5` |
| `SearchField` | Buscador | Con lupa |
| `EmptyState` | Estado vacío | Icono en un círculo gris, título y texto de ayuda |
| `BrandHero` | Tarjeta de marca con una ola azul | Para la cabecera de la pantalla principal y del inicio de sesión |

Otros componentes:
- `codigo/tab-bar.tsx`: barra de pestañas flotante, con 5 pestañas como máximo.
- `codigo/week-strip.tsx`: tira con los días de la semana, el de hoy en una pastilla azul y un punto en los días ocupados.
- `codigo/income-expense-chart.tsx`: barras agrupadas por mes; al tocar un mes sale una etiqueta, y debajo va la tabla "Ver en tabla".
- `codigo/icons.tsx`: iconos de trazo de 24 × 24, con un grosor de 1.8, extremos redondeados y `currentColor`.

### Ejemplos de uso

```tsx
<PageHeader title="Documentos" subtitle="Facturas y cobros" action={<HeaderButton href="/nueva" label="Nueva"><PlusIcon /></HeaderButton>} />
<Page>
  <div className="grid grid-cols-2 gap-3">
    <Card dark className="p-4">
      <p className="text-[13px] text-white/60">Pendiente de cobro</p>
      <p className="num mt-1 text-[22px] font-semibold">1.250,00 €</p>
    </Card>
    <Card className="p-4">
      <Label>Facturado en 2026</Label>
      <p className="num mt-1 text-[22px] font-semibold">18.430,00 €</p>
    </Card>
  </div>

  <Segmented value={f} onChange={setF} options={[{ value: "todas", label: "Todas" }, { value: "pend", label: "Pendientes" }]} />

  <Panel title="Facturas" detail="12">
    <TileLink href="/f/1" icon={<Initials name="Ana López" />} title="Ana López" subtitle="F2026-0001 · 19/11/2026"
      detail={<span className="num font-semibold text-text">641,30 €</span>} />
  </Panel>

  <Panel title="Datos">
    <Field label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
    <FieldRow>
      <Field label="Fecha" type="date" />
      <SelectField label="IVA"><option>21 %</option></SelectField>
    </FieldRow>
  </Panel>

  <Button className="w-full">Guardar</Button>
</Page>
```

## 7. Patrones

- **Listas:** usa siempre un `Panel` con `TileLink`. A la izquierda, un `IconBadge` (para tipos o categorías) o `Initials` (para personas). Debajo del título, un subtítulo gris con los datos separados por " · ". A la derecha, el importe en `.num` y, debajo, un `Chip` de estado.
- **Resúmenes:** una cuadrícula de 2 columnas. Una tarjeta negra para lo más importante y una blanca para lo secundario. Encima, la etiqueta gris; debajo, la cifra `.num` grande y un chip o texto pequeño de contexto.
- **Ficha de detalle:** una `Card` con la cifra protagonista (34 px), un `Chip` de estado arriba a la derecha y, debajo, `ProgressBar` y datos en dos columnas. A continuación, el botón principal a lo ancho y después los `Panel` con los detalles.
- **Formularios:** los campos van agrupados en `Panel` con título ("Datos", "Contacto"…). El botón principal va al final a lo ancho, con los secundarios o el de borrar (`danger`) debajo. Los errores van en un bloque `bg-danger-soft text-danger` con una lista.
- **Acciones rápidas:** una fila de `ActionButton` dentro de una `Card` (`flex justify-around`).
- **Estados:** siempre un `Chip` con texto, nunca solo color: verde para hecho o cobrado, naranja para pendiente o sin conexión, rojo para vencido o error, azul para en curso y gris para borrador o cerrado.
- **Vacíos:** un `EmptyState` con el icono de la sección y un texto que diga qué hacer.
- **Hojas a pantalla completa** (por ejemplo, firmar): `fixed inset-0 bg-bg`, con el título arriba, el contenido en una tarjeta grande y dos botones abajo (Cancelar en `secondary` y Aceptar en `primary`).
- **Botón flotante "+"** (opcional, solo en la pantalla principal): círculo azul de 56 px abajo a la derecha, por encima de la barra; al tocarlo abre un menú de filas con `IconBadge`.

## 8. Gráficos

- Barras finas con los extremos redondeados, 2 series como máximo por gráfico y **una sola escala**.
- **Leyenda siempre visible** cuando hay 2 series o más.
- La rejilla y los ejes van muy suaves (`stroke-border`, línea discontinua a media altura).
- Al tocar (o con el ratón) se muestra una **etiqueta oscura** con los valores, y siempre hay una alternativa en tabla ("Ver en tabla").
- Para mostrar una magnitud por categoría, usa **barras de progreso de un solo color** (no un color por categoría).
- El periodo seleccionado va a opacidad completa y el resto, atenuado.
- Colores: solo `--chart-income` y `--chart-expense`. El texto nunca va en el color de la serie.

## 9. Textos

- La interfaz está en español de España: moneda con el formato `1.234,56 €` y fechas como `dd/mm/aaaa`. Los títulos llevan solo la primera letra en mayúscula ("Datos de la empresa", no "Datos De La Empresa").
- Los botones dicen la acción ("Guardar", "Emitir factura", "Añadir cobro").
- Las ayudas van en gris debajo del campo, con frases cortas y prácticas.

## 10. Modo oscuro

- Se activa solo con `prefers-color-scheme: dark`, redefiniendo los mismos tokens (sección 2).
- La estructura es la misma: las tarjetas pasan a `#17181c` sobre un fondo `#0b0c0e`, y la tarjeta negra pasa a negro puro.
- La ola de `BrandHero` y las cifras se adaptan solas porque usan los tokens. Comprueba siempre las dos versiones.

## 11. Si la otra app no usa Tailwind 4

- **Tailwind 3:** copia las variables de `:root` y del bloque oscuro de `globals.css` en tu CSS global, y en `tailwind.config.js` mapea los colores. Por ejemplo, `colors: { bg: "var(--bg)", surface: "var(--surface)", "surface-2": "var(--surface-2)", "surface-dark": "var(--surface-dark)", text: "var(--text)", muted: "var(--muted)", border: "var(--border)", brand: { DEFAULT: "var(--brand)", strong: "var(--brand-strong)", soft: "var(--brand-soft)" }, "on-brand": "var(--on-brand)", accent: "var(--accent)", success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" }, warning: {…}, danger: {…}, "chart-income": "var(--chart-income)", "chart-expense": "var(--chart-expense)" }`. Las opacidades del tipo `bg-brand/25` necesitan colores en RGB; si no, usa `color-mix()`.
- **Sin Tailwind** (CSS normal, otra librería o React Native): conserva los mismos valores (tokens, radios de 26, 18, 16 y 12 px, sombras, tamaños de letra y alturas táctiles). Traduce cada componente de `ui.tsx` a tu sistema; las clases de Tailwind se leen como especificación (`rounded-[26px] border border-border bg-surface p-5` = radio de 26 px, borde de 1 px con el color `border`, fondo `surface` y relleno de 20 px).
- **Sin Next.js:** en `ui.tsx` y `tab-bar.tsx`, cambia `next/link` por el `Link` de tu enrutador (o por `<a>`) y `usePathname` por su equivalente.

## 12. Lo que NO hay que hacer

- Colores nuevos fuera de los tokens, degradados (salvo la ola de la marca) o más de un azul.
- Sombras fuertes o tarjetas sin borde.
- Radios pequeños (de 4 u 8 px) en las tarjetas.
- Títulos en mayúsculas.
- Cifras en la fuente normal (los importes siempre en `.num`).
- Varias tarjetas negras en la misma pantalla.
- Estados mostrados solo con color, sin texto.
- Elementos táctiles de menos de 44 px.
- Campos con letra de menos de 16 px.
- Más de 5 pestañas.

## 13. Archivos de este kit

```
DISENO.md                      ← este documento
codigo/globals.css             ← tokens (claro y oscuro), fuente, .num y áreas seguras
codigo/ui.tsx                  ← todos los componentes base
codigo/icons.tsx               ← iconos de trazo
codigo/tab-bar.tsx             ← barra de pestañas flotante
codigo/week-strip.tsx          ← tira de la semana
codigo/income-expense-chart.tsx← gráfico de barras agrupadas con etiqueta y tabla
codigo/formato.ts              ← utilidades mínimas (mes, semana, euros) que usan los dos anteriores
capturas/*.png                 ← referencia visual (en docs/capturas/) (iPhone 15, claro y oscuro)
```

Para usar el kit, copia `codigo/` en `src/components/` (o donde tengas los componentes) y el contenido de `globals.css` en tu CSS global. Los componentes llevan `"use client"`: en Next con App Router se pueden importar desde páginas de servidor.

---

# Anexo: código de los componentes

Crea cada archivo con este contenido exacto (rutas relativas a tu carpeta de componentes; `globals.css` es tu CSS global).

## `globals.css`

```css
@import "tailwindcss";

/* Estilo: fondo gris claro, tarjetas blancas muy redondeadas, azul intenso. */
:root {
  --bg: #eceef1;
  --surface: #ffffff;
  --surface-2: #f5f6f8;
  --surface-dark: #141518;
  --text: #121317;
  --muted: #747a86;
  --border: #e3e5e9;
  --brand: #2b5ce6;
  --brand-strong: #1f47c2;
  --brand-soft: #e7edfd;
  --on-brand: #ffffff;
  --accent: #f09a4f;
  --success: #1e8a5a;
  --success-soft: #e3f4ec;
  --warning: #c26a12;
  --warning-soft: #fdf0e1;
  --danger: #e0533d;
  --danger-soft: #fce9e6;
  /* Gráficos (validados con el validador de paleta: claro sobre #fff, oscuro sobre #17181c) */
  --chart-income: #2b5ce6;
  --chart-expense: #eb6834;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b0c0e;
    --surface: #17181c;
    --surface-2: #111215;
    --surface-dark: #000000;
    --text: #f2f3f5;
    --muted: #9298a3;
    --border: #262830;
    --brand: #5482ff;
    --brand-strong: #7a9dff;
    --brand-soft: #18203a;
    --on-brand: #ffffff;
    --accent: #f5aa66;
    --success: #4cc48a;
    --success-soft: #12261d;
    --warning: #f0a94d;
    --warning-soft: #2a1f10;
    --danger: #ff7a66;
    --danger-soft: #2c1512;
    --chart-income: #5482ff;
    --chart-expense: #d95926;
  }
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-dark: var(--surface-dark);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-brand: var(--brand);
  --color-brand-strong: var(--brand-strong);
  --color-brand-soft: var(--brand-soft);
  --color-on-brand: var(--on-brand);
  --color-accent: var(--accent);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-danger: var(--danger);
  --color-danger-soft: var(--danger-soft);
  --color-chart-income: var(--chart-income);
  --color-chart-expense: var(--chart-expense);
  --font-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

html {
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  overscroll-behavior-y: none;
}

/* iOS amplía la página al enfocar campos con letra menor de 16px. */
input,
select,
textarea {
  font-size: 16px;
}

.pt-safe {
  padding-top: env(safe-area-inset-top);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Cifras e importes: monoespaciada, como en el diseño de referencia. */
.num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
```

## `ui.tsx`

```tsx
"use client";

import Link from "next/link";
import { useId, type ComponentProps, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Estructura de página                                                */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-20 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-12 max-w-2xl items-center justify-between gap-2 px-4 pt-1">
        {back ? (
          <Link
            href={back.href}
            className="-ml-1 flex min-h-11 items-center gap-0.5 pr-3 text-[15px] font-medium text-brand"
          >
            <ChevronLeftIcon width={20} height={20} />
            {back.label}
          </Link>
        ) : (
          <span />
        )}
        {action}
      </div>
      <div className="mx-auto max-w-2xl px-5 pb-3">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[14px] text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-2xl space-y-3 px-4 pb-8">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Contenedores                                                        */
/* ------------------------------------------------------------------ */

/** Tarjeta blanca muy redondeada. */
export function Card({
  className,
  dark,
  ...props
}: ComponentProps<"div"> & { dark?: boolean }) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-[26px] border p-5",
        dark
          ? "border-transparent bg-surface-dark text-white"
          : "border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    />
  );
}

/** Título pequeño de tarjeta con detalle opcional a la derecha. */
export function CardTitle({ children, detail }: { children: ReactNode; detail?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold">{children}</h2>
      {detail && <span className="text-[13px] text-muted">{detail}</span>}
    </div>
  );
}

/** Etiqueta pequeña gris (p. ej. "Total facturado"). */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-[13px] text-muted", className)}>{children}</p>;
}

/**
 * Panel gris que agrupa filas blancas (como "Budgets" o "Spending by category"
 * del diseño de referencia).
 */
export function Panel({
  title,
  detail,
  footer,
  children,
}: {
  title?: string;
  detail?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-border bg-surface-2 p-2">
      {title && (
        <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-2.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {detail && <span className="text-[13px] text-muted">{detail}</span>}
        </div>
      )}
      <div className="space-y-1.5">{children}</div>
      {footer && <p className="px-3 pb-1.5 pt-2.5 text-[13px] leading-snug text-muted">{footer}</p>}
    </section>
  );
}

const tileClass =
  "flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left";

/** Fila blanca dentro de un Panel. */
export function Tile({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx(tileClass, className)} />;
}

/** Cuadradito de color con un icono (como en la lista de avisos). */
export function IconBadge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "success" | "warning" | "danger" | "dark";
}) {
  return (
    <span
      className={cx(
        "flex size-9 shrink-0 items-center justify-center rounded-xl text-white",
        tone === "brand" && "bg-brand",
        tone === "success" && "bg-success",
        tone === "warning" && "bg-accent",
        tone === "danger" && "bg-danger",
        tone === "dark" && "bg-surface-dark",
      )}
    >
      {children}
    </span>
  );
}

function TileBody({
  icon,
  title,
  subtitle,
  trailing,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {subtitle && <span className="block truncate text-[13px] text-muted">{subtitle}</span>}
      </span>
      {trailing}
    </>
  );
}

export function TileLink({
  href,
  icon,
  title,
  subtitle,
  detail,
}: {
  href: string;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <Link href={href} className={cx(tileClass, "transition active:scale-[0.99] active:bg-surface-2")}>
      <TileBody
        icon={icon}
        title={title}
        subtitle={subtitle}
        trailing={
          <>
            {detail && <span className="text-[13px] text-muted">{detail}</span>}
            <ChevronRightIcon width={16} height={16} className="text-muted" />
          </>
        }
      />
    </Link>
  );
}

export function TileButton({
  icon,
  title,
  subtitle,
  className,
  ...props
}: Omit<ComponentProps<"button">, "title"> & {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <button
      type="button"
      {...props}
      className={cx(tileClass, "transition active:scale-[0.99] active:bg-surface-2", className)}
    >
      <TileBody icon={icon} title={title} subtitle={subtitle} />
    </button>
  );
}

/** Fila de dato: etiqueta a la izquierda, valor a la derecha. */
export function DataTile({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <Tile className="justify-between">
      <span className="text-[15px]">{label}</span>
      <span className={cx("text-right text-[14px] text-muted", mono && "num")}>{value}</span>
    </Tile>
  );
}

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" | "dark" }) {
  return (
    <button
      {...props}
      className={cx(
        "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]",
        variant === "secondary" && "border border-border bg-surface text-text",
        variant === "danger" && "border border-border bg-surface text-danger",
        variant === "dark" && "bg-surface-dark text-white",
        className,
      )}
    />
  );
}

/** Control segmentado (Todos / Ingresos / Gastos…). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex rounded-2xl border border-border bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-10 flex-1 rounded-xl text-[14px] font-medium transition",
            o.value === value ? "bg-surface text-text shadow-sm" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-8 w-[52px] shrink-0 rounded-full transition",
        checked ? "bg-brand" : "bg-border",
      )}
    >
      <span
        className={cx(
          "absolute top-1 size-6 rounded-full bg-white shadow transition-all",
          checked ? "left-[24px]" : "left-1",
        )}
      />
    </button>
  );
}

export function ProgressBar({
  value,
  tone = "brand",
}: {
  value: number; // 0..1
  tone?: "brand" | "success" | "danger" | "warning";
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div
        className={cx(
          "h-full rounded-full transition-all",
          tone === "brand" && "bg-brand",
          tone === "success" && "bg-success",
          tone === "danger" && "bg-danger",
          tone === "warning" && "bg-accent",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Chip pequeño (p. ej. "▲ +3,0 %" o el estado de sincronización). */
export function Chip({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  return (
    <span
      {...props}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium",
        tone === "neutral" && "border-border bg-surface text-muted",
        tone === "success" && "border-transparent bg-success-soft text-success",
        tone === "warning" && "border-transparent bg-warning-soft text-warning",
        tone === "danger" && "border-transparent bg-danger-soft text-danger",
        tone === "brand" && "border-transparent bg-brand-soft text-brand",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Formularios                                                         */
/* ------------------------------------------------------------------ */

const inputClass =
  "mt-1 w-full rounded-xl bg-transparent text-[16px] text-text placeholder:text-muted/60 focus:outline-none";

/** Campo dentro de un Panel: tarjeta blanca con etiqueta arriba. */
export function Field({
  label,
  hint,
  hintTone,
  ...props
}: { label: string; hint?: string; hintTone?: "danger" | "warning" } & ComponentProps<"input">) {
  const id = useId();
  return (
    <div
      className={cx(
        "rounded-[18px] border bg-surface px-3.5 py-2.5 focus-within:border-brand",
        hintTone === "danger" ? "border-danger" : "border-border",
      )}
    >
      <label htmlFor={id} className="block text-[12px] font-medium text-muted">
        {label}
      </label>
      <input id={id} {...props} className={inputClass} />
      {hint && (
        <p
          className={cx(
            "mt-1 text-[12px] leading-snug",
            hintTone === "danger" ? "text-danger" : hintTone === "warning" ? "text-warning" : "text-muted",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & ComponentProps<"textarea">) {
  const id = useId();
  return (
    <div className="rounded-[18px] border border-border bg-surface px-3.5 py-2.5 focus-within:border-brand">
      <label htmlFor={id} className="block text-[12px] font-medium text-muted">
        {label}
      </label>
      <textarea id={id} rows={3} {...props} className={cx(inputClass, "resize-y")} />
      {hint && <p className="mt-1 text-[12px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Otros                                                               */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center px-6 py-9 text-center">
      <span className="mb-3 flex size-14 items-center justify-center rounded-full border border-border bg-surface-2 text-brand">
        {icon}
      </span>
      <p className="text-[16px] font-semibold">{title}</p>
      {children && <div className="mt-1 text-[14px] text-muted">{children}</div>}
    </Card>
  );
}

/** Tarjeta de marca con la ola azul. */
export function BrandHero({
  name,
  logo,
  children,
}: {
  name: string;
  logo?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-border bg-surface">
      <div className="relative z-10 flex items-center gap-3 p-5 pb-16">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="size-10 rounded-xl bg-white object-contain" />
        ) : (
          <WaveMark />
        )}
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold tracking-tight">{name}</p>
          {children && <div className="text-[13px] text-muted">{children}</div>}
        </div>
      </div>
      <svg
        viewBox="0 0 400 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-20 w-full"
        aria-hidden="true"
      >
        <path
          d="M0 38 C 70 18, 120 52, 200 36 S 330 14, 400 30 L400 90 L0 90 Z"
          className="fill-brand/25"
        />
        <path
          d="M0 54 C 80 34, 150 70, 230 50 S 340 34, 400 46 L400 90 L0 90 Z"
          className="fill-brand"
        />
        <circle cx="300" cy="40" r="5" className="fill-surface stroke-brand" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function WaveMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft">
      <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true">
        <circle cx="12" cy="12" r="10" className="fill-brand/30" />
        <path d="M2.5 13.5c3-2.5 6-2.5 9.5 0s6.5 2.5 9.5 0V14a9.5 9.5 0 0 1-19 0z" className="fill-brand" />
      </svg>
    </span>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: { label: string; hint?: string } & ComponentProps<"select">) {
  const id = useId();
  return (
    <div className="rounded-[18px] border border-border bg-surface px-3.5 py-2.5 focus-within:border-brand">
      <label htmlFor={id} className="block text-[12px] font-medium text-muted">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="mt-1 w-full appearance-none bg-transparent text-[16px] text-text focus:outline-none"
      >
        {children}
      </select>
      {hint && <p className="mt-1 text-[12px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

/** Dos campos en la misma fila. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}

/** Cuadradito con iniciales (como "WF", "SA" en la referencia). */
export function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-[12px] font-semibold text-brand">
      {letters || "?"}
    </span>
  );
}

/** Botón redondo con icono y texto debajo (llamar, WhatsApp, mapa…). */
export function ActionButton({
  href,
  icon,
  label,
  onClick,
  external,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon}
      </span>
      <span className="text-[12px] font-medium text-muted">{label}</span>
    </>
  );
  const cls = "flex min-w-16 flex-col items-center gap-1.5 transition active:scale-95";
  if (href)
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
        {inner}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Enlace con aspecto de botón. */
export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-semibold transition active:scale-[0.98]",
        variant === "primary" && "bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]",
        variant === "secondary" && "border border-border bg-surface text-text",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Botón pequeño redondo para la cabecera (p. ej. "+"). */
export function HeaderButton({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-brand shadow-sm active:scale-95"
    >
      {children}
    </Link>
  );
}

export function SearchField(props: ComponentProps<"input">) {
  return (
    <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 focus-within:border-brand">
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className="text-muted" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
      </svg>
      <input type="search" {...props} className="w-full bg-transparent text-[16px] placeholder:text-muted/70 focus:outline-none" />
    </label>
  );
}
```

## `icons.tsx`

```tsx
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const TodayIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </Base>
);

export const UsersIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.6 3 5.2" />
  </Base>
);

export const DocumentIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8z" />
    <path d="M14 2.5V8h5.5M8.5 13h7M8.5 17h7" />
  </Base>
);

export const MoreIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 5l7 7-7 7" />
  </Base>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const BuildingIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2.5 21h19" />
    <path d="M8 7h4M8 11h4M8 15h4" />
  </Base>
);

export const PhoneIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
    <path d="M11 18.5h2" />
  </Base>
);

export const CloudIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5z" />
  </Base>
);

export const CloudOffIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 3l18 18" />
    <path d="M9.5 6.3A6 6 0 0 1 18.1 10.6a4 4 0 0 1 2.3 6.7M17 18.5H7a4.75 4.75 0 0 1-.9-9.4" />
  </Base>
);

export const RefreshIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 11A8 8 0 0 0 5.6 6.4L3.5 8.5M3.5 3.5v5h5M4 13a8 8 0 0 0 14.4 4.6l2.1-2.1M20.5 20.5v-5h-5" />
  </Base>
);

export const LogoutIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 4.5h2.5A2.5 2.5 0 0 1 20 7v10a2.5 2.5 0 0 1-2.5 2.5H15M10 16.5L5.5 12 10 7.5M5.5 12H15" />
  </Base>
);

export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 15V3M8 7l4-4 4 4M7.5 10.5H6A2 2 0 0 0 4 12.5v7A2 2 0 0 0 6 21.5h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" />
  </Base>
);

export const PlusSquareIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const PlusIcon = (p: IconProps) => (
  <Base strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Base>
);

export const CallIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 3.5h3.2l1.6 4.2-2.2 1.4a11 11 0 0 0 5.3 5.3l1.4-2.2 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5A15.5 15.5 0 0 1 2.5 6.2 2.5 2.5 0 0 1 5 3.5z" />
  </Base>
);

export const ChatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 19.5l1.3-3.8A8 8 0 1 1 8.5 19z" />
  </Base>
);

export const MailIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </Base>
);

export const MapPinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Base>
);

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />
  </Base>
);

export const EuroIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5M4 10.5h9M4 13.5h9" />
  </Base>
);

export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const PencilIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5zM13.5 7l3 3" />
  </Base>
);

export const TagIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8" cy="8" r="1.4" />
  </Base>
);

export const ChartIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M21.5 20.5h-19" />
  </Base>
);

export const GearIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Base>
);

export const CameraIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </Base>
);

export const ReceiptIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />
  </Base>
);

export const ArrowDownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Base>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Base>
);

export const DownloadIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15" />
  </Base>
);

export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />
  </Base>
);
```

## `tab-bar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ChartIcon, DocumentIcon, TodayIcon, UsersIcon } from "./icons";
import { cx } from "./ui";

// Cambia las pestañas por las de tu app (máximo 5, como en iOS).
const TABS = [
  { href: "/", label: "Hoy", Icon: TodayIcon },
  { href: "/agenda/", label: "Agenda", Icon: CalendarIcon },
  { href: "/clientes/", label: "Clientes", Icon: UsersIcon },
  { href: "/documentos/", label: "Documentos", Icon: DocumentIcon },
  { href: "/cuentas/", label: "Cuentas", Icon: ChartIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href) || pathname === href.slice(0, -1);
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-md gap-1 rounded-[26px] border border-border bg-surface/90 p-1.5 shadow-[0_10px_30px_-12px_rgba(16,24,40,0.25)] backdrop-blur-xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[10.5px] font-medium transition",
                  active ? "bg-brand-soft text-brand" : "text-muted",
                )}
              >
                <Icon width={22} height={22} strokeWidth={active ? 2.1 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

## `week-strip.tsx`

```tsx
"use client";

import { monthName, weekDays } from "./formato";
import { Card, CardTitle, cx } from "./ui";

const LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

/** Tira con los días de la semana actual; hoy resaltado en azul. */
export function WeekStrip({
  today,
  detail,
  busyDays,
}: {
  today: string;
  detail?: string;
  busyDays?: Set<string>;
}) {
  const days = weekDays(today);
  return (
    <Card className="pb-4">
      <CardTitle detail={detail}>{monthName(today)}</CardTitle>
      <ol className="grid grid-cols-7 gap-1 text-center">
        {days.map((iso, i) => {
          const isToday = iso === today;
          return (
            <li
              key={iso}
              aria-current={isToday ? "date" : undefined}
              className={cx(
                "flex flex-col items-center gap-1 rounded-2xl py-2",
                isToday && "bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]",
              )}
            >
              <span className={cx("text-[11px]", isToday ? "text-on-brand/80" : "text-muted")}>
                {LETTERS[i]}
              </span>
              <span className="num text-[16px] font-semibold">{Number(iso.slice(8))}</span>
              <span
                className={cx(
                  "size-1.5 rounded-full",
                  busyDays?.has(iso) ? (isToday ? "bg-on-brand" : "bg-accent") : "bg-transparent",
                )}
              />
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
```

## `income-expense-chart.tsx`

```tsx
"use client";

import { useState } from "react";
import { formatEuros, monthName } from "./formato";
import { cx } from "./ui";

interface Point {
  month: string; // AAAA-MM
  income: number;
  expense: number;
}

const short = (month: string) => monthName(`${month}-01`).slice(0, 3);

/** Abrevia importes del eje: 12.500 € -> "12,5k". */
function axisLabel(cents: number) {
  const euros = cents / 100;
  if (euros >= 1000) return `${(euros / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })}k`;
  return Math.round(euros).toLocaleString("es-ES");
}

/**
 * Barras agrupadas de ingresos y gastos (sin IVA) por mes.
 * Al tocar un mes se muestran sus importes; debajo hay una tabla con los datos.
 */
export function IncomeExpenseChart({ data, highlight }: { data: Point[]; highlight?: (month: string) => boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const H = 140;
  const groupW = 100 / data.length;
  const barW = Math.min(groupW * 0.32, 7);
  const sel = active !== null ? data[active] : null;

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
        <span className="num text-[11px] text-muted">máx. {axisLabel(max)} €</span>
      </div>

      <div className="relative">
        {sel && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-surface-dark px-3 py-2 text-[12px] text-white shadow-lg"
            style={{ left: `clamp(76px, ${(active! + 0.5) * groupW}%, calc(100% - 76px))` }}
            role="status"
          >
            <p className="mb-1 text-white/60">{monthName(`${sel.month}-01`)}</p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded bg-chart-income" />
              <span className="num font-semibold">{formatEuros(sel.income)}</span>
              <span className="text-white/60">ingresos</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded bg-chart-expense" />
              <span className="num font-semibold">{formatEuros(sel.expense)}</span>
              <span className="text-white/60">gastos</span>
            </p>
          </div>
        )}
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="block h-36 w-full" role="img" aria-label="Ingresos y gastos por mes">
          <line x1="0" x2="100" y1={H / 2} y2={H / 2} className="stroke-border" strokeWidth="0.4" vectorEffect="non-scaling-stroke" strokeDasharray="2 3" />
          {data.map((d, i) => {
            const cx0 = (i + 0.5) * groupW;
            const hi = (d.income / max) * (H - 4);
            const he = (d.expense / max) * (H - 4);
            const dim = active !== null && active !== i;
            const hl = highlight?.(d.month) ?? true;
            return (
              <g key={d.month} opacity={active === i ? 1 : dim ? 0.45 : hl ? 1 : 0.55}>
                <rect x={cx0 - barW - 0.4} y={H - hi} width={barW} height={Math.max(hi, d.income ? 1 : 0)} rx="1.2" className="fill-chart-income" />
                <rect x={cx0 + 0.4} y={H - he} width={barW} height={Math.max(he, d.expense ? 1 : 0)} rx="1.2" className="fill-chart-expense" />
              </g>
            );
          })}
          <line x1="0" x2="100" y1={H} y2={H} className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Zonas táctiles: todo el ancho de cada mes. */}
        <div className="absolute inset-0 flex">
          {data.map((d, i) => (
            <button
              key={d.month}
              type="button"
              aria-label={`${monthName(`${d.month}-01`)}: ingresos ${formatEuros(d.income)}, gastos ${formatEuros(d.expense)}`}
              className="h-full flex-1"
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              // Tocar un mes lo muestra; tocar fuera (pierde el foco) lo oculta.
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex">
        {data.map((d) => (
          <span key={d.month} className={cx("flex-1 text-center text-[10.5px] text-muted", highlight?.(d.month) && "font-semibold text-text")}>
            {short(d.month)}
          </span>
        ))}
      </div>

      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer text-muted">Ver en tabla</summary>
        <table className="num mt-2 w-full text-right">
          <thead className="text-muted">
            <tr>
              <th className="text-left font-medium">Mes</th>
              <th className="font-medium">Ingresos</th>
              <th className="font-medium">Gastos</th>
              <th className="font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month} className="border-t border-border">
                <td className="py-1 text-left font-sans">{monthName(`${d.month}-01`)}</td>
                <td>{formatEuros(d.income)}</td>
                <td>{formatEuros(d.expense)}</td>
                <td className={d.income - d.expense < 0 ? "text-danger" : undefined}>{formatEuros(d.income - d.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
```

## `formato.ts`

```ts
// Utilidades mínimas que usan week-strip.tsx e income-expense-chart.tsx.
// Adáptalas a tu app (moneda, zona horaria…).

/** "2026-11-19" -> "Noviembre" */
export function monthName(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const t = new Intl.DateTimeFormat("es-ES", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Días (lunes a domingo, "AAAA-MM-DD") de la semana que contiene `iso`. */
export function weekDays(iso: string): string[] {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const weekday = (base.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() - weekday + i);
    return day.toISOString().slice(0, 10);
  });
}

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", useGrouping: "always" });
/** 123456 (céntimos) -> "1.234,56 €" */
export function formatEuros(cents: number): string {
  return eur.format(cents / 100);
}
```
