import { Suspense } from "react";
import { Mantenimiento } from "@/components/(SIGET)/gestion-territorial/gestion-vehiculos/mantenimiento/Mantenimiento";

export default function MantenimientoPage() {
  return (
    <Suspense>
      <Mantenimiento />
    </Suspense>
  );
}
