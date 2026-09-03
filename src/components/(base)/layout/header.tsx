"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { EllipsisVertical, X } from "lucide";
import { RefreshCw } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import Menu from "./Menu";
import { getPendingDevicesCount } from "@/components/(base)/admin/lib/actions";
import { createPortal } from "react-dom";
import AnimacionLogoSiget from "@/components/(SIGET)/logo/AnimacionLogoSiget";

export default function Header() {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDevices, setPendingDevices] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [refreshRotation, setRefreshRotation] = useState(0);
  const [breadcrumbInline, setBreadcrumbInline] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const showBreadcrumb = Boolean(user) && !isLoginPage;
  const showHamburger = Boolean(user);

  const inlineSlotRef = useRef<HTMLDivElement | null>(null);
  const breadcrumbMeasureRef = useRef<HTMLDivElement | null>(null);

  const metadata = user?.user_metadata || {};
  const role = metadata.rol || user?.role || "user";
  const canManage = ["super", "admin"].includes(role);

  useEffect(() => {
    setMounted(true);
    if (!canManage) return;
    getPendingDevicesCount()
      .then((c) => setPendingDevices(c ?? 0))
      .catch(() => setPendingDevices(0));
  }, [canManage]);

  const measureBreadcrumbFit = useCallback(() => {
    const slot = inlineSlotRef.current;
    const measure = breadcrumbMeasureRef.current;
    if (!slot || !measure) return;
    const available = slot.clientWidth;
    const needed = measure.scrollWidth;
    setBreadcrumbInline(needed <= available);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!showBreadcrumb) {
      delete root.dataset.breadcrumb;
      setBreadcrumbInline(false);
      return () => {
        delete root.dataset.breadcrumb;
      };
    }
    root.dataset.breadcrumb = breadcrumbInline ? "inline" : "on";
    return () => {
      delete root.dataset.breadcrumb;
    };
  }, [showBreadcrumb, breadcrumbInline]);

  useLayoutEffect(() => {
    if (!showBreadcrumb) return;
    measureBreadcrumbFit();
    const slot = inlineSlotRef.current;
    const measure = breadcrumbMeasureRef.current;
    if (!slot || !measure) return;
    const observer = new ResizeObserver(() => measureBreadcrumbFit());
    observer.observe(slot);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [showBreadcrumb, pathname, measureBreadcrumbFit]);

  const handleRefresh = () => {
    if (refreshSpinning) return;
    setRefreshSpinning(true);
    setRefreshRotation((rotation) => rotation + 360);
  };

  const handleRefreshHover = (hovered: boolean) => {
    if (refreshSpinning) return;
    setRefreshRotation(hovered ? 90 : 0);
  };

  return (
    <>
      <header className="relative z-[100] w-full shrink-0 border-b border-border/40 bg-zinc-100 shadow-sm transition-all dark:bg-zinc-800">
        <div className="mx-auto flex h-[var(--header-row-height)] items-center justify-between gap-2 px-1 md:gap-4 md:px-2.5">
          <button
            type="button"
            id="observatorio-header-brand"
            onClick={() => setIsFullScreen(true)}
            className="flex cursor-pointer items-center gap-1.5 md:gap-3"
          >
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="shrink-0 cursor-pointer text-3xl leading-none font-extrabold tracking-tighter text-azul-trifinio md:text-4xl dark:text-white"
            >
              SIGET
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="hidden cursor-pointer border-l border-border/60 pl-1 text-left text-[5px] leading-[1.35] font-black tracking-[0.06em] text-celeste-trifinio uppercase sm:text-[7px] sm:leading-[1.4] sm:tracking-[0.08em] md:block md:pl-1.5 md:text-[9px] md:leading-[1.45] md:tracking-[0.1em]"
            >
              SISTEMA INTEGRAL DE
              <br />
              GESTIÓN ESTRATÉGICA TRIFINIO
            </motion.div>
          </button>

          {showBreadcrumb && (
            <div
              ref={inlineSlotRef}
              className="flex min-w-0 flex-1 items-center overflow-hidden"
            >
              {breadcrumbInline && <BreadcrumbNav />}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2.5 md:gap-4">
            <AnimatedThemeToggler />
            <button
              id="refresh-btn"
              type="button"
              onClick={handleRefresh}
              onMouseEnter={() => handleRefreshHover(true)}
              onMouseLeave={() => handleRefreshHover(false)}
              className="flex cursor-pointer items-center justify-center text-azul-trifinio hover:text-celeste-trifinio dark:text-white dark:hover:text-white/80"
            >
              <motion.span
                animate={{ rotate: refreshRotation }}
                transition={{
                  duration: refreshSpinning ? 0.55 : 0.25,
                  ease: refreshSpinning ? "easeInOut" : "easeOut",
                }}
                onAnimationComplete={() => {
                  if (refreshSpinning) window.location.reload();
                }}
                className="inline-flex"
              >
                <RefreshCw size={24} strokeWidth={2.25} />
              </motion.span>
            </button>
            {showHamburger && (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex cursor-pointer items-center justify-center text-foreground transition-colors active:scale-95 hover:text-foreground/80"
                >
                  <MorphHoverIcon
                    from={EllipsisVertical}
                    to={X}
                    hovered={isOpen}
                    size={28}
                    color="currentColor"
                    spring="snappy"
                    className="md:scale-[1.14]"
                  />
                </button>
                {!isOpen && canManage && pendingDevices > 0 && (
                  <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] animate-pulse items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                    {pendingDevices}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showBreadcrumb && !breadcrumbInline && (
          <div className="flex min-w-0 w-full items-center pb-1.5 pl-2 pr-3 md:pl-4 md:pr-8">
            <BreadcrumbNav />
          </div>
        )}
      </header>

      {showBreadcrumb && (
        <div
          aria-hidden
          className="pointer-events-none fixed -top-[9999px] left-0 flex w-max items-center whitespace-nowrap"
        >
          <div ref={breadcrumbMeasureRef} className="flex w-max items-center">
            <BreadcrumbNav />
          </div>
        </div>
      )}

      {showHamburger && (
        <Menu isOpen={isOpen} setIsOpen={setIsOpen} user={user} />
      )}

      {mounted &&
        createPortal(
          <AnimacionLogoSiget
            isOpen={isFullScreen}
            onClose={() => setIsFullScreen(false)}
          />,
          document.body,
        )}
    </>
  );
}
