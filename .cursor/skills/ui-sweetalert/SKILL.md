---
name: ui-sweetalert
description: Confirmaciones destructivas con SweetAlert 2 fuera de ModalShell — helper compartido confirm-destructivo.ts y wrappers opcionales en lib/swal.ts del módulo. Se usa al confirmar eliminaciones o decisiones destructivas en listas y formularios que no usan ModalShell.
---

# SweetAlert 2

Solo **fuera** de `ModalShell`. Dentro de modales: `ModalConfirmDelete` (skill `ui-modales`).

## Helper compartido (obligatorio)

Estilos y z-index centralizados en `@/lib/confirm-destructivo.ts`:

| Función | Uso |
|---------|-----|
| `confirmDestructivo()` | Eliminar / quitar (warning, botón rojo) |
| `confirmSwal()` | Confirmación genérica (`confirmTone: "primary"` para acciones no destructivas) |
| `avisoSwal()` | Aviso con un solo botón |

No copiar `customClass` ni `didOpen` en cada módulo.

## Wrapper opcional por módulo

Solo si el módulo tiene **varias** confirmaciones con textos fijos → `lib/swal.ts` con funciones finas:

```typescript
import { confirmDestructivo } from "@/lib/confirm-destructivo";

export function confirmQuitarItem() {
  return confirmDestructivo({
    title: "¿Quitar?",
    text: "Este elemento se eliminará.",
    confirmButtonText: "Sí, quitar",
  });
}
```

Si es **una sola** confirmación puntual, importar `confirmDestructivo` directo sin crear `lib/swal.ts`.

## Estilo

- Popup zinc `rounded-2xl`; icono warning ámbar.
- Confirmar destructivo: rojo suave. Cancelar / primario: sky.
- `buttonsStyling: false`; acciones centradas.
- `z-index` 10001 en `didOpen` (por encima de toastify).

## Prohibido

- SweetAlert dentro de formularios con `ModalShell`.
- Botones con estilo por defecto de SweetAlert (`confirmButtonColor` sin `customClass`).
- Duplicar el bloque de `customClass` fuera de `confirm-destructivo.ts`.
- SweetAlert para feedback simple (usar toast: skill `ui-toastify`).
