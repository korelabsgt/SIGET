import { Suspense } from "react";
import { RepositorioDocumentoVista } from "@/components/(SIGET)/repositorio/RepositorioDocumentoVista";

export default async function RepositorioDocumentoVerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense>
      <RepositorioDocumentoVista slug={slug} listaSegmento="documentos" />
    </Suspense>
  );
}
