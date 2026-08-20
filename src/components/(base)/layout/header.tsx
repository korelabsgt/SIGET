"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Menu as MenuIcon, X, RefreshCw } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Menu from "./Menu";
import { getPendingDevicesCount } from "@/components/(base)/admin/lib/actions";
import { createPortal } from "react-dom";
import AnimacionLogoTrifinio from "@/components/(SIGET)/logo/AnimacionLogoTrifinio";

export default function Header() {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDevices, setPendingDevices] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const showBreadcrumb = Boolean(user) && !isLoginPage;
  const showHamburger = Boolean(user);

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

  const handleLogoClick = (e: React.MouseEvent) => {
    // Prevent default navigation to show the animation instead
    e.preventDefault();
    setIsFullScreen(true);
  };

  return (
    <>
      <div
        aria-hidden
        className={`shrink-0 pointer-events-none transition-[height] duration-200 md:h-16 ${
          showBreadcrumb ? "h-28" : "h-14"
        }`}
      />
      <header className="w-full fixed left-0 transition-all bg-zinc-100 dark:bg-zinc-800 border-b border-border/40 z-[100] shadow-sm">
        <div className="mx-auto flex h-14 md:h-16 items-center justify-between px-3 md:px-8 gap-2 md:gap-4">
          <div className="flex min-w-0 flex-1 items-center h-full overflow-hidden pr-1">
            <div className="flex min-w-0 items-center shrink">
              <Link
                href={user ? "/siget" : "/"}
                onClick={handleLogoClick}
                id="observatorio-header-brand"
                className="flex min-w-0 max-w-full flex-row items-center gap-1.5 md:gap-3 cursor-pointer group overflow-hidden"
              >
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="shrink-0 text-lg sm:text-xl md:text-4xl font-extrabold tracking-tighter leading-none text-azul-trifinio dark:text-white transition-transform duration-300 group-hover:scale-105 origin-left"
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
                  className="min-w-0 text-[7px] sm:text-[10px] md:text-sm font-black uppercase tracking-[0.08em] sm:tracking-[0.12em] md:tracking-widest leading-[1.05] md:leading-[1.15] text-celeste-trifinio border-l border-border/60 pl-1.5 md:pl-3 transition-transform duration-300 group-hover:scale-[1.02] origin-left group-hover:text-azul-trifinio dark:group-hover:text-[#FFFDD0]"
                >
                  SISTEMA INTEGRAL DE
                  <br />
                  GESTIÓN ESTRATÉGICA TRIFINIO
                </motion.div>
              </Link>
            </div>
            {showBreadcrumb && (
              <div className="hidden md:flex ml-4 md:ml-6 border-l border-border/30 h-10 items-center pl-4 md:pl-6">
                <BreadcrumbNav />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2.5 md:gap-4">
            <AnimatedThemeToggler />
            <button
              id="refresh-btn"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center text-azul-trifinio hover:text-celeste-trifinio dark:text-white dark:hover:text-white/80 cursor-pointer transition-all hover:rotate-180 duration-500 active:scale-95"
            >
              <RefreshCw className="size-6 md:size-6" />
            </button>
            {showHamburger && (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center justify-center text-foreground hover:text-foreground/80 cursor-pointer transition-all active:scale-95"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="size-6 md:size-8" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MenuIcon className="size-6 md:size-8" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                {!isOpen && canManage && pendingDevices > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse pointer-events-none">
                    {pendingDevices}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showBreadcrumb && (
        <div
          style={{ top: "calc(var(--banner-height, 0px) + 56px)" }}
          className="fixed left-0 md:hidden w-full px-6 h-[var(--mobile-breadcrumb-height)] flex items-center bg-zinc-100 dark:bg-zinc-800 z-[105]"
        >
          <BreadcrumbNav />
        </div>
      )}

      {showHamburger && (
        <Menu isOpen={isOpen} setIsOpen={setIsOpen} user={user} />
      )}

      {mounted &&
        createPortal(
          <AnimacionLogoTrifinio
            isOpen={isFullScreen}
            onClose={() => setIsFullScreen(false)}
          />,
          document.body,
        )}
    </>
  );
}
