import { notFound, redirect } from "next/navigation";
import { getDocumentoPorSlug } from "@/components/(SIGET)/repositorio/lib/actions";
import { rutaEditarDocumento } from "@/components/(SIGET)/repositorio/lib/helpers";

export default async function RepositorioEditarLegacyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDocumentoPorSlug(slug);
  if (!doc) notFound();
  redirect(rutaEditarDocumento(doc.slug, doc.channel));
}
