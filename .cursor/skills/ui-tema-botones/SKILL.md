---
name: ui-tema-botones
description: Aplica tema zinc (claro/oscuro) y estilos de botones SIGET — CTA, guardar, cancelar, agregar ítem y quitar. Se usa al estilizar pantallas, cards, superficies o cualquier botón de acción en la app.
---

# Tema y botones

## Superficies (paleta zinc)

| Contexto | Claro | Oscuro |
|----------|-------|--------|
| Fondo de página | blanco | `zinc-900` |
| Cards / componentes | `zinc-50` | `zinc-800` |
| Header / layout | `zinc-100` | `zinc-800` |
| Modal (cuerpo) | `zinc-100` | `zinc-900` |
| Modal (header/footer) | `zinc-100` | `zinc-800` |

Prohibidos fondos negro/blanco fijos fuera de esta escala.

## Reglas globales de botones

- Siempre `cursor-pointer`; deshabilitado: `cursor-not-allowed disabled:opacity-50`.
- Fondo sólido semántico; **sin borde** (`border-0`); **sin sombra** en acciones.
- Texto en mayúsculas pequeñas cuando aplique: `uppercase text-[10px] tracking-widest font-bold`.

## Tipos de botón

| Tipo | Cuándo | Clases |
|------|--------|--------|
| CTA página | Acción principal de pantalla | `inline-flex h-11 items-center justify-center rounded-xl border-0 px-6 bg-azul-trifinio text-white hover:opacity-90 active:scale-95 cursor-pointer` |
| Guardar | Formularios, modales | Usar `ModalSubmit` de `general-modal.tsx` |
| Cancelar | Secundario en modal | `inline-flex h-11 items-center justify-center rounded-xl border-0 px-6 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 cursor-pointer` |
| Agregar ítem | Fila/bloque repetible en formulario | `inline-flex h-9 items-center gap-1.5 rounded-lg border-0 px-3 text-xs font-bold bg-{tema}-100 text-{tema}-700 hover:bg-{tema}-200 dark:bg-{tema}-950 dark:hover:bg-{tema}-900 cursor-pointer` |
| Quitar | Destructivo inline | `inline-flex h-9 items-center gap-1.5 rounded-lg border-0 px-3 text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 cursor-pointer` |

**Agregar ítem:** `{tema}` = color de la sección (`sky`, `amber`, `violet`, `emerald`, etc.). Elige uno coherente con el bloque del formulario.

## Ejemplos

```tsx
<button
  type="button"
  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-azul-trifinio px-6 text-white transition-opacity hover:opacity-90 active:scale-95"
>
  Crear
</button>

<button
  type="button"
  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-violet-100 px-3 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-950 dark:hover:bg-violet-900"
>
  Agregar ítem
</button>
```
