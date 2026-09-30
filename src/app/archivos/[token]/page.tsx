import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArchivosPublicos } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/ArchivosPublicos";
import { getArchivosPorToken } from "@/components/(SIGET)/gestion-territorial/asistencia-actividades/lib/actions";

async function ArchivosPublicosContent({ token }: { token: string }) {
  const data = await getArchivosPorToken(token);
  if (!data) notFound();
  return <ArchivosPublicos data={data} />;
}

export default async function ArchivosPublicosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense>
      <ArchivosPublicosContent token={token} />
    </Suspense>
  );
}
