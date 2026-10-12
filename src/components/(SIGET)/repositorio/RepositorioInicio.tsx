"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Eye,
  FileStack,
  FileText,
  Globe2,
  Library,
  Newspaper,
  PenLine,
  Send,
} from "lucide";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { AuroraText } from "@/components/ui/aurora-text";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { createClient } from "@/utils/supabase/client";
import { pickSaludoMotivacional } from "@/components/(SIGET)/gestion-territorial/lib/saludos";
import { primerNombre, pickSaludoEntrada } from "@/lib/persona";
import {
  rutaRepositorioDocumentos,
  rutaRepositorioNoticias,
} from "./lib/helpers";
import {
  RepositorioMenuShell,
  RepositorioTarjetasMenu,
  type RepositorioMenuCard,
} from "./RepositorioTarjetasMenu";

const REPOSITORIO_CARDS: RepositorioMenuCard[] = [
  {
    id: "card-noticias",
    href: rutaRepositorioNoticias(),
    badge: "Comunicación",
    title: "Noticias",
    description:
      "Notas y comunicados con secciones, fotos y vista previa antes de publicar.",
    cta: "Entrar a Noticias",
    iconFrom: Newspaper,
    iconTo: PenLine,
    iconColor: "#60a5fa",
    accent: {
      border: "border-blue-300/40 dark:border-blue-400/20",
      ring: "ring-blue-300/20",
      badge: "bg-blue-500/90",
      button: "bg-blue-500 hover:bg-blue-600",
      check: "text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-400/10",
    },
    features: [
      { label: "Mis noticias en borrador", iconFrom: FileText, iconTo: PenLine },
      { label: "Secciones con fotos", iconFrom: Eye, iconTo: Globe2 },
      { label: "Envío a revisión", iconFrom: Send, iconTo: Send },
    ],
  },
  {
    id: "card-documentos",
    href: rutaRepositorioDocumentos(),
    badge: "Conocimiento",
    title: "Documentos",
    description:
      "Informes, estudios, guías y materiales del repositorio científico o educativo.",
    cta: "Entrar a Documentos",
    iconFrom: FileStack,
    iconTo: BookOpen,
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
      { label: "Mis documentos cargados", iconFrom: FileStack, iconTo: FileText },
      { label: "Canales científico y educativo", iconFrom: Library, iconTo: BookOpen },
      { label: "Archivos adjuntos", iconFrom: FileText, iconTo: FileStack },
    ],
  },
];

export function RepositorioInicio() {
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const [loading, setLoading] = useState(true);
  const [saludoEntrada, setSaludoEntrada] = useState("¡Hola, ");
  const [saludoMotivacional] = useState(() => pickSaludoMotivacional());
  const [typedText, setTypedText] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaludoEntrada(pickSaludoEntrada(null));
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
          setSaludoEntrada(pickSaludoEntrada(data.genero));
        } else {
          setSaludoEntrada(pickSaludoEntrada(null));
        }
      } catch {
        setSaludoEntrada(pickSaludoEntrada(null));
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
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
      <div className="flex-1 w-full px-6 lg:px-12 space-y-10 max-w-[1600px] mx-auto pb-10 pt-20">
        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
      </div>
    );
  }


  return (
    <RepositorioMenuShell
      encabezado={
        <div className="flex flex-col items-center justify-center text-center w-full gap-4 relative z-10">
          <div
            className="group mb-6 flex cursor-pointer items-center justify-center gap-4 rounded-full border border-sky-200/80 bg-sky-50/90 py-2 pl-2 pr-8 text-xs font-black uppercase tracking-[0.15em] text-[#2c5f9b] shadow-sm transition-all hover:bg-sky-100/90 hover:shadow-md dark:border-sky-400/15 dark:bg-sky-400/8 dark:text-[#6f9fd4] dark:hover:bg-sky-400/12"
            onMouseEnter={() => setHeaderHovered(true)}
            onMouseLeave={() => setHeaderHovered(false)}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/80 transition-transform group-hover:scale-105 dark:bg-white/10">
              <MorphHoverIcon
                from={Library}
                to={Globe2}
                hovered={headerHovered}
                size={32}
                color="#2c5f9b"
              />
            </div>
            Repositorio institucional
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            {saludoEntrada}
            <AuroraText>{primerNombre(metadata.nombre)}</AuroraText>!
          </h2>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed min-h-[56px] md:min-h-[60px]">
            {typedText}
            <span className="inline-block w-[2px] h-[1em] bg-[#6f9fd4] ml-1 align-middle animate-pulse" />
          </p>
        </div>
      }
    >
      <RepositorioTarjetasMenu
        cards={REPOSITORIO_CARDS}
        gridClassName="grid-cols-1 gap-8 md:grid-cols-2 xl:max-w-4xl xl:mx-auto"
      />
    </RepositorioMenuShell>
  );
}
