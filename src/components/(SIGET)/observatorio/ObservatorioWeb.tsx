"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUser,
  useUserContext,
} from "@/components/(base)/providers/UserProvider";
import { AuroraText } from "@/components/ui/aurora-text";
import OrganizacionesLogoCintillo from "./OrganizacionesLogoCintillo";
import { createClient } from "@/utils/supabase/client";

const ROLES_WITH_PLANTILLAS = ["admin", "super", "admin-observatorio"];

const FRASES_BIENVENIDA = [
  "¡Qué bueno verte de nuevo! Todo está listo para continuar con la gestión técnica y el análisis regional.",
  "¡Hola de nuevo! Tienes a tu disposición todas las herramientas estadísticas y datos del Observatorio.",
  "¡Un saludo! El portal de recolección y análisis de datos está optimizado y listo para tu jornada.",
  "¡Es un gusto saludarte! Accede a las herramientas clave para actualizar y visualizar el avance de la región.",
  "¡Qué alegría tu presencia! Tu liderazgo técnico impulsa el desarrollo de la región con datos reales.",
  "¡Es un placer saludarte de nuevo! Explora, gestiona y analiza libremente la información de movilidad regional.",
  "¡Es un placer tenerte aquí hoy! Tu trabajo aquí hace más transparente la gestión de datos.",
  "¡Hola! Que tengas una excelente y productiva jornada gestionando la información del Observatorio.",
  "¡Excelente día para trabajar con datos! El portal está completamente listo para la actualización y el análisis.",
  "¡Hola! Gracias por tu valioso aporte técnico al análisis continuo de la movilidad humana regional.",
];

export default function ObservatorioWeb() {
  const router = useRouter();
  const user = useUser();
  const { effectiveRole } = useUserContext();
  const metadata = user?.user_metadata || {};

  const [loading, setLoading] = useState(true);
  const [genero, setGenero] = useState<string | null>(null);

  const [typedText, setTypedText] = useState("");

  const canSeePlantillas = ROLES_WITH_PLANTILLAS.includes(effectiveRole);

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
    const fraseAleatoria =
      FRASES_BIENVENIDA[Math.floor(Math.random() * FRASES_BIENVENIDA.length)];
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedText(fraseAleatoria.substring(0, i + 1));
        i++;
        if (i >= fraseAleatoria.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(timeout);
  }, []);

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
            {/* Header Centrado */}
            <div className="flex flex-col items-center justify-center text-center w-full gap-4 relative z-10">
              <div
                id="observatorio-header-icon"
                className="group cursor-pointer flex items-center justify-center gap-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 pl-2 pr-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-6 border border-blue-100 dark:border-blue-500/20 shadow-sm transition-all hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-500/20"
              >
                <div className="shrink-0 flex items-center justify-center w-16 h-16 dark:rounded-full dark:bg-white transition-transform group-hover:scale-105">
                  <AnimatedIcon
                    iconKey="qqvpjphn"
                    target="#observatorio-header-icon"
                    size={48}
                  />
                </div>
                Módulos del Observatorio Web
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
                  className="inline-block w-[2px] h-[1em] bg-blue-600 ml-1 align-middle"
                />
              </p>
            </div>

            {/* Cards estilo Pricing */}
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mt-12 relative z-10",
                canSeePlantillas ? "xl:grid-cols-3" : "max-w-4xl",
              )}
            >
              {/* Card Avanzada -> Reportes (Azul) */}
              <div
                id="card-reportes"
                className="bg-card rounded-3xl border border-blue-500/30 dark:border-blue-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-blue-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => router.push("/siget/observatorio/reportes")}
              >
                <div className="bg-blue-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                  Análisis de Datos
                </div>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex shrink-0 items-center justify-center w-20 h-20 dark:rounded-2xl dark:bg-white group-hover:scale-110 transition-transform">
                      <AnimatedIcon
                        iconKey="mbhqzvjk"
                        target="#card-reportes"
                        size={48}
                      />
                    </div>
                    <div className="flex flex-col pt-1">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                        Reportes
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                        Generación de reportes y cruce de variables de los
                        indicadores recolectados.
                      </p>
                    </div>
                  </div>
                  <button className="w-full text-center py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                    Generar Reportes
                  </button>
                  <ul className="space-y-4 mt-auto">
                    {[
                      "Descarga de datos en PDF/Excel",
                      "Gráficos interactivos dinámicos",
                      "Análisis avanzado y filtros",
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                      >
                        <svg
                          className="w-5 h-5 text-blue-500 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Básica -> Formularios (Morado) */}
              <div
                id="card-formularios"
                className="bg-card rounded-3xl border border-purple-500/30 dark:border-purple-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-purple-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => router.push("/siget/observatorio/formularios")}
              >
                <div className="bg-purple-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                  Recolección de Datos
                </div>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex shrink-0 items-center justify-center w-20 h-20 dark:rounded-2xl dark:bg-white group-hover:scale-110 transition-transform">
                      <AnimatedIcon
                        iconKey="uwkcewhk"
                        target="#card-formularios"
                        size={48}
                      />
                    </div>
                    <div className="flex flex-col pt-1">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                        Formularios
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                        Gestión de recolección de datos mediante formularios
                        interactivos.
                      </p>
                    </div>
                  </div>
                  <button className="w-full text-center py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                    Acceder a Formularios
                  </button>
                  <ul className="space-y-4 mt-auto">
                    {[
                      "Creación y llenado de registros",
                      "Edición de datos en tiempo real",
                      "Historial de envíos por usuario",
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                      >
                        <svg
                          className="w-5 h-5 text-purple-500 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Constructor -> (Verde) - solo admin/super */}
              {canSeePlantillas && (
                <div
                  id="card-constructor"
                  className="bg-card rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-emerald-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 md:col-span-2 xl:col-span-1"
                  onClick={() => router.push("/siget/observatorio/plantillas")}
                >
                  <div className="bg-emerald-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                    Configuración
                  </div>
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex items-start gap-5 mb-8">
                      <div className="flex shrink-0 items-center justify-center w-20 h-20 dark:rounded-2xl dark:bg-white group-hover:scale-110 transition-transform">
                        <AnimatedIcon
                          iconKey="cdxxgczv"
                          target="#card-constructor"
                          size={48}
                        />
                      </div>
                      <div className="flex flex-col pt-1">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                          Plantillas
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                          Cree y configure formularios dinámicos por sector.
                        </p>
                      </div>
                    </div>
                    <button className="w-full text-center py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                      Ir al Constructor
                    </button>
                    <ul className="space-y-4 mt-auto">
                      {[
                        "Crear nuevos formularios",
                        "Gestión de indicadores dinámicos",
                        "Asignación por sector",
                      ].map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                        >
                          <svg
                            className="w-5 h-5 text-emerald-500 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div
              id="card-paz-hidrica-ja"
              className="group relative mx-auto mt-8 flex max-w-6xl cursor-pointer overflow-hidden rounded-3xl border border-[#003882]/25 bg-card ring-1 ring-[#C59B27]/30 transition-all duration-300 hover:-translate-y-1"
              onClick={() => router.push("/siget/paz-hidrica-ja")}
            >
              <div className="flex w-full flex-col md:flex-row">
                <div className="flex items-center justify-center bg-[#003882] px-8 py-6 text-white md:w-56">
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C59B27]">
                      Submódulo transversal
                    </p>
                    <p className="mt-2 text-2xl font-black leading-none">Ja&apos;</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest">
                      Paz Hídrica
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center p-6 md:p-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Observatorio de Paz Hídrica Ja&apos;
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Gestión de los Recursos Hídricos en la Cuenca del Río Grande.
                    Alertas, mesas de concertación, redes inclusivas y tablero PBF.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <OrganizacionesLogoCintillo />
    </>
  );
}
