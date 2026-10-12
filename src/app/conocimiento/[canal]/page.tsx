import { Suspense } from "react";
import { ConocimientoCanal } from "@/components/(SIGET)/repositorio/ConocimientoCanal";

export default async function ConocimientoCanalPage({
  params,
}: {
  params: Promise<{ canal: string }>;
}) {
  const { canal } = await params;
  return (
    <Suspense>
      <ConocimientoCanal canal={canal} />
    </Suspense>
  );
}
