import type { ReactNode } from "react";
import { formatFechaCalendarioGt, formatFechaHora24Gt } from "@/lib/fechas-gt";
import { modalAccentClass } from "@/components/ui/general-modal";
import {
  CHANNEL_LABELS,
  COUNTRY_LABELS,
  PROGRAM_LABELS,
  TYPE_LABELS,
  sanitizarHtml,
  textoPlanoHtml,
} from "./lib/helpers";
import { esImagenMime, esPdfMime, rutaRawArchivo, rutaVisorArchivo } from "./lib/storage";
import { ConocimientoDetalleAcciones } from "./ConocimientoDetalleAcciones";
import { ContadoresPublicacion } from "./ContadoresPublicacion";
import type { DocumentRecord } from "./lib/zod";

export function DocumentoLectura({
  doc,
  actualizadoEn,
  registrarVisita = false,
  headerActions,
}: {
  doc: DocumentRecord;
  actualizadoEn: string | null;
  registrarVisita?: boolean;
  headerActions?: ReactNode;
}) {
  const imagenes = doc.files.filter((file) => esImagenMime(file.mime_type));
  const adjuntos = doc.files.filter((file) => !esImagenMime(file.mime_type));
  const html = sanitizarHtml(doc.content);

  return (
    <article className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
          {CHANNEL_LABELS[doc.channel]} · {TYPE_LABELS[doc.document_type]}
        </p>
        {headerActions}
      </div>
      <h1 className={`mt-2 text-3xl leading-tight ${modalAccentClass}`}>{doc.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {doc.author}
        {doc.cooperante ? ` · ${doc.cooperante}` : ""} ·{" "}
        {formatFechaCalendarioGt(doc.publication_date)} ·{" "}
        {COUNTRY_LABELS[doc.country_scope]}
        {doc.program ? ` · ${PROGRAM_LABELS[doc.program]}` : ""}
      </p>
      {actualizadoEn ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Última actualización: {formatFechaHora24Gt(actualizadoEn)}
        </p>
      ) : null}
      <div className="mt-2">
        <ContadoresPublicacion
          visitas={doc.view_count}
          descargas={doc.download_count}
          slug={registrarVisita ? doc.slug : undefined}
          registrar={registrarVisita}
        />
      </div>
      {doc.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
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

      {doc.summary.trim() && textoPlanoHtml(doc.summary) ? (
        /<\/?[a-z][\s\S]*>/i.test(doc.summary) ? (
          <div
            className="noticia-cuerpo mt-6 text-base leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizarHtml(doc.summary) }}
          />
        ) : (
          <p className="mt-6 text-base leading-relaxed text-foreground">{doc.summary}</p>
        )
      ) : null}

      {html && html !== "<p></p>" && textoPlanoHtml(html) ? (
        <div
          className="noticia-cuerpo mt-6 text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

      {imagenes.length > 0 ? (
        <div className="mt-8 grid gap-4">
          {imagenes.map((file) => (
            <figure
              key={file.id}
              className="overflow-hidden rounded-2xl border border-border dark:border-zinc-700"
            >
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
    </article>
  );
}
