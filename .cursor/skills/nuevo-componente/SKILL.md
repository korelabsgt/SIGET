---
name: nuevo-componente
description: Orquesta la creación de módulos nuevos en SIGET — estructura autocontenida, Supabase, TanStack Query, Zod y enrutamiento. Carga skills específicos según necesidad (ui-modales, ui-toastify, componente-fechas-gt, etc.). Se usa al crear componente, módulo, feature, CRUD o pantalla nueva.
---

# Nuevo componente SIGET

Todo módulo es **autocontenido** en `src/components/[nombre-modulo]/`. Nada de lógica del módulo fuera de ahí.

## Antes de escribir código

1. `graphify query "<módulo>"` desde `src/` para ver si ya existe algo parecido.
2. Si el módulo existe, **respeta su estructura actual**.
3. Confirma tabla y columnas de Supabase antes de `lib/zod.ts`.

## Estructura obligatoria

```
src/components/[nombre-modulo]/
├── NombreRepresentativo.tsx
├── forms/
│   ├── Crear.tsx
│   └── VerEditar.tsx
└── lib/
    ├── zod.ts
    ├── actions.ts
    └── hooks.ts
```

- Carpeta en `kebab-case` español.
- Componente de entrada con nombre **descriptivo**, nunca `Index.tsx` ni `Main.tsx`.
- Prohibido `types.ts` / `interfaces.ts`; tipos con `z.infer` en `lib/zod.ts`.
- Lógica pura compartida (formato, normalización DB, filtros, vacíos de formulario) en `lib/helpers.ts` — **no** tipos ni schemas ahí.

### Archivos opcionales en `lib/`

Solo cuando el módulo lo necesite (no forman parte de la estructura base):

| Archivo | Cuándo | Skill |
|---------|--------|-------|
| `lib/helpers.ts` | Funciones de dominio reutilizadas en 2+ archivos del módulo | — |
| `lib/swal.ts` | Varias confirmaciones SweetAlert fuera de modal | `ui-sweetalert` |

**`helpers.ts`:** funciones puras sin `"use server"`. Importar tipos desde `zod.ts`, no redefinirlos.

**Cuándo crear `helpers.ts`:** normalizar JSON de Supabase, formatear etiquetas, filtros locales, factories `empty*()`, ordenamiento. Si la función solo se usa en un componente, dejarla colocada ahí.

Si hay una sola confirmación puntual, usar `@/lib/confirm-destructivo` directo sin crear `lib/swal.ts`.

## Orden de construcción

```
- [ ] 1. lib/zod.ts
- [ ] 2. lib/actions.ts
- [ ] 3. lib/hooks.ts
- [ ] 4. lib/helpers.ts (solo si hay lógica pura compartida)
- [ ] 5. forms/Crear.tsx y forms/VerEditar.tsx
- [ ] 6. NombreRepresentativo.tsx
- [ ] 7. app/.../page.tsx
- [ ] 8. Verificación
```

Plantillas: [plantillas.md](plantillas.md).

## Skills a cargar según el caso

| Necesidad | Skill |
|-----------|-------|
| Tema, botones | `ui-tema-botones` |
| Formularios flotantes | `ui-modales` |
| Feedback éxito/error | `ui-toastify` |
| Confirmar eliminación fuera de modal | `ui-sweetalert` (helper `@/lib/confirm-destructivo`; `lib/swal.ts` solo si hay varias) |
| Gráficos (donas, barras, progreso) | `ui-graficos` |
| Filas que se agregan/quitan | `ui-animaciones-listas` |
| Layout sticky/fullscreen, estado de red | `ui-offline-banner` |
| Fechas y timestamps | `componente-fechas-gt` |
| Entrada en menú lateral | `menu-lateral` |

## Reglas de código

- Sin comentarios explicativos. Sin `any`.
- Datos async: TanStack Query, no `useEffect` para carga.
- Mutaciones: Server Actions en `lib/actions.ts`.

### Server Actions

1. `"use server"` al inicio.
2. Validar sesión con `supabase.auth.getUser()` antes de leer/mutar.
3. Validar input con `.safeParse()` de `lib/zod.ts`.
4. `try/catch`; devolver códigos (`UNAUTHORIZED`, `FORBIDDEN`, `INVALID_INPUT`, `DB_ERROR`).

```typescript
type ActionResult = { success: boolean; error: string | null };
```

Códigos nuevos → `MODAL_ACTION_ERRORS` en `modal-toast.ts`.

### Enrutamiento

`page.tsx` solo importa el componente en `<Suspense>`. Sin UI ni lógica ahí.

```typescript
import { Suspense } from "react";
import { NombreComponente } from "@/components/mi-modulo/NombreComponente";

export default function Page() {
  return (
    <Suspense>
      <NombreComponente />
    </Suspense>
  );
}
```

## Verificación final

```
- [ ] Estructura completa; nada del módulo fuera de su carpeta
- [ ] Sin types.ts, interfaces.ts ni any
- [ ] Tipos en zod.ts; helpers solo funciones puras
- [ ] Server Actions con sesión + safeParse + códigos de error
- [ ] page.tsx solo Suspense + componente
- [ ] Menú: skill `menu-lateral` si el módulo aparece en el drawer
- [ ] Donas: skill `ui-graficos` (centro interactivo, leyenda clickeable)
- [ ] Fechas: skill componente-fechas-gt (si hay campos de fecha)
- [ ] Layouts fixed/sticky respetan --banner-height (ui-offline-banner)
- [ ] pnpm lint OK
- [ ] graphify update . desde src/
```

## Recursos

- Plantillas: [plantillas.md](plantillas.md)
- Referencia de módulo con helpers: `src/components/(SIGET)/memoria-labores/`
