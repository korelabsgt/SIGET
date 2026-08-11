import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RegistroPublico } from "@/components/(SIGET)/asistencia-actividades/RegistroPublico";
import { getActividadPublica } from "@/components/(SIGET)/asistencia-actividades/lib/actions";

export default async function RegistroPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
