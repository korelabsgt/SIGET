import { Suspense } from "react";
import { RepositorioEditar } from "@/components/(SIGET)/repositorio/forms/VerEditar";

export default async function RepositorioNoticiaEditarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense>
      <RepositorioEditar slug={slug} listaSegmento="noticias" />
    </Suspense>
  );
}
