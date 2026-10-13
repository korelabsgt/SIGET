"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide";
import { Loader2, Search } from "lucide-react";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { modalAccentClass, modalFieldClass } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { useDocumentosPublicos, useTags, useTagsCatalogoPublico } from "./lib/hooks";
import { ConocimientoCanalHeroInstitucional } from "./ConocimientoCanalHeroInstitucional";
import { ConocimientoCatalogoCard } from "./ConocimientoCatalogoCard";
import { ConocimientoVolverEnlace } from "./ConocimientoVolverEnlace";
import {
  PUBLIC_CANAL_NAV_ORDER,
  publicCanalUi,
} from "./lib/canales-publicos-ui";
import {
  COUNTRY_OPTIONS,
  PROGRAM_OPTIONS,
  SORT_OPTION_LIST,
  esCanalPublico,
  rutaCatalogoCanal,
  rutaDetalleDocumento,
} from "./lib/helpers";
import type {
  CountryScope,
  DocumentFilterParams,
  DocumentListItem,
  ProgramEnum,
  PublicCanalSlug,
  SortOption,
} from "./lib/zod";

const selectClass = cn(
  "h-10 rounded-lg bg-transparent px-3 text-sm text-foreground outline-none",
  modalFieldClass,
);

const panelFiltrosClass =
  "rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-zinc-700/70 dark:bg-zinc-900/80 md:p-5";

const filaSelectorInstitucionalClass =
  "border-border bg-zinc-50 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/50";

function FilaSelectorCatalogo({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 dark:border-zinc-700/80 dark:bg-zinc-800/60",
        className,
      )}
    >
      <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.22em] text-celeste-trifinio">
        {label}
      </span>
      <div className="relative min-w-0 flex-1">{children}</div>
    </div>
  );
}

function PastillaFiltroCatalogo({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
        active
          ? "border-azul-trifinio bg-azul-trifinio text-white dark:border-celeste-trifinio dark:bg-celeste-trifinio dark:text-[#0a1628]"
          : "border-border bg-background text-muted-foreground hover:border-celeste-trifinio/60 hover:text-foreground dark:border-zinc-600 dark:bg-zinc-900/50",
      )}
    >
      {children}
    </button>
  );
}

const selectInstitucionalClass =
  "w-full cursor-pointer appearance-none bg-transparent pr-6 text-right text-sm font-bold text-foreground focus:outline-none dark:text-white";

function EncabezadoCatalogoCanal({
  kicker,
  titulo,
  descripcion,
  compacto = false,
  institucional = false,
}: {
  kicker: string;
  titulo?: string;
  descripcion: string;
  compacto?: boolean;
  institucional?: boolean;
}) {
  if (institucional) {
    return (
      <ConocimientoCanalHeroInstitucional
        kicker={kicker}
        titulo={titulo}
        descripcion={descripcion}
      />
    );
  }

  if (compacto) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-celeste-trifinio md:text-sm">
          — {kicker} —
        </p>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
          {descripcion}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3 md:gap-5">
        <span
          className="h-0 w-6 shrink-0 border-t border-celeste-trifinio md:w-8"
          aria-hidden
        />
        <p className="text-lg font-bold uppercase tracking-[0.18em] text-celeste-trifinio md:text-2xl lg:text-3xl">
          {kicker}
        </p>
        <span
          className="h-0 w-6 shrink-0 border-t border-celeste-trifinio md:w-8"
          aria-hidden
        />
      </div>
      {titulo ? (
        <h1 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-5xl lg:text-6xl">
          {titulo}
        </h1>
      ) : null}
      <div
        className="mx-auto mt-5 h-0 w-56 border-t border-celeste-trifinio sm:w-72 md:w-96"
        aria-hidden
      />
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {descripcion}
      </p>
    </div>
  );
}

const canalesFiltroSinDocumentos = PUBLIC_CANAL_NAV_ORDER.filter(
  (slug) => slug !== "documentos",
);

function CanalMorphFiltro({
  slug,
  active,
  hovered,
  onHover,
  onSelect,
}: {
  slug: PublicCanalSlug;
  active: boolean;
  hovered: boolean;
  onHover: (hover: boolean) => void;
  onSelect: () => void;
}) {
  const ui = publicCanalUi(slug);
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 shadow-sm transition-colors",
        active
          ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
          : "border-azul-trifinio/25 bg-white text-muted-foreground hover:border-celeste-trifinio hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300",
          ui.iconBg,
          hovered && "scale-110",
        )}
      >
        <MorphHoverIcon
          from={ui.iconFrom}
          to={ui.iconTo}
          hovered={hovered}
          size={18}
          color={ui.iconColor}
        />
      </span>
      <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.12em] text-azul-trifinio dark:text-celeste-trifinio md:text-xs">
        {ui.label}
      </span>
    </button>
  );
}

export function ConocimientoBuscador({
  canal,
  titulo,
  descripcion,
  mostrarCanales = true,
  hrefForItem,
  compacto = false,
  cardLayout = "default",
  volver,
  encabezado,
  presentacion = "default",
}: {
  canal?: string;
  titulo?: string;
  descripcion?: string;
  mostrarCanales?: boolean;
  hrefForItem?: (item: DocumentListItem) => string | null;
  compacto?: boolean;
  cardLayout?: "default" | "cuadrado";
  volver?: { href: string; label: string };
  presentacion?: "default" | "institucional";
  encabezado?: {
    kicker: string;
    titulo?: string;
    descripcion: string;
    compacto?: boolean;
  };
}) {
  const router = useRouter();
  const canalActivo = canal && esCanalPublico(canal) ? canal : undefined;
  const { data: allTags = [] } = useTags();
  const [query, setQuery] = useState("");
  const [queryDebounced, setQueryDebounced] = useState("");
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [country, setCountry] = useState<"" | CountryScope>("");
  const [program, setProgram] = useState<"" | ProgramEnum>("");
  const [sort, setSort] = useState<SortOption>("fecha_desc");
  const [page, setPage] = useState(1);
  const [hoveredCanalFiltro, setHoveredCanalFiltro] = useState<PublicCanalSlug | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQueryDebounced(query);
      setPage(1);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filters: DocumentFilterParams = useMemo(
    () => ({
      query: queryDebounced,
      canal: canalActivo,
      tag_slugs: tagSlugs,
      country_scope: country || undefined,
      program: program || undefined,
      sort,
      page,
      page_size: 12,
    }),
    [queryDebounced, canalActivo, tagSlugs, country, program, sort, page],
  );

  const tagFacetFilters = useMemo(
    () => ({
      query: queryDebounced,
      canal: canalActivo,
      country_scope: country || undefined,
      program: program || undefined,
    }),
    [queryDebounced, canalActivo, country, program],
  );

  const { data: tagsDisponibles = [] } = useTagsCatalogoPublico(tagFacetFilters);

  const tagsVisibles = useMemo(() => {
    const map = new Map(tagsDisponibles.map((tag) => [tag.slug, tag]));
    for (const slug of tagSlugs) {
      if (!map.has(slug)) {
        const extra = allTags.find((tag) => tag.slug === slug);
        if (extra) map.set(slug, extra);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [tagsDisponibles, tagSlugs, allTags]);

  const { data, isPending, isFetching } = useDocumentosPublicos(filters);
  const isLoading = isPending && !data;
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

  const irCanal = (siguiente?: PublicCanalSlug) => {
    setPage(1);
    router.push(rutaCatalogoCanal(siguiente));
  };

  const resolverHref = (item: DocumentListItem) =>
    hrefForItem ? hrefForItem(item) : rutaDetalleDocumento(item.channel, item.slug);

  const esInstitucional = presentacion === "institucional";
  const panelFiltros = Boolean(encabezado && !compacto && !esInstitucional);
  const layoutInstitucionalAncho = esInstitucional && !compacto;

  const panelBusquedaInstitucional = (
    <div className="space-y-7 md:space-y-8">
      <div className="relative border-b-2 border-azul-trifinio/25 pb-0.5 transition-colors focus-within:border-celeste-trifinio dark:border-white/20">
        <Search
          className="pointer-events-none absolute left-0 top-1/2 size-5 -translate-y-1/2 text-celeste-trifinio"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título, resumen o etiqueta…"
          className="h-12 w-full border-0 bg-transparent pl-8 pr-2 text-base font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        />
      </div>

      <div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-celeste-trifinio">
          País / alcance
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilaSelectorCatalogo
            label="País"
            className={cn("min-w-0", filaSelectorInstitucionalClass)}
          >
            <select
              className={selectInstitucionalClass}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value as "" | CountryScope);
                setPage(1);
              }}
              aria-label="Filtrar por país o alcance"
            >
              <option value="">Todos los países</option>
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              aria-hidden
            >
              ▾
            </span>
          </FilaSelectorCatalogo>
          <FilaSelectorCatalogo
            label="Programa"
            className={cn("min-w-0", filaSelectorInstitucionalClass)}
          >
            <select
              className={selectInstitucionalClass}
              value={program}
              onChange={(e) => {
                setProgram(e.target.value as "" | ProgramEnum);
                setPage(1);
              }}
              aria-label="Filtrar por programa"
            >
              <option value="">Todos los programas</option>
              {PROGRAM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              aria-hidden
            >
              ▾
            </span>
          </FilaSelectorCatalogo>
          <FilaSelectorCatalogo
            label="Ordenar"
            className={cn("min-w-0", filaSelectorInstitucionalClass)}
          >
            <select
              className={selectInstitucionalClass}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              aria-label="Orden de resultados"
            >
              {SORT_OPTION_LIST.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
              aria-hidden
            >
              ▾
            </span>
          </FilaSelectorCatalogo>
        </div>
      </div>

      {tagsVisibles.length > 0 ? (
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-celeste-trifinio">
            Etiquetas
          </p>
          <div className="flex flex-wrap gap-2">
            {tagsVisibles.map((tag) => {
              const selected = tagSlugs.includes(tag.slug);
              return (
                <PastillaFiltroCatalogo
                  key={tag.id}
                  active={selected}
                  onClick={() => toggleTag(tag.slug)}
                >
                  {tag.name}
                </PastillaFiltroCatalogo>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );

  const contenidoResultados = (
    <>
      <div
        className={cn(
          "mt-8 transition-opacity",
          isFetching && !isLoading ? "opacity-80" : "opacity-100",
        )}
      >
        {isLoading ? (
          cardLayout === "cuadrado" ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="aspect-square min-h-0">
                  <div className="size-full animate-pulse rounded-2xl border border-border bg-zinc-100 dark:bg-zinc-800" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-celeste-trifinio" />
            </div>
          )
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No hay publicaciones con esos filtros.
          </p>
        ) : (
          <ul
            className={cn(
              "grid gap-4",
              cardLayout === "cuadrado"
                ? "grid-cols-1 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6"
                : "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            <AnimatePresence>
              {items.map((item) => (
                <ConocimientoCatalogoCard
                  key={item.id}
                  item={item}
                  href={resolverHref(item)}
                  layout={cardLayout}
                  onAbrir={(target) => router.push(target)}
                />
              ))}
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

      {volver && (!compacto || esInstitucional) ? (
        <div className="mt-6 flex w-full justify-start">
          <ConocimientoVolverEnlace
            href={volver.href}
            label={volver.label}
            className="mb-0 py-1.5"
          />
        </div>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        !compacto && "relative w-full flex-1",
        esInstitucional && !compacto && "min-h-0 overflow-hidden",
        !compacto && !encabezado && "overflow-hidden bg-background dark:bg-zinc-900",
      )}
    >
      {!compacto && !encabezado && !esInstitucional ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      ) : null}
      {encabezado && esInstitucional ? (
        <EncabezadoCatalogoCanal
          kicker={encabezado.kicker}
          titulo={encabezado.titulo}
          descripcion={encabezado.descripcion}
          compacto={encabezado.compacto}
          institucional
        />
      ) : null}
      {layoutInstitucionalAncho ? (
        <div className="relative z-10 flex w-full flex-1 flex-col bg-white dark:bg-zinc-900">
          <div className="mx-auto w-full max-w-6xl px-4 pt-1.5 md:px-12 lg:max-w-7xl lg:px-16">
            {volver ? (
              <ConocimientoVolverEnlace href={volver.href} label={volver.label} />
            ) : null}
          </div>
          <section
            className="w-full border-y border-border/80 bg-white px-4 py-7 dark:border-zinc-700/70 dark:bg-zinc-900 md:px-12 md:py-9 lg:px-16"
          >
            {panelBusquedaInstitucional}
          </section>
          <div className="mx-auto w-full max-w-6xl px-4 pb-5 pt-6 md:px-12 md:pb-6 lg:max-w-7xl lg:px-16">
            {contenidoResultados}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative z-10 w-full",
            compacto
              ? "px-4 pb-6"
              : cn(
                  "mx-auto px-4 pb-5 pt-1.5 md:px-12 md:pb-6 lg:px-16",
                  encabezado ? "max-w-6xl lg:max-w-7xl" : "max-w-[1600px] py-8 md:px-6 lg:px-12",
                ),
          )}
        >
          {volver && !compacto ? (
            <ConocimientoVolverEnlace href={volver.href} label={volver.label} />
          ) : null}

          {encabezado && !esInstitucional ? (
            <EncabezadoCatalogoCanal
              kicker={encabezado.kicker}
              titulo={encabezado.titulo}
              descripcion={encabezado.descripcion}
              compacto={encabezado.compacto}
              institucional={false}
            />
          ) : encabezado ? null : (
            <>
              {titulo ? <h1 className={`text-3xl ${modalAccentClass}`}>{titulo}</h1> : null}
              {descripcion ? (
                <p className={cn("text-sm text-muted-foreground", titulo && "mt-1")}>
                  {descripcion}
                </p>
              ) : null}
            </>
          )}

          {mostrarCanales ? (
            <div
              className={cn(
                "mt-8 flex w-full flex-wrap items-center gap-2",
                encabezado || titulo || descripcion ? "" : "mt-0",
              )}
            >
              <button
                type="button"
                onClick={() => irCanal()}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold",
                  !canalActivo
                    ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                    : "border-zinc-200 text-muted-foreground dark:border-zinc-700",
                )}
              >
                Todos
              </button>
              {canalesFiltroSinDocumentos.map((slug) => (
                <CanalMorphFiltro
                  key={slug}
                  slug={slug}
                  active={canalActivo === slug}
                  hovered={hoveredCanalFiltro === slug}
                  onHover={(hover) => setHoveredCanalFiltro(hover ? slug : null)}
                  onSelect={() => irCanal(slug)}
                />
              ))}
              <span className="min-h-px min-w-2 flex-1 basis-full sm:basis-auto" aria-hidden />
              <CanalMorphFiltro
                slug="documentos"
                active={canalActivo === "documentos"}
                hovered={hoveredCanalFiltro === "documentos"}
                onHover={(hover) => setHoveredCanalFiltro(hover ? "documentos" : null)}
                onSelect={() => irCanal("documentos")}
              />
            </div>
          ) : null}

          <div
            className={cn(
              panelFiltros && panelFiltrosClass,
              panelFiltros || mostrarCanales || encabezado || titulo || descripcion
                ? "mt-8 space-y-4"
                : "mt-1 space-y-4",
            )}
          >
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              <div className="relative min-w-[14rem] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título, resumen o etiquetas"
                  className={cn("h-10 w-full rounded-lg pl-10 pr-3 text-sm", modalFieldClass)}
                />
              </div>
              <select
                className={cn(selectClass, "w-[10.5rem] shrink-0")}
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
                className={cn(selectClass, "min-w-[11rem] max-w-[14rem] shrink-0")}
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
                className={cn(selectClass, "w-[9.5rem] shrink-0")}
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

            {tagsVisibles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagsVisibles.map((tag) => {
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
            ) : null}
          </div>

          {contenidoResultados}
        </div>
      )}
    </div>
  );
}
