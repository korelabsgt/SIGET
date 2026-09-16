"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Phone } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { MUNICIPIOS, type Municipio } from "../lib/catalogos";
import { DIRECTORIO_PUBLICO, enlaceWhatsApp } from "../lib/publico-mock";
import { JaSelect } from "../lib/ui";
import { PubMarco } from "./ui";

function formatoTel(telefono: string) {
  const d = telefono.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("502")) {
    return `+502 ${d.slice(3, 7)} ${d.slice(7)}`;
  }
  return telefono;
}

export function DirectorioPublico() {
  const [muni, setMuni] = useState<Municipio | "todos">("todos");

  const contactos = useMemo(() => {
    if (muni === "todos") return DIRECTORIO_PUBLICO;
    return DIRECTORIO_PUBLICO.filter((row) => row.municipio === muni);
  }, [muni]);

  return (
    <div className="space-y-4">
      <PubMarco>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
              Directorio
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              OMAS, UGAM y comités de agua. Un toque abre WhatsApp.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
              Municipio
            </p>
            <JaSelect
              value={muni}
              onChange={(e) => setMuni(e.target.value as Municipio | "todos")}
              aria-label="Filtrar directorio por municipio"
            >
              <option value="todos">Todos</option>
              {MUNICIPIOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </JaSelect>
          </div>
        </div>
      </PubMarco>

      <div className="grid gap-3 md:grid-cols-2">
        {contactos.map((row) => (
          <article
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-[28px] bg-white px-5 py-4 dark:bg-zinc-900"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#C59B27]">
                {row.actor}
              </p>
              <h3 className="mt-1 truncate text-sm font-black text-[#003882] dark:text-[#6f9fd4]">
                {row.nombre}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">
                {row.municipio} · {formatoTel(row.telefono)}
              </p>
            </div>
            <SigetActionButton
              label="WhatsApp"
              accentColor={sigetAccent.abrir}
              morphFrom={Phone}
              morphTo={MessageCircle}
              onClick={() =>
                window.open(enlaceWhatsApp(row.telefono), "_blank", "noopener,noreferrer")
              }
              ariaLabel={`Abrir WhatsApp con ${row.nombre}`}
              className="w-auto shrink-0"
            />
          </article>
        ))}
      </div>
    </div>
  );
}
