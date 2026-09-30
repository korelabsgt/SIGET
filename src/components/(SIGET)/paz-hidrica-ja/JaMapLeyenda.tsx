"use client";

const COLOR_PILOTO = "#C59B27";
const COLOR_DIALOGO = "#003882";
const COLOR_NACIMIENTO = "#15803D";
const COLOR_INCIDENTE = "#FF6B6B";
const TRAZO = "#0a1628";

function FormaRombo({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <polygon
        points="11,1.8 20.2,11 11,20.2 1.8,11"
        fill={color}
        stroke={TRAZO}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FormaCirculo({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <circle cx="11" cy="11" r="8" fill={color} stroke={TRAZO} strokeWidth="2.4" />
    </svg>
  );
}

function FormaCuadro({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" fill={color} stroke={TRAZO} strokeWidth="2.4" />
    </svg>
  );
}

function FormaTriangulo({ color }: { color: string }) {
  return (
    <svg width="16" height="15" viewBox="0 0 26 24" aria-hidden="true" className="shrink-0">
      <polygon
        points="13,2.5 24.5,21.5 1.5,21.5"
        fill={color}
        stroke={TRAZO}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Fila({
  forma,
  color,
  label,
  detalle,
}: {
  forma: "circulo" | "cuadro" | "triangulo" | "rombo";
  color: string;
  label: string;
  detalle?: string;
}) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex shrink-0">
        {forma === "circulo" ? <FormaCirculo color={color} /> : null}
        {forma === "cuadro" ? <FormaCuadro color={color} /> : null}
        {forma === "triangulo" ? <FormaTriangulo color={color} /> : null}
        {forma === "rombo" ? <FormaRombo color={color} /> : null}
      </span>
      <span>
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">{label}</span>
        {detalle ? (
          <span className="block text-[10px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
            {detalle}
          </span>
        ) : null}
      </span>
    </p>
  );
}

export function JaMapLeyenda({
  variante,
}: {
  variante: "interno" | "publico";
}) {
  return (
    <div className="pointer-events-none absolute bottom-7 left-7 z-1 max-w-[min(calc(100%-1.5rem),18rem)] rounded-2xl border border-zinc-200/80 bg-white px-3 py-2.5 text-[11px] font-medium text-zinc-600 opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      <p className="mb-1.5 font-semibold text-zinc-900 dark:text-white">Leyenda</p>
      {variante === "interno" ? (
        <>
          <Fila
            forma="rombo"
            color={COLOR_INCIDENTE}
            label="Incidente"
            detalle="Conflicto o alerta. El color indica criticidad."
          />
          <Fila forma="cuadro" color={COLOR_PILOTO} label="Piloto" detalle="Proyecto en la microcuenca." />
          <Fila forma="triangulo" color={COLOR_DIALOGO} label="Diálogo" detalle="Mesa o sesión comunitaria." />
        </>
      ) : (
        <>
          <Fila
            forma="rombo"
            color={COLOR_INCIDENTE}
            label="Incidente"
            detalle="Alerta hídrica. Sin nombres ni denuncias."
          />
          <Fila
            forma="circulo"
            color={COLOR_NACIMIENTO}
            label="Manantial"
            detalle="Fuente donde nace el agua."
          />
          <Fila forma="cuadro" color={COLOR_PILOTO} label="Piloto" detalle="Proyecto en la microcuenca." />
          <Fila forma="triangulo" color={COLOR_DIALOGO} label="Diálogo" detalle="Mesa o sesión comunitaria." />
        </>
      )}
      <p className="mt-2 text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
        Anillo verde: microcuenca. Clic para ver detalle.
      </p>
    </div>
  );
}
