import { Suspense } from "react";
import { AsistenciaActividades } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/AsistenciaActividades";

export default function AsistenciaActividadesPage() {
  return (
    <Suspense>
      <AsistenciaActividades />
    </Suspense>
  );
}
