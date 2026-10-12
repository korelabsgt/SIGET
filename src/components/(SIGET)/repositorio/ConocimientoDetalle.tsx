import { notFound } from "next/navigation";
import { formatFechaCalendarioGt } from "@/lib/fechas-gt";
import { modalAccentClass } from "@/components/ui/general-modal";
import { getDocumentoPublico } from "./lib/actions";
import {
  CHANNEL_LABELS,
  COUNTRY_LABELS,
  PROGRAM_LABELS,
  TYPE_LABELS,
  esCanalPublico,
  esNoticiaSecciones,
  parsearNoticiaContent,
  sanitizarHtml,
  slugsFotosSeccion,
} from "./lib/helpers";
import { esImagenMime, esPdfMime, rutaRawArchivo, rutaVisorArchivo } from "./lib/storage";
import { ConocimientoDetalleAcciones } from "./ConocimientoDetalleAcciones";
import { NoticiaArticulo } from "./NoticiaArticulo";

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

  if (doc.channel === "noticia" && esNoticiaSecciones(doc.content)) {
    const parsed = parsearNoticiaContent(doc.content);
    const slugsUsados = new Set(
      parsed.sections.flatMap((section) => slugsFotosSeccion(section)),
    );
    const adjuntos = doc.files.filter((file) => !slugsUsados.has(file.slug));
    return (
      <article className="relative w-full flex-1 bg-white dark:bg-zinc-900">
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10">
          <NoticiaArticulo
            title={doc.title}
            summary={doc.summary}
            author={doc.author}
            publicationDate={doc.publication_date}
            countryScope={doc.country_scope}
            program={doc.program}
            tags={doc.tags}
            documentType={doc.document_type}
            channel={doc.channel}
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
      </article>
    );
  }

  const imagenes = doc.files.filter((file) => esImagenMime(file.mime_type));
  const adjuntos = doc.files.filter((file) => !esImagenMime(file.mime_type));
  const html = sanitizarHtml(doc.content);

  return (
    <article className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
          {CHANNEL_LABELS[doc.channel]} · {TYPE_LABELS[doc.document_type]}
        </p>
        <h1 className={`mt-2 text-3xl leading-tight ${modalAccentClass}`}>{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {doc.author}
          {doc.cooperante ? ` · ${doc.cooperante}` : ""} ·{" "}
          {formatFechaCalendarioGt(doc.publication_date)} ·{" "}
          {COUNTRY_LABELS[doc.country_scope]}
          {doc.program ? ` · ${PROGRAM_LABELS[doc.program]}` : ""}
        </p>
        {doc.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {doc.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-muted-foreground dark:bg-zinc-800"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : null}

        {doc.summary ? (
          <p className="mt-6 text-base leading-relaxed text-foreground">{doc.summary}</p>
        ) : null}

        {html && html !== "<p></p>" ? (
          <div
            className="prose prose-sm mt-6 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}

        {imagenes.length > 0 ? (
          <div className="mt-8 grid gap-4">
            {imagenes.map((file) => (
              <figure key={file.id} className="overflow-hidden rounded-2xl border border-border dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rutaRawArchivo(file.slug)}
                  alt={file.original_name}
                  className="w-full"
                />
              </figure>
            ))}
          </div>
        ) : null}

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
    </article>
  );
}
