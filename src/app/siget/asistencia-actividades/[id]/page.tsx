import { Suspense } from "react";
import { ActividadDetalle } from "@/components/(SIGET)/asistencia-actividades/ActividadDetalle";

export default async function ActividadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <ActividadDetalle actividadId={id} />
    </Suspense>
  );
}
