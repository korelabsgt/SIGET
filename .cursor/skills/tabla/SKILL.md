---
name: tabla
description: Tablas de listado SIGET a ancho completo con columnas No., Título (máx. 3 líneas), Autor y Acc. (SigetActionButton Abrir). Usar en catálogos públicos, bandejas y cualquier lista tabular del proyecto.
---

# Tabla de listado SIGET

## Cuándo

Listas de recursos en pantalla ancha (Conocimiento, repositorio, bandejas) donde conviene filas tabulares en lugar de cards.

## Layout de página

- Contenedor de contenido: `mx-auto w-full max-w-[1600px] px-2 md:px-6 lg:px-12` (no `max-w-5xl` en listas tabulares).
- Tabla dentro de `SigetTablaContenedor` (`@/components/ui/siget-tabla`).

## Columnas (orden fijo)

| Columna | Ancho | Contenido |
|---------|--------|-----------|
| **No.** | `w-0 whitespace-nowrap`, `tabular-nums` | Número de fila global: `(page - 1) * pageSize + index + 1` |
| **Título** | `table-fixed` + `colgroup` (~38%) | Solo título; `line-clamp-3`, `font-bold`, `break-words` |
| **Autor** | `colgroup` (~30–32%), `min-w-0` en celda | `author`; `line-clamp-2` |
| **Acc.** | `w-0 whitespace-nowrap text-right` | `SigetActionButton` `label="Abrir"` + `sigetAccent.abrir`; sin menú de 3 puntos salvo bandeja admin |

Encabezados: clase `sigetTablaHeadRowClass`. Filas: `sigetTablaRowClass`. Tabla: `sigetTablaClass` + `table-fixed` y `colgroup` (no dejar Autor con `w-0` sin porcentaje).

Filtros (buscador, selects): barra dentro de `SigetTablaContenedor`, sobre la fila de títulos de columna (`border-b`, fondo `bg-sky-50/80`).

## Fechas

En celdas, subtítulos de fila y metadatos: `formatFechaHora24Gt` (`@/lib/fechas-gt.ts`) → `Lun 01/02/26, 17:00`. `tabular-nums`. No usar AM/PM ni `toLocaleString` suelto.

## Acciones

Solo `SigetActionButton` (skill `ui-tema-botones`). Abrir → detalle o ruta pública.

## Paginación

`SigetTablaPaginacion` en el footer del contenedor; opcional selector de filas (`pageSizeOptions`).

## Animación

Filas con `AnimatePresence` + `motion.tr` `layout` (skill `ui-animaciones-listas` si aplica).

## Referencia

Implementación de referencia: `RepositorioLista.tsx` (bandeja SIGET). El catálogo público `/conocimiento` usa **cards**, no esta tabla.
