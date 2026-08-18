import { confirmDestructivo } from "@/lib/confirm-destructivo";

export function confirmQuitarMemoria(options: {
  title?: string;
  text?: string;
  confirmButtonText?: string;
}) {
  return confirmDestructivo({
    title: options.title ?? "¿Quitar?",
    text: options.text ?? "Este elemento se eliminará del formulario.",
    confirmButtonText: options.confirmButtonText ?? "Sí, quitar",
  });
}

export function confirmQuitarProyectoMemoria() {
  return confirmQuitarMemoria({
    title: "¿Quitar proyecto?",
    text: "Se eliminará este proyecto completo del informe.",
    confirmButtonText: "Sí, quitar proyecto",
  });
}
