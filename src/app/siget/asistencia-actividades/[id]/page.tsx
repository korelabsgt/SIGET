import { redirect } from "next/navigation";
import { getActividad } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/lib/actions";
import {
  esUuidActividad,
  rutaDetalleActividadAsistencia,
} from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/lib/helpers";

export default async function AsistenciaActividadLegacyRedirect(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  if (esUuidActividad(id)) {
    const actividad = await getActividad(id);
    if (actividad) {
      redirect(rutaDetalleActividadAsistencia(actividad));
    }
  }

  redirect(`/siget/gestion-territorial/asistencia-actividades/${id}`);
}
