"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { AuroraText } from "@/components/ui/aurora-text";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { createClient } from "@/utils/supabase/client";

const FRASES_BIENVENIDA = [
  "¡Es un gusto saludarte! Accede a las herramientas para el seguimiento y control territorial.",
  "¡Qué bueno verte de nuevo! Todo está listo para la gestión de asistencia y reportes de labores.",
  "¡Un saludo! El módulo de gestión territorial te permite mantener todo organizado de manera eficiente.",
];

export default function GestionTerritorialPage() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};

  const [genero, setGenero] = useState<string | null>(null);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("genero")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && data && !error) {
          setGenero(data.genero);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
                id="gt-header-icon"
                className="group cursor-pointer flex items-center justify-center gap-4 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 pl-2 pr-8 py-2 rounded-full text-xs font-black uppercase tracking-[0.15em] mb-6 border border-orange-100 dark:border-orange-500/20 shadow-sm transition-all hover:shadow-lg hover:bg-orange-100 dark:hover:bg-orange-500/20"
              >
                <div className="shrink-0 flex items-center justify-center w-16 h-16 dark:rounded-full dark:bg-white transition-transform group-hover:scale-105">
                  <AnimatedIcon
                    iconKey="giblkgwf"
                    target="#gt-header-icon"
                    size={48}
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
                  className="inline-block w-[2px] h-[1em] bg-orange-600 ml-1 align-middle"
                />
              </p>
            </div>

            {/* Cards estilo Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12 relative z-10">
              {/* Card Básica -> Memoria de Labores (Naranja/Coral) */}
              <div
                id="card-memoria-labores"
                className="bg-card rounded-3xl border border-orange-500/30 dark:border-orange-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-orange-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => router.push("/siget/gestion-territorial/memoria-labores")}
              >
                <div className="bg-orange-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                  Gestión Documental
                </div>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex shrink-0 items-center justify-center w-20 h-20 dark:rounded-2xl dark:bg-white group-hover:scale-110 transition-transform">
                      <AnimatedIcon
                        iconKey="wvhscmei"
                        target="#card-memoria-labores"
                        size={48}
                      />
                    </div>
                    <div className="flex flex-col pt-1">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                        Memoria de Labores
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                        Formularios institucionales del Plan Trifinio para la
                        memoria de labores semestral.
                      </p>
                    </div>
                  </div>
                  <button className="w-full text-center py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                    Acceder a Formularios
                  </button>
                  <ul className="space-y-4 mt-auto">
                    {[
                      "Creación de registros semestrales",
                      "Visualización de proyectos",
                      "Reporte de actividades institucionales",
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                      >
                        <svg
                          className="w-5 h-5 text-orange-500 shrink-0"
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

              {/* Card -> Registro de Asistencia (Teal/Turquesa) */}
              <div
                id="card-asistencia"
                className="bg-card rounded-3xl border border-teal-500/30 dark:border-teal-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-teal-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                onClick={() => router.push("/siget/gestion-territorial/asistencia-actividades")}
              >
                <div className="bg-teal-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                  Gestión de Eventos
                </div>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex shrink-0 items-center justify-center w-20 h-20 dark:rounded-2xl dark:bg-white group-hover:scale-110 transition-transform">
                      <AnimatedIcon
                        iconKey="unfvchvi"
                        target="#card-asistencia"
                        size={48}
                      />
                    </div>
                    <div className="flex flex-col pt-1">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                        Registro de Asistencia
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                        Actividades con código QR y estadísticas de asistencia.
                      </p>
                    </div>
                  </div>
                  <button className="w-full text-center py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                    Acceder a Registro
                  </button>
                  <ul className="space-y-4 mt-auto">
                    {[
                      "Generación de Códigos QR",
                      "Estadísticas en tiempo real",
                      "Gestión de asistentes",
                    ].map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                      >
                        <svg
                          className="w-5 h-5 text-teal-500 shrink-0"
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

              {/* Card -> Gestión de Vehículos (Blue/Azul) */}
              <div
                id="card-vehiculos"
                className="bg-card rounded-3xl border border-blue-500/30 dark:border-blue-500/20 shadow-xl p-0 flex flex-col justify-between relative overflow-hidden ring-1 ring-blue-500/20 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 md:col-span-2 xl:col-span-1"
                onClick={() => router.push("/siget/gestion-territorial/gestion-vehiculos/flota")}
              >
                <div className="bg-blue-600 text-white text-center py-2 text-[10px] font-black tracking-widest uppercase">
                  Gestión de Flota
                </div>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-start gap-5 mb-8">
                    <div className="flex shrink-0 items-center justify-center w-20 h-20 dark:rounded-2xl dark:bg-white group-hover:scale-110 transition-transform">
                      <AnimatedIcon
                        iconKey="cdxxgczv"
                        target="#card-vehiculos"
                        size={48}
                      />
                    </div>
                    <div className="flex flex-col pt-1">
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                        Gestión de Vehículos
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">
                        Control y asignación de la flota vehicular de la institución.
                      </p>
                    </div>
                  </div>
                  <button className="w-full text-center py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors mb-8 cursor-pointer pointer-events-none">
                    Acceder a Flota
                  </button>
                  <ul className="space-y-4 mt-auto">
                    {[
                      "Control de asignaciones",
                      "Registro de mantenimientos",
                      "Reporte de recorridos",
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
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
