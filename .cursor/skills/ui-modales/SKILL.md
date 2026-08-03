---
name: ui-modales
description: Implementa formularios y ventanas flotantes con ModalShell de general-modal.tsx — ModalInput, ModalFooter, ModalConfirmDelete y feedback con toast. Se usa al crear o editar modales, formularios en overlay o confirmaciones destructivas dentro de un modal.
---

# Modales

Implementación única: `@/components/ui/general-modal.tsx`.

Componentes: `ModalShell`, `ModalLabel`, `ModalInput`, `ModalTextarea`, `ModalSubmit`, `ModalFooter`, `ModalConfirmDelete`.

## Comportamiento

- Portal al `body` con `createPortal`; `z-[200]`; bloquear scroll del body.
- **Escritorio:** centrado, overlay `bg-zinc-700/20 backdrop-blur-sm`, borde animado celeste, `rounded-3xl`, sombra ligera.
- **Teléfono:** pantalla completa `100dvh`, fondo zinc sólido, sin blur ni borde animado.
- Campos: **sin placeholder**; `border-2 border-celeste-trifinio`; fondo transparente; focus ring celeste.
- Footer: Cancelar (gris) izquierda + Guardar (esmeralda) derecha; una sola acción → Guardar centrado.
- Safe area superior e inferior en teléfono.

## Prohibido

- `Dialog` de shadcn u otros modales ad hoc para formularios.
- SweetAlert dentro de `ModalShell` (usar `ModalConfirmDelete`).
- Botones con borde u outline en guardar/cancelar.

## Plantilla

```tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ModalShell,
  ModalLabel,
  ModalInput,
  ModalSubmit,
  ModalFooter,
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
    <ModalShell open={open} onClose={onClose} title="Título" subtitle="Subtítulo">
      {open && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-2">
            <ModalLabel htmlFor="campo">Campo</ModalLabel>
            <ModalInput
              id="campo"
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              autoFocus
            />
          </div>
          <ModalFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 bg-zinc-200 px-6 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              Cancelar
            </button>
            <ModalSubmit disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
            </ModalSubmit>
          </ModalFooter>
        </form>
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
