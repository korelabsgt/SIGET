"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { actionErrorMessage } from "@/components/ui/modal-toast";
import { useBuscarParticipante, useRegistrarAsistencia } from "./lib/hooks";
import type { DpiSugerencia } from "./lib/actions";
import { BusquedaDpi } from "./BusquedaDpi";
import { CamposInstitucionPuesto } from "./forms/CamposInstitucionPuesto";
import {
  formatFechaActividad,
  formatUbicacionActividad,
  institucionDesdeRegistro,
  normalizarDpiInput,
  normalizarFechaInput,
  normalizarTelefonoInput,
  registroPublicoSchema,
  type ActividadRecord,
  type ParticipanteRecord,
  type TipoInstitucion,
} from "./lib/zod";

const inputClass =
  "flex h-10 w-full rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-celeste-trifinio/30";

const GENERO_STYLES = {
  masculino: {
    active:
      "border-blue-600 bg-blue-100 text-blue-800 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200",
    idle: "border-blue-300/50 text-muted-foreground hover:border-blue-500 dark:border-blue-800",
  },
  femenino: {
    active:
      "border-pink-500 bg-pink-100 text-pink-800 dark:border-pink-500 dark:bg-pink-950 dark:text-pink-200",
    idle: "border-pink-300/50 text-muted-foreground hover:border-pink-500 dark:border-pink-800",
  },
} as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold leading-none text-foreground/70">
      {children}
    </label>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl bg-zinc-100/80 p-4 dark:bg-zinc-900/50">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function aplicarParticipante(
  p: ParticipanteRecord,
  setters: {
    setNombre: (v: string) => void;
    setEmail: (v: string) => void;
    setTelefono: (v: string) => void;
    setFechaNacimiento: (v: string) => void;
    setGenero: (v: "masculino" | "femenino" | "") => void;
    setTipoInstitucion: (v: TipoInstitucion) => void;
    setInstitucionOtra: (v: string) => void;
    setPuesto: (v: string) => void;
  },
) {
  setters.setNombre(p.nombre);
  setters.setEmail(p.email ?? "");
  setters.setTelefono(p.telefono ?? "");
  setters.setFechaNacimiento(normalizarFechaInput(p.fecha_nacimiento));
  setters.setGenero(p.genero);
  const { tipo, otra } = institucionDesdeRegistro(p.institucion);
  setters.setTipoInstitucion(tipo);
  setters.setInstitucionOtra(otra);
  setters.setPuesto(p.puesto ?? "");
}

function limpiarDatosPersonales(setters: {
  setNombre: (v: string) => void;
  setEmail: (v: string) => void;
  setTelefono: (v: string) => void;
  setFechaNacimiento: (v: string) => void;
  setGenero: (v: "masculino" | "femenino" | "") => void;
  setTipoInstitucion: (v: TipoInstitucion) => void;
  setInstitucionOtra: (v: string) => void;
  setPuesto: (v: string) => void;
}) {
  setters.setNombre("");
  setters.setEmail("");
  setters.setTelefono("");
  setters.setFechaNacimiento("");
  setters.setGenero("");
  setters.setTipoInstitucion("sin");
  setters.setInstitucionOtra("");
  setters.setPuesto("");
}

export function RegistroPublico({ actividad }: { actividad: ActividadRecord }) {
  const buscar = useBuscarParticipante();
  const registrar = useRegistrarAsistencia();

  const [paso, setPaso] = useState<"dpi" | "formulario">("dpi");
  const [enviado, setEnviado] = useState(false);
  const [dpi, setDpi] = useState("");
  const [participanteEncontrado, setParticipanteEncontrado] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [puesto, setPuesto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<"masculino" | "femenino" | "">("");
  const [tipoInstitucion, setTipoInstitucion] =
    useState<TipoInstitucion>("sin");
  const [institucionOtra, setInstitucionOtra] = useState("");

  const setters = {
    setNombre,
    setEmail,
    setTelefono,
    setFechaNacimiento,
    setGenero,
    setTipoInstitucion,
    setInstitucionOtra,
    setPuesto,
  };

  const dpiCompleto = dpi.length === 13;
  const fechaActividad = formatFechaActividad(actividad.fecha_realizacion);
  const ubicacionActividad = formatUbicacionActividad(actividad);

  const handleDpiChange = (value: string) => {
    setDpi(normalizarDpiInput(value));
  };

  const handleBuscarDpi = async (dpiValor = dpi) => {
    if (dpiValor.length !== 13) {
      toast.warn("Ingresa un DPI válido de 13 dígitos.");
      return;
    }
    const participante = await buscar.mutateAsync(dpiValor);
    limpiarDatosPersonales(setters);
    if (participante) {
      aplicarParticipante(participante, setters);
      setParticipanteEncontrado(true);
      toast.success("Participante encontrado. Revisa tus datos.");
    } else {
      setParticipanteEncontrado(false);
      toast.info("DPI no registrado. Completa tus datos.");
    }
    setPaso("formulario");
  };

  const handleSeleccionarDpi = async (sugerencia: DpiSugerencia) => {
    setDpi(sugerencia.dpi);
    const participante = await buscar.mutateAsync(sugerencia.dpi);
    limpiarDatosPersonales(setters);
    if (participante) {
      aplicarParticipante(participante, setters);
      setParticipanteEncontrado(true);
    } else {
      setNombre(sugerencia.nombre);
      setParticipanteEncontrado(true);
    }
    setPaso("formulario");
    toast.success("Datos cargados. Revisa y confirma.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registroPublicoSchema.safeParse({
      actividad_id: actividad.id,
      dpi,
      nombre,
      email,
      telefono,
      puesto,
      tipo_institucion: tipoInstitucion,
      institucion_otra: institucionOtra,
      fecha_nacimiento: fechaNacimiento,
      genero,
    });
    if (!parsed.success) {
      toast.warn("Revisa los datos del formulario.");
      return;
    }
    const res = await registrar.mutateAsync(parsed.data);
    if (res.success) {
      setEnviado(true);
      toast.success("Asistencia registrada correctamente.");
    } else {
      const mensaje = actionErrorMessage(
        res,
        "No se pudo registrar la asistencia.",
      );
      toast.error(mensaje, { autoClose: res.detail ? 8000 : 3000 });
    }
  };

  if (enviado) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 className="mb-4 size-16 text-emerald-500" />
        <h1 className="text-2xl font-black text-foreground">
          ¡Registro exitoso!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu asistencia a «{actividad.nombre}» ha sido registrada.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Plan Trifinio · SIGET
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground">
          Registro de asistencia
        </h1>
        <p className="mt-2 text-sm font-semibold text-azul-trifinio">
          {actividad.nombre}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
          <CalendarDays className="size-3.5 shrink-0" />
          <span className="capitalize">{fechaActividad}</span>
        </div>
        {ubicacionActividad && (
          <div className="mt-2 inline-flex max-w-full items-start gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-muted-foreground dark:bg-zinc-800/80">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-celeste-trifinio" />
            <span>{ubicacionActividad}</span>
          </div>
        )}
        {actividad.descripcion && (
          <p className="mt-2 text-sm text-muted-foreground">
            {actividad.descripcion}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {paso === "dpi" ? (
          <motion.div
            key="dpi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800/60"
          >
            <FormSection title="Identificación">
              <div className="space-y-2">
                <FieldLabel>DPI</FieldLabel>
                <BusquedaDpi
                  value={dpi}
                  onChange={handleDpiChange}
                  onSeleccionar={handleSeleccionarDpi}
                  disabled={buscar.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {dpi.length}/13 dígitos · escribe al menos 3 para ver
                  sugerencias
                </p>
              </div>
            </FormSection>
            <button
              type="button"
              onClick={() => handleBuscarDpi()}
              disabled={!dpiCompleto || buscar.isPending}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-azul-trifinio text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buscar.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Continuar
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="formulario"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-4"
          >
            <FormSection title="Identificación">
              <div className="flex items-center justify-between gap-2 rounded-xl bg-sky-50 px-3 py-2 dark:bg-sky-950/40">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    DPI
                  </p>
                  <p className="font-mono text-sm font-bold tabular-nums">
                    {dpi}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaso("dpi")}
                  className="cursor-pointer text-xs font-bold text-azul-trifinio hover:underline"
                >
                  Cambiar
                </button>
              </div>

              {participanteEncontrado && (
                <p className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  Datos cargados desde registros anteriores. Puedes
                  actualizarlos.
                </p>
              )}

              <div className="space-y-2">
                <FieldLabel>Nombre completo</FieldLabel>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Correo electrónico (opcional)</FieldLabel>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Teléfono (opcional)</FieldLabel>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(normalizarTelefonoInput(e.target.value))
                  }
                  className={inputClass}
                  autoComplete="tel"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">8 dígitos</p>
              </div>
            </FormSection>

            <FormSection title="Institución">
              <CamposInstitucionPuesto
                tipoInstitucion={tipoInstitucion}
                institucionOtra={institucionOtra}
                puesto={puesto}
                onTipoInstitucionChange={setTipoInstitucion}
                onInstitucionOtraChange={setInstitucionOtra}
                onPuestoChange={setPuesto}
              />
            </FormSection>

            <FormSection title="Datos personales">
              <div className="space-y-2">
                <FieldLabel>Fecha de nacimiento</FieldLabel>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Género</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(["masculino", "femenino"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenero(g)}
                      className={cn(
                        "h-10 cursor-pointer rounded-lg border-2 text-sm font-bold transition-colors",
                        genero === g
                          ? GENERO_STYLES[g].active
                          : GENERO_STYLES[g].idle,
                      )}
                    >
                      {g === "masculino" ? "Masculino" : "Femenino"}
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>

            <button
              type="submit"
              disabled={registrar.isPending || !genero}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-emerald-200 text-[10px] font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
            >
              {registrar.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                "Registrar asistencia"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
