import { avisoSwal, confirmDestructivo, confirmSwal } from "@/lib/confirm-destructivo";

export async function confirmarDesasignarPersona(options: {
  title: string;
  text: string;
}) {
  return confirmSwal({
    title: options.title,
    text: options.text,
    icon: "question",
    confirmButtonText: "Sí, desasignar",
    confirmTone: "primary",
  });
}

export async function confirmarEliminacionEstructura(options: {
  title: string;
  text: string;
}) {
  return confirmDestructivo({
    title: options.title,
    text: options.text,
    confirmButtonText: "Sí, eliminar",
  });
}

export async function avisoNoEliminableEstructura(options: {
  title: string;
  text: string;
}) {
  return avisoSwal({
    title: options.title,
    text: options.text,
  });
}
