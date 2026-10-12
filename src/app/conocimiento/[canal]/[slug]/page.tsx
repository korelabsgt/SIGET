import { Suspense } from "react";
import { ConocimientoDetalle } from "@/components/(SIGET)/repositorio/ConocimientoDetalle";

export default async function ConocimientoDetallePage({
  params,
}: {
  params: Promise<{ canal: string; slug: string }>;
}) {
  const { canal, slug } = await params;
  return (
    <Suspense>
      <ConocimientoDetalle canal={canal} slug={slug} />
    </Suspense>
  );
}
