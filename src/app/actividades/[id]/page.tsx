import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { RegistroPublico } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/RegistroPublico";
import { getActividadPublica } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/lib/actions";
import {
  esUuidActividad,
  rutaPublicaActividadAsistencia,
} from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/lib/helpers";

async function RegistroPublicoContent({ id }: { id: string }) {
  const actividad = await getActividadPublica(id);

  if (!actividad) {
    notFound();
  }

  return (
    <Suspense>
      <RegistroPublico actividad={actividad} />
    </Suspense>
  );
}

export default async function RegistroPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (esUuidActividad(id)) {
    const actividad = await getActividadPublica(id);
    if (actividad) {
      redirect(rutaPublicaActividadAsistencia(actividad));
    }
  }

  return <RegistroPublicoContent id={id} />;
}
