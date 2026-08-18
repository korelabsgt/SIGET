import { redirect } from "next/navigation";

export default function GestionVehiculosPage() {
  // Redirigir por defecto a la pestaña de "Flota"
  redirect("/siget/gestion-territorial/gestion-vehiculos/flota");
}
