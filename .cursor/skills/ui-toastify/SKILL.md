---
name: ui-toastify
description: Notificaciones con react-toastify en SIGET — toast.success/error/warn, modalActionMessage y contenedor global ObsToastContainer. Se usa para feedback de éxito, error o advertencia en formularios, modales y acciones.
---

# Toastify

Siempre **react-toastify** para éxito, error y advertencia. Prohibido montar otro `ToastContainer`.

## Contenedor global

- `ObsToastContainer` en el layout raíz (`src/app/layout.tsx`).
- Config: `position="top-center"`, `autoClose={3000}`, `theme="colored"`.
- Estilos en `globals.css` con variables `--toastify-*`. No sobrescribir theme en el contenedor.
- `z-index` 10000 (por encima de modales `z-[200]`).

## Uso

```typescript
import { toast } from "react-toastify";
import { modalActionMessage } from "@/components/ui/modal-toast";

toast.success("Guardado correctamente.");
toast.error("No se pudo guardar.");
toast.warn("Revisa los datos del formulario.");

toast.error(modalActionMessage(res.error ?? undefined, "No se pudo guardar."));
```

- Llamadas directas a `toast.*`; sin wrappers ni SweetAlert para feedback simple.
- Códigos de server action: agregar a `MODAL_ACTION_ERRORS` en `modal-toast.ts` si hace falta uno nuevo.
- `autoClose` distinto solo si el mensaje lo requiere: `toast.warn("...", { autoClose: 6000 })`.

## Apariencia (obligatoria)

- Fondo sólido semántico (verde éxito, rojo error, ámbar advertencia).
- Sin sombra, sin borde fino, sin tarjeta blanca interior.
- Texto blanco en éxito/error; texto oscuro en advertencia.

## Prohibido

- `ToastContainer` duplicado por página o módulo.
- SweetAlert para feedback simple (reservado para confirmaciones: skill `ui-sweetalert`).
