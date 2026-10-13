"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lens } from "@/components/ui/lens";
import { formatFechaCalendarioGt } from "@/lib/fechas-gt";
import { ContadoresPublicacion } from "./ContadoresPublicacion";
import { cn } from "@/lib/utils";
import { portadaListItemSrc } from "./lib/storage";
import {
  CHANNEL_LABELS,
  COUNTRY_LABELS,
  PROGRAM_LABELS,
  textoPlanoHtml,
} from "./lib/helpers";
import type { DocumentListItem } from "./lib/zod";

export function ConocimientoCatalogoCard({
  item,
  href,
  onAbrir,
  simulado = false,
  layout = "default",
}: {
  item: DocumentListItem;
  href: string | null;
  onAbrir: (href: string) => void;
  simulado?: boolean;
  layout?: "default" | "cuadrado";
}) {
  const resumen = textoPlanoHtml(item.summary);
  const meta = [
    item.author,
    formatFechaCalendarioGt(item.publication_date),
    item.program ? PROGRAM_LABELS[item.program] : null,
    COUNTRY_LABELS[item.country_scope],
  ]
    .filter(Boolean)
    .join(" · ");

  const abrir = () => {
    if (href) onAbrir(href);
  };

  const portadaSrc = portadaListItemSrc(item.cover_slug);

  if (layout === "cuadrado") {
    return (
      <motion.li
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className="group aspect-square min-h-0"
      >
        <Card
          className={cn(
            "relative h-full w-full cursor-pointer gap-0 overflow-hidden border-border py-0 shadow-sm transition-shadow duration-300 group-hover:shadow-lg dark:border-zinc-700",
            href &&
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/40",
          )}
          role={href ? "button" : undefined}
          tabIndex={href ? 0 : undefined}
          onClick={href ? abrir : undefined}
          onKeyDown={
            href
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abrir();
                  }
                }
              : undefined
          }
        >
          {portadaSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portadaSrc}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div
              className="absolute inset-0 bg-linear-to-br from-azul-trifinio/90 to-celeste-trifinio/70 transition-transform duration-700 ease-out group-hover:scale-105"
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 bg-linear-to-t from-[#0a1628]/95 via-[#0a1628]/55 to-[#0a1628]/15 transition-opacity duration-500 group-hover:from-[#0a1628]/98 group-hover:via-[#0a1628]/65"
            aria-hidden
          />
          <CardContent className="relative z-10 flex h-full flex-col justify-end space-y-2 p-4 pt-16 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-celeste-trifinio">
                {CHANNEL_LABELS[item.channel]}
              </p>
              {simulado ? (
                <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-200">
                  Simulado
                </span>
              ) : null}
            </div>
            <CardTitle className="line-clamp-3 text-base font-bold leading-snug text-white md:text-lg">
              {item.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-[11px] leading-snug text-white/75">
              {meta}
            </CardDescription>
            {href ? (
              <p className="pt-1 text-right text-[11px] font-bold text-celeste-trifinio">
                click para leer
              </p>
            ) : null}
          </CardContent>
        </Card>
      </motion.li>
    );
  }

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={cn(
          "relative h-full gap-0 overflow-hidden border-border py-0 shadow-sm dark:border-zinc-700",
          href &&
            "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/40",
        )}
        role={href ? "button" : undefined}
        tabIndex={href ? 0 : undefined}
        onClick={href ? abrir : undefined}
        onKeyDown={
          href
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  abrir();
                }
              }
            : undefined
        }
      >
        {portadaSrc ? (
          <CardHeader className="p-0">
            <Lens
              zoomFactor={1.5}
              lensSize={150}
              ariaLabel={`Ampliar imagen de ${item.title}`}
              className="rounded-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portadaSrc}
                alt={item.title}
                loading="lazy"
                className="block aspect-[16/10] w-full object-cover"
              />
            </Lens>
          </CardHeader>
        ) : null}
        <CardContent
          className={cn(
            "flex flex-1 flex-col space-y-2 pb-4",
            !portadaSrc && "pt-6",
            portadaSrc && "pt-4",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-celeste-trifinio">
              {CHANNEL_LABELS[item.channel]}
            </p>
            {simulado ? (
              <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                Simulado
              </span>
            ) : null}
          </div>
          <CardTitle className="text-lg font-bold leading-snug text-foreground">
            {item.title}
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">{meta}</CardDescription>
          <ContadoresPublicacion
            visitas={item.view_count}
            descargas={item.download_count}
          />
          {resumen ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {resumen}
            </p>
          ) : null}
          {item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-zinc-800"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}
          {href ? (
            <p className="mt-auto pt-3 text-right text-[11px] font-bold text-celeste-trifinio">
              click para leer
            </p>
          ) : null}
        </CardContent>
      </Card>
    </motion.li>
  );
}
