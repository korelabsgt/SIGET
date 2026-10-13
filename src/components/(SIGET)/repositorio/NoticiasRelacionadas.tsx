"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { modalAccentClass } from "@/components/ui/general-modal";
import { ConocimientoCatalogoCard } from "./ConocimientoCatalogoCard";
import { rutaDetalleDocumento } from "./lib/helpers";
import type { DocumentListItem, DocumentRecord } from "./lib/zod";

const SIMULADO_ID_LEGACY = "noticia-simulada-super";
const SIMULADO_KEY_PREFIX = "simulado-preview-";

function articuloComoListItem(doc: DocumentRecord): DocumentListItem {
  const cover_slug =
    doc.files.find((file) => file.kind === "imagen")?.slug ?? null;
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    channel: doc.channel,
    document_type: doc.document_type,
    country_scope: doc.country_scope,
    program: doc.program,
    author: doc.author,
    cooperante: doc.cooperante,
    publication_date: doc.publication_date,
    download_count: doc.download_count,
    view_count: doc.view_count,
    created_at: doc.created_at,
    tags: doc.tags,
    cover_slug,
  };
}

function tresSimuladosDesdeArticulo(base: DocumentListItem): DocumentListItem[] {
  return [0, 1, 2].map((index) => ({
    ...base,
    id: `${SIMULADO_KEY_PREFIX}${base.id}-${index}`,
  }));
}

function esTarjetaSimulada(item: DocumentListItem): boolean {
  return (
    item.id === SIMULADO_ID_LEGACY || item.id.startsWith(SIMULADO_KEY_PREFIX)
  );
}

export function NoticiasRelacionadas({
  items,
  articuloActual,
}: {
  items: DocumentListItem[];
  articuloActual?: DocumentRecord;
}) {
  const router = useRouter();
  const { realRole } = useUserContext();
  const esSuper = realRole.toLowerCase().trim() === "super";

  const visibles = useMemo(() => {
    if (items.length > 0) return items.slice(0, 3);
    if (!esSuper || !articuloActual) return [];
    return tresSimuladosDesdeArticulo(articuloComoListItem(articuloActual));
  }, [items, esSuper, articuloActual]);

  if (visibles.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-8 dark:border-zinc-700">
      <h2 className={`text-2xl ${modalAccentClass}`}>Podría interesarte</h2>
      <ul
        className="mt-6 grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-3 sm:justify-items-stretch sm:gap-5 [&>li]:w-full [&>li]:max-w-[17.5rem] sm:[&>li]:max-w-none"
      >
        {visibles.map((item) => {
          const simulada = esTarjetaSimulada(item);
          return (
            <ConocimientoCatalogoCard
              key={item.id}
              item={item}
              href={simulada ? null : rutaDetalleDocumento(item.channel, item.slug)}
              simulado={simulada}
              layout="cuadrado"
              onAbrir={(target) => router.push(target)}
            />
          );
        })}
      </ul>
    </section>
  );
}
