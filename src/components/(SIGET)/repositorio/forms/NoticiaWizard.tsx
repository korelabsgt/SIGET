"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Image,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide";
import {
  ModalField,
  ModalFechaInput,
  ModalInput,
  ModalLabel,
  ModalTextarea,
  modalAccentClass,
  modalFieldClass,
  toast,
} from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import { fechaCalendarioGt } from "@/lib/fechas-gt";
import {
  COUNTRY_OPTIONS,
  PROGRAM_OPTIONS,
  TYPE_LABELS,
  nombreDesdeMetadata,
  parsearNoticiaContent,
  seccionNoticiaVacia,
  slugsFotosSeccion,
} from "../lib/helpers";
import { esImagenMime, rutaRawArchivo } from "../lib/storage";
import { esNoticiaAspectId, type NoticiaAspectId } from "../lib/noticia-imagen";
import { parsearVideoNoticia } from "../lib/noticia-video";
import type { DocumentFormValues, DocumentRecord, TagRecord } from "../lib/zod";
import { NOTICIA_GALERIA_MAX } from "../lib/zod";
import { NoticiaArticulo } from "../NoticiaArticulo";
import type { NoticiaGaleriaDraftItem, NoticiaSeccionDraft } from "../lib/upload-client";
import { NoticiaFotoCropper } from "./NoticiaFotoCropper";
import { EtiquetasPicker } from "./EtiquetasPicker";

const selectClass = cn(
  "flex h-10 w-full rounded-lg bg-transparent px-3 py-2 text-sm text-foreground outline-none",
  modalFieldClass,
);

const NOTICIA_TIPOS = ["articulo", "nota", "comunicado"] as const;

type WizardStep = 1 | 2 | 3;

type GaleriaUiItem = NoticiaGaleriaDraftItem & { previewUrl: string | null };

type SeccionUi = NoticiaSeccionDraft;

type CropTarget = { sectionId: string; slot: number };

function galeriaVacia(): GaleriaUiItem[] {
  return Array.from({ length: NOTICIA_GALERIA_MAX }, () => ({
    slug: null,
    file: null,
    previewUrl: null,
  }));
}

function galeriaUiDesdeSeccion(section: {
  image_slug: string | null;
  gallery_slugs: string[];
}): GaleriaUiItem[] {
  const slugs = slugsFotosSeccion(section);
  return Array.from({ length: NOTICIA_GALERIA_MAX }, (_, index) => {
    const slug = slugs[index] ?? null;
    return {
      slug,
      file: null,
      previewUrl: slug ? rutaRawArchivo(slug) : null,
    };
  });
}

function revocarPreviewUrl(url: string | null | undefined) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

function revocarGaleria(items: GaleriaUiItem[]) {
  for (const item of items) revocarPreviewUrl(item.previewUrl);
}

function nuevaSeccionUi(): SeccionUi {
  const base = seccionNoticiaVacia();
  return { ...base, gallery: galeriaVacia() };
}

export function NoticiaWizard({
  tags,
  documento,
  userMeta,
  userEmail,
  pending = false,
  onCancel,
  onSave,
}: {
  tags: TagRecord[];
  documento?: DocumentRecord;
  userMeta?: Record<string, unknown> | null;
  userEmail?: string | null;
  pending?: boolean;
  onCancel: () => void;
  onSave: (values: DocumentFormValues, sections: NoticiaSeccionDraft[]) => Promise<void>;
}) {
  const parsed = parsearNoticiaContent(documento?.content ?? "");
  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState(documento?.title ?? "");
  const [summary, setSummary] = useState(documento?.summary ?? "");
  const [documentType, setDocumentType] = useState<(typeof NOTICIA_TIPOS)[number]>(
    documento?.document_type === "nota" || documento?.document_type === "comunicado"
      ? documento.document_type
      : "articulo",
  );
  const [countryScope, setCountryScope] = useState(documento?.country_scope ?? "trinacional");
  const [program, setProgram] = useState(documento?.program ?? "");
  const [author, setAuthor] = useState(
    documento?.author ||
      nombreDesdeMetadata(userMeta, userEmail?.split("@")[0] ?? ""),
  );
  const [cooperante, setCooperante] = useState(documento?.cooperante ?? "");
  const [publicationDate, setPublicationDate] = useState(
    documento?.publication_date ?? fechaCalendarioGt(),
  );
  const [tagIds, setTagIds] = useState<string[]>(documento?.tags.map((tag) => tag.id) ?? []);
  const [sections, setSections] = useState<SeccionUi[]>(() =>
    parsed.sections.map((section) => ({
      ...section,
      foto_aspect: esNoticiaAspectId(section.foto_aspect) ? section.foto_aspect : null,
      gallery: galeriaUiDesdeSeccion(section),
    })),
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const creador = documento?.created_by_nombre
    || nombreDesdeMetadata(userMeta, userEmail ?? "tu usuario");

  useEffect(() => {
    return () => {
      for (const section of sectionsRef.current) {
        revocarGaleria(section.gallery);
      }
    };
  }, []);

  const selectedTags = useMemo(
    () => tags.filter((tag) => tagIds.includes(tag.id)),
    [tags, tagIds],
  );

  const previewSections = sections.map((section) => ({
    id: section.id,
    heading: section.heading,
    body: section.body,
    photoSrcs: section.gallery
      .map((item) => item.previewUrl)
      .filter((src): src is string => Boolean(src)),
    videoUrl: section.video_url,
    imageAlt: section.heading || title,
  }));

  const cropSection = cropTarget
    ? sections.find((section) => section.id === cropTarget.sectionId)
    : null;
  const cropLockedAspect = esNoticiaAspectId(cropSection?.foto_aspect)
    ? cropSection.foto_aspect
    : null;

  const buildValues = (submitForReview: boolean): DocumentFormValues => ({
    title,
    summary,
    content: "",
    channel: "noticia",
    document_type: documentType,
    country_scope: countryScope,
    program: program ? (program as DocumentFormValues["program"]) : null,
    access_level: "public",
    author,
    cooperante,
    publication_date: publicationDate,
    version: documento?.version ?? "1",
    tag_ids: tagIds,
    submit_for_review: submitForReview,
  });

  const drafts = (): NoticiaSeccionDraft[] =>
    sections.map(({ gallery, ...rest }) => ({
      ...rest,
      gallery: gallery.map(({ slug, file }) => ({ slug, file })),
    }));

  const validarDatos = () => {
    if (!title.trim()) {
      toast.warn("Escribe el título de la noticia.");
      setStep(1);
      return false;
    }
    if (!author.trim()) {
      toast.warn("Indica el autor.");
      setStep(1);
      return false;
    }
    if (!publicationDate) {
      toast.warn("Indica la fecha.");
      setStep(1);
      return false;
    }
    return true;
  };

  const validarSecciones = () => {
    const invalido = sections.find(
      (section) => section.video_url?.trim() && !parsearVideoNoticia(section.video_url),
    );
    if (invalido) {
      toast.warn("Hay un enlace de video que no es de YouTube ni Facebook.");
      setStep(2);
      return false;
    }
    const hayTexto = sections.some(
      (section) =>
        section.body.trim() ||
        section.heading.trim() ||
        section.gallery.some((item) => item.previewUrl) ||
        parsearVideoNoticia(section.video_url),
    );
    if (!hayTexto) {
      toast.warn("Agrega al menos una sección con texto, foto o video.");
      setStep(2);
      return false;
    }
    return true;
  };

  const updateSection = (id: string, patch: Partial<SeccionUi>) => {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...patch } : section)),
    );
  };

  const addSection = () => {
    setSections((current) => [...current, nuevaSeccionUi()]);
  };

  const removeSection = (id: string) => {
    setSections((current) => {
      const target = current.find((section) => section.id === id);
      if (target) revocarGaleria(target.gallery);
      const next = current.filter((section) => section.id !== id);
      return next.length > 0 ? next : [nuevaSeccionUi()];
    });
  };

  const applyGalleryPhoto = (
    id: string,
    slot: number,
    file: File,
    aspectId: NoticiaAspectId,
  ) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;
        const gallery = [...section.gallery];
        const prev = gallery[slot];
        if (prev) revocarPreviewUrl(prev.previewUrl);
        gallery[slot] = {
          slug: prev?.slug ?? null,
          file,
          previewUrl: URL.createObjectURL(file),
        };
        return {
          ...section,
          gallery,
          foto_aspect: section.foto_aspect ?? aspectId,
        };
      }),
    );
  };

  const removeGalleryPhoto = (id: string, slot: number) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== id) return section;
        const target = section.gallery[slot];
        if (!target?.previewUrl && !target?.slug && !target?.file) return section;
        revocarPreviewUrl(target.previewUrl);
        const gallery = [...section.gallery];
        gallery[slot] = { slug: null, file: null, previewUrl: null };
        const tieneFotos = gallery.some((item) => item.previewUrl || item.slug);
        return {
          ...section,
          gallery,
          foto_aspect: tieneFotos ? section.foto_aspect : null,
        };
      }),
    );
  };

  const openGalleryCropper = (sectionId: string, slot: number, file: File | null) => {
    if (!file) return;
    if (!esImagenMime(file.type)) {
      toast.warn("Solo se aceptan fotos (JPG, PNG, WEBP).");
      return;
    }
    revocarPreviewUrl(cropSrc);
    setCropTarget({ sectionId, slot });
    setCropSrc(URL.createObjectURL(file));
  };

  const closeCropper = () => {
    revocarPreviewUrl(cropSrc);
    setCropSrc(null);
    setCropTarget(null);
  };

  return (
    <div className="relative w-full flex-1 bg-white dark:bg-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] bg-size-[24px_24px] opacity-50 dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] dark:opacity-40" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-1 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-celeste-trifinio">
          Noticia
        </p>
        <h1 className={`mt-1 text-2xl ${modalAccentClass}`}>
          {documento ? "Editar noticia" : "Nueva noticia"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La crea {creador}. Armas la nota por secciones y ves cómo quedará publicada.
        </p>

        <ol className="mt-2.5 flex flex-wrap gap-2">
          {(
            [
              [1, "Datos"],
              [2, "Secciones"],
              [3, "Vista"],
            ] as const
          ).map(([n, label]) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => setStep(n)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-bold",
                  step === n
                    ? "border-celeste-trifinio bg-sky-50 text-azul-trifinio dark:bg-sky-950/40"
                    : "border-zinc-200 text-muted-foreground dark:border-zinc-700",
                )}
              >
                {n}. {label}
              </button>
            </li>
          ))}
        </ol>

        {step === 1 ? (
          <div className="mt-2.5 space-y-4 rounded-2xl border border-border bg-zinc-50 p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
            <ModalField>
              <ModalLabel htmlFor="noticia-title">Título</ModalLabel>
              <ModalInput
                id="noticia-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </ModalField>
            <div className="grid gap-4 sm:grid-cols-2">
              <ModalField>
                <ModalLabel htmlFor="noticia-tipo">Tipo</ModalLabel>
                <select
                  id="noticia-tipo"
                  className={selectClass}
                  value={documentType}
                  onChange={(e) =>
                    setDocumentType(e.target.value as (typeof NOTICIA_TIPOS)[number])
                  }
                >
                  {NOTICIA_TIPOS.map((value) => (
                    <option key={value} value={value}>
                      {TYPE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </ModalField>
              <ModalField>
                <ModalLabel htmlFor="noticia-fecha">Fecha</ModalLabel>
                <ModalFechaInput
                  id="noticia-fecha"
                  value={publicationDate}
                  onChange={setPublicationDate}
                  required
                />
              </ModalField>
              <ModalField>
                <ModalLabel htmlFor="noticia-author">Autor</ModalLabel>
                <ModalInput
                  id="noticia-author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </ModalField>
              <ModalField>
                <ModalLabel htmlFor="noticia-cooperante">Cooperante</ModalLabel>
                <ModalInput
                  id="noticia-cooperante"
                  value={cooperante}
                  onChange={(e) => setCooperante(e.target.value)}
                />
              </ModalField>
              <ModalField>
                <ModalLabel htmlFor="noticia-pais">País</ModalLabel>
                <select
                  id="noticia-pais"
                  className={selectClass}
                  value={countryScope}
                  onChange={(e) =>
                    setCountryScope(e.target.value as DocumentFormValues["country_scope"])
                  }
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </ModalField>
              <ModalField>
                <ModalLabel htmlFor="noticia-programa">Programa</ModalLabel>
                <select
                  id="noticia-programa"
                  className={selectClass}
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                >
                  <option value="">Sin programa</option>
                  {PROGRAM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </ModalField>
            </div>
            <ModalField>
              <ModalLabel htmlFor="noticia-summary">Resumen</ModalLabel>
              <ModalTextarea
                id="noticia-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
              />
            </ModalField>
            <ModalField>
              <ModalLabel htmlFor="noticia-tags">Etiquetas</ModalLabel>
              <EtiquetasPicker
                tags={tags}
                value={tagIds}
                onChange={setTagIds}
                disabled={pending}
                inputId="noticia-tags"
              />
            </ModalField>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-2.5 space-y-4">
            <AnimatePresence>
                {sections.map((section, index) => (
                  <SeccionEditor
                    key={section.id}
                    index={index}
                    section={section}
                    disabled={pending}
                    onChange={(patch) => updateSection(section.id, patch)}
                    onGalleryPick={(slot, file) => openGalleryCropper(section.id, slot, file)}
                    onGalleryRemove={(slot) => removeGalleryPhoto(section.id, slot)}
                    onRemove={() => removeSection(section.id)}
                  />
                ))}
            </AnimatePresence>
            <SigetActionButton
              label="Sección"
              accentColor={sigetAccent.crear}
              morphFrom={Plus}
              morphTo={CirclePlus}
              onClick={addSection}
              disabled={pending || sections.length >= 30}
              className="w-auto shrink-0"
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-2.5 rounded-2xl border border-border bg-zinc-50 p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-6 text-sm text-muted-foreground">
              Revisa la nota antes de guardar o enviarla a revisión.
            </p>
            <NoticiaArticulo
              title={title}
              summary={summary}
              author={author}
              publicationDate={publicationDate}
              countryScope={countryScope}
              program={program ? (program as DocumentFormValues["program"]) : null}
              tags={selectedTags}
              sections={previewSections}
              documentType={documentType}
              galeriaInsetBleed
            />
          </div>
        ) : null}

        <div className="mt-2.5 flex flex-wrap justify-between gap-2 border-t border-zinc-200 pt-2.5 dark:border-zinc-700">
          <SigetActionButton
            label="Cancelar"
            accentColor={sigetAccent.cancelar}
            morphFrom={X}
            morphTo={X}
            morphOnHover={false}
            onClick={onCancel}
            disabled={pending}
            className="w-auto shrink-0"
          />
          <div className="flex flex-wrap gap-2">
            {step > 1 ? (
              <SigetActionButton
                label="Atrás"
                accentColor={sigetAccent.cancelar}
                morphFrom={ChevronLeft}
                morphTo={ChevronLeft}
                morphOnHover={false}
                onClick={() => setStep((current) => (current === 1 ? 1 : ((current - 1) as WizardStep)))}
                disabled={pending}
                className="w-auto shrink-0"
              />
            ) : null}
            {step < 3 ? (
              <SigetActionButton
                label="Seguir"
                accentColor={sigetAccent.crear}
                morphFrom={ChevronRight}
                morphTo={ChevronRight}
                onClick={() => {
                  if (step === 1 && !validarDatos()) return;
                  if (step === 2 && !validarSecciones()) return;
                  setStep((current) => (current === 3 ? 3 : ((current + 1) as WizardStep)));
                }}
                disabled={pending}
                className="w-auto shrink-0"
              />
            ) : (
              <>
                <SigetActionButton
                  label="Guardar"
                  accentColor={sigetAccent.guardar}
                  morphFrom={Save}
                  morphTo={Check}
                  disabled={pending}
                  onClick={() => {
                    if (!validarDatos() || !validarSecciones()) return;
                    void onSave(buildValues(false), drafts());
                  }}
                  className="w-auto shrink-0"
                />
                <SigetActionButton
                  label="Enviar a revisión"
                  accentColor={sigetAccent.crear}
                  morphFrom={Send}
                  morphTo={Send}
                  morphOnHover={false}
                  disabled={pending}
                  onClick={() => {
                    if (!validarDatos() || !validarSecciones()) return;
                    void onSave(buildValues(true), drafts());
                  }}
                  className="w-auto shrink-0"
                />
              </>
            )}
          </div>
        </div>
      </div>
      <NoticiaFotoCropper
        open={Boolean(cropSrc && cropTarget)}
        imageSrc={cropSrc ?? ""}
        lockedAspectId={cropLockedAspect}
        onClose={closeCropper}
        onApply={async (file, aspectId) => {
          if (!cropTarget) return;
          applyGalleryPhoto(cropTarget.sectionId, cropTarget.slot, file, aspectId);
        }}
      />
    </div>
  );
}

function SeccionEditor({
  index,
  section,
  disabled,
  onChange,
  onGalleryPick,
  onGalleryRemove,
  onRemove,
}: {
  index: number;
  section: SeccionUi;
  disabled: boolean;
  onChange: (patch: Partial<SeccionUi>) => void;
  onGalleryPick: (slot: number, file: File | null) => void;
  onGalleryRemove: (slot: number) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-3 rounded-2xl border border-border bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-bold uppercase tracking-wider ${modalAccentClass}`}>
          Sección {index + 1}
        </p>
        <SigetActionButton
          label="Quitar"
          accentColor={sigetAccent.quitar}
          morphFrom={Trash2}
          morphTo={Trash2}
          morphOnHover={false}
          onClick={onRemove}
          disabled={disabled}
          className="w-auto shrink-0"
        />
      </div>
      <ModalField>
        <ModalLabel htmlFor={`sec-heading-${section.id}`}>Subtítulo</ModalLabel>
        <ModalInput
          id={`sec-heading-${section.id}`}
          value={section.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </ModalField>
      <ModalField>
        <ModalLabel>Fotos</ModalLabel>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (pendingSlot !== null) {
              onGalleryPick(pendingSlot, e.target.files?.[0] ?? null);
            }
            setPendingSlot(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        {(() => {
          const filledSlots = section.gallery
            .map((item, slot) => ({ item, slot }))
            .filter(({ item }) => Boolean(item.previewUrl));
          const nextSlot = section.gallery.findIndex(
            (item) => !item.previewUrl && !item.slug && !item.file,
          );
          const canAdd = nextSlot >= 0 && nextSlot < NOTICIA_GALERIA_MAX;
          return (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {filledSlots.map(({ item, slot }) => (
                  <div
                    key={`${section.id}-foto-${slot}`}
                    className="relative shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl ?? ""}
                      alt={`Foto ${slot + 1}`}
                      className="block h-[4.5rem] w-[5.5rem] object-cover sm:h-20 sm:w-24"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-[#2c5f9b]/90 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-[#6f9fd4]/90">
                      {slot + 1}
                    </span>
                    <SigetActionButton
                      label="Quitar"
                      iconOnly
                      accentColor={sigetAccent.quitar}
                      morphFrom={Trash2}
                      morphTo={Trash2}
                      morphOnHover={false}
                      onClick={() => onGalleryRemove(slot)}
                      disabled={disabled}
                      className="absolute right-1 top-1 size-8 w-8 min-w-8 border-white/30 bg-black/45 dark:bg-black/55"
                    />
                  </div>
                ))}
                {canAdd ? (
                  <SigetActionButton
                    label="Foto"
                    accentColor={sigetAccent.crear}
                    morphFrom={Image}
                    morphTo={Image}
                    morphOnHover={false}
                    onClick={() => {
                      setPendingSlot(nextSlot);
                      fileRef.current?.click();
                    }}
                    disabled={disabled}
                    className="w-auto shrink-0"
                  />
                ) : null}
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {filledSlots.length}/{NOTICIA_GALERIA_MAX}
                {filledSlots.length === 0
                  ? " · elige una imagen; puedes agregar hasta seis"
                  : " · la primera define la proporción"}
                {filledSlots.length > 1 ? " · galería al publicar" : ""}
              </p>
            </div>
          );
        })()}
      </ModalField>
      <ModalField>
        <ModalLabel htmlFor={`sec-video-${section.id}`}>Video</ModalLabel>
        <ModalInput
          id={`sec-video-${section.id}`}
          value={section.video_url ?? ""}
          onChange={(e) => onChange({ video_url: e.target.value })}
          onBlur={() => {
            const value = section.video_url?.trim() ?? "";
            if (value && !parsearVideoNoticia(value)) {
              toast.warn("Pega un enlace de YouTube o Facebook.");
            }
          }}
        />
        <p className="text-[11px] text-muted-foreground">
          Enlace de YouTube o Facebook.
        </p>
        {section.video_url?.trim() ? (
          <div className="flex flex-wrap gap-2">
            <SigetActionButton
              label="Quitar"
              accentColor={sigetAccent.quitar}
              morphFrom={Trash2}
              morphTo={Trash2}
              morphOnHover={false}
              onClick={() => onChange({ video_url: null })}
              disabled={disabled}
              className="w-auto shrink-0"
            />
          </div>
        ) : null}
      </ModalField>
      <ModalField>
        <ModalLabel htmlFor={`sec-body-${section.id}`}>Texto</ModalLabel>
        <ModalTextarea
          id={`sec-body-${section.id}`}
          value={section.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={1}
        />
      </ModalField>
    </motion.div>
  );
}
