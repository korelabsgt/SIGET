import { notFound } from "next/navigation";
import { getArchivoRepositorioPorSlug } from "./lib/actions";
import { ConocimientoArchivoVisor } from "./ConocimientoArchivoVisor";

export async function ConocimientoArchivoPage({ slug }: { slug: string }) {
  const archivo = await getArchivoRepositorioPorSlug(slug);
  if (!archivo) notFound();
  return (
    <ConocimientoArchivoVisor
      slug={archivo.slug}
      mime={archivo.mime_type}
      filename={archivo.original_name}
    />
  );
}
