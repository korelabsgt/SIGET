"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type { IconNode } from "lucide";
import {
  BarChart3,
  ChartPie,
  CalendarCheck,
  Car,
  ClipboardList,
  ClipboardPen,
  Eye,
  FileBarChart,
  FilePlus,
  FileText,
  FolderKanban,
  Globe2,
  KeyRound,
  Map,
  Route,
  Settings,
  Truck,
  UserCheck,
  Users,
  Wrench,
} from "lucide";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { AuroraText } from "@/components/ui/aurora-text";
import { createClient } from "@/utils/supabase/client";
import { pickSaludoMotivacional } from "@/components/(SIGET)/gestion-territorial/lib/saludos";

type GtCardFeature = {
  label: string;
  iconFrom: IconNode;
  iconTo: IconNode;
};

const GT_CARDS = [
  {
    id: "card-memoria-labores",
    href: "/siget/gestion-territorial/memoria-labores",
    badge: "Gestión Documental",
    title: "Memoria de Labores",
    description:
      "Formularios institucionales del Plan Trifinio para la memoria de labores semestral.",
    cta: "Acceder a Formularios",
    iconFrom: FileText,
    iconTo: ClipboardList,
    iconColor: "#fb923c",
    accent: {
      border: "border-orange-300/40 dark:border-orange-400/20",
      ring: "ring-orange-300/20",
      badge: "bg-orange-400/90",
      button: "bg-orange-400 hover:bg-orange-500",
      check: "text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-400/10",
    },
    features: [
      {
        label: "Creación de registros semestrales",
        iconFrom: FilePlus,
        iconTo: CalendarCheck,
      },
      {
        label: "Visualización de proyectos",
        iconFrom: FolderKanban,
        iconTo: Eye,
      },
      {
        label: "Reporte de actividades institucionales",
        iconFrom: ClipboardList,
        iconTo: FileBarChart,
      },
    ] satisfies GtCardFeature[],
  },
  {
    id: "card-asistencia",
    href: "/siget/gestion-territorial/asistencia-actividades",
    badge: "Gestión de Eventos",
    title: "Registro de Actividades",
    description:
      "Gestión de asistentes, minuta de actividad y estadísticas en tiempo real.",
    cta: "Acceder a Registro",
    iconFrom: ClipboardPen,
    iconTo: UserCheck,
    iconColor: "#a78bfa",
    accent: {
      border: "border-violet-300/40 dark:border-violet-400/20",
      ring: "ring-violet-300/20",
      badge: "bg-violet-400/90",
      button: "bg-violet-400 hover:bg-violet-500",
      check: "text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-400/10",
    },
    features: [
      {
        label: "Gestión de asistentes",
        iconFrom: Users,
        iconTo: UserCheck,
      },
      {
        label: "Minuta de Actividad",
        iconFrom: ClipboardPen,
        iconTo: FileText,
      },
      {
        label: "Estadísticas en tiempo real",
        iconFrom: BarChart3,
        iconTo: ChartPie,
      },
    ] satisfies GtCardFeature[],
  },
  {
    id: "card-vehiculos",
    href: "/siget/gestion-territorial/gestion-vehiculos",
    badge: "Gestión de Flota",
    title: "Gestión de Vehículos",
    description: "Control y asignación de la flota vehicular de la institución.",
    cta: "Acceder a Flota",
    iconFrom: Car,
    iconTo: Truck,
    iconColor: "#60a5fa",
    accent: {
      border: "border-blue-300/40 dark:border-blue-400/20",
      ring: "ring-blue-300/20",
      badge: "bg-blue-400/90",
      button: "bg-blue-400 hover:bg-blue-500",
      check: "text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-400/10",
    },
    features: [
      {
        label: "Control de asignaciones",
        iconFrom: KeyRound,
        iconTo: Car,
      },
      {
        label: "Registro de mantenimientos",
        iconFrom: Wrench,
        iconTo: Settings,
      },
      {
        label: "Reporte de recorridos",
        iconFrom: Map,
        iconTo: Route,
      },
    ] satisfies GtCardFeature[],
    colSpan: "md:col-span-2 lg:col-span-1",
  },
] as const;

export default function GestionTerritorialPage() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};

  const [loading, setLoading] = useState(true);
  const [genero, setGenero] = useState<string | null>(null);
  const [saludoMotivacional] = useState(() => pickSaludoMotivacional());
  const [typedText, setTypedText] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("genero")
          .eq("id", user.id)
          .single();
        if (data && !error) {
          setGenero(data.genero);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedText(saludoMotivacional.substring(0, i + 1));
        i++;
        if (i >= saludoMotivacional.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(timeout);
  }, [saludoMotivacional]);

  if (loading) {
    return (
      <div className="flex-1 w-full px-6 lg:px-12 space-y-10 max-w-550 mx-auto pb-10 pt-20">
        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
      </div>
    );
  }

  const welcomeText =
    genero === "Femenino"
      ? "¡Bienvenida, "
      : genero === "Masculino"
        ? "¡Bienvenido, "
        : "¡Bienvenid@, ";

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px] dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] opacity-60" />
      <div className="flex-1 w-full px-2 md:px-6 lg:px-12 max-w-[1600px] mx-auto pt-5 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center justify-center text-center w-full gap-4 relative z-10">
              <div
                className="group mb-6 flex cursor-pointer items-center justify-center gap-4 rounded-full border border-orange-200/80 bg-orange-50/90 py-2 pl-2 pr-8 text-xs font-black uppercase tracking-[0.15em] text-orange-500 shadow-sm transition-all hover:bg-orange-100/90 hover:shadow-md dark:border-orange-400/15 dark:bg-orange-400/8 dark:text-orange-300 dark:hover:bg-orange-400/12"
                onMouseEnter={() => setHeaderHovered(true)}
                onMouseLeave={() => setHeaderHovered(false)}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/80 transition-transform group-hover:scale-105 dark:bg-white/10">
                  <MorphHoverIcon
                    from={Map}
                    to={Globe2}
                    hovered={headerHovered}
                    size={32}
                    color="#fb923c"
                  />
                </div>
                Módulo de Gestión Territorial
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight"
              >
                {welcomeText}
                <AuroraText>{metadata.nombre || "Usuario"}</AuroraText>!
              </motion.h2>

              <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed min-h-[56px] md:min-h-[60px]">
                {typedText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-[2px] h-[1em] bg-orange-400 ml-1 align-middle"
                />
              </p>
            </div>

            <div className="relative z-10 mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {GT_CARDS.map((card) => (
                <div
                  key={card.id}
                  id={card.id}
                  className={`group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border bg-card p-0 shadow-lg ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${card.accent.border} ${card.accent.ring} ${"colSpan" in card ? card.colSpan : ""}`}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => router.push(card.href)}
                >
                  <div
                    className={`py-2 text-center text-[10px] font-black uppercase tracking-widest text-white ${card.accent.badge}`}
                  >
                    {card.badge}
                  </div>
                  <div className="flex h-full flex-col p-8">
                    <div className="mb-8 flex items-start gap-5">
                      <div
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${card.accent.iconBg}`}
                      >
                        <MorphHoverIcon
                          from={card.iconFrom}
                          to={card.iconTo}
                          hovered={hoveredCard === card.id}
                          size={40}
                          color={card.iconColor}
                        />
                      </div>
                      <div className="flex flex-col pt-1">
                        <h3 className="mb-2 text-3xl font-black leading-none text-slate-900 dark:text-white">
                          {card.title}
                        </h3>
                        <p className="text-sm font-medium leading-snug text-slate-500 dark:text-slate-400">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`pointer-events-none mb-8 w-full cursor-pointer rounded-xl py-3.5 text-center text-sm font-bold text-white shadow-sm transition-colors ${card.accent.button}`}
                    >
                      {card.cta}
                    </button>
                    <ul className="mt-auto space-y-4">
                      {card.features.map((feature) => (
                        <li
                          key={feature.label}
                          className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center ${card.accent.check}`}
                          >
                            <MorphHoverIcon
                              from={feature.iconFrom}
                              to={feature.iconTo}
                              hovered={hoveredCard === card.id}
                              size={18}
                              color={card.iconColor}
                              spring="snappy"
                            />
                          </span>
                          {feature.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
