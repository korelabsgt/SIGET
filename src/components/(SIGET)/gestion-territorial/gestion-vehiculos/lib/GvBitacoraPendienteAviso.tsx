import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function GvBitacoraPendienteAviso({
  mensaje,
  className,
}: {
  mensaje: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-snug text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
        className,
      )}
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{mensaje}</p>
    </div>
  );
}
