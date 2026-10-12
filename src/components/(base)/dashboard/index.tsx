"use client";

import { useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import LogoTrifinio from "@/components/(SIGET)/logo/LogoTrifinio";
import LogoTrifinioMobile from "@/components/(SIGET)/logo/LogoTrifinio-mobile";
import { getVisibleDashboardModules } from "@/components/(base)/dashboard/modules";
import { DashboardModulos } from "@/components/(base)/dashboard/DashboardModulos";
import { cn } from "@/lib/utils";

const DASHBOARD_DOTTED_BG_CLASS =
  "pointer-events-none [background-size:12px_12px] bg-[radial-gradient(#71717a_1px,transparent_1px)] opacity-50 dark:bg-[radial-gradient(oklch(72%_0_0)_1px,transparent_1px)] dark:opacity-40 [mask-image:radial-gradient(ellipse_55%_70%_at_50%_50%,white,transparent)] [-webkit-mask-image:radial-gradient(ellipse_55%_70%_at_50%_50%,white,transparent)]";

export function Dashboard() {
  const { effectiveRole } = useUserContext();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const router = useRouter();

  const { scrollY } = useScroll();
  const logoY = useTransform(scrollY, [0, 600], [24, -276]);
  const logoOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const bgScaleRaw = useTransform(scrollY, [0, 800], [1, 1.05]);
  const bgScale = useSpring(bgScaleRaw, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const mobileParallaxY = useTransform(scrollY, [0, 800], [0, 150]);

  const visibleModules = getVisibleDashboardModules(effectiveRole).filter(
    (mod) => mod.id !== "admin" && mod.id !== "perfil",
  );

  const handleOpen = (id: string, href: string) => {
    if (navigatingId) return;
    setNavigatingId(id);
    router.push(href);
  };

  return (
    <div className="relative flex w-full flex-1 flex-col min-h-0">
      <div className="flex flex-col md:hidden w-full bg-muted dark:bg-muted">
        <div className="w-full pt-2 pb-0 -mb-[6%] relative z-[2] mt-4">
          <LogoTrifinioMobile backgroundEffect="blur" />
        </div>

        <div className="w-full overflow-hidden">
          <motion.img
            src="/trifinio/hero-background2.jpg"
            alt="Plan Trifinio"
            style={{
              y: mobileParallaxY,
              scale: bgScale,
            }}
            className="w-full h-auto object-contain block origin-center"
          />
        </div>

        <div className="relative w-full px-4 pt-8 pb-20">
          <div className={cn("absolute inset-0", DASHBOARD_DOTTED_BG_CLASS)} />
          <div className="relative z-10">
            <DashboardModulos
              modules={visibleModules}
              onOpen={handleOpen}
              navigatingId={navigatingId}
            />
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
            <div className="w-full max-w-[min(100%,1600px)] mx-auto -mt-[80px]">
              <DashboardModulos
                modules={visibleModules}
                onOpen={handleOpen}
                navigatingId={navigatingId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
