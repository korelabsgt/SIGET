"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Library } from "lucide";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import {
  SigetActionButton,
  sigetAccent,
} from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import { formatFechaCalendarioGt, normalizarFechaCalendario } from "@/lib/fechas-gt";
import {
  DarkSectionBackground,
  LightSectionBackground,
  SectionDivider,
  SectionLabel,
} from "@/components/(base)/(home)/ObservatorioHomeSections";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { TrifinioDottedMapSection } from "@/components/(base)/(home)/TrifinioDottedMapSection";
import { ConocimientoBeamHub } from "./ConocimientoBeamHub";
import { ConocimientoFondoModerno } from "./ConocimientoFondoModerno";
import { useDocumentosPublicos } from "./lib/hooks";
import { ConocimientoCatalogoCard } from "./ConocimientoCatalogoCard";
import {
  esHomePreviewSimulado,
  rutaCatalogoCanal,
  rutaDetalleDocumento,
  seisSimuladosHomePreview,
} from "./lib/helpers";
import {
  PUBLIC_CANAL_CATALOGO_COPY,
  PUBLIC_CANAL_HOME_TITLES,
  publicCanalUi,
} from "./lib/canales-publicos-ui";
import type { DocumentFilterParams, PublicCanalSlug } from "./lib/zod";

function ExplorarCatalogoButton({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <InteractiveHoverButton
        href={href}
        hoverClassName="text-azul-trifinio"
        className="w-full max-w-sm bg-azul-trifinio border-azul-trifinio text-white shadow-none sm:w-auto"
      >
        {children}
      </InteractiveHoverButton>
    </div>
  );
}

const INTRO_PILLARS = [
  "Noticias institucionales de la región",
  "Material científico y técnico",
  "Recursos educativos abiertos",
];

export function ConocimientoCanalesHubSection() {
  return (
    <section
      className="relative flex w-full flex-col items-center justify-start overflow-x-hidden bg-background px-6 pb-10 pt-4 md:px-12 md:pb-12 md:pt-5 lg:px-16"
    >
      <LightSectionBackground />
      <div className="relative z-10 mx-auto w-full max-w-6xl lg:max-w-7xl">
        <ConocimientoBeamHub compactoHome />
      </div>
    </section>
  );
}

function CentroConocimientoIntroSection() {
  return (
    <section className="relative flex w-full flex-col justify-start overflow-x-hidden bg-background px-6 pb-16 pt-4 md:px-12 md:pb-24 md:pt-6 lg:px-16">
      <LightSectionBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center lg:max-w-7xl"
      >
        <div className="w-full max-w-4xl px-2 lg:max-w-5xl">
          <h2 className="text-xl font-black leading-snug tracking-[-0.02em] text-azul-trifinio-hero sm:text-2xl md:text-3xl lg:text-4xl">
            El espacio público de notas, estudios y materiales institucionales
          </h2>
        </div>

        <div className="mx-auto mt-8 w-full max-w-3xl text-center md:mt-10">
          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            El Centro de Conocimiento reúne la{" "}
            <span className="font-bold text-foreground">
              memoria institucional abierta
            </span>{" "}
            de Plan Trifinio: noticias, documentos científicos y recursos
            educativos para consulta pública en El Salvador, Guatemala y
            Honduras.
          </p>

          <ul className="mt-10 space-y-5 text-left sm:mx-auto sm:max-w-md">
            {INTRO_PILLARS.map((item, idx) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.45, delay: 0.2 + idx * 0.1 }}
                className="flex items-center justify-start gap-3.5"
              >
                <span className="size-2 shrink-0 rounded-full bg-celeste-trifinio" />
                <span className="text-xs font-black uppercase tracking-widest text-foreground md:text-sm">
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}

function etiquetaMesGt(ym: string): string {
  const raw = formatFechaCalendarioGt(`${ym}-01`, {
    month: "long",
    year: "numeric",
  });
  if (!raw || raw === "\u2014") return ym;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function mesDePublicacion(fecha: string): string {
  const normalizada = normalizarFechaCalendario(fecha);
  return normalizada.slice(0, 7);
}

function CatalogPreviewGrid({
  canal,
  variant,
  porMes = false,
  cardLayout = "default",
}: {
  canal: PublicCanalSlug;
  variant: "dark" | "light";
  porMes?: boolean;
  cardLayout?: "default" | "cuadrado";
}) {
  const router = useRouter();
  const { realRole } = useUserContext();
  const esSuper = realRole.toLowerCase().trim() === "super";
  const [mes, setMes] = useState("");
  const previewLimit = cardLayout === "cuadrado" ? 6 : undefined;

  const filters: DocumentFilterParams = useMemo(
    () => ({
      query: "",
      canal,
      tag_slugs: [],
      sort: "fecha_desc",
      page: 1,
      page_size: previewLimit ?? (porMes ? 50 : 9),
    }),
    [canal, porMes, previewLimit],
  );
  const { data, isPending } = useDocumentosPublicos(filters);
  const items = data?.items ?? [];
  const loading = isPending && !data;
  const isDark = variant === "dark";

  const meses = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const clave = mesDePublicacion(item.publication_date);
      if (/^\d{4}-\d{2}$/.test(clave)) set.add(clave);
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [items]);

  const mesActivo = mes && meses.includes(mes) ? mes : (meses[0] ?? "");
  const visiblesBase =
    porMes && mesActivo
      ? items.filter((item) => mesDePublicacion(item.publication_date) === mesActivo)
      : items;
  const visibles = previewLimit
    ? visiblesBase.slice(0, previewLimit)
    : visiblesBase;

  const visiblesGrid = useMemo(() => {
    if (visibles.length > 0) return visibles;
    if (!esSuper || cardLayout !== "cuadrado") return [];
    return seisSimuladosHomePreview(canal);
  }, [visibles, esSuper, cardLayout, canal]);

  const gridClass =
    cardLayout === "cuadrado"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6"
      : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: cardLayout === "cuadrado" ? 6 : 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse rounded-2xl border",
              cardLayout === "cuadrado" ? "aspect-square" : "h-56",
              isDark ? "border-white/10 bg-white/5" : "border-border bg-zinc-100 dark:bg-zinc-800",
            )}
          />
        ))}
      </div>
    );
  }

  if (visiblesGrid.length === 0 && items.length === 0) {
    return (
      <p
        className={cn(
          "py-10 text-center text-sm",
          isDark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        Aún no hay publicaciones en este canal.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {porMes && !previewLimit && meses.length > 0 ? (
        <div
          className={cn(
            "mx-auto flex w-full max-w-xs items-center justify-between gap-2 rounded-xl border px-3 py-2.5",
            isDark ? "border-white/10 bg-white/5" : "border-border bg-card",
          )}
        >
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              isDark ? "text-celeste-trifinio" : "text-celeste-trifinio",
            )}
          >
            Mes
          </span>
          <div className="relative min-w-0">
            <select
              value={mesActivo}
              onChange={(e) => setMes(e.target.value)}
              className={cn(
                "w-full cursor-pointer appearance-none bg-transparent pr-5 text-right text-sm font-bold focus:outline-none",
                isDark ? "text-white" : "text-foreground",
              )}
              aria-label="Filtrar noticias por mes"
            >
              {meses.map((clave) => (
                <option key={clave} value={clave}>
                  {etiquetaMesGt(clave)}
                </option>
              ))}
            </select>
            <span
              className={cn(
                "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-xs",
                isDark ? "text-white/60" : "text-muted-foreground",
              )}
            >
              ▾
            </span>
          </div>
        </div>
      ) : null}

      {visibles.length === 0 && visiblesGrid.length === 0 ? (
        <p
          className={cn(
            "py-8 text-center text-sm",
            isDark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          No hay publicaciones en este mes.
        </p>
      ) : (
        <ul className={gridClass}>
          {(visibles.length > 0 ? visibles : visiblesGrid).map((item) => {
            const simulada = esHomePreviewSimulado(item.id);
            const href = simulada
              ? null
              : rutaDetalleDocumento(item.channel, item.slug);
            return (
              <ConocimientoCatalogoCard
                key={item.id}
                item={item}
                href={href}
                simulado={simulada}
                onAbrir={(target) => router.push(target)}
                layout={cardLayout}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DocumentosRepositorioHomeSection() {
  const router = useRouter();
  const ui = publicCanalUi("documentos");
  const href = rutaCatalogoCanal("documentos");

  return (
    <section
      className="relative z-10 overflow-hidden border-t border-celeste-trifinio/20 bg-[#0a1628] px-6 py-10 md:px-12 md:py-14 lg:px-16"
    >
      <DarkSectionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 lg:max-w-7xl md:flex-row md:items-center md:justify-between md:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: 0.65 }}
          className="flex min-w-0 flex-1 items-start gap-4 md:gap-5"
        >
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl md:size-16",
              ui.iconBg,
            )}
          >
            <span className="inline-flex size-8 items-center justify-center md:size-9">
              <MorphHoverIcon
                from={ui.iconFrom}
                to={ui.iconTo}
                size={32}
                color={ui.iconColor}
                hovered={false}
              />
            </span>
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-celeste-trifinio md:text-xs">
              {ui.label}
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white md:text-3xl lg:text-4xl">
              {PUBLIC_CANAL_HOME_TITLES.documentos}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
              {PUBLIC_CANAL_CATALOGO_COPY.documentos}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.35 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="flex shrink-0 justify-center md:justify-end"
        >
          <SigetActionButton
            label="Acceder"
            accentColor={sigetAccent.abrir}
            morphFrom={FileText}
            morphTo={Library}
            onClick={() => router.push(href)}
            ariaLabel="Acceder al repositorio de documentos"
            className="h-11 min-h-11 w-full min-w-[11.5rem] px-6 text-sm sm:w-auto md:h-12 md:min-h-12 md:min-w-[13rem] md:px-8 md:text-base"
          />
        </motion.div>
      </div>
    </section>
  );
}

type CanalHomeFondo = "moderno" | "plano" | "suave";

function CanalPublicoSection({
  canal,
  kicker,
  title,
  description,
  variant,
  porMes = false,
  cardLayout = "default",
  titleCompact = false,
  soloAcceso = false,
  ctaLabel = "Explorar",
  fondoHome = "moderno",
  separadorSuperior = false,
}: {
  canal: PublicCanalSlug;
  kicker: string;
  title: string;
  description: string;
  variant: "dark" | "light";
  porMes?: boolean;
  cardLayout?: "default" | "cuadrado";
  titleCompact?: boolean;
  soloAcceso?: boolean;
  ctaLabel?: string;
  fondoHome?: CanalHomeFondo;
  separadorSuperior?: boolean;
}) {
  const router = useRouter();
  const canalUi = publicCanalUi(canal);
  const isDark = variant === "dark";

  const encabezadoHome = titleCompact;

  const fondoDecorativo = isDark ? (
    <DarkSectionBackground />
  ) : fondoHome === "moderno" ? (
    <ConocimientoFondoModerno />
  ) : fondoHome === "plano" ? (
    <LightSectionBackground />
  ) : fondoHome === "suave" ? (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.12}
        duration={3}
        repeatDelay={1}
        className={cn(
          "fill-slate-400/20 stroke-slate-400/25 dark:fill-white/10 dark:stroke-white/10",
          "mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />
    </div>
  ) : null;

  return (
    <section
      className={cn(
        "relative z-10 flex w-full flex-col justify-start overflow-hidden px-6 lg:px-16",
        encabezadoHome
          ? "pb-12 pt-6 md:px-12 md:pb-16 md:pt-8"
          : "pb-20 pt-8 md:px-12 md:pb-24 md:pt-16",
        separadorSuperior &&
          "border-t border-celeste-trifinio/25 dark:border-celeste-trifinio/15",
        isDark
          ? "bg-[#0a1628]"
          : fondoHome === "suave"
            ? "bg-slate-50 dark:bg-zinc-900"
            : "bg-background",
      )}
    >
      {fondoDecorativo}
      <div className="relative z-10 mx-auto w-full max-w-6xl lg:max-w-7xl">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className={cn(
              "flex items-center justify-center",
              encabezadoHome ? "gap-2 md:gap-3" : "gap-3 md:gap-5",
            )}
          >
            <span
              className={cn(
                "h-0 shrink-0 border-t border-celeste-trifinio",
                encabezadoHome ? "w-5 md:w-6" : "w-6 md:w-8",
              )}
              aria-hidden
            />
            <p
              className={cn(
                "font-bold uppercase text-celeste-trifinio",
                encabezadoHome
                  ? "text-[10px] tracking-[0.22em] md:text-xs"
                  : "text-lg tracking-[0.18em] md:text-2xl lg:text-3xl",
              )}
            >
              {kicker}
            </p>
            <span
              className={cn(
                "h-0 shrink-0 border-t border-celeste-trifinio",
                encabezadoHome ? "w-5 md:w-6" : "w-6 md:w-8",
              )}
              aria-hidden
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={cn(
              "font-black leading-tight",
              encabezadoHome
                ? "mt-2 text-xl md:text-2xl lg:text-3xl"
                : "mt-4 text-4xl md:text-5xl lg:text-6xl",
              isDark ? "text-white" : "text-foreground",
            )}
          >
            {title}
          </motion.h2>
          <SectionDivider
            className={cn(
              "h-0 rounded-none border-t border-celeste-trifinio bg-transparent",
              encabezadoHome
                ? "mt-3 w-32 sm:w-40 md:w-48"
                : "mt-5 w-56 sm:w-72 md:w-96 lg:w-lg",
            )}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className={cn(
              "mx-auto leading-relaxed",
              encabezadoHome
                ? "mt-3 max-w-xl text-sm md:text-base"
                : "mt-6 max-w-2xl text-lg",
              isDark ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {description}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className={encabezadoHome ? "mt-8" : "mt-12"}
        >
          {!soloAcceso ? (
            <CatalogPreviewGrid
              canal={canal}
              variant={variant}
              porMes={porMes}
              cardLayout={cardLayout}
            />
          ) : null}
          <div
            className={cn(
              "flex justify-center",
              soloAcceso ? "mt-2" : "mt-10",
            )}
          >
            <SigetActionButton
              label={ctaLabel}
              accentColor={sigetAccent.abrir}
              morphFrom={canalUi.iconFrom}
              morphTo={canalUi.iconTo}
              onClick={() => router.push(rutaCatalogoCanal(canal))}
              ariaLabel={`${ctaLabel} ${kicker}`}
              className="h-10 min-h-10 w-full max-w-xs px-5 text-sm sm:w-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "¿Qué es el Centro de Conocimiento?",
    a: "Es el catálogo público de Plan Trifinio: noticias institucionales, materiales científicos y recursos educativos aprobados para consulta en la región Trifinio.",
  },
  {
    q: "¿Quiénes pueden consultar las publicaciones?",
    a: "Cualquier persona puede leer y descargar el contenido público. No se requiere cuenta para consultar el catálogo.",
  },
  {
    q: "¿Qué encuentro en Noticias?",
    a: "Notas, comunicados y crónicas con secciones, fotografías y video. Son publicaciones de comunicación institucional ya aprobadas.",
  },
  {
    q: "¿Qué encuentro en Documentos?",
    a: "Informes, estudios, guías, infografías y otros archivos científicos o educativos, con lectura en línea cuando el formato lo permite y descarga del adjunto.",
  },
  {
    q: "¿Los documentos internos también aparecen aquí?",
    a: "No. El material normativo interno permanece en el repositorio institucional. Este centro solo muestra lo publicado para el público.",
  },
];

function ConocimientoFaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="flex w-full flex-col justify-start rounded-b-2xl bg-background px-5 pb-20 pt-12 max-md:overflow-hidden md:min-h-0 md:overflow-visible md:rounded-none md:bg-transparent md:px-8 md:pb-32 md:pt-24 lg:px-10 lg:pb-36 lg:pt-28 xl:px-12">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1fr_1.12fr] lg:items-start lg:gap-16 xl:gap-20">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <SectionLabel className="text-sm md:text-base">FAQ</SectionLabel>
            <h2 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-5xl lg:text-6xl">
              Preguntas frecuentes
            </h2>
            <SectionDivider />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Respuestas sobre el Centro de Conocimiento de Plan Trifinio: noticias,
              documentos y acceso público.
            </p>
          </motion.div>

          <div className="mt-12 divide-y divide-border md:mt-14">
            {faqs.map((faq, idx) => {
              const isOpen = open === idx;
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-5 py-6 text-left md:py-7"
                  >
                    <span
                      className={cn(
                        "text-lg font-bold transition-colors duration-300 md:text-xl",
                        isOpen ? "text-azul-trifinio" : "text-foreground",
                      )}
                    >
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 md:size-9",
                        isOpen
                          ? "border-azul-trifinio bg-azul-trifinio text-white"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <Plus className="size-4 md:size-5" strokeWidth={2.5} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-base leading-relaxed text-muted-foreground md:pb-7 md:text-lg">
                          {faq.a}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <ExplorarCatalogoButton
            href="/conocimiento/noticias"
            className="mt-10 lg:hidden md:mt-12 [&_a]:px-8 [&_a]:py-3 [&_a]:text-base"
          >
            Explorar
          </ExplorarCatalogoButton>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative hidden lg:flex lg:flex-col lg:pt-2"
        >
          <div className="relative w-full">
            <div className="absolute -right-4 -top-4 h-full w-full rounded-3xl border-2 border-celeste-trifinio/40" />
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-3xl border-2 border-azul-trifinio/20" />
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="/trifinio/hero-background2.jpg"
                alt="Región Trifinio"
                className="aspect-3/2 min-h-[340px] w-full object-cover object-center xl:aspect-4/3 xl:min-h-[420px]"
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
                <p className="text-xs font-black uppercase tracking-widest text-white">
                  Centro de Conocimiento
                </p>
                <div className="my-2.5 h-px w-full bg-white/50" />
                <p
                  className="font-black leading-none text-white"
                  style={{
                    fontFamily: "'Arial Black', sans-serif",
                    fontSize: "clamp(1.1rem, 1.8vw, 1.45rem)",
                  }}
                >
                  Plan Trifinio
                </p>
              </div>
            </div>
          </div>
          <ExplorarCatalogoButton
            href="/conocimiento/noticias"
            className="mt-8 w-full justify-center [&_a]:px-8 [&_a]:py-3 [&_a]:text-base"
          >
            Explorar
          </ExplorarCatalogoButton>
        </motion.div>
      </div>
    </section>
  );
}

const HOME_PREVIEW_CUADRADO = {
  variant: "light" as const,
  cardLayout: "cuadrado" as const,
  titleCompact: true,
};

const HOME_CANAL_SECTIONS: Array<{
  slug: PublicCanalSlug;
  variant: "dark" | "light";
  cardLayout?: "default" | "cuadrado";
  titleCompact?: boolean;
  soloAcceso?: boolean;
  description?: string;
  fondoHome?: CanalHomeFondo;
  separadorSuperior?: boolean;
}> = [
  {
    slug: "noticias",
    ...HOME_PREVIEW_CUADRADO,
    fondoHome: "moderno",
    description:
      "Notas y comunicados de Plan Trifinio en la región Trifinio.",
  },
  {
    slug: "educativo",
    ...HOME_PREVIEW_CUADRADO,
    fondoHome: "suave",
    separadorSuperior: true,
  },
  {
    slug: "cientifico",
    ...HOME_PREVIEW_CUADRADO,
    fondoHome: "plano",
    separadorSuperior: true,
  },
];

export function ConocimientoHomeSections() {
  return (
    <>
      <CentroConocimientoIntroSection />

      {HOME_CANAL_SECTIONS.map((cfg) => {
        const ui = publicCanalUi(cfg.slug);
        return (
          <CanalPublicoSection
            key={cfg.slug}
            canal={cfg.slug}
            kicker={ui.label}
            title={PUBLIC_CANAL_HOME_TITLES[cfg.slug]}
            description={
              cfg.description ?? PUBLIC_CANAL_CATALOGO_COPY[cfg.slug]
            }
            variant={cfg.variant}
            cardLayout={cfg.cardLayout}
            titleCompact={cfg.titleCompact}
            soloAcceso={cfg.soloAcceso}
            ctaLabel="Explorar"
            fondoHome={cfg.fondoHome}
            separadorSuperior={cfg.separadorSuperior}
          />
        );
      })}

      <DocumentosRepositorioHomeSection />

      <TrifinioDottedMapSection
        title="Centro de Conocimiento"
        description="El catálogo público de Plan Trifinio cubre la región Trifinio: El Salvador, Guatemala y Honduras."
      />

      <ConocimientoFaqSection />
    </>
  );
}
