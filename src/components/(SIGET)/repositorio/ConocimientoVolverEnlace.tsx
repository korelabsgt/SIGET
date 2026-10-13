import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConocimientoVolverEnlace({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-ml-0.5 mb-2 inline-flex items-center gap-0.5 py-2.5 text-sm font-bold text-azul-trifinio underline underline-offset-2 transition-colors hover:text-celeste-trifinio dark:text-celeste-trifinio dark:hover:text-white",
        className,
      )}
    >
      <ChevronLeft className="size-5 shrink-0" strokeWidth={2.25} aria-hidden />
      {label}
    </Link>
  );
}
