import { formatFechaCalendarioGt, formatFechaHora24Gt } from "@/lib/fechas-gt";
import { modalAccentClass } from "@/components/ui/general-modal";
import { ContadoresPublicacion } from "./ContadoresPublicacion";
import { sanitizarHtml } from "./lib/helpers";
import {
  CHANNEL_LABELS,
  COUNTRY_LABELS,
  PROGRAM_LABELS,
  TYPE_LABELS,
} from "./lib/helpers";
import { rutaRawArchivo } from "./lib/storage";
import type { DocumentChannel, DocumentType, ProgramEnum, TagRecord } from "./lib/zod";
import { NoticiaSeccionCarrete } from "./NoticiaSeccionCarrete";
import { NoticiaVideo } from "./NoticiaVideo";

export type NoticiaSeccionVista = {
  id: string;
  heading: string;
  body: string;
  photoSrcs?: string[];
  videoUrl?: string | null;
  imageAlt?: string;
};

export function NoticiaArticulo({
  title,
  summary,
  author,
  publicationDate,
  actualizadoEn = null,
  countryScope,
  program,
  tags = [],
  sections,
  documentType = "articulo",
  channel = "noticia",
  galeriaInsetBleed = false,
  visitas,
  descargas,
  slug,
  registrarVisita = false,
}: {
  title: string;
  summary: string;
  author: string;
  publicationDate: string;
  actualizadoEn?: string | null;
  countryScope: "trinacional" | "guatemala" | "el_salvador" | "honduras";
  program?: ProgramEnum | null;
  tags?: TagRecord[];
  sections: NoticiaSeccionVista[];
  documentType?: DocumentType;
  channel?: DocumentChannel;
  galeriaInsetBleed?: boolean;
  visitas?: number;
  descargas?: number;
  slug?: string;
  registrarVisita?: boolean;
}) {
  return (
    <article className="w-full">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
        {CHANNEL_LABELS[channel]} · {TYPE_LABELS[documentType]}
      </p>
      <h1 className={`mt-2 text-3xl leading-tight ${modalAccentClass}`}>
        {title.trim() || "Sin título"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {author.trim() || "Autor"}
        {publicationDate ? ` · ${formatFechaCalendarioGt(publicationDate)}` : ""}
        {` · ${COUNTRY_LABELS[countryScope]}`}
        {program ? ` · ${PROGRAM_LABELS[program]}` : ""}
      </p>
      {actualizadoEn ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Última actualización: {formatFechaHora24Gt(actualizadoEn)}
        </p>
      ) : null}
      {visitas !== undefined && descargas !== undefined ? (
        <div className="mt-2">
          <ContadoresPublicacion
            visitas={visitas}
            descargas={descargas}
            slug={slug}
            registrar={registrarVisita}
          />
        </div>
      ) : null}
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-muted-foreground dark:bg-zinc-800"
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
      {summary.trim() ? (
        <p className="mt-6 text-base leading-relaxed text-foreground">{summary}</p>
      ) : null}
      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <section key={section.id} className="space-y-3">
            {section.heading.trim() ? (
              <h2 className={`text-xl font-bold leading-tight ${modalAccentClass}`}>
                {section.heading}
              </h2>
            ) : null}
            {section.photoSrcs && section.photoSrcs.length > 0 ? (
              <NoticiaSeccionCarrete
                images={section.photoSrcs}
                alt={section.imageAlt || section.heading || title}
                insetBleed={galeriaInsetBleed && section.photoSrcs.length === 1}
              />
            ) : null}
            <NoticiaVideo
              url={section.videoUrl}
              title={section.heading || title || "Video"}
              posterSrc={section.photoSrcs?.[0]}
            />
            {section.body.trim() ? (
              /<\/?[a-z][\s\S]*>/i.test(section.body) ? (
                <div
                  className="noticia-cuerpo text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizarHtml(section.body) }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {section.body}
                </div>
              )
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}

export function srcSeccionNoticia(imageSlug: string | null): string | null {
  if (!imageSlug) return null;
  return rutaRawArchivo(imageSlug);
}
