import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getDocumentoVista, getNoticiasRelacionadas } from "./lib/actions";
import {
  esNoticiaSecciones,
  instanteUltimaActualizacion,
  parsearNoticiaContent,
  puedeEditarAccesoDocumento,
  puedeEditarDocumento,
  rutaDetalleDocumento,
  rutaEditarDocumento,
  rutaRepositorioDocumentos,
  rutaRepositorioNoticias,
  segmentoListaRepositorio,
  slugsFotosSeccion,
} from "./lib/helpers";
import { esPdfMime, rutaRawArchivo, rutaVisorArchivo } from "./lib/storage";
import { DocumentoLectura } from "./DocumentoLectura";
import { NoticiaArticulo } from "./NoticiaArticulo";
import { ConocimientoDetalleAcciones } from "./ConocimientoDetalleAcciones";
import { NoticiasRelacionadas } from "./NoticiasRelacionadas";
import { RepositorioDocumentoVistaAcciones } from "./RepositorioDocumentoVistaAcciones";

export async function RepositorioDocumentoVista({
  slug,
  listaSegmento,
}: {
  slug: string;
  listaSegmento: "noticias" | "documentos";
}) {
  const doc = await getDocumentoVista(slug);
  if (!doc) notFound();

  const esperado = segmentoListaRepositorio(doc.channel);
  if (esperado !== listaSegmento) {
    redirect(`/siget/repositorio/${esperado}/${encodeURIComponent(doc.slug)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role =
    (user?.user_metadata?.rol as string | undefined) || user?.role || "user";
  const puedeEditar = puedeEditarDocumento(doc, user?.id, role);
  const puedeEditarAcceso = puedeEditarAccesoDocumento(doc, user?.id, role);
  const actualizadoEn = instanteUltimaActualizacion(doc);
  const publicoHref =
    doc.publishing_status === "aprobado" && doc.access_level === "public"
      ? rutaDetalleDocumento(doc.channel, doc.slug)
      : null;
  const volverHref =
    esperado === "noticias" ? rutaRepositorioNoticias() : rutaRepositorioDocumentos();
  const acciones = (
    <RepositorioDocumentoVistaAcciones
      slug={doc.slug}
      volverHref={volverHref}
      editarHref={puedeEditar ? rutaEditarDocumento(doc.slug, doc.channel) : null}
      publicoHref={publicoHref}
      accessLevel={doc.access_level}
      canToggleAccess={puedeEditarAcceso}
    />
  );

  if (doc.channel === "noticia" && esNoticiaSecciones(doc.content)) {
    const parsed = parsearNoticiaContent(doc.content);
    const slugsUsados = new Set(
      parsed.sections.flatMap((section) => slugsFotosSeccion(section)),
    );
    const adjuntos = doc.files.filter((file) => !slugsUsados.has(file.slug));
    const relacionadas = await getNoticiasRelacionadas({
      documentType: doc.document_type,
      excludeSlug: doc.slug,
    });
    return (
      <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10">
          <div className="mb-6">{acciones}</div>
          <div className="rounded-2xl border border-border bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <NoticiaArticulo
              title={doc.title}
              summary={doc.summary}
              author={doc.author}
              publicationDate={doc.publication_date}
              actualizadoEn={actualizadoEn}
              countryScope={doc.country_scope}
              program={doc.program}
              tags={doc.tags}
              documentType={doc.document_type}
              channel={doc.channel}
              visitas={doc.view_count}
              descargas={doc.download_count}
              sections={parsed.sections.map((section) => ({
                id: section.id,
                heading: section.heading,
                body: section.body,
                photoSrcs: slugsFotosSeccion(section)
                  .map((fileSlug) => rutaRawArchivo(fileSlug))
                  .filter((src): src is string => Boolean(src)),
                videoUrl: section.video_url,
                imageAlt: section.heading || doc.title,
              }))}
            />
            {adjuntos.length > 0 ? (
              <div className="mt-8 space-y-3">
                {adjuntos.map((file) => (
                  <ConocimientoDetalleAcciones
                    key={file.id}
                    slug={file.slug}
                    nombre={file.original_name}
                    puedeVer={esPdfMime(file.mime_type)}
                    visorHref={rutaVisorArchivo(file.slug)}
                    rawHref={rutaRawArchivo(file.slug, true)}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <NoticiasRelacionadas items={relacionadas} articuloActual={doc} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-6">{acciones}</div>
        <div className="rounded-2xl border border-border bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <DocumentoLectura doc={doc} actualizadoEn={actualizadoEn} />
        </div>
      </div>
    </div>
  );
}
