import { formatFechaHora24Gt } from "@/lib/fechas-gt";
import { modalAccentClass } from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { etiquetaActividad } from "./lib/helpers";
import type { ActividadEvento } from "./lib/zod";

export function LineaTiempoActividad({
  eventos,
  className,
}: {
  eventos: ActividadEvento[];
  className?: string;
}) {
  if (eventos.length === 0) return null;
  let ultimaModificacion = -1;
  eventos.forEach((evento, index) => {
    if (evento.accion === "modificacion") ultimaModificacion = index;
  });

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
    >
      <p className={`text-sm ${modalAccentClass}`}>Historial</p>
      <ol className="mt-4">
        {eventos.map((evento, index) => (
          <li key={`${evento.at}-${index}`} className="relative pb-5 pl-5 last:pb-0">
            {index < eventos.length - 1 ? (
              <span className="absolute bottom-0 left-[5px] top-3 w-px bg-zinc-300 dark:bg-zinc-600" />
            ) : null}
            <span className="absolute left-0 top-1 size-3 rounded-full border-2 border-[#2c5f9b] bg-white dark:border-[#6f9fd4] dark:bg-zinc-900" />
            <p className="text-xs font-bold text-[#2c5f9b] dark:text-[#6f9fd4]">
              {etiquetaActividad(evento.accion, index === ultimaModificacion)}
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
              {evento.nombre.trim() || "Usuario"}
            </p>
            <p className="text-xs text-muted-foreground">{formatFechaHora24Gt(evento.at)}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
