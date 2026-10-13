import { notFound, redirect } from "next/navigation";
import { getDocumentoVista } from "@/components/(SIGET)/repositorio/lib/actions";
import { rutaVerDocumento } from "@/components/(SIGET)/repositorio/lib/helpers";

export default async function RepositorioSlugLegacyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDocumentoVista(slug);
  if (!doc) notFound();
  redirect(rutaVerDocumento(doc.slug, doc.channel));
}
