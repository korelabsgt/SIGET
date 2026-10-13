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

export function confirmCambiarAcceso(publico: boolean) {
  return confirmSwal({
    title: publico ? "¿Hacer público?" : "¿Hacer privado?",
    text: publico
      ? "El documento podrá verse en el catálogo de conocimiento cuando esté aprobado."
      : "El documento dejará de aparecer en el catálogo público.",
    icon: "question",
    confirmButtonText: publico ? "Sí, público" : "Sí, privado",
    confirmTone: "primary",
  }).then((r) => r.isConfirmed);
}

export function confirmQuitarArchivo(nombre: string) {
  return confirmDestructivo({
    title: "¿Quitar archivo?",
    text: `Se quitará “${nombre}”. Esta acción no se puede deshacer.`,
    confirmButtonText: "Sí, quitar",
  }).then((r) => r.isConfirmed);
}

export function confirmQuitarDocumento(titulo: string) {
  return confirmDestructivo({
    title: "¿Eliminar?",
    text: `Se eliminará “${titulo}” y sus archivos. Esta acción no se puede deshacer.`,
    confirmButtonText: "Sí, eliminar",
  }).then((r) => r.isConfirmed);
}
