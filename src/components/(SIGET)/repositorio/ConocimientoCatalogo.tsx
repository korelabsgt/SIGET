"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide";
import { Loader2, Search } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { modalAccentClass, modalFieldClass } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { formatFechaCalendarioGt } from "@/lib/fechas-gt";
import { useDocumentosPublicos, useTags } from "./lib/hooks";
import { rutaRawArchivo } from "./lib/storage";
import {
  CANAL_LABELS,
  CHANNEL_LABELS,
  COUNTRY_LABELS,
  COUNTRY_OPTIONS,
  PROGRAM_LABELS,
  PROGRAM_OPTIONS,
  SORT_OPTION_LIST,
  esCanalPublico,
  rutaCatalogoCanal,
  rutaDetalleDocumento,
} from "./lib/helpers";
import type {
  CountryScope,
  DocumentFilterParams,
  ProgramEnum,
  SortOption,
} from "./lib/zod";
import { PUBLIC_CANAL_SLUGS } from "./lib/zod";

const selectClass = cn(
  "h-10 rounded-lg bg-transparent px-3 text-sm text-foreground outline-none",
  modalFieldClass,
);

export function ConocimientoCatalogo({ canal }: { canal?: string }) {
  const router = useRouter();
  const canalActivo = canal && esCanalPublico(canal) ? canal : undefined;
  const { data: tags = [] } = useTags();
  const [query, setQuery] = useState("");
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [country, setCountry] = useState<"" | CountryScope>("");
  const [program, setProgram] = useState<"" | ProgramEnum>("");
  const [sort, setSort] = useState<SortOption>("fecha_desc");
  const [page, setPage] = useState(1);

  const filters: DocumentFilterParams = useMemo(
    () => ({
      query,
      canal: canalActivo,
      tag_slugs: tagSlugs,
      country_scope: country || undefined,
      program: program || undefined,
      sort,
      page,
      page_size: 12,
    }),
    [query, canalActivo, tagSlugs, country, program, sort, page],
  );

  const { data, isLoading } = useDocumentosPublicos(filters);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.page_size ?? 12;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const toggleTag = (slug: string) => {
    setPage(1);
    setTagSlugs((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  };

  return (
    <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className={`text-3xl ${modalAccentClass}`}>Conocimiento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo institucional de notas, materiales científicos y recursos educativos.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              router.push("/conocimiento");
            }}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold",
              !canalActivo
                ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                : "border-zinc-200 text-muted-foreground dark:border-zinc-700",
            )}
          >
            Todos
          </button>
          {PUBLIC_CANAL_SLUGS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setPage(1);
                router.push(rutaCatalogoCanal(item));
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold",
                canalActivo === item
                  ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                  : "border-zinc-200 text-muted-foreground dark:border-zinc-700",
              )}
            >
              {CANAL_LABELS[item]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por título, resumen o etiquetas"
              className={cn("h-10 w-full rounded-lg pl-10 pr-3 text-sm", modalFieldClass)}
            />
          </div>
          <select
            className={selectClass}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value as "" | CountryScope);
              setPage(1);
            }}
          >
            <option value="">Todos los países</option>
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={program}
            onChange={(e) => {
              setProgram(e.target.value as "" | ProgramEnum);
              setPage(1);
            }}
          >
            <option value="">Todos los programas</option>
            {PROGRAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
          >
            {SORT_OPTION_LIST.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const selected = tagSlugs.includes(tag.slug);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.slug)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-[11px] font-bold",
                  selected
                    ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                    : "border-zinc-200 text-muted-foreground dark:border-zinc-700",
                )}
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No hay publicaciones con esos filtros.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence>
                {items.map((item) => {
                  const href = rutaDetalleDocumento(item.channel, item.slug);
                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      {item.cover_slug ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rutaRawArchivo(item.cover_slug)}
                          alt={item.title}
                          className="h-40 w-full object-cover"
                        />
                      ) : null}
                      <div className="flex flex-1 flex-col p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-celeste-trifinio">
                        {CHANNEL_LABELS[item.channel]}
                      </p>
                      <h2 className="mt-1 font-bold text-foreground">{item.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.author} · {formatFechaCalendarioGt(item.publication_date)}
                        {item.program ? ` · ${PROGRAM_LABELS[item.program]}` : ""}
                        {` · ${COUNTRY_LABELS[item.country_scope]}`}
                      </p>
                      {item.summary ? (
                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                      ) : null}
                      {item.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-zinc-900"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {href ? (
                        <div className="mt-4">
                          <SigetActionButton
                            label="Abrir"
                            accentColor={sigetAccent.abrir}
                            morphFrom={ExternalLink}
                            morphTo={ArrowUpRight}
                            onClick={() => router.push(href)}
                            className="w-auto shrink-0"
                          />
                        </div>
                      ) : null}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {pages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm">
            <SigetActionButton
              label="Anterior"
              accentColor={sigetAccent.cancelar}
              morphFrom={ChevronLeft}
              morphTo={ChevronLeft}
              morphOnHover={false}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-auto shrink-0"
            />
            <span className="tabular-nums text-muted-foreground">
              {page} / {pages}
            </span>
            <SigetActionButton
              label="Siguiente"
              accentColor={sigetAccent.crear}
              morphFrom={ChevronRight}
              morphTo={ChevronRight}
              morphOnHover={false}
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="w-auto shrink-0"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
