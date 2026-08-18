import { confirmDestructivo } from "@/lib/confirm-destructivo";

export function confirmQuitarActividad(text: string) {
  return confirmDestructivo({
    title: "¿Eliminar?",
    text,
    confirmButtonText: "Sí, eliminar",
  }).then((r) => r.isConfirmed);
}
