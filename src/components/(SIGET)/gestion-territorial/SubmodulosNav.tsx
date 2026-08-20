"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Car, CalendarRange, BookOpen, Wrench } from "lucide-react";
import { GESTION_VEHICULOS_MENU_OPTIONS } from "@/components/(base)/dashboard/modules";

export function SubmodulosNav() {
  const pathname = usePathname();

  if (!pathname.includes("/gestion-vehiculos")) return null;

  const getIcon = (id: string) => {
    switch (id) {
      case "flota":
        return <Car className="size-4 shrink-0" />;
      case "solicitudes":
        return <CalendarRange className="size-4 shrink-0" />;
      case "bitacoras":
        return <BookOpen className="size-4 shrink-0" />;
      case "mantenimiento":
        return <Wrench className="size-4 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto px-3 pb-1 sm:px-0">
      {GESTION_VEHICULOS_MENU_OPTIONS.map((opt) => {
        const isActive = pathname.startsWith(opt.href);
        return (
          <Link
            key={opt.id}
            href={opt.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border-b-2 px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap",
              isActive
                ? "border-azul-trifinio bg-sky-50/90 text-azul-trifinio dark:border-celeste-trifinio dark:bg-sky-950/35 dark:text-celeste-trifinio"
                : "border-transparent text-muted-foreground hover:border-sky-200/80 hover:bg-sky-50/50 hover:text-azul-trifinio dark:hover:border-sky-900/60 dark:hover:bg-sky-950/20 dark:hover:text-celeste-trifinio",
            )}
          >
            {getIcon(opt.id)}
            {opt.title}
          </Link>
        );
      })}
    </div>
  );
}
