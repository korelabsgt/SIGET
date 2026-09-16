"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Clock,
  CloudRain,
  Download,
  Droplets,
  FileText,
  Leaf,
  Lock,
  LockOpen,
  Mountain,
  Pickaxe,
  Save,
  Scale,
  Shield,
  ShieldCheck,
  Sprout,
  Waves,
} from "lucide";
import {
  ModalShell,
  ModalForm,
  ModalField,
  ModalLabel,
  ModalInput,
  ModalTextarea,
  ModalFooter,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { cn } from "@/lib/utils";
import {
  COMUNIDADES_MICROCUENCA,
  MICROCUENCAS,
  TIPOLOGIAS,
} from "../lib/catalogos";
import { municipioDeMicrocuenca } from "../lib/helpers";
import { useCrearReporteCiudadano } from "../lib/hooks";
import { descargarTicketReporte } from "../lib/publico-pdf";
import { JaSelect } from "../lib/ui";
import { reporteCiudadanoFormSchema } from "../lib/zod";
import { PubContador, PubMarco } from "./ui";

const TIPOS = [
  { value: TIPOLOGIAS[0], label: "Canícula", detalle: "Déficit de agua", from: Droplets, to: CloudRain },
  { value: TIPOLOGIAS[1], label: "Fuente", detalle: "Contaminación", from: Waves, to: Droplets },
  { value: TIPOLOGIAS[2], label: "Recarga", detalle: "Daño en ladera", from: Leaf, to: Sprout },
  { value: TIPOLOGIAS[3], label: "Extractivas", detalle: "Sin control", from: Mountain, to: Pickaxe },
  { value: TIPOLOGIAS[4], label: "Turnos", detalle: "Distribución", from: Scale, to: Clock },
] as const;

export function CanalCiudadano() {
  const crear = useCrearReporteCiudadano();
  const [tipologia, setTipologia] = useState<(typeof TIPOLOGIAS)[number]>(TIPOLOGIAS[0]);
  const [microcuenca, setMicrocuenca] = useState<(typeof MICROCUENCAS)[number]>("Muyurco");
  const municipio = municipioDeMicrocuenca(microcuenca);
  const comunidades = COMUNIDADES_MICROCUENCA[microcuenca];
  const [comunidad, setComunidad] = useState(comunidades[0] ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [familias, setFamilias] = useState(0);
  const [mujeres, setMujeres] = useState(0);
  const [juventudes, setJuventudes] = useState(0);
  const [chorti, setChorti] = useState(0);
  const [confidencial, setConfidencial] = useState(true);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [hoverTipo, setHoverTipo] = useState<(typeof TIPOLOGIAS)[number] | null>(null);

  const derivacionLabel = useMemo(() => {
    return `OMAS, UGAM o Comité Comunitario de Agua de ${municipio}`;
  }, [municipio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = reporteCiudadanoFormSchema.safeParse({
      tipologia,
      microcuenca,
      municipio,
      comunidad,
      descripcion,
      poblacion: {
        hombres: familias,
        mujeres,
        juventudes,
        pueblo_maya_chorti: chorti,
      },
      confidencial,
      nombre: confidencial ? "" : nombre,
      contacto: confidencial ? "" : contacto,
    });
    if (!parsed.success) {
      toast.warn(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }
    const res = await crear.mutateAsync(parsed.data);
    if (res.success && res.codigo) {
      setTicket(res.codigo);
      setDescripcion("");
      setFamilias(0);
      setMujeres(0);
      setJuventudes(0);
      setChorti(0);
      setNombre("");
      setContacto("");
      toast.success("Alerta canalizada. Conserve el código de seguimiento.");
      return;
    }
    toast.error(modalActionMessage(res.error ?? undefined, "No se pudo enviar el reporte."));
  };

  return (
    <div className="space-y-5">
      <div className="relative min-h-52 overflow-hidden rounded-[28px] md:min-h-60">
        <Image
          src="/paz-hidrica-ja/comunidad/01-campesinos-guatemala.jpg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 1152px"
          className="object-cover object-[center_30%]"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#003882] via-[#003882]/70 to-[#003882]/25" />
        <div className="relative flex min-h-52 flex-col justify-end px-6 py-6 md:min-h-60 md:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C59B27]">
            Alerta temprana
          </p>
          <h2 className="mt-1 max-w-lg text-2xl font-black leading-tight text-white md:text-3xl">
            Cuéntanos qué está pasando con el agua
          </h2>
          <p className="mt-2 max-w-lg text-sm font-medium text-sky-100/90">
            La alerta llega a {derivacionLabel}. Con reserva de identidad se entrega un código
            anónimo. El mapa público no muestra denuncias ni nombres.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <aside className="space-y-3">
          <PubMarco>
            <ol className="space-y-5 px-5 py-5">
              {[
                { n: "01", t: "Describe", d: "Tipo de situación y qué ocurre en la comunidad." },
                { n: "02", t: "Ubica", d: "Microcuenca, municipio y caserío. Sin coordenadas de denuncia." },
                { n: "03", t: "Código", d: "Recibes un folio anónimo para dar seguimiento." },
              ].map((paso) => (
                <li key={paso.n} className="flex gap-3">
                  <span className="font-mono text-sm font-black text-[#C59B27]">{paso.n}</span>
                  <div>
                    <p className="text-sm font-black text-[#003882] dark:text-[#6f9fd4]">{paso.t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{paso.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </PubMarco>
          <div className="rounded-[28px] bg-[#1B5E20] px-5 py-5 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
              Acción Sin Daño
            </p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-50">
              La reserva oculta nombre y contacto. Nadie ve el punto en el visor territorial
              abierto.
            </p>
          </div>
        </aside>

        <PubMarco>
          <ModalForm onSubmit={handleSubmit} className="space-y-0">
            <div className="space-y-6 px-5 py-6 md:px-7">
              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
                  Tipo de situación
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {TIPOS.map((tipo) => {
                    const activa = tipologia === tipo.value;
                    return (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() => setTipologia(tipo.value)}
                        onPointerEnter={() => setHoverTipo(tipo.value)}
                        onPointerLeave={() => setHoverTipo(null)}
                        className={cn(
                          "flex cursor-pointer flex-col items-start gap-2 rounded-2xl px-3 py-3 text-left transition-colors",
                          activa
                            ? "bg-[#003882] text-white"
                            : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",
                        )}
                        aria-pressed={activa}
                      >
                        <MorphHoverIcon
                          from={tipo.from}
                          to={tipo.to}
                          size={16}
                          color="currentColor"
                          spring="snappy"
                          hovered={activa || hoverTipo === tipo.value}
                        />
                        <span className="text-sm font-black leading-none">{tipo.label}</span>
                        <span
                          className={cn(
                            "text-[11px] font-medium leading-snug",
                            activa ? "text-sky-100/80" : "text-zinc-500 dark:text-zinc-400",
                          )}
                        >
                          {tipo.detalle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ModalField>
                  <ModalLabel htmlFor="ja-pub-micro">Microcuenca</ModalLabel>
                  <JaSelect
                    id="ja-pub-micro"
                    value={microcuenca}
                    onChange={(e) => {
                      const next = e.target.value as typeof microcuenca;
                      setMicrocuenca(next);
                      const lista = COMUNIDADES_MICROCUENCA[next];
                      setComunidad(lista[0] ?? "");
                    }}
                  >
                    {MICROCUENCAS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </JaSelect>
                </ModalField>
                <ModalField>
                  <ModalLabel htmlFor="ja-pub-com">Comunidad</ModalLabel>
                  <JaSelect
                    id="ja-pub-com"
                    value={comunidad}
                    onChange={(e) => setComunidad(e.target.value)}
                  >
                    {comunidades.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </JaSelect>
                </ModalField>
              </div>
              <p className="text-xs font-bold text-zinc-500">Municipio: {municipio}</p>

              <ModalField>
                <ModalLabel htmlFor="ja-pub-desc">Qué está ocurriendo</ModalLabel>
                <ModalTextarea
                  id="ja-pub-desc"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  required
                />
              </ModalField>

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
                  Quiénes se ven afectadas
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <PubContador label="Familias" value={familias} onChange={setFamilias} />
                  <PubContador label="Mujeres" value={mujeres} onChange={setMujeres} />
                  <PubContador label="Jóvenes" value={juventudes} onChange={setJuventudes} />
                  <PubContador label="Maya Ch'orti'" value={chorti} onChange={setChorti} />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-zinc-50 px-4 py-4 dark:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#003882] dark:text-[#6f9fd4]">
                    {confidencial ? "Reporte confidencial" : "Reporte con contacto"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {confidencial
                      ? "Se omite nombre y teléfono. Recibes un código anónimo."
                      : "El contacto queda en canal reservado, no en el mapa público."}
                  </p>
                </div>
                <SigetActionButton
                  label={confidencial ? "Reserva" : "Pública"}
                  accentColor={confidencial ? sigetAccent.activa : sigetAccent.inactiva}
                  morphFrom={confidencial ? Lock : LockOpen}
                  morphTo={confidencial ? LockOpen : Lock}
                  role="switch"
                  ariaChecked={confidencial}
                  onClick={() => setConfidencial((v) => !v)}
                  ariaLabel="Alternar reserva de identidad"
                  className="w-auto shrink-0"
                />
              </div>

              {confidencial ? null : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ModalField>
                    <ModalLabel htmlFor="ja-pub-nom">Nombre</ModalLabel>
                    <ModalInput
                      id="ja-pub-nom"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </ModalField>
                  <ModalField>
                    <ModalLabel htmlFor="ja-pub-tel">Contacto</ModalLabel>
                    <ModalInput
                      id="ja-pub-tel"
                      value={contacto}
                      onChange={(e) => setContacto(e.target.value)}
                    />
                  </ModalField>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-zinc-200 bg-zinc-100 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800 md:px-7">
              <SigetActionButton
                label="Enviar"
                accentColor={sigetAccent.guardar}
                morphFrom={Save}
                morphTo={Check}
                type="submit"
                disabled={crear.isPending}
                ariaLabel="Enviar reporte ciudadano"
                className="w-auto shrink-0"
              />
            </div>
          </ModalForm>
        </PubMarco>
      </div>

      <ModalShell
        open={Boolean(ticket)}
        onClose={() => setTicket(null)}
        title="Reporte recibido"
        maxWidth="max-w-md"
      >
        {ticket ? (
          <div className="space-y-4 px-1 pb-2">
            <div className="rounded-2xl bg-[#003882] px-5 py-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C59B27]">
                Código anónimo
              </p>
              <p className="mt-2 font-mono text-3xl font-black tracking-wide">{ticket}</p>
              <p className="mt-3 text-sm text-sky-100/90">
                Conserva este folio. No se publican nombres ni puntos en el mapa.
              </p>
            </div>
            <ModalFooter>
              <SigetActionButton
                label="Ticket"
                accentColor={sigetAccent.excel}
                morphFrom={FileText}
                morphTo={Download}
                onClick={() => descargarTicketReporte(ticket, derivacionLabel)}
                ariaLabel="Descargar comprobante del reporte"
                className="w-auto shrink-0"
              />
              <SigetActionButton
                label="Listo"
                accentColor={sigetAccent.guardar}
                morphFrom={Shield}
                morphTo={ShieldCheck}
                onClick={() => setTicket(null)}
                className="w-auto shrink-0"
              />
            </ModalFooter>
          </div>
        ) : null}
      </ModalShell>
    </div>
  );
}
