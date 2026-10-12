import { Suspense } from "react";
import { ConocimientoArchivoPage } from "@/components/(SIGET)/repositorio/ConocimientoArchivoPage";

export default async function ConocimientoArchivoVisorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense>
      <ConocimientoArchivoPage slug={slug} />
    </Suspense>
  );
}
