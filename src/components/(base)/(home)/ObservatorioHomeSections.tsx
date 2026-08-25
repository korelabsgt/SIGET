"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from "framer-motion";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type RefObject,
  type ReactNode,
} from "react";
import {
  Plus,
  Users,
  BarChart3,
  Building2,
  ExternalLink,
  Facebook,
  Youtube,
} from "lucide-react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";
import { TextAnimate } from "@/components/ui/text-animate";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  getPublicObsStats,
  type ObsPublicStats,
} from "@/app/obs-public-actions";
import { softBarColor } from "@/components/(SIGET)/observatorio/reportes/lib/chart-colors";
import { TrifinioDottedMapSection } from "@/components/(base)/(home)/TrifinioDottedMapSection";
import { AnimatedNumber } from "@/components/ui/animated-number";
import OrganizacionesLogoCintillo from "@/components/(SIGET)/observatorio/OrganizacionesLogoCintillo";

function fmt(n: number) {
  return new Intl.NumberFormat("es-GT").format(n);
}

/* ─── count-up 0 → n (reinicia al entrar en pantalla) ─── */

function playLordIcons(container: HTMLElement | null) {
  if (!container) return;
  container.querySelectorAll("lord-icon").forEach((icon) => {
    const el = icon as HTMLElement & {
      playFromBeginning?: () => void;
      play?: () => void;
    };
    el.playFromBeginning?.();
    el.play?.();
  });
}

const WHY_CARD_HOVER_TARGET = ".why-card-hover-zone";

const MONTH_NAMES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/* ─── helpers ─── */

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, letterSpacing: "0.5em" }}
      whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.8 }}
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.25em] text-celeste-trifinio",
        className,
      )}
    >
      — {children} —
    </motion.p>
  );
}

function SectionDivider({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={cn(
        "mx-auto mt-4 h-0.5 w-12 origin-left rounded-full bg-celeste-trifinio",
        className,
      )}
    />
  );
}

function LightSectionBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] opacity-60"
    />
  );
}

function DarkSectionBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-32 top-1/4 size-96 rounded-full bg-celeste-trifinio"
        style={{ filter: "blur(80px)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute -right-24 bottom-1/4 size-80 rounded-full bg-azul-trifinio"
        style={{ filter: "blur(80px)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
    </div>
  );
}

function AccederObservatorioButton({
  href = "/observatorio-web",
  className,
  fullWidth = false,
}: {
  href?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={cn("flex justify-center", fullWidth && "w-full", className)}
    >
      <InteractiveHoverButton
        href={href}
        hoverClassName="text-azul-trifinio"
        className={cn(
          "bg-azul-trifinio border-azul-trifinio text-white shadow-sm",
          fullWidth ? "w-full" : "w-full max-w-sm sm:w-auto",
        )}
      >
        Acceder al observatorio web
      </InteractiveHoverButton>
    </div>
  );
}

/* ─── parallax banner ─── */

const BANNER_TITLE_ANIM_DURATION = 2;
const BANNER_CHAR_DURATION = 0.65;
const BANNER_SEQ_GAP = 0.06;

function bannerChainDelay(previousDelay: number, previousDuration: number) {
  return previousDelay + previousDuration + BANNER_SEQ_GAP;
}

function BannerHeroSequence({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  const observatorioText = `— ${label} —`;
  const aguaText = "\u201CAgua sin fronteras\u201D";
  const countriesText = "El Salvador · Guatemala · Honduras";

  const obsDelay = 0;
  const planDelay = bannerChainDelay(obsDelay, BANNER_CHAR_DURATION);
  const aguaDelay = bannerChainDelay(planDelay, BANNER_CHAR_DURATION);
  const lineDelay = bannerChainDelay(aguaDelay, BANNER_CHAR_DURATION);
  const countriesDelay = lineDelay + 0.55;

  const obsLabelClass = cn(
    "font-black uppercase tracking-[0.2em] text-white drop-shadow-lg",
    compact
      ? "mb-4 text-[10px]"
      : "mb-12 text-xl md:mb-14 md:text-2xl lg:text-3xl",
  );

  const planClass =
    "min-h-[1.1em] w-full whitespace-nowrap text-center font-black leading-[0.95] text-white drop-shadow-xl";
  const planStyle = {
    fontFamily: "'Arial Black', sans-serif",
    fontSize: compact
      ? "clamp(1.2rem, 5vw, 1.8rem)"
      : "clamp(2.75rem, 11vw, 4.25rem)",
  };
  const aguaClass =
    "mt-1.5 min-h-[1.2em] w-full text-center font-bold italic leading-tight text-white drop-shadow-lg";
  const aguaStyle = {
    fontFamily: "Arial, sans-serif",
    fontSize: compact
      ? "clamp(0.75rem, 3.2vw, 1rem)"
      : "clamp(1.5rem, 6vw, 2.5rem)",
  };
  const countriesClass = cn(
    "mt-2 min-h-[1.2em] w-full text-center font-semibold text-white/85 drop-shadow-lg",
    compact
      ? "max-w-full text-balance text-[clamp(0.55rem,2.8vw,0.75rem)] tracking-[0.06em] whitespace-nowrap"
      : "whitespace-nowrap tracking-[0.18em]",
  );
  const countriesStyle = {
    fontFamily: "Arial, sans-serif",
    fontSize: compact ? undefined : "clamp(0.9rem, 3.5vw, 1.35rem)",
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center",
        compact ? "translate-y-1" : "-translate-y-10 md:-translate-y-16",
      )}
    >
      <TextAnimate
        animation="blurIn"
        as="p"
        by="character"
        duration={BANNER_CHAR_DURATION}
        delay={obsDelay}
        startOnView
        className={obsLabelClass}
      >
        {observatorioText}
      </TextAnimate>

      <div
        className={cn(
          "flex w-full items-center justify-center",
          compact
            ? "flex-col gap-3 px-2"
            : "flex-col gap-3 md:flex-row md:gap-3 lg:gap-4",
        )}
      >
        <motion.img
          initial={{ opacity: 0, scale: 0.82, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.35, delay: planDelay, ease: "easeOut" }}
          src="/trifinio/logo.png"
          alt="Plan Trifinio"
          className={cn(
            "shrink-0 object-contain drop-shadow-2xl",
            compact
              ? "size-28 sm:size-32"
              : "size-32 md:size-[180px] lg:size-[200px]",
          )}
        />
        <div className="flex min-w-0 w-full flex-col items-center text-center md:w-auto">
          <TextAnimate
            animation="blurIn"
            as="p"
            by="character"
            duration={BANNER_CHAR_DURATION}
            delay={planDelay}
            startOnView
            className={planClass}
            style={planStyle}
          >
            Plan Trifinio
          </TextAnimate>

          <TextAnimate
            animation="blurIn"
            as="p"
            by="character"
            duration={BANNER_CHAR_DURATION}
            delay={aguaDelay}
            startOnView
            className={aguaClass}
            style={aguaStyle}
          >
            {aguaText}
          </TextAnimate>

          <div className="mt-3 grid w-max max-w-full grid-cols-1">
            <div
              className={cn(
                "col-start-1 row-start-1 mb-3 w-full min-w-0 self-end",
                compact ? "h-px" : "h-[2px]",
              )}
              aria-hidden
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{
                  duration: 0.55,
                  delay: lineDelay,
                  ease: "easeOut",
                }}
                className="h-full w-full origin-left bg-white"
              />
            </div>

            <TextAnimate
              animation="blurIn"
              as="p"
              by="character"
              duration={BANNER_CHAR_DURATION}
              delay={countriesDelay}
              startOnView
              className={cn(
                countriesClass,
                "col-start-1 row-start-2 mt-0 w-max max-w-full justify-self-center",
              )}
              style={countriesStyle}
            >
              {countriesText}
            </TextAnimate>
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerLabel({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <TextAnimate
      animation="blurIn"
      as="p"
      by="word"
      duration={1.2}
      delay={0}
      startOnView
      className={cn(
        "mb-3 font-black uppercase tracking-[0.35em] text-white drop-shadow-lg",
        compact ? "text-xs sm:text-sm" : "mb-5 text-base md:text-lg lg:text-xl",
      )}
    >
      {`— ${label} —`}
    </TextAnimate>
  );
}

function BannerTitle({
  title,
  compact = false,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <TextAnimate
      animation="blurIn"
      as="h1"
      by="character"
      duration={BANNER_TITLE_ANIM_DURATION}
      startOnView
      className={cn(
        "font-black text-white leading-tight drop-shadow-xl",
        compact
          ? "mx-auto w-full max-w-full text-balance text-center text-[clamp(0.6875rem,4.2vw,2.75rem)] tracking-tight max-[380px]:whitespace-normal sm:whitespace-nowrap"
          : "whitespace-nowrap text-6xl lg:text-7xl xl:text-8xl",
      )}
      style={{ fontFamily: "'Arial Black', sans-serif", color: "#ffffff" }}
    >
      {title}
    </TextAnimate>
  );
}

function FullWidthImageBanner({
  src,
  alt,
  overlay = "from-[#0a1628]/80 via-[#0a1628]/40 to-transparent",
  label,
  showPlanTrifinioBrand = false,
  title,
  imageClassName,
  fixedBackground = false,
}: {
  src: string;
  alt: string;
  overlay?: string;
  label?: string;
  showPlanTrifinioBrand?: boolean;
  title?: string;
  imageClassName?: string;
  fixedBackground?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20px", "-20px"]);
  const fixedBgOpacity = useTransform(scrollYProgress, [0.5, 0.88], [1, 0]);

  return (
    <>
      {/* móvil — imagen completa sin recorte ni parallax */}
      <div className="relative w-full md:hidden">
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-auto block object-contain", imageClassName)}
        />
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-b from-[#0a1628]/60 via-transparent to-[#0a1628]/60",
          )}
        />
        {(label || title || showPlanTrifinioBrand) && (
          <div className="absolute inset-0 flex w-full min-w-0 flex-col items-center justify-center px-4 text-center">
            {showPlanTrifinioBrand && label ? (
              <BannerHeroSequence label={label} compact />
            ) : (
              <>
                {label && <BannerLabel label={label} compact />}
                {title && <BannerTitle title={title} compact />}
              </>
            )}
          </div>
        )}
      </div>

      {/* desktop — parallax o imagen fija con scroll encima */}
      <div
        ref={ref}
        className={cn(
          "relative hidden w-full md:block",
          fixedBackground ? "h-[70vh] bg-[#0a1628]" : "",
        )}
        style={fixedBackground ? undefined : { height: "70vh" }}
      >
        {fixedBackground ? (
          <>
            <motion.div
              style={{ opacity: fixedBgOpacity }}
              className="sticky top-0 z-0 h-[70vh] w-full overflow-hidden"
            >
              <img
                src={src}
                alt={alt}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover",
                  imageClassName,
                )}
              />
              <div className={cn("absolute inset-0 bg-linear-to-r", overlay)} />
            </motion.div>
            {(label || title || showPlanTrifinioBrand) && (
              <motion.div
                style={{ y: textY }}
                className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
              >
                {showPlanTrifinioBrand && label ? (
                  <BannerHeroSequence label={label} />
                ) : (
                  <>
                    {label && <BannerLabel label={label} />}
                    {title && <BannerTitle title={title} />}
                  </>
                )}
              </motion.div>
            )}
          </>
        ) : (
          <>
            <motion.img
              src={src}
              alt={alt}
              style={{ y: imgY }}
              className={cn(
                "absolute inset-0 h-[120%] w-full -top-[10%] object-cover",
                imageClassName,
              )}
            />
            <div className={cn("absolute inset-0 bg-linear-to-r", overlay)} />
            {(label || title || showPlanTrifinioBrand) && (
              <motion.div
                style={{ y: textY }}
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              >
                {showPlanTrifinioBrand && label ? (
                  <BannerHeroSequence label={label} />
                ) : (
                  <>
                    {label && <BannerLabel label={label} />}
                    {title && <BannerTitle title={title} />}
                  </>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ─── stat card con count-up ─── */

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="size-4 shrink-0 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
      <Skeleton className="h-9 w-20 rounded-lg" />
    </div>
  );
}

function DonutChartContentSkeleton() {
  return (
    <div className="flex flex-row items-center gap-5">
      <Skeleton className="size-32 sm:size-36 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1 rounded-md" />
            <Skeleton className="h-3 w-10 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  bg,
  inView,
  className,
  variant = "light",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  loading: boolean;
  accent: string;
  bg: string;
  inView: boolean;
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-5 shadow-sm",
        variant === "dark" ? "border-white/10" : "border-border",
        bg,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", accent)} strokeWidth={2} />
        <p
          className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            accent,
          )}
        >
          {label}
        </p>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24 rounded-lg" />
      ) : (
        <AnimatedNumber
          value={value}
          active={inView}
          loading={false}
          className={cn(
            "text-3xl font-black leading-none",
            variant === "dark" ? "text-white" : "text-foreground",
          )}
        />
      )}
    </motion.div>
  );
}

/* ─── paleta donut ─── */

const DONUT_COLORS = [
  "#2c5f9b",
  "#1a95d3",
  "#3b82f6",
  "#06b6d4",
  "#0ea5e9",
  "#7dd3fc",
  "#93c5fd",
  "#bae6fd",
];

function DonutTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: { nombre?: string; name?: string };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const label = item.payload?.nombre ?? item.payload?.name ?? item.name ?? "";
  const value = fmt(Number(item.value ?? 0));

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-md">
      <p className="max-w-[10rem] text-[11px] font-semibold leading-snug text-black whitespace-normal break-words">
        {label}: {value}
      </p>
    </div>
  );
}

function DonutCenterTotal({
  value,
  inView,
  loading,
  isDark,
}: {
  value: number;
  inView: boolean;
  loading: boolean;
  isDark: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <AnimatedNumber
        value={value}
        active={inView}
        loading={loading}
        className={cn(
          "text-lg font-black leading-none",
          isDark ? "text-white" : "text-foreground",
        )}
      />
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-wider",
          isDark ? "text-white/60" : "text-muted-foreground",
        )}
      >
        total
      </span>
    </div>
  );
}

function DonutLegendItem({
  nombre,
  total,
  color,
  inView,
  loading,
  isDark,
}: {
  nombre: string;
  total: number;
  color: string;
  inView: boolean;
  loading: boolean;
  isDark: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className="size-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span
        className={cn(
          "truncate flex-1 text-left",
          isDark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {nombre}
      </span>
      <AnimatedNumber
        value={total}
        active={inView}
        loading={loading}
        className={cn(
          "shrink-0 font-bold text-xs",
          isDark ? "text-white" : "text-foreground",
        )}
      />
    </li>
  );
}

function CampoStatCell({
  name,
  value,
  color,
  pct,
  inView,
  loading,
}: {
  name: string;
  value: number;
  color: string;
  pct: string;
  inView: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 min-w-0">
      <div
        className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-semibold text-white/80 truncate flex-1 min-w-0">
        {name}
      </span>
      <span className="text-xs font-bold text-white/45 shrink-0">{pct}%</span>
      <AnimatedNumber
        value={value}
        active={inView}
        loading={loading}
        className="text-sm font-black text-white font-mono shrink-0"
      />
    </div>
  );
}

function DonutChart({
  data,
  title,
  loading,
  variant = "light",
  legendLimit = 5,
  className,
  embedded = false,
}: {
  data: { nombre: string; total: number }[];
  title: string;
  loading: boolean;
  variant?: "light" | "dark";
  legendLimit?: number;
  className?: string;
  embedded?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const total = data.reduce((s, d) => s + d.total, 0);
  const isDark = variant === "dark";

  return (
    <div
      ref={ref}
      className={cn(
        embedded
          ? "flex flex-col"
          : "flex flex-col rounded-2xl border p-6 shadow-sm",
        !embedded &&
          (isDark ? "border-white/10 bg-white/5" : "border-border bg-card"),
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-black uppercase tracking-widest mb-4",
          isDark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      {loading ? (
        <DonutChartContentSkeleton />
      ) : data.length === 0 ? (
        <p
          className={cn(
            "text-sm text-center py-10",
            isDark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          Sin datos
        </p>
      ) : (
        <div className="flex flex-row items-center gap-5">
          <div className="relative size-32 sm:size-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="90%"
                  strokeWidth={1}
                  stroke="transparent"
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
            <DonutCenterTotal
              value={total}
              inView={inView}
              loading={loading}
              isDark={isDark}
            />
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-2 min-w-0">
            {data.slice(0, legendLimit).map((d, i) => (
              <DonutLegendItem
                key={d.nombre}
                nombre={d.nombre}
                total={d.total}
                color={DONUT_COLORS[i % DONUT_COLORS.length]}
                inView={inView}
                loading={loading}
                isDark={isDark}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CampoBreakdownPanel({
  data,
  loading,
  title = "Por Campo",
}: {
  data: { nombre: string; total: number }[];
  loading: boolean;
  title?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const panelInView = useInView(panelRef, { once: true, margin: "-40px" });

  const donutData = useMemo(
    () =>
      data.map((d, i) => ({
        name: d.nombre,
        value: d.total,
        color: softBarColor(i),
      })),
    [data],
  );
  const total = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div ref={panelRef}>
      <p className="text-xs font-black uppercase tracking-widest text-white/70 mb-4">
        {title}
      </p>
      {loading ? (
        <DonutChartContentSkeleton />
      ) : donutData.length === 0 ? (
        <p className="text-sm text-center py-10 text-white/60">Sin datos</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] gap-4 lg:gap-6 items-center">
          <div className="relative h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={donutData.length > 1 ? 4 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`campo-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
            <DonutCenterTotal
              value={total}
              inView={panelInView}
              loading={loading}
              isDark
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {donutData.map((item) => {
              const pct =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
              return (
                <CampoStatCell
                  key={item.name}
                  name={item.name}
                  value={item.value}
                  color={item.color}
                  pct={pct}
                  inView={panelInView}
                  loading={loading}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoreoFilterCell({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 min-w-0",
        className,
      )}
    >
      <span className="text-[10px] font-black uppercase tracking-widest text-celeste-trifinio shrink-0">
        {label}
      </span>
      <div className="relative min-w-0">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none bg-transparent pr-5 text-sm font-bold text-white cursor-pointer focus:outline-none text-right"
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/60 text-xs">
          ▾
        </span>
      </div>
    </div>
  );
}

function MonitoreoStatInline({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  bg,
  inView,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  loading: boolean;
  accent: string;
  bg: string;
  inView: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-white/10 px-3 py-2.5 min-w-0",
        "lg:flex-row lg:items-center lg:gap-2 lg:flex-1 lg:min-w-[140px]",
        bg,
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0 lg:contents">
        <Icon
          className={cn("size-3.5 shrink-0 lg:size-4", accent)}
          strokeWidth={2}
        />
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-widest leading-tight",
            accent,
          )}
        >
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-16 rounded-md lg:ml-auto lg:h-6 lg:w-14" />
      ) : (
        <AnimatedNumber
          value={value}
          active={inView}
          loading={false}
          className="text-xl font-black text-white lg:ml-auto lg:text-lg"
        />
      )}
    </div>
  );
}

function MonitoreoDesglosePanel({
  stats,
  loading,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  statsRef,
  statsInView,
}: {
  stats: ObsPublicStats | null;
  loading: boolean;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  statsRef: RefObject<HTMLDivElement | null>;
  statsInView: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div
        ref={statsRef}
        className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-stretch"
      >
        <div className="grid grid-cols-2 gap-3 lg:flex lg:shrink-0">
          <MonitoreoFilterCell
            label="Año"
            value={selectedYear}
            onChange={onYearChange}
          >
            <option value={0}>Todos</option>
            {(stats?.availableYears ?? []).map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </MonitoreoFilterCell>

          <MonitoreoFilterCell
            label="Mes"
            value={selectedMonth}
            onChange={onMonthChange}
          >
            <option value={0}>Todos</option>
            {(stats?.availableMonths ?? []).map((m) => (
              <option key={m} value={m}>
                {MONTH_NAMES[m]}
              </option>
            ))}
          </MonitoreoFilterCell>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:flex lg:flex-1 lg:min-w-0">
          <MonitoreoStatInline
            icon={Users}
            label="Total Atenciones"
            value={stats?.totalAtenciones ?? 0}
            loading={loading && !stats}
            accent="text-violet-400"
            bg="bg-violet-500/15"
            inView={statsInView}
          />
          <MonitoreoStatInline
            icon={BarChart3}
            label="Registros"
            value={stats?.totalRegistros ?? 0}
            loading={loading && !stats}
            accent="text-celeste-trifinio"
            bg="bg-azul-trifinio/15"
            inView={statsInView}
          />
          <MonitoreoStatInline
            icon={Building2}
            label="Organizaciones"
            value={stats?.totalOrganizaciones ?? 0}
            loading={loading && !stats}
            accent="text-celeste-trifinio"
            bg="bg-celeste-trifinio/15"
            inView={statsInView}
          />
        </div>
      </div>

      {((stats?.byNacionalidad?.length ?? 0) > 0 ||
        (stats?.byPerfil?.length ?? 0) > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {(stats?.byNacionalidad?.length ?? 0) > 0 && (
            <DonutChart
              data={stats?.byNacionalidad ?? []}
              title="Por Nacionalidad"
              loading={loading}
              variant="dark"
              embedded
            />
          )}
          {(stats?.byPerfil?.length ?? 0) > 0 && (
            <DonutChart
              data={stats?.byPerfil ?? []}
              title="Por Perfil"
              loading={loading}
              variant="dark"
              embedded
            />
          )}
        </div>
      )}

      {(stats?.byCampo?.length ?? 0) > 0 && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <CampoBreakdownPanel data={stats?.byCampo ?? []} loading={loading} />
        </div>
      )}

      {((stats?.byIndicadorOmite?.length ?? 0) > 0 ||
        (stats?.byCampoOmite?.length ?? 0) > 0) && (
        <div className="mt-6 border-t border-violet-400/30 pt-6 space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-300">
              Reuniones, Empresas y Actores
            </p>
            <p className="text-[11px] text-white/60 mt-1">
              Desglose aparte, sin comparación por nacionalidad ni perfil.
            </p>
          </div>
          {(stats?.byIndicadorOmite?.length ?? 0) > 0 && (
            <DonutChart
              data={stats?.byIndicadorOmite ?? []}
              title="Por Indicador"
              loading={loading}
              variant="dark"
              embedded
              legendLimit={6}
            />
          )}
          {(stats?.byCampoOmite?.length ?? 0) > 0 && (
            <CampoBreakdownPanel
              data={stats?.byCampoOmite ?? []}
              loading={loading}
              title="Por Campo"
            />
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <AccederObservatorioButton className="justify-end" />
      </div>
    </div>
  );
}

/* ─── sección 1 ─── */

const FEATURE_CARDS = [
  {
    iconKey: "jahhljqt",
    title: "Monitoreo de Atenciones",
    desc: "Visualice en tiempo real las atenciones a personas en contexto de movilidad humana en la región Trifinio.",
    primaryColor: "#b4b4b4",
  },
  {
    iconKey: "irujbhaa",
    title: "Datos Integrados",
    desc: "Consolide registros por nacionalidad, perfil migratorio y organización en una sola plataforma.",
  },
  {
    iconKey: "dbusuvao",
    title: "Decisiones Informadas",
    desc: "Transforme datos de movilidad humana en perspectivas accionables para políticas y cooperación regional.",
  },
];

function WhyObservatorioSection() {
  const [stats, setStats] = useState<ObsPublicStats | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // ref para detectar cuando las tarjetas entran en pantalla
  const statsRef = useRef<HTMLDivElement>(null);
  const whyCardsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-40px" });
  const donutsRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const data = await getPublicObsStats(year, month);
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(0, 0);
  }, [loadStats]);

  const handleYear = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(0);
    loadStats(year, 0);
  };

  const handleMonth = (month: number) => {
    setSelectedMonth(month);
    loadStats(selectedYear, month);
  };

  return (
    <section className="relative z-10 flex w-full flex-col justify-start overflow-hidden bg-[#0a1628] px-6 md:px-12 lg:px-16 pt-3 md:pt-18 pb-20 md:min-h-[130vh]">
      <DarkSectionBackground />
      <div className="relative z-10 mx-auto max-w-6xl w-full">
        {/* cabecera */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-3 md:gap-5"
          >
            <span
              className="h-0 w-6 shrink-0 border-t border-celeste-trifinio md:w-8"
              aria-hidden
            />
            <p className="text-lg font-bold uppercase tracking-[0.18em] text-celeste-trifinio md:text-2xl lg:text-3xl">
              Movilidad Humana
            </p>
            <span
              className="h-0 w-6 shrink-0 border-t border-celeste-trifinio md:w-8"
              aria-hidden
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight"
          >
            Monitoreo integral de las atenciones
          </motion.h2>
          <SectionDivider className="mt-5 h-0 w-56 rounded-none border-t border-celeste-trifinio bg-transparent sm:w-72 md:w-96 lg:w-lg" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-white/70 text-lg leading-relaxed"
          >
            Registro y consolidación en movilidad humana, con datos actualizados
            por indicadores, políticas migratorias, organizaciones, sectores,
            perfil migratorio y nacionalidad.
          </motion.p>
        </div>

        {/* feature cards — arriba de filtros y stats */}
        <div ref={whyCardsRef} className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURE_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, delay: idx * 0.15 }}
              onMouseEnter={() => playLordIcons(whyCardsRef.current)}
              className={cn(
                "why-card-hover-zone flex flex-row items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-7 shadow-sm",
              )}
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + idx * 0.15,
                  type: "spring",
                }}
                className="shrink-0 flex size-16 md:size-18 items-center justify-center rounded-2xl bg-[#e8ecf0] dark:bg-[#e8ecf0] pointer-events-none"
              >
                <AnimatedIcon
                  iconKey={card.iconKey}
                  target={WHY_CARD_HOVER_TARGET}
                  size={52}
                  primaryColor={card.primaryColor}
                />
              </motion.div>
              <div className="flex flex-col text-left">
                <h3 className="text-base font-bold text-white leading-tight">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm text-white/70 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* desglose */}
        <motion.div
          ref={donutsRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-10"
        >
          <MonitoreoDesglosePanel
            stats={stats}
            loading={loading}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={handleYear}
            onMonthChange={handleMonth}
            statsRef={statsRef}
            statsInView={statsInView}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── órbita de iconos — gira con scroll ─── */

const ORBIT_RADIUS = 40;
const ORBIT_SIDE_SPREAD = 42;

type OrbitHintAlign = "top" | "center" | "bottom";
type OrbitHintSide = "left" | "right";
type OrbitSlot =
  | "left-top"
  | "left-mid"
  | "left-bot"
  | "right-top"
  | "right-mid"
  | "right-bot";

function orbitAngle(slot: OrbitSlot, spread: number) {
  const angles: Record<OrbitSlot, number> = {
    "left-top": 270 + spread,
    "left-mid": 270,
    "left-bot": 270 - spread,
    "right-top": 90 - spread,
    "right-mid": 90,
    "right-bot": 90 + spread,
  };
  return angles[slot];
}

const ORBIT_ICONS = [
  {
    id: "obs-icon-lt",
    iconKey: "btfhpqdm",
    slot: "left-top" as OrbitSlot,
    sizeClass: "size-20 md:size-32",
    side: "left" as OrbitHintSide,
    align: "top" as OrbitHintAlign,
    description:
      "Atención y cuidado integral brindado a personas migrantes en la región Trifinio.",
    speed: 1.6,
    float: { y: [0, -6, 0], delay: 0.3, duration: 4.5 },
  },
  {
    id: "obs-icon-lm",
    iconKey: "sagolbcs",
    slot: "left-mid" as OrbitSlot,
    sizeClass: "size-20 md:size-32",
    side: "left" as OrbitHintSide,
    align: "center" as OrbitHintAlign,
    description:
      "Caracterización de perfiles y población en movimiento transfronterizo.",
    speed: 1.5,
    float: { y: [0, 7, 0], delay: 0.8, duration: 4.2 },
  },
  {
    id: "obs-icon-lb",
    iconKey: "vnqckbbs",
    slot: "left-bot" as OrbitSlot,
    sizeClass: "size-20 md:size-28",
    side: "left" as OrbitHintSide,
    align: "bottom" as OrbitHintAlign,
    description:
      "Coordinación institucional entre El Salvador, Guatemala y Honduras.",
    speed: 1.3,
    float: {
      y: [0, -8, 0],
      rotate: [-2, 2, -2],
      delay: 1.1,
      duration: 5,
    },
  },
  {
    id: "obs-icon-rt",
    iconKey: "joegeleh",
    slot: "right-top" as OrbitSlot,
    sizeClass: "size-20 md:size-28",
    side: "right" as OrbitHintSide,
    align: "top" as OrbitHintAlign,
    description:
      "Visualización territorial de rutas, flujos y corredores migratorios.",
    speed: 1.4,
    float: { y: [0, -7, 0], x: [0, 3, 0], delay: 0.5, duration: 4.6 },
  },
  {
    id: "obs-icon-rm",
    iconKey: "byxbxspd",
    slot: "right-mid" as OrbitSlot,
    sizeClass: "size-20 md:size-28",
    side: "right" as OrbitHintSide,
    align: "center" as OrbitHintAlign,
    description:
      "Análisis estadístico de indicadores de movilidad humana en la región.",
    speed: 1.4,
    float: { y: [0, 6, 0], delay: 0.9, duration: 5 },
  },
  {
    id: "obs-icon-rb",
    iconKey: "wvhscmei",
    slot: "right-bot" as OrbitSlot,
    sizeClass: "size-20 md:size-28",
    side: "right" as OrbitHintSide,
    align: "bottom" as OrbitHintAlign,
    description:
      "Reportes consolidados para la toma de decisiones públicas e institucionales.",
    speed: 1.5,
    float: { y: [0, -6, 0], x: [0, -3, 0], delay: 1.2, duration: 4.8 },
  },
] as const;

function OrbitIconHint({
  side,
  align,
  description,
}: {
  side: OrbitHintSide;
  align: OrbitHintAlign;
  description: string;
}) {
  const isLeft = side === "left";
  const textClass = cn(
    "w-[10.5rem] font-bold text-azul-trifinio dark:text-white text-[10px] leading-relaxed sm:w-[12rem] sm:text-xs md:w-[14rem] md:text-sm md:leading-snug",
    isLeft ? "text-right" : "text-left",
  );

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 hidden md:block",
        isLeft ? "right-full mr-2" : "left-full ml-2",
        align === "top" && "bottom-1/2",
        align === "center" && "top-1/2 -translate-y-1/2",
        align === "bottom" && "top-1/2",
      )}
    >
      <p className={cn(textClass, isLeft ? "pr-1" : "pl-1")}>{description}</p>
    </div>
  );
}

function orbitFloatAnimation(float: (typeof ORBIT_ICONS)[number]["float"]) {
  const anim: { y?: number[]; x?: number[]; rotate?: number[] } = {};
  if (float.y) anim.y = [...float.y];
  if ("x" in float && float.x) anim.x = [...float.x];
  if ("rotate" in float && float.rotate) anim.rotate = [...float.rotate];
  return anim;
}

function ObservatorioIconOrbit() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: orbitRef,
    offset: ["start 0.85", "end 0.15"],
  });
  const orbitRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-40, 0, 40]);
  const iconCounterRotate = useTransform(orbitRotate, (r) => -r);

  return (
    <div className="w-full">
      <div
        ref={orbitRef}
        className="relative mx-auto my-4 md:my-16 w-full max-w-none md:max-w-2xl aspect-square overflow-visible px-0 md:px-10"
      >
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute size-44 md:size-72 rounded-full border border-azul-trifinio/40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 1.4, delay: 0.5 }}
            className="absolute size-52 md:size-96 rounded-full border border-azul-trifinio/25"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            id="obs-icon-center"
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{
              duration: 0.7,
              delay: 0.25,
              type: "spring",
              stiffness: 120,
            }}
            className="pointer-events-auto relative flex size-32 md:size-44 items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="size-full"
            >
              <AnimatedIcon
                iconKey="okgvdvjm"
                target="#obs-icon-center"
                size="100%"
                speed={1.5}
              />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ rotate: orbitRotate }}
        >
          {ORBIT_ICONS.map((icon, idx) => {
            const rad =
              (orbitAngle(icon.slot, ORBIT_SIDE_SPREAD) * Math.PI) / 180;
            const left = 50 + ORBIT_RADIUS * Math.sin(rad);
            const top = 50 - ORBIT_RADIUS * Math.cos(rad);
            const float = icon.float;

            return (
              <motion.div
                key={icon.id}
                id={icon.id}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{
                  duration: 0.75,
                  delay: 0.45 + idx * 0.05,
                  type: "spring",
                  stiffness: 180,
                }}
                className={cn(
                  "group/orbit-icon pointer-events-auto absolute flex cursor-pointer items-center justify-center",
                  icon.sizeClass,
                )}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  x: "-50%",
                  y: "-50%",
                  rotate: iconCounterRotate,
                }}
                onMouseEnter={(e) => playLordIcons(e.currentTarget)}
              >
                <OrbitIconHint
                  side={icon.side}
                  align={icon.align}
                  description={icon.description}
                />
                <motion.div
                  animate={orbitFloatAnimation(float)}
                  transition={{
                    duration: float.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: float.delay,
                  }}
                  className="size-full"
                >
                  <AnimatedIcon
                    iconKey={icon.iconKey}
                    target={`#${icon.id}`}
                    size="100%"
                    speed={icon.speed}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <ul className="mt-6 mb-12 w-full space-y-4 md:hidden">
        {ORBIT_ICONS.map((icon) => (
          <li key={`${icon.id}-mobile`} className="flex items-start gap-4">
            <div
              id={`${icon.id}-mobile`}
              className="flex size-14 shrink-0 items-center justify-center"
            >
              <AnimatedIcon
                iconKey={icon.iconKey}
                target={`#${icon.id}-mobile`}
                size="100%"
                speed={icon.speed}
              />
            </div>
            <p className="pt-1 text-left text-sm font-bold leading-snug text-azul-trifinio dark:text-white">
              {icon.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── sección 2 ─── */

function ModulosObservatorioSection() {
  const observatorioPillars = [
    "Ingesta y centralización de datos",
    "Procesamiento analítico",
    "Repositorio de conocimiento",
  ];

  const reportFeatures = [
    "Filtros por año, mes, sector y organización",
    "Gráficos por nacionalidad y perfil migratorio",
    "Cruce de variables y visualización por territorio",
    "Datos consolidados de la región Trifinio",
  ];

  return (
    <section className="relative flex w-full flex-col justify-start overflow-x-hidden bg-background px-6 md:px-12 lg:px-16 pt-0 pb-20 md:pb-36 md:min-h-[130vh]">
      <LightSectionBackground />

      <div className="relative z-10 mx-auto max-w-6xl w-full py-4 text-center md:py-5">
        <TextAnimate
          animation="blurInUp"
          by="word"
          className="text-sm sm:text-base md:text-lg font-black uppercase tracking-[0.25em] text-celeste-trifinio"
        >
          — Observatorio Web —
        </TextAnimate>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-4 text-4xl font-black leading-[0.92] tracking-[-0.025em] text-azul-trifinio-hero md:text-6xl lg:text-7xl xl:text-8xl"
        >
          de Plan Trifinio
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-1 text-2xl font-bold leading-[1.05] tracking-[-0.015em] text-foreground md:mt-1.5 md:text-4xl lg:text-[2.75rem]"
        >
          Es una plataforma tecnológica e interactiva
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative z-10 mx-auto mt-10 md:mt-8 flex w-full max-w-full flex-col items-center text-center max-md:mt-6 md:w-[65%] md:max-w-[65%]"
      >
        <ObservatorioIconOrbit />

        <div className="w-full text-left">
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
            Diseñada para la{" "}
            <span className="font-bold text-foreground">
              recolección, centralización, análisis y visualización continua de
              datos
            </span>{" "}
            sobre movilidad humana en la región Trifinio. Su propósito central
            es{" "}
            <span className="font-bold text-foreground">
              generar conocimiento técnico y estadístico
            </span>{" "}
            que fundamente la toma de decisiones institucionales y públicas.
          </p>

          <ul className="mt-10 space-y-5">
            {observatorioPillars.map((item, idx) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.45, delay: 0.35 + idx * 0.1 }}
                className="flex items-center gap-3.5"
              >
                <span className="size-2 shrink-0 rounded-full bg-celeste-trifinio" />
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-foreground">
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.75 }}
        className="relative z-10 mx-auto mt-16 md:mt-20 w-full max-w-full border-t border-border pt-14 md:pt-20 pb-4 md:pb-6 md:w-[65%] md:max-w-[65%]"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-10 md:mb-12 mx-auto w-full text-center"
        >
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-celeste-trifinio">
            — Reportes —
          </p>
          <h3 className="mt-4 text-3xl md:text-4xl lg:text-[2.75rem] font-black text-foreground leading-tight">
            Consulte los indicadores regionales
          </h3>
          <p className="mt-4 md:mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
            Acceda a reportes dinámicos con filtros avanzados, gráficos
            interactivos y descarga de resultados en PDF y Excel.
          </p>
        </motion.div>
        <div className="mx-auto grid w-full grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,40%)_minmax(0,1fr)] md:gap-12 lg:gap-14">
          {/* izquierda: cuadro */}
          <div className="flex w-full mx-auto md:mx-0">
            <motion.div
              id="rep-card-hover"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative flex w-full min-h-88 md:min-h-80 flex-col overflow-hidden rounded-2xl border border-azul-trifinio bg-azul-trifinio pt-7 shadow-sm dark:border-azul-trifinio/30 dark:bg-transparent dark:bg-linear-to-br dark:from-azul-trifinio/45 dark:via-azul-trifinio/35 dark:to-celeste-trifinio/50"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(26,149,211,0.22),transparent_62%)] opacity-0 dark:opacity-100" />

              <div className="relative flex flex-1 flex-col items-center justify-end px-2 pb-5 md:px-6">
                {/* abanico de iconos */}
                <div className="relative h-52 w-full max-w-full md:h-56 md:max-w-[380px]">
                  <motion.div
                    initial={{ opacity: 0, y: 16, rotate: -24 }}
                    whileInView={{ opacity: 1, y: 0, rotate: -18 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="absolute bottom-0 left-0 flex size-28 md:size-32 items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 3.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2,
                      }}
                      className="size-full drop-shadow-none dark:drop-shadow-sm"
                    >
                      <AnimatedIcon
                        iconKey="qkcczdgu"
                        target="#rep-card-hover"
                        size="100%"
                        speed={1.5}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.7 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.12,
                      type: "spring",
                      stiffness: 180,
                    }}
                    className="absolute left-1/2 top-0 flex size-32 md:size-36 -translate-x-1/2 items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 3.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="size-full drop-shadow-none dark:drop-shadow-md"
                    >
                      <AnimatedIcon
                        iconKey="ucosgsod"
                        target="#rep-card-hover"
                        size="100%"
                        speed={1.4}
                      />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16, rotate: 24 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 18 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{
                      duration: 0.55,
                      delay: 0.28,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="absolute bottom-0 right-0 flex size-28 md:size-32 items-center justify-center pointer-events-none"
                  >
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 4.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                      className="size-full drop-shadow-none dark:drop-shadow-sm"
                    >
                      <AnimatedIcon
                        iconKey="wvhscmei"
                        target="#rep-card-hover"
                        size="100%"
                        speed={1.5}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="relative z-10 w-full border-t border-azul-trifinio/25 bg-[#1a2332] px-5 py-5 text-center dark:bg-card/95"
              >
                <p className="text-xs md:text-sm font-black uppercase tracking-widest text-white/70 dark:text-muted-foreground">
                  Análisis de Datos
                </p>
                <p className="text-xl md:text-2xl font-black text-white leading-tight dark:text-foreground">
                  Reportes
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* derecha: lista + botón */}
          <div className="flex flex-col gap-8 md:gap-10 md:pt-2">
            <ul className="space-y-5 md:space-y-6">
              {reportFeatures.map((feature, fi) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.45, delay: 0.3 + fi * 0.07 }}
                  className="flex items-start gap-3.5"
                >
                  <span className="mt-2 size-2.5 shrink-0 rounded-full bg-celeste-trifinio" />
                  <span className="text-base md:text-lg font-black uppercase tracking-wide text-foreground leading-snug">
                    {feature}
                  </span>
                </motion.li>
              ))}
            </ul>

            <AccederObservatorioButton className="md:justify-start" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── sección 3 — FAQ ─── */

const faqs = [
  {
    q: "¿Qué es el Observatorio Web de Plan Trifinio?",
    a: "Es una plataforma tecnológica e interactiva diseñada para la recolección, centralización, análisis y visualización continua de datos sobre movilidad humana en la región Trifinio. Su propósito central es generar conocimiento técnico y estadístico que fundamente la toma de decisiones institucionales y públicas.",
  },
  {
    q: "¿Quiénes pueden acceder al observatorio?",
    a: "El Observatorio Web es público para consulta: cualquier persona puede visualizar y descargar los datos de forma libre. Solo el Plan Trifinio e instituciones autorizadas ingresan la información.",
  },
  {
    q: "¿Qué tipo de datos se recopilan?",
    a: "Datos de movilidad humana vinculados a políticas de migración, indicadores y sectores, así como perfiles y nacionalidades. Se irán añadiendo diferentes áreas de interés y fenómenos a estudiar, como el sector agrícola, pecuario, clima, turismo, entre otros.",
  },
  {
    q: "¿Cómo se generan los reportes?",
    a: "Desde el módulo de Reportes puedes filtrar por organización, sector, período y territorio, cruzar variables y descargar los resultados en PDF o Excel con gráficos interactivos.",
  },
  {
    q: "¿Los datos están seguros?",
    a: "Sí. Los datos son ingresados por diferentes instituciones y resguardados por el Plan Trifinio para su utilización.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="flex w-full flex-col justify-start rounded-b-2xl bg-background px-5 max-md:overflow-hidden md:overflow-visible md:rounded-none md:bg-transparent md:px-8 lg:px-10 xl:px-12 pt-12 pb-20 md:pt-24 md:pb-32 lg:pt-28 lg:pb-36 md:min-h-0">
      <div className="mx-auto grid max-w-7xl w-full gap-12 lg:grid-cols-[1fr_1.12fr] lg:items-start lg:gap-16 xl:gap-20">
        {/* columna izquierda — texto + acordeón */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <SectionLabel className="text-sm md:text-base">FAQ</SectionLabel>
            <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight">
              Preguntas frecuentes
            </h2>
            <SectionDivider />
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              Aquí encontrarás las respuestas a las dudas más comunes sobre el
              Observatorio Web de Plan Trifinio.
            </p>
          </motion.div>

          <div className="mt-12 md:mt-14 divide-y divide-border">
            {faqs.map((faq, idx) => {
              const isOpen = open === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-5 py-6 md:py-7 text-left"
                  >
                    <span
                      className={cn(
                        "text-lg md:text-xl font-bold transition-colors duration-300",
                        isOpen ? "text-azul-trifinio" : "text-foreground",
                      )}
                    >
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex size-8 md:size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                        isOpen
                          ? "border-azul-trifinio bg-azul-trifinio text-white"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <Plus className="size-4 md:size-5" strokeWidth={2.5} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 md:pb-7 text-base md:text-lg text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <AccederObservatorioButton className="mt-10 md:mt-12 lg:hidden [&_a]:px-8 [&_a]:py-3 [&_a]:text-base" />
        </div>

        {/* columna derecha — imagen decorativa + CTA */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative hidden lg:flex lg:flex-col lg:pt-2"
        >
          <div className="relative w-full">
            {/* marco decorativo */}
            <div className="absolute -top-4 -right-4 h-full w-full rounded-3xl border-2 border-celeste-trifinio/40" />
            <div className="absolute -bottom-4 -left-4 h-full w-full rounded-3xl border-2 border-azul-trifinio/20" />
            <div className="relative overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="/trifinio/hero-background2.jpg"
                alt="Región Trifinio"
                className="aspect-3/2 xl:aspect-4/3 w-full min-h-[340px] xl:min-h-[420px] object-cover object-center"
              />
              {/* badge sobre la imagen */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md border border-white/20">
                <p className="text-xs font-black uppercase tracking-widest text-white">
                  Observatorio Web
                </p>
                <div className="my-2.5 h-px w-full bg-white/50" />
                <p
                  className="font-black text-white leading-none"
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

          <AccederObservatorioButton className="mt-8 w-full justify-center [&_a]:px-8 [&_a]:py-3 [&_a]:text-base" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── footer cortina (espejo del hero) ─── */

const FOOTER_SIGET_LINKS = [
  { label: "Observatorio Web", href: "/observatorio-web", external: false },
  { label: "Acceder SIGET", href: "/login", external: false },
] as const;

const FOOTER_PLAN_TRIFINIO_LINKS = [
  {
    label: "Sitio oficial",
    href: "https://www.plantrifinio.int/",
    external: true,
  },
  {
    label: "Noticias",
    href: "https://www.plantrifinio.int/noticias/",
    external: true,
  },
  {
    label: "Quiénes somos",
    href: "https://www.plantrifinio.int/quienes-somos/",
    external: true,
  },
  {
    label: "Programas y proyectos",
    href: "https://www.plantrifinio.int/programas-y-proyectos/",
    external: true,
  },
  {
    label: "Reserva de Biosfera Trifinio",
    href: "https://www.plantrifinio.int/reserva-de-biosfera-transfronteriza-trifinio-fraternidad/",
    external: true,
  },
] as const;

const FOOTER_PLAN_TRIFINIO_LINKS_LEFT = FOOTER_PLAN_TRIFINIO_LINKS.slice(0, 3);
const FOOTER_PLAN_TRIFINIO_LINKS_RIGHT = FOOTER_PLAN_TRIFINIO_LINKS.slice(3);

const FOOTER_SOCIAL = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/plantrifiniooficial",
    icon: Facebook,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@plantrifinio5622",
    icon: Youtube,
  },
] as const;

const FOOTER_COUNTRIES_LINE = (
  <>El Salvador&ensp;•&ensp;Guatemala&ensp;•&ensp;Honduras</>
);

function FooterPlanTrifinioBrand() {
  return (
    <div className="flex w-full flex-row items-center gap-5 md:w-auto md:gap-6 lg:gap-8">
      <img
        src="/trifinio/logo.png"
        alt="Plan Trifinio"
        className="size-[110px] shrink-0 object-contain md:size-[120px] lg:size-[132px]"
      />
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center md:flex-none">
        {/* fantasma para anclar el ancho al texto de países (solo desktop) */}
        <p
          className="pointer-events-none invisible hidden h-0 overflow-hidden whitespace-nowrap font-semibold text-white md:block"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(0.5rem, 1.1vw, 0.9rem)",
            letterSpacing: "0.22em",
          }}
          aria-hidden
        >
          {FOOTER_COUNTRIES_LINE}
        </p>
        <p
          className="whitespace-nowrap text-center font-black leading-[0.95] text-white"
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: "clamp(1.9rem, 8vw, 2.8rem)",
          }}
        >
          Plan Trifinio
        </p>
        <p
          className="mt-1 text-center font-bold italic leading-tight text-white"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(1.15rem, 4.5vw, 1.8rem)",
          }}
        >
          &ldquo;Agua sin fronteras&rdquo;
        </p>
        <div className="mt-2 h-[2px] w-full origin-center bg-white" />
        <p
          className="mt-2 whitespace-nowrap text-center font-semibold text-white/85"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "clamp(0.65rem, 2.5vw, 0.9rem)",
            letterSpacing: "0.18em",
          }}
        >
          {FOOTER_COUNTRIES_LINE}
        </p>
      </div>
    </div>
  );
}

type FooterUnderlineMode = "hover-draw" | "always" | "responsive";

/** Solo móvil: subrayado celeste fijo en cada línea */
const FOOTER_UNDERLINE_MOBILE =
  "max-md:underline max-md:decoration-2 max-md:decoration-celeste-trifinio max-md:underline-offset-[5px] max-md:[box-decoration-break:clone]";

/** Solo escritorio: línea fina que se dibuja al hover (sin text-decoration) */
const FOOTER_UNDERLINE_HOVER_LINE =
  "pointer-events-none absolute bottom-0 left-0 hidden h-0.5 w-full origin-left scale-x-0 bg-celeste-trifinio transition-transform duration-300 ease-out group-hover:scale-x-100 md:block";

function FooterSectionHeading({
  children,
  align = "start",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-celeste-trifinio whitespace-nowrap",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
    </p>
  );
}

function FooterLinkLabel({
  children,
  mode = "hover-draw",
}: {
  children: React.ReactNode;
  mode?: FooterUnderlineMode;
}) {
  if (mode === "always") {
    return <span className={FOOTER_UNDERLINE_MOBILE}>{children}</span>;
  }

  if (mode === "responsive") {
    return (
      <span
        className={cn(
          "relative inline max-md:pb-0 md:pb-0.5",
          FOOTER_UNDERLINE_MOBILE,
        )}
      >
        {children}
        <span aria-hidden className={FOOTER_UNDERLINE_HOVER_LINE} />
      </span>
    );
  }

  return (
    <span className="relative inline pb-0.5">
      {children}
      <span aria-hidden className={FOOTER_UNDERLINE_HOVER_LINE} />
    </span>
  );
}

function FooterLinkItem({
  label,
  href,
  external,
  animatedUnderline = false,
  underlineMode = "hover-draw",
  showExternalIcon = true,
}: {
  label: string;
  href: string;
  external: boolean;
  animatedUnderline?: boolean;
  underlineMode?: FooterUnderlineMode;
  showExternalIcon?: boolean;
}) {
  const className = cn(
    "group max-w-full text-base font-semibold text-white/85 transition-colors hover:text-white md:text-lg",
    showExternalIcon ? "inline-flex items-center gap-2" : "inline-block",
  );

  const labelContent = animatedUnderline ? (
    <FooterLinkLabel mode={underlineMode}>{label}</FooterLinkLabel>
  ) : (
    label
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {labelContent}
        {showExternalIcon ? (
          <ExternalLink className="size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
        ) : null}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {labelContent}
    </Link>
  );
}

function ObservatorioFooterContent({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-full w-full flex-col justify-end gap-8 px-4 pb-8 sm:px-6 md:gap-10 md:px-10 md:pb-10 lg:px-14 xl:px-16",
        className,
      )}
    >
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-12 md:items-start md:gap-x-10 lg:gap-x-14">
        {/* Columna 1 — Marca + descripción */}
        <div className="w-full min-w-0 md:col-span-5">
          <FooterPlanTrifinioBrand />
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 md:text-[15px] md:leading-relaxed lg:text-base">
            Plataforma tecnológica para la recolección, centralización, análisis
            y visualización de datos sobre movilidad humana en la región
            Trifinio.
          </p>
          <p className="mt-4 w-full text-base font-black leading-snug text-white md:max-w-md md:text-sm md:font-normal md:leading-relaxed md:text-white/60">
            Sistema Integral de Gestión Estratégica Trifinio (SIGET).
          </p>
        </div>

        {/* Columna 2 — Observatorio Web + Redes */}
        <div className="min-w-0 md:col-span-3">
          <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-1 md:gap-0">
            <div className="min-w-0">
              <FooterSectionHeading>Observatorio Web</FooterSectionHeading>
              <ul className="mt-5 space-y-3.5">
                {FOOTER_SIGET_LINKS.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem
                      {...link}
                      animatedUnderline
                      underlineMode="responsive"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 text-right md:text-left">
              <div className="md:mt-8">
                <FooterSectionHeading align="end" className="md:justify-start">
                  Redes
                </FooterSectionHeading>
              </div>
              <ul className="mt-5 flex flex-col items-end space-y-3.5 md:items-start">
                {FOOTER_SOCIAL.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-3 text-base font-semibold text-white/85 transition-colors hover:text-white md:text-lg"
                    >
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-celeste-trifinio transition-colors group-hover:border-celeste-trifinio/50 group-hover:bg-white/10">
                        <Icon className="size-4" />
                      </span>
                      <FooterLinkLabel mode="responsive">
                        {label}
                      </FooterLinkLabel>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Columna 3 — Plan Trifinio (a la derecha) */}
        <div className="min-w-0 md:col-span-4 md:text-right">
          <FooterSectionHeading className="md:justify-end">
            Plan Trifinio
          </FooterSectionHeading>
          <div className="mt-5 flex justify-between gap-6 md:hidden">
            <ul className="flex min-w-0 flex-col items-start gap-3">
              {FOOTER_PLAN_TRIFINIO_LINKS_LEFT.map((link) => (
                <li key={link.label} className="min-w-0 max-w-44 sm:max-w-xs">
                  <FooterLinkItem
                    {...link}
                    animatedUnderline
                    underlineMode="responsive"
                    showExternalIcon={false}
                  />
                </li>
              ))}
            </ul>
            <ul className="flex min-w-0 flex-col items-end gap-3 text-right">
              {FOOTER_PLAN_TRIFINIO_LINKS_RIGHT.map((link) => (
                <li key={link.label} className="min-w-0 max-w-44 sm:max-w-xs">
                  <FooterLinkItem
                    {...link}
                    animatedUnderline
                    underlineMode="responsive"
                    showExternalIcon={false}
                  />
                </li>
              ))}
            </ul>
          </div>
          <ul className="mt-5 hidden space-y-3.5 md:flex md:flex-col md:items-end">
            {FOOTER_PLAN_TRIFINIO_LINKS.map((link) => (
              <li key={link.label} className="text-right">
                <FooterLinkItem
                  {...link}
                  animatedUnderline
                  underlineMode="responsive"
                  showExternalIcon={false}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/55">
          © 2026 SIGET — Plan Trifinio
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-white/55">
          Powered by{" "}
          <a
            href="https://www.oscar27jimenez.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center"
          >
            <FooterLinkLabel>
              <AuroraText className="text-xs whitespace-nowrap">
                Kore | Ing. de Software
              </AuroraText>
            </FooterLinkLabel>
          </a>
        </p>
      </div>
    </div>
  );
}

/** Altura del footer fijo en desktop. */
export const FOOTER_HEIGHT_VH = 50;
/** Spacer desktop: un poco más alto que el footer para que el azul asome bajo las esquinas redondeadas del blanco. */
export const FOOTER_SCROLL_SPACER_VH = 58;
/** Scroll en móvil: ~100vh para que el bloque blanco suba y desaparezca por completo. */
export const FOOTER_SCROLL_SPACER_MOBILE_VH = 100;

export function ObservatorioFooterCurtain({
  revealed = false,
}: {
  revealed?: boolean;
}) {
  return (
    <footer
      className="relative z-20 flex h-auto w-full flex-col overflow-hidden bg-[#0a1628] md:fixed md:bottom-0 md:left-0 md:z-0 md:h-[50vh] max-md:!opacity-100 max-md:!visibility-visible max-md:!pointer-events-auto"
      style={{
        zoom: 1 / 0.9,
        opacity: revealed ? 1 : 0,
        visibility: revealed ? "visible" : "hidden",
        pointerEvents: revealed ? undefined : "none",
      }}
      aria-label="Pie de página Plan Trifinio"
    >
      <DarkSectionBackground />
      <div className="relative z-10 flex h-full w-full overflow-y-auto md:overflow-visible">
        <ObservatorioFooterContent className="pt-14 md:pt-0" />
      </div>
    </footer>
  );
}

/* ─── export ─── */

export function ObservatorioHomeSections() {
  return (
    <>
      <ModulosObservatorioSection />

      <FullWidthImageBanner
        src="/trifinio/hero-background2.jpg"
        alt="Panorama regional Trifinio"
        overlay="from-[#0a1628]/90 via-[#2c5f9b]/50 to-[#1a95d3]/30"
        label="Observatorio Web"
        showPlanTrifinioBrand
        fixedBackground
      />

      <WhyObservatorioSection />

      <TrifinioDottedMapSection />

      <OrganizacionesLogoCintillo variant="public" />

      <FaqSection />
    </>
  );
}
