"use client";

import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { MorphCycleIcon } from "@/components/ui/morph-cycle-icon";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import LogoTrifinio from "@/components/(SIGET)/logo/LogoTrifinio";
import LogoTrifinioMobile from "@/components/(SIGET)/logo/LogoTrifinio-mobile";
import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";
import PassKeysModal from "@/components/(base)/layout/modals/PassKeysModal";
import { useAppSettings } from "@/components/(base)/(settings)/hooks";
import {
  User as UserIcon,
  KeyRound,
} from "lucide-react";
import {
  DASHBOARD_MODULES,
  getVisibleDashboardModules,
} from "@/components/(base)/dashboard/modules";
import { cn } from "@/lib/utils";

const MODULES = DASHBOARD_MODULES;

const DASHBOARD_ICON_PLATE_CLASS =
  "flex items-center justify-center dark:rounded-2xl dark:bg-white";

const DASHBOARD_DOTTED_BG_CLASS =
  "pointer-events-none [background-size:12px_12px] bg-[radial-gradient(#71717a_1px,transparent_1px)] opacity-50 dark:bg-[radial-gradient(oklch(72%_0_0)_1px,transparent_1px)] dark:opacity-40 [mask-image:radial-gradient(ellipse_55%_70%_at_50%_50%,white,transparent)] [-webkit-mask-image:radial-gradient(ellipse_55%_70%_at_50%_50%,white,transparent)]";

export function Dashboard() {
  const { user, effectiveRole } = useUserContext();
  const { data: appSettings } = useAppSettings();
  const passkeysEnabled = appSettings?.enable_passkeys ?? false;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedPerfil, setExpandedPerfil] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasskeysOpen, setIsPasskeysOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 600], [0, -300]);
  const logoOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const bgScaleRaw = useTransform(scrollY, [0, 800], [1, 1.05]);
  const bgScale = useSpring(bgScaleRaw, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const visibleModules = getVisibleDashboardModules(effectiveRole).filter(
    (mod) => mod.id !== "admin" && mod.id !== "perfil"
  );

  const handleCardClick = (id: string, href: string) => {
    if (isMobile) {
      if (activeId === id) {
        router.push(href);
      } else {
        setActiveId(id);
      }
    } else {
      router.push(href);
    }
  };

  const CardsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full lg:flex lg:flex-nowrap lg:justify-center lg:items-stretch">
      {visibleModules.map((mod, index) => {
        const isActive = isMobile && activeId === mod.id;
        const isFirstMobile = isMobile && index === 0;

        return (
          <motion.div
            key={mod.id}
            className={[
              "cursor-pointer w-full h-auto min-h-[400px] lg:h-[380px] lg:w-[280px] xl:w-[300px] lg:flex-none relative",
              isFirstMobile ? "-mt-[20%]" : "",
            ]
              .join(" ")
              .trim()}
            id={`${mod.id}-card`}
            initial="idle"
            whileHover="hover"
            animate={isActive ? "active" : "idle"}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {mod.id === "perfil" ? (
              <div className="group flex flex-col border border-border dark:border-white/10 overflow-hidden h-full w-full rounded-2xl bg-card transition-all duration-500 hover:border-azul-trifinio hover:-translate-y-2">
                <AnimatePresence mode="wait">
                  {expandedPerfil ? (
                    <motion.div
                      key="perfil-expanded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full h-full min-h-[300px] flex flex-col justify-center items-center p-6 relative z-10 bg-transparent rounded-[inherit] overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-[calc(100%-70px)] bg-gradient-to-t from-azul-trifinio to-celeste-trifinio pointer-events-none z-0 rounded-t-[inherit]" />
                      <button
                        onClick={() => setExpandedPerfil(false)}
                        className="absolute bottom-0 left-0 w-full h-[70px] flex justify-center items-center z-10 cursor-pointer hover:bg-accent/60 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-azul-trifinio font-black uppercase text-xs tracking-[0.25em]">
                          ← Volver
                        </span>
                      </button>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.15,
                          ease: "easeOut",
                        }}
                        className="relative z-10 w-full flex flex-col gap-3 pb-[40px]"
                      >
                        <button
                          onClick={() => setIsProfileOpen(true)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-left"
                        >
                          <UserIcon className="size-5 shrink-0 text-white" />
                          <div>
                            <p className="text-sm font-bold text-white">
                              Mi Perfil
                            </p>
                            <p className="text-[10px] text-white/70">
                              Ver y editar perfil
                            </p>
                          </div>
                        </button>
                        {passkeysEnabled && (
                          <button
                            onClick={() => setIsPasskeysOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/30 bg-white/15 hover:bg-white/25 transition-all cursor-pointer text-left"
                          >
                            <KeyRound className="size-5 shrink-0 text-white/80" />
                            <div>
                              <p className="text-sm font-bold text-white">
                                Ingreso Seguro
                              </p>
                              <p className="text-[10px] text-white/70">
                                Administrar dispositivos
                              </p>
                            </div>
                          </button>
                        )}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="perfil-normal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      onClick={() => setExpandedPerfil(true)}
                      className="w-full h-full min-h-[300px] flex flex-col justify-center items-center p-6 relative z-10 bg-transparent rounded-[inherit] overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-full h-[calc(100%-70px)] origin-bottom scale-y-0 bg-gradient-to-t from-azul-trifinio to-celeste-trifinio transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-y-100 pointer-events-none z-0 rounded-t-[inherit]" />
                      <div className="absolute bottom-0 left-0 w-full h-[70px] flex justify-center items-center z-10 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                        <span className="flex items-center gap-2 text-celeste-trifinio dark:text-foreground font-black uppercase text-xs tracking-[0.25em]">
                          Ver opciones
                        </span>
                      </div>
                      <div className="w-full h-full flex flex-col justify-center items-center relative z-10 pb-[40px]">
                        <div className="relative z-10 w-full flex justify-center mb-4">
                          <div
                            className={cn(
                              "size-[90px] flex items-center justify-center transition-transform duration-700 ease-out group-hover:-translate-y-4",
                              DASHBOARD_ICON_PLATE_CLASS,
                            )}
                          >
                            <AnimatedIcon
                              iconKey={mod.animatedIcon}
                              target={`#${mod.id}-card`}
                              size={90}
                              speed={1.5}
                            />
                          </div>
                        </div>
                        <div className="relative z-10 w-full flex flex-col items-start text-left space-y-4 transition-transform duration-700 group-hover:-translate-y-2">
                          <h3 className="text-[1.6rem] lg:text-[1.85rem] font-black tracking-tighter text-foreground group-hover:text-white uppercase leading-none w-full break-words transition-colors duration-500">
                            {mod.title}
                            <br />
                            <span className="text-celeste-trifinio group-hover:text-white/90 transition-colors duration-500">
                              {mod.subtitle}
                            </span>
                          </h3>
                          <p className="text-[14px] lg:text-[15px] text-muted-foreground group-hover:text-white/80 font-bold italic leading-tight pr-2 transition-colors duration-500">
                            {mod.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div
                onClick={() => handleCardClick(mod.id, mod.href)}
                onMouseEnter={() => setHoveredCard(mod.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={cn(
                  "group flex flex-col border border-border dark:border-white/10 overflow-hidden h-full w-full rounded-2xl transition-[border-color] duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] cursor-pointer bg-card group-hover:border-[var(--card-hover-border)]",
                  isActive && "border-[var(--card-hover-border)]",
                )}
                style={
                  {
                    "--card-accent": mod.accentColor ?? "#1a95d3",
                    "--card-hover-border": mod.hoverBorderColor ?? "#2c5f9b",
                  } as React.CSSProperties
                }
              >
                <div className="w-full h-full min-h-[300px] flex flex-col justify-center items-center p-6 outline-none relative z-10 rounded-[inherit] overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 left-0 w-full h-[calc(100%-70px)] origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-y-100 pointer-events-none z-0 rounded-t-[inherit]",
                      isActive && "scale-y-100",
                    )}
                    style={{
                      backgroundImage: `linear-gradient(to top, ${mod.hoverGradientFrom ?? "#2c5f9b"}, ${mod.hoverGradientTo ?? "#1a95d3"})`,
                    }}
                  />
                  <div className="absolute inset-0 rounded-[inherit] border border-border dark:border-white/10 pointer-events-none z-20" />
                  <div className="absolute bottom-0 left-0 w-full h-[70px] flex justify-center items-center z-10 pointer-events-none">
                    <span className="flex items-center gap-2 font-black uppercase text-xs tracking-[0.25em] text-[var(--card-accent)]">
                      {isActive
                        ? "Toca de nuevo para entrar"
                        : "Haz click para entrar"}
                    </span>
                  </div>
                  <motion.div
                    className="w-full h-full flex flex-col justify-center items-center relative z-10 pb-[40px]"
                    variants={{
                      idle: { opacity: 1 },
                      hover: { opacity: 1 },
                      active: { opacity: [1, 0.4, 1] },
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="relative z-10 w-full flex justify-center mb-4 -translate-y-3">
                      {mod.morphIconCycle ? (
                        <div
                          className={cn(
                            "flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:-translate-y-4",
                            isActive && "-translate-y-4",
                            mod.morphIconBg,
                          )}
                        >
                          <MorphCycleIcon
                            icons={mod.morphIconCycle}
                            hovered={hoveredCard === mod.id || isActive}
                            size={48}
                            color={mod.morphIconColor ?? "#1a95d3"}
                            spring="snappy"
                          />
                        </div>
                      ) : mod.morphIconFrom && mod.morphIconTo ? (
                        <div
                          className={cn(
                            "flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:-translate-y-4",
                            isActive && "-translate-y-4",
                            mod.morphIconBg,
                          )}
                        >
                          <MorphHoverIcon
                            from={mod.morphIconFrom}
                            to={mod.morphIconTo}
                            hovered={hoveredCard === mod.id || isActive}
                            size={48}
                            color={mod.morphIconColor ?? "#1a95d3"}
                            spring="snappy"
                          />
                        </div>
                      ) : (
                        <motion.div
                          variants={{
                            idle: { y: 0 },
                            hover: { y: -16 },
                            active: { y: -16 },
                          }}
                          className={cn(
                            "size-[90px] flex items-center justify-center transition-transform duration-700",
                            DASHBOARD_ICON_PLATE_CLASS,
                          )}
                        >
                          <AnimatedIcon
                            iconKey={mod.animatedIcon}
                            target={`#${mod.id}-card`}
                            size={90}
                            speed={1.5}
                          />
                        </motion.div>
                      )}
                    </div>
                    <div className="relative z-10 w-full flex flex-col items-start text-left space-y-4 transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:-translate-y-2">
                      <h3
                        className="text-[1.25rem] lg:text-[1.4rem] font-black tracking-tight uppercase leading-[1.05] w-full break-words transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]"
                      >
                        <span
                          className="text-foreground transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-white"
                          style={{ color: isActive ? "#ffffff" : undefined }}
                        >
                          {mod.title}
                        </span>
                        <br />
                        <span
                          className={cn(
                            "text-[var(--card-accent)] transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-white/90",
                            isActive && "text-white/90",
                          )}
                        >
                          {mod.subtitle}
                        </span>
                      </h3>
                      <p
                        className="text-[12px] lg:text-[13px] text-muted-foreground font-bold italic leading-snug pr-2 transition-colors duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:text-white/80"
                        style={{
                          color: isActive ? "rgba(255,255,255,0.8)" : undefined,
                        }}
                      >
                        {mod.desc}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="relative flex w-full flex-1 flex-col min-h-0">
      <VerPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={null}
      />
      <PassKeysModal
        isOpen={isPasskeysOpen && passkeysEnabled}
        onClose={() => setIsPasskeysOpen(false)}
        user={user}
      />

      <div className="flex flex-col md:hidden w-full bg-muted dark:bg-muted">
        <div className="w-full pt-2 pb-0 -mb-[6%] relative z-[2] mt-4">
          <LogoTrifinioMobile backgroundEffect="blur" />
        </div>

        <div className="w-full overflow-hidden">
          <motion.img
            src="/trifinio/hero-background2.jpg"
            alt="Plan Trifinio"
            style={{
              y: useTransform(scrollY, [0, 800], [0, 150]),
              scale: bgScale,
            }}
            className="w-full h-auto object-contain block origin-center"
          />
        </div>

        <div className="relative w-full px-4 pt-8 pb-20">
          <div className={cn("absolute inset-0", DASHBOARD_DOTTED_BG_CLASS)} />
          <div className="relative z-10">
            <CardsGrid />
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col relative w-full min-h-0 bg-muted dark:bg-zinc-950">
        <div className="fixed top-0 left-0 w-full h-[62vh] z-0 bg-[#0a1628] overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-cover bg-center origin-center"
            style={{
              backgroundImage: "url('/trifinio/hero-background2.jpg')",
              scale: bgScale,
            }}
          />
        </div>

        <motion.div
          className="fixed top-0 left-0 w-full h-[52vh] flex justify-center items-center z-[5] pt-12 pb-24"
          style={{ y: logoY, opacity: logoOpacity }}
        >
          <div className="relative flex justify-center items-center px-8">
            <LogoTrifinio />
          </div>
        </motion.div>

        <div className="relative z-10 flex flex-1 flex-col w-full mt-[44vh] min-h-[calc(100dvh-4rem-4rem-44vh)] bg-muted dark:bg-zinc-950 rounded-t-[3rem]">
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-t-[3rem] overflow-hidden",
              DASHBOARD_DOTTED_BG_CLASS,
            )}
          />
          <div className="relative z-20 w-full px-8 lg:px-12 pt-10 pb-6">
            <div className="w-full max-w-[min(100%,1600px)] mx-auto -mt-[160px]">
              <CardsGrid />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
