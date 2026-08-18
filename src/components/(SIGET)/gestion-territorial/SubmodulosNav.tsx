"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, QrCode, Car, CalendarRange, BookOpen } from "lucide-react";
import { GESTION_TERRITORIAL_MENU_OPTIONS } from "@/components/(base)/dashboard/modules";

export function SubmodulosNav() {
  const pathname = usePathname();

  const getIcon = (id: string) => {
    switch (id) {
      case "memoria-labores":
        return <FileText className="w-4 h-4" />;
      case "asistencia-actividades":
        return <QrCode className="w-4 h-4" />;
      case "flota":
        return <Car className="w-4 h-4" />;
      case "solicitudes":
        return <CalendarRange className="w-4 h-4" />;
      case "bitacoras":
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 px-3 sm:px-0 overflow-x-auto pb-2">
      {GESTION_TERRITORIAL_MENU_OPTIONS.filter(
        (opt) => opt.id === "flota" || opt.id === "solicitudes" || opt.id === "bitacoras"
      ).map((opt) => {
        const isActive = pathname.startsWith(opt.href);
        return (
          <Link
            key={opt.id}
            href={opt.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              isActive
                ? "bg-azul-trifinio/20 text-azul-trifinio border-b-2 border-azul-trifinio"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
