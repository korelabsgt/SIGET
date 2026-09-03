"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArrowLeft, ChevronLeft } from "lucide";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";

import { cn } from "@/lib/utils";

const crumbIconLink =
  "group flex items-center justify-center text-foreground hover:text-celeste-trifinio dark:text-white dark:hover:text-celeste-trifinio transition-colors duration-300 cursor-pointer active:scale-95";

const crumbTextLink =
  "capitalize whitespace-nowrap text-foreground hover:text-celeste-trifinio dark:text-white dark:hover:text-celeste-trifinio transition-all duration-300 group/link hover:underline underline-offset-4";

const crumbActive =
  "text-celeste-trifinio";

const sigetCrumbLink =
  "group shrink-0 normal-case text-azul-trifinio hover:text-celeste-trifinio dark:text-azul-trifinio dark:hover:text-celeste-trifinio transition-all duration-300";

const sigetCrumbText =
  "whitespace-nowrap group-hover:underline underline-offset-4";

const sigetCrumbActive =
  "shrink-0 normal-case text-azul-trifinio underline underline-offset-4 pointer-events-none text-[10px] md:text-xs";

const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatBreadcrumbLabel(segment: string): string {
  if (UUID_SEGMENT.test(segment)) return "detalles";
  return segment.replace(/-/g, " ");
}

const crumbRow =
  "flex min-w-0 w-full items-center gap-1 overflow-x-auto text-[9px] font-medium text-muted-foreground sm:text-[10px] md:pt-0.5 md:text-xs";

function SigetCrumb({ active = false }: { active?: boolean }) {
  if (active) {
    return (
      <span className={sigetCrumbActive} title="Panel">
        SIGET
      </span>
    );
  }

  return (
    <Link href="/siget" className={sigetCrumbLink} title="Ir al panel">
      <span className={sigetCrumbText}>SIGET</span>
    </Link>
  );
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const user = useUser();

  if (pathname === "/") {
    if (!user) return null; // invitado: sin breadcrumb (Iniciar Sesión en header)

    return (
      <LayoutGroup id="breadcrumb">
        <motion.div layout className={crumbRow}>
          <motion.div layout="position" className="shrink-0">
            <SigetCrumb />
          </motion.div>
        </motion.div>
      </LayoutGroup>
    );
  }

  if (pathname === "/siget") {
    return (
      <LayoutGroup id="breadcrumb">
        <motion.div layout className={crumbRow}>
          <motion.div layout="position" className="flex shrink-0 items-center">
            <SigetCrumb active />
          </motion.div>
        </motion.div>
      </LayoutGroup>
    );
  }

  const segments = pathname.split("/").filter((item) => item !== "");

  const parentPath = (() => {
    if (segments.length <= 1) return "/siget";
    const parent = `/${segments.slice(0, -1).join("/")}`;
    if (parent === "/" || parent === "") return "/siget";
    return parent;
  })();

  return (
    <LayoutGroup id="breadcrumb">
      <motion.div layout className={crumbRow}>
        <motion.div layout="position" className="shrink-0">
          <Link
            href={parentPath}
            className={cn(crumbIconLink, "mr-0.5")}
            title="Atrás"
          >
            <span className="inline-flex size-3.5 items-center justify-center md:size-4 [&_svg]:block">
              <MorphHoverIcon
                from={ArrowLeft}
                to={ChevronLeft}
                size={14}
                color="currentColor"
                strokeWidth={2}
                spring="snappy"
              />
            </span>
          </Link>
        </motion.div>

        <motion.div layout="position" className="flex shrink-0 items-center">
          <SigetCrumb />
        </motion.div>

        <div className="flex shrink-0 items-center gap-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {segments.map((segment, index) => {
              if (segment === "siget") return null;

              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const isLast = index === segments.length - 1;

              return (
                <motion.div
                  layout="position"
                  key={href}
                  initial={{ opacity: 0, x: 10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    transition: { duration: 0.15 },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                    mass: 1,
                  }}
                  className="flex items-center gap-1 shrink-0 whitespace-nowrap group/segment"
                >
                  <ChevronRight className="size-3 md:size-3.5 text-muted-foreground/40 shrink-0 transition-all duration-300 group-hover/segment:text-celeste-trifinio group-hover/segment:translate-x-0.5" />
                  <Link
                    href={href}
                    className={cn(
                      isLast
                        ? cn(
                            crumbActive,
                            "pointer-events-none whitespace-nowrap text-[10px] font-bold capitalize underline underline-offset-4 md:text-xs",
                          )
                        : crumbTextLink,
                    )}
                  >
                    {formatBreadcrumbLabel(segment)}
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}
