---
name: ui-offline-banner
description: Banner global de conexión offline/lenta (OfflineBanner) — estados online/offline/slow, data-connection, --banner-height y layouts que respetan el offset. Se usa al crear UI fija/sticky, modales fullscreen móvil o lógica que dependa del estado de red.
---

# OfflineBanner y estado de conexión

Componente global: `src/components/OfflineBanner.tsx`. Montado una sola vez en `src/app/layout.tsx`.

**No crear otro banner de conexión.** Reutilizar el existente y respetar sus variables CSS.

## Estados

| Estado | Cuándo | UI |
|--------|--------|-----|
| `online` | Conexión normal | Banner oculto (`return null`) |
| `offline` | `!navigator.onLine` | Barra `bg-slate-700`, borde slate, «Sin Conexión» |
| `slow` | 2g/3g, `saveData`, RTT > 500 | Barra `bg-amber-600`, «Conexión Lenta o Inestable» |

Detección: `navigator.onLine` + Network Information API (`navigator.connection`).

## Integración con el layout

`OfflineBanner` escribe en `<html>`:

- `data-connection="online" | "offline" | "slow"`
- En `globals.css`, `offline` y `slow` activan `--banner-height: 64px` (56px en móvil).

El body usa `paddingTop: var(--banner-height, 0px)`.

## UI del banner

- Contenedor fijo `z-[9999]`; barra superior `h-14 md:h-16`, mismo alto que el header.
- Marco de pantalla: borde 6px (`slate-500/30` offline, `amber-500/20` slow).
- Entrada/salida con `motion.div` (`y: -64 → 0`, ease `[0.4, 0, 0.2, 1]`).
- Botón «Reintentar» → `window.location.reload()`.
- Texto: mayúsculas, tracking amplio, blanco.

## Layouts que deben respetar el banner

Cualquier elemento `fixed`/`sticky` bajo el header debe usar `--banner-height`:

```tsx
className="top-[calc(var(--banner-height,0px)+4rem)]"
className="h-[calc(100dvh-var(--banner-height,0px)-4rem)]"
```

Ejemplos en el proyecto: `Menu.tsx`, `OrganigramaVertical.tsx`, `header.tsx` (breadcrumb móvil).

## Lógica dependiente de conexión

Para deshabilitar mutaciones offline, leer en cliente:

```typescript
const offline = !navigator.onLine;
// o
const conn = document.documentElement.getAttribute("data-connection");
const isDegraded = conn === "offline" || conn === "slow";
```

Mostrar feedback con toast (`ui-toastify`), no un segundo banner.

## Prohibido

- Montar otro `OfflineBanner` o banner de red en páginas/módulos.
- Hardcodear `top: 4rem` en paneles fullscreen sin sumar `--banner-height`.
- Ignorar `data-connection` al calcular alturas `100dvh` en móvil.

## Referencia

- Componente: `src/components/OfflineBanner.tsx`
- Variables CSS: `src/app/globals.css` (`--banner-height`, `[data-connection]`)
- Layout: `src/app/layout.tsx`
