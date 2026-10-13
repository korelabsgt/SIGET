import { notFound } from "next/navigation";
import { getDocumentoPublico, getNoticiasRelacionadas } from "./lib/actions";
import {
  esCanalPublico,
  esNoticiaSecciones,
  instanteUltimaActualizacion,
  parsearNoticiaContent,
  slugsFotosSeccion,
} from "./lib/helpers";
import { esPdfMime, rutaRawArchivo, rutaVisorArchivo } from "./lib/storage";
import { ConocimientoDetalleAcciones } from "./ConocimientoDetalleAcciones";
import { ConocimientoVolverEnlace } from "./ConocimientoVolverEnlace";
import { DocumentoLectura } from "./DocumentoLectura";
import { NoticiaArticulo } from "./NoticiaArticulo";
import { NoticiasRelacionadas } from "./NoticiasRelacionadas";
import { rutaCatalogoCanal } from "./lib/helpers";

export async function ConocimientoDetalle({
  canal,
  slug,
}: {
  canal: string;
  slug: string;
}) {
  if (!esCanalPublico(canal)) notFound();
  const doc = await getDocumentoPublico(canal, slug);
  if (!doc) notFound();
  const actualizadoEn = instanteUltimaActualizacion(doc);

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
      <article className="relative w-full flex-1">
        <div className="relative z-10 mx-auto my-4 w-full max-w-3xl rounded-3xl border border-white/60 bg-white/85 px-4 pb-4 pt-1.5 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/85 md:my-8 md:px-6 md:pb-5">
          <ConocimientoVolverEnlace
            href={rutaCatalogoCanal("noticias")}
            label="Volver a noticias"
          />
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
            slug={doc.slug}
            registrarVisita
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
          <NoticiasRelacionadas items={relacionadas} articuloActual={doc} />
          <div className="mt-6 flex w-full justify-start">
            <ConocimientoVolverEnlace
              href={rutaCatalogoCanal("noticias")}
              label="Volver a noticias"
              className="mb-0 py-1.5"
            />
          </div>
        </div>
      </article>
    );
  }

  const relacionadas =
    doc.channel === "noticia"
      ? await getNoticiasRelacionadas({
          documentType: doc.document_type,
          excludeSlug: doc.slug,
        })
      : [];

  return (
    <article className="relative w-full flex-1">
      <div className="relative z-10 mx-auto my-4 w-full max-w-3xl rounded-3xl border border-white/60 bg-white/85 px-4 pb-4 pt-1.5 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/85 md:my-8 md:px-6 md:pb-5">
        {doc.channel === "noticia" ? (
          <ConocimientoVolverEnlace
            href={rutaCatalogoCanal("noticias")}
            label="Volver a noticias"
          />
        ) : null}
        <DocumentoLectura
          doc={doc}
          actualizadoEn={actualizadoEn}
          registrarVisita
        />
        <NoticiasRelacionadas items={relacionadas} articuloActual={doc} />
        {doc.channel === "noticia" ? (
          <div className="mt-6 flex w-full justify-start">
            <ConocimientoVolverEnlace
              href={rutaCatalogoCanal("noticias")}
              label="Volver a noticias"
              className="mb-0 py-1.5"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
