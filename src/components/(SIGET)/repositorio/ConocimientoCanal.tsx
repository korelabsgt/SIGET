import { notFound } from "next/navigation";
import { ConocimientoCatalogo } from "./ConocimientoCatalogo";
import { esCanalPublico } from "./lib/helpers";

export function ConocimientoCanal({ canal }: { canal: string }) {
  if (!esCanalPublico(canal)) notFound();
  return <ConocimientoCatalogo canal={canal} />;
}
