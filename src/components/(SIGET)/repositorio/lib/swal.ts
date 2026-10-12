import { confirmDestructivo, confirmSwal } from "@/lib/confirm-destructivo";

export function confirmAprobarDocumento(titulo: string) {
  return confirmSwal({
    title: "¿Aprobar?",
    text: `Se publicará “${titulo}” en el catálogo de conocimiento.`,
    icon: "question",
    confirmButtonText: "Sí, aprobar",
    confirmTone: "primary",
  }).then((r) => r.isConfirmed);
}

export function confirmQuitarDocumento(titulo: string) {
  return confirmDestructivo({
    title: "¿Eliminar?",
    text: `Se eliminará “${titulo}” y sus archivos. Esta acción no se puede deshacer.`,
    confirmButtonText: "Sí, eliminar",
  }).then((r) => r.isConfirmed);
}
