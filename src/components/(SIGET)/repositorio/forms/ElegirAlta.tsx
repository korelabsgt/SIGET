"use client";

import { useRouter } from "next/navigation";
import { FilePlus, Newspaper } from "lucide";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { modalAccentClass } from "@/components/ui/general-modal";
import { rutaNuevaNoticia, rutaNuevoDocumento } from "../lib/helpers";

export function ElegirAlta() {
  const router = useRouter();

  return (
    <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className={`text-2xl ${modalAccentClass}`}>Nuevo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Las noticias se arman por secciones con fotos. El resto de materiales usa el formulario del repositorio.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
            <div>
              <h2 className="font-bold text-foreground">Noticia</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Wizard con secciones, fotos visibles y vista previa de cómo quedará publicada.
              </p>
            </div>
            <SigetActionButton
              label="Noticia"
              accentColor={sigetAccent.crear}
              morphFrom={Newspaper}
              morphTo={Newspaper}
              morphOnHover={false}
              onClick={() => router.push(rutaNuevaNoticia())}
              className="w-auto shrink-0"
            />
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800">
            <div>
              <h2 className="font-bold text-foreground">Documento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informes, estudios, guías y archivos del repositorio científico o educativo.
              </p>
            </div>
            <SigetActionButton
              label="Documento"
              accentColor={sigetAccent.crear}
              morphFrom={FilePlus}
              morphTo={FilePlus}
              morphOnHover={false}
              onClick={() => router.push(rutaNuevoDocumento())}
              className="w-auto shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
