---
name: ui-modales
description: Implementa formularios y ventanas flotantes con ModalShell de general-modal.tsx — ModalInput, ModalFooter, ModalConfirmDelete y feedback con toast. Se usa al crear o editar modales, formularios en overlay o confirmaciones destructivas dentro de un modal.
---

# Modales

Implementación única: `@/components/ui/general-modal.tsx`.

Componentes: `ModalShell`, `ModalLabel`, `ModalInput`, `ModalTextarea`, `ModalFechaInput`, `ModalForm`, `ModalField`, `ModalSubmit`, `ModalFooter`, `ModalConfirmDelete`, `modalFieldClass`.

## Comportamiento

- Portal al `body` con `createPortal`; `z-[200]`; bloquear scroll del body.
- **Escritorio:** centrado, overlay `bg-zinc-700/20 backdrop-blur-sm`, borde animado celeste, `rounded-3xl`, sombra ligera.
- **Teléfono:** pantalla completa `100dvh`, fondo zinc sólido, sin blur ni borde animado.
- Campos: borde zinc (`modalFieldClass`); fondo transparente; focus ring zinc. Fecha manual con `ModalFechaInput` (`DD/MM/AAAA`, sin calendario).
- Layout formulario: `ModalForm` (`space-y-4`) + `ModalField` (`space-y-2` por campo).
- Footer: acciones con `SigetActionButton` (skill `ui-tema-botones`): Cancelar + Guardar, una palabra cada uno, icono morph a la derecha.
- Safe area superior e inferior en teléfono.

## Prohibido

- `Dialog` de shadcn u otros modales ad hoc para formularios.
- SweetAlert dentro de `ModalShell` (usar `ModalConfirmDelete`).
- `ModalSubmit`, `<button>` suelto o cualquier botón que no sea `SigetActionButton`.

## Plantilla

```tsx
"use client";

import { useState } from "react";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalFechaInput,
  ModalForm,
  ModalField,
  ModalFooter,
  ModalCancelButton,
  ModalSubmit,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";

export function EjemploModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const onClose = () => onOpenChange(false);
  const [campo, setCampo] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campo.trim()) {
      toast.warn("Revisa los datos del formulario.");
      return;
    }
    setPending(true);
    // const res = await mutacion...
    setPending(false);
    toast.success("Guardado correctamente.");
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Título">
      {open && (
        <ModalForm onSubmit={handleSubmit}>
          <ModalField>
            <ModalLabel htmlFor="campo">Campo</ModalLabel>
            <ModalInput
              id="campo"
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              autoFocus
            />
          </ModalField>
          <ModalFooter>
            <ModalCancelButton onClick={onClose} disabled={pending} />
            <ModalSubmit disabled={pending} />
          </ModalFooter>
        </ModalForm>
      )}
    </ModalShell>
  );
}
```

Montar el cuerpo con `{open && <Body />}` para resetear estado en cada apertura.

## Confirmación destructiva

```tsx
import { ModalConfirmDelete } from "@/components/ui/general-modal";

{confirmando && (
  <ModalConfirmDelete
    message="¿Eliminar este registro? Esta acción no se puede deshacer."
    pending={eliminar.isPending}
    onCancel={() => setConfirmando(false)}
    onConfirm={async () => {
      const res = await eliminar.mutateAsync(id);
      if (res.success) {
        toast.success("Eliminado.");
        onClose();
        return;
      }
      toast.error(modalActionMessage(res.error ?? undefined, "No se pudo eliminar."));
    }}
  />
)}
```

Feedback con toast: skill `ui-toastify`.
