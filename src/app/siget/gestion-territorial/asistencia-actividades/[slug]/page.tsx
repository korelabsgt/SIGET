"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ActividadDetalle } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/ActividadDetalle";

export default function ActividadDetallePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  if (!slug || Array.isArray(slug)) {
    return null;
  }

  return (
    <Suspense>
      <ActividadDetalle actividadRef={slug} />
    </Suspense>
  );
}
