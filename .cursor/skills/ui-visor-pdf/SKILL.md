---
name: ui-visor-pdf
description: Visor público de archivos SIGET (PDF ajustado al ancho con pinch-zoom, imagen a pantalla completa, resto se descarga). Usar al mostrar PDF/imagen en móvil, enlaces /archivos/[token], proxy same-origin, o al no mandar el navegador a Supabase Storage.
---

# Visor PDF / archivo público

Nunca abrir el PDF con `<iframe src={urlSupabase}>` ni `window.location` a Storage. Safari lo muestra recortado/zoomeado. El binario se sirve **desde SIGET** y el PDF se pinta con `react-pdf`.

## Rutas

| Ruta | Archivo | Rol |
|------|---------|-----|
| `/archivos/[token]` | `src/app/archivos/[token]/page.tsx` | Página pública. `getArchivosPorToken` + `ArchivosPublicos` |
| `/archivos/[token]/raw` | `src/app/archivos/[token]/raw/route.ts` | GET: stream del archivo (o 302 si es enlace externo) |
| layout | `src/app/archivos/layout.tsx` | Viewport con `userScalable: true`, `maximumScale: 5` (el root lo bloquea) |

Chrome de app: `Header` y `ConditionalFooter` retornan `null` si `pathname.startsWith("/archivos")`.

Token: slug del nombre + código corto (`tokenPublicoDesdeNombre`). Legado `n`+uuid se regenera al copiar el enlace.

## Cómo cargar el archivo

1. **Metadatos (server):** `getArchivosPorToken(token)` en `asistencia-actividades/lib/actions.ts`. Alcance `archivo` → un nodo; `actividad`/`carpeta` → listado.
2. **Bytes (server, never the browser):** `obtenerArchivoPublicoPorToken(token)` descarga con `createPublicClient().storage.from(bucket).download(path)` y responde en `/raw` con `Content-Type` y `Content-Disposition` (`inline` si PDF/imagen, `attachment` el resto).
3. **Cliente:** `ArchivosPublicos` si es un archivo único monta `ArchivoPublicoVisor` con `url = /archivos/${token}/raw` (same-origin). Enlaces Drive/Dropbox sí salen al destino.

```tsx
<ArchivoPublicoVisor
  nodo={archivoUnico}
  url={`/archivos/${archivoUnico.token_publico}/raw`}
/>
```

## Cómo visualizar

Componente: `ArchivoPublicoVisor.tsx`

| Tipo | UI |
|------|----|
| PDF | `ManualPdfMobileViewer` a `fixed inset-0` |
| `image/*` | `<img>` full-width, scroll + zoom de página |
| otro | `fetch(raw)` → blob → `<a download>` |
| `enlace` | `location.replace` al URL externo |

PDF (no iframe; **solo cliente**, `ssr: false` — `react-pdf` usa `DOMMatrix`):

```tsx
import dynamic from "next/dynamic";

const ManualPdfMobileViewer = dynamic(
  () => import("@/components/(base)/layout/modals/ManualPdfMobileViewer"),
  { ssr: false },
);

<div className="fixed inset-0 z-[300] bg-zinc-200 dark:bg-zinc-950">
  <ManualPdfMobileViewer url={urlSameOrigin} />
</div>
```

`ManualPdfMobileViewer` (`src/components/(base)/layout/modals/ManualPdfMobileViewer.tsx`):

- `react-pdf` `Document` + `Page` con `width` = ancho del contenedor (página completa al entrar).
- Pellizco 1×–4× (`transform: scale`, `touch-action`).
- Worker: `pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"` (`public/pdf.worker.min.mjs`).
- CSS: `react-pdf/dist/Page/AnnotationLayer.css`. `renderTextLayer={false}`.

Dependencia: `react-pdf`. Si se reusa fuera de archivos públicos, pasar **URL same-origin o blob**, no la URL pública de Storage.

## Prohibido

- `<iframe>` / `<embed>` / `<object>` de PDF en móvil.
- `urlPublicaStorage` / signed URL en el `src` del visor.
- Dejar `maximumScale: 1` en rutas donde haga falta pellizco (override en el layout de esa ruta).
