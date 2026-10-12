"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Paperclip, Save, Send, Trash2, X } from "lucide";
import {
  ModalField,
  ModalFechaInput,
  ModalForm,
  ModalInput,
  ModalLabel,
  ModalTextarea,
  modalFieldClass,
} from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import { fechaCalendarioGt } from "@/lib/fechas-gt";
import type {
  DocumentFileRecord,
  DocumentFormValues,
  TagRecord,
} from "../lib/zod";
import {
  ACCESS_OPTIONS,
  CHANNEL_OPTIONS_DOCUMENTO,
  COUNTRY_OPTIONS,
  PROGRAM_OPTIONS,
  TYPE_OPTIONS,
} from "../lib/helpers";
import { LIBRARY_MAX_BYTES, pesoArchivoLegible } from "../lib/storage";
import { CuerpoEditor } from "./CuerpoEditor";
import { EtiquetasPicker } from "./EtiquetasPicker";

const selectClass = cn(
  "flex h-10 w-full rounded-lg bg-transparent px-3 py-2 text-sm text-foreground outline-none",
  modalFieldClass,
);

export type PendingFile = {
  key: string;
  file: File;
};

export function DocumentoForm({
  tags,
  initial,
  existingFiles = [],
  pending = false,
  onSubmit,
  onCancel,
  onRemoveExisting,
}: {
  tags: TagRecord[];
  initial?: Partial<DocumentFormValues>;
  existingFiles?: DocumentFileRecord[];
  pending?: boolean;
  onSubmit: (values: DocumentFormValues, files: File[]) => Promise<void>;
  onCancel: () => void;
  onRemoveExisting?: (fileSlug: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "cientifico");
  const [documentType, setDocumentType] = useState(initial?.document_type ?? "nota");
  const [countryScope, setCountryScope] = useState(
    initial?.country_scope ?? "trinacional",
  );
  const [program, setProgram] = useState(initial?.program ?? "");
  const [accessLevel, setAccessLevel] = useState(initial?.access_level ?? "public");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [cooperante, setCooperante] = useState(initial?.cooperante ?? "");
  const [publicationDate, setPublicationDate] = useState(
    initial?.publication_date ?? fechaCalendarioGt(),
  );
  const [version, setVersion] = useState(initial?.version ?? "1");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tag_ids ?? []);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: PendingFile[] = [];
    for (const file of Array.from(list)) {
      if (file.size > LIBRARY_MAX_BYTES) continue;
      next.push({ key: `${file.name}-${file.size}-${file.lastModified}`, file });
    }
    setPendingFiles((current) => [...current, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const buildValues = (submitForReview: boolean): DocumentFormValues => ({
    title,
    summary,
    content,
    channel,
    document_type: documentType,
    country_scope: countryScope,
    program: program ? (program as DocumentFormValues["program"]) : null,
    access_level: channel === "normativo_interno" ? "interno" : accessLevel,
    author,
    cooperante,
    publication_date: publicationDate,
    version,
    tag_ids: tagIds,
    submit_for_review: submitForReview,
  });

  return (
    <ModalForm
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(buildValues(false), pendingFiles.map((item) => item.file));
      }}
    >
      <ModalField>
        <ModalLabel htmlFor="title">Título</ModalLabel>
        <ModalInput
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
      </ModalField>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="channel">Canal</ModalLabel>
          <select
            id="channel"
            className={selectClass}
            value={channel}
            onChange={(e) =>
              setChannel(e.target.value as DocumentFormValues["channel"])
            }
          >
            {CHANNEL_OPTIONS_DOCUMENTO.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="document_type">Tipo</ModalLabel>
          <select
            id="document_type"
            className={selectClass}
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as DocumentFormValues["document_type"])
            }
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="country_scope">País</ModalLabel>
          <select
            id="country_scope"
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
          <ModalLabel htmlFor="program">Programa</ModalLabel>
          <select
            id="program"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField>
          <ModalLabel htmlFor="author">Autor</ModalLabel>
          <ModalInput
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="cooperante">Cooperante</ModalLabel>
          <ModalInput
            id="cooperante"
            value={cooperante}
            onChange={(e) => setCooperante(e.target.value)}
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="publication_date">Publicación</ModalLabel>
          <ModalFechaInput
            id="publication_date"
            value={publicationDate}
            onChange={setPublicationDate}
            required
          />
        </ModalField>
        <ModalField>
          <ModalLabel htmlFor="version">Versión</ModalLabel>
          <ModalInput
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </ModalField>
      </div>

      {channel !== "normativo_interno" ? (
        <ModalField>
          <ModalLabel htmlFor="access_level">Acceso</ModalLabel>
          <select
            id="access_level"
            className={selectClass}
            value={accessLevel}
            onChange={(e) =>
              setAccessLevel(e.target.value as DocumentFormValues["access_level"])
            }
          >
            {ACCESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </ModalField>
      ) : null}

      <ModalField>
        <ModalLabel htmlFor="summary">Resumen</ModalLabel>
        <ModalTextarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
        />
      </ModalField>

      <ModalField>
        <ModalLabel>Cuerpo</ModalLabel>
        <CuerpoEditor value={content} onChange={setContent} disabled={pending} />
      </ModalField>

      <ModalField>
        <ModalLabel htmlFor="tag-search">Etiquetas</ModalLabel>
        <EtiquetasPicker
          tags={tags}
          value={tagIds}
          onChange={setTagIds}
          disabled={pending}
          inputId="tag-search"
        />
      </ModalField>

      <ModalField>
        <ModalLabel>Archivos</ModalLabel>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <SigetActionButton
          label="Adjuntar"
          accentColor={sigetAccent.crear}
          morphFrom={Paperclip}
          morphTo={Paperclip}
          morphOnHover={false}
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="w-auto shrink-0"
        />
        <ul className="space-y-2">
          <AnimatePresence>
            {existingFiles.map((file) => (
              <motion.li
                key={file.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between rounded-xl border border-border bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="min-w-0 truncate">
                  {file.original_name} · {pesoArchivoLegible(file.file_size_bytes)}
                </span>
                {onRemoveExisting ? (
                  <SigetActionButton
                    label="Quitar"
                    accentColor={sigetAccent.quitar}
                    morphFrom={Trash2}
                    morphTo={Trash2}
                    morphOnHover={false}
                    onClick={() => onRemoveExisting(file.slug)}
                    className="w-auto shrink-0"
                  />
                ) : null}
              </motion.li>
            ))}
            {pendingFiles.map((item) => (
              <motion.li
                key={item.key}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between rounded-xl border border-border bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span className="min-w-0 truncate">
                  {item.file.name} · {pesoArchivoLegible(item.file.size)}
                </span>
                <SigetActionButton
                  label="Quitar"
                  accentColor={sigetAccent.quitar}
                  morphFrom={Trash2}
                  morphTo={Trash2}
                  morphOnHover={false}
                  onClick={() =>
                    setPendingFiles((current) =>
                      current.filter((file) => file.key !== item.key),
                    )
                  }
                  className="w-auto shrink-0"
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </ModalField>

      <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
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
        <SigetActionButton
          type="submit"
          label="Guardar"
          accentColor={sigetAccent.guardar}
          morphFrom={Save}
          morphTo={Check}
          disabled={pending}
          className="w-auto shrink-0"
        />
        <SigetActionButton
          label="Enviar"
          accentColor={sigetAccent.crear}
          morphFrom={Send}
          morphTo={Send}
          morphOnHover={false}
          disabled={pending}
          onClick={() =>
            void onSubmit(buildValues(true), pendingFiles.map((item) => item.file))
          }
          className="w-auto shrink-0"
        />
      </div>
    </ModalForm>
  );
}
