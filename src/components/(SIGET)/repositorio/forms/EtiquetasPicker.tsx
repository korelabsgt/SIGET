"use client";

import { useMemo, useState } from "react";
import { CirclePlus, Plus } from "lucide";
import { Search } from "lucide-react";
import {
  ModalField,
  ModalForm,
  ModalFooter,
  ModalCancelButton,
  ModalInput,
  ModalLabel,
  ModalShell,
  ModalSubmit,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { cn } from "@/lib/utils";
import { isLibraryAdminRole } from "../lib/helpers";
import { useCrearTag } from "../lib/hooks";
import type { TagRecord } from "../lib/zod";

export function EtiquetasPicker({
  tags,
  value,
  onChange,
  disabled = false,
  inputId = "tag-search",
}: {
  tags: TagRecord[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  inputId?: string;
}) {
  const { effectiveRole } = useUserContext();
  const esAdmin = isLibraryAdminRole(effectiveRole);
  const crear = useCrearTag();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [locales, setLocales] = useState<TagRecord[]>([]);

  const catalogo = useMemo(() => {
    const byId = new Map<string, TagRecord>();
    for (const tag of tags) byId.set(tag.id, tag);
    for (const tag of locales) byId.set(tag.id, tag);
    return [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
  }, [tags, locales]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter(
      (tag) =>
        tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q),
    );
  }, [catalogo, query]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  const abrirCrear = () => {
    setNombre(query.trim());
    setModalOpen(true);
  };

  const cerrarCrear = () => {
    if (crear.isPending) return;
    setModalOpen(false);
  };

  const handleCrear = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const limpio = nombre.trim();
    if (limpio.length < 2) {
      toast.warn("Escribe un nombre de al menos 2 caracteres.");
      return;
    }
    const existente = catalogo.find(
      (tag) => tag.name.toLowerCase() === limpio.toLowerCase(),
    );
    if (existente) {
      onChange(value.includes(existente.id) ? value : [...value, existente.id]);
      setQuery("");
      setModalOpen(false);
      toast.success("Etiqueta seleccionada.");
      return;
    }
    const aplicarTag = (tag: TagRecord) => {
      setLocales((current) =>
        current.some((item) => item.id === tag.id) ? current : [...current, tag],
      );
      onChange(value.includes(tag.id) ? value : [...value, tag.id]);
      setQuery("");
      setModalOpen(false);
    };

    const res = await crear.mutateAsync(limpio);
    if (res.tag && (res.success || res.error === "DUPLICATE")) {
      aplicarTag(res.tag);
      if (res.success) toast.success("Etiqueta creada.");
      else toast.warn("Esa etiqueta ya existía; quedó seleccionada.");
      return;
    }
    toast.error(
      modalActionMessage(res.error ?? undefined, "No se pudo crear la etiqueta.", {
        DUPLICATE: "Ya existe una etiqueta con ese nombre.",
      }),
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-celeste-trifinio" />
          <ModalInput
            id={inputId}
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder="Buscar etiqueta"
            disabled={disabled}
          />
        </div>
        {esAdmin ? (
          <SigetActionButton
            label="Etiqueta"
            accentColor={sigetAccent.crear}
            morphFrom={Plus}
            morphTo={CirclePlus}
            onClick={abrirCrear}
            disabled={disabled}
            ariaLabel="Crear etiqueta"
            className="w-auto shrink-0"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {query.trim()
              ? "No hay coincidencias."
              : "Aún no hay etiquetas."}
          </p>
        ) : (
          filtered.map((tag) => {
            const selected = value.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(tag.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  selected
                    ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                    : "border-zinc-200 text-muted-foreground hover:border-celeste-trifinio/50 dark:border-zinc-700",
                )}
              >
                {tag.name}
              </button>
            );
          })
        )}
      </div>
      <ModalShell
        open={modalOpen}
        onClose={cerrarCrear}
        title="Nueva etiqueta"
        maxWidth="max-w-md"
      >
        {modalOpen ? (
          <ModalForm onSubmit={handleCrear}>
            <ModalField>
              <ModalLabel htmlFor="nueva-etiqueta-nombre">Nombre</ModalLabel>
              <ModalInput
                id="nueva-etiqueta-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
                maxLength={60}
              />
            </ModalField>
            <ModalFooter>
              <ModalCancelButton onClick={cerrarCrear} disabled={crear.isPending} />
              <ModalSubmit disabled={crear.isPending} />
            </ModalFooter>
          </ModalForm>
        ) : null}
      </ModalShell>
    </>
  );
}
