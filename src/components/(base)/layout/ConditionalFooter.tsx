"use client";

import { usePathname } from "next/navigation";
import * as motion from "framer-motion/client";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const isDashboard = pathname === "/siget";

  return (
    <footer
      className={cn(
        "w-full relative z-10",
        isDashboard
          ? "mt-auto shrink-0 bg-muted dark:bg-zinc-950 border-t-0"
          : "mt-auto shrink-0 bg-zinc-100 dark:bg-zinc-950 border-t border-border/40",
      )}
    >
      <div className="mx-auto flex h-14 md:h-16 items-center justify-center px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-4"
        >
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
            © 2026 SIGET
          </p>
          <div className="hidden md:block w-px h-3 bg-border" />
          <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            Powered by{" "}
            <a
              href="https://www.oscar27jimenez.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline cursor-pointer transition-all inline-flex items-center text-foreground"
            >
              <AuroraText className="text-[10px] md:text-sm whitespace-nowrap">
                Kore | Ing. de Software
              </AuroraText>
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
