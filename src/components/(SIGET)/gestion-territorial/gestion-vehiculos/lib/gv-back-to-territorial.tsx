"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide";
import { ChevronLeft as ChevronLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { GvMorphIcon } from "./morph-icon";

const backClass =
  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center self-end rounded-xl border border-border bg-card transition-colors hover:bg-accent";

export function GvBackToTerritorial({
  className,
  morph = false,
}: {
  className?: string;
  morph?: boolean;
}) {
  return (
    <Link
      href="/siget/gestion-territorial"
      className={cn(backClass, className)}
      aria-label="Regresar a Gestión Territorial"
    >
      {morph ? (
        <GvMorphIcon icon={ChevronLeft} hoverIcon={ChevronRight} size={20} className="text-muted-foreground" />
      ) : (
        <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </Link>
  );
}
