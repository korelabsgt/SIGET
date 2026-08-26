"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ModalShell,
  ModalInput,
  ModalLabel,
  ModalSubmit,
  ModalFooter,
  ModalCancelButton,
} from "@/components/ui/general-modal";
import { actionErrorMessage } from "@/components/ui/modal-toast";
import { CamposInstitucionPuesto } from "./CamposInstitucionPuesto";
import { FechaNacimientoCampos } from "./FechaNacimientoCampos";
import { GeneroSwitch } from "./GeneroSwitch";
import { useEditarRegistro } from "../lib/hooks";
import {
  institucionDesdeRegistro,
  normalizarDpiInput,
  normalizarFechaInput,
  normalizarTelefonoInput,
  registroEditSchema,
  type RegistroAsistenciaRecord,
} from "../lib/zod";

export function EditarRegistro({
  open,
  registro,
  actividadId,
  onClose,
}: {
  open: boolean;
  registro: RegistroAsistenciaRecord | null;
  actividadId: string;
  onClose: () => void;
}) {
  const editar = useEditarRegistro(actividadId);

  const [dpi, setDpi] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [puesto, setPuesto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<"masculino" | "femenino">("masculino");
  const [tipoInstitucion, setTipoInstitucion] = useState<
    "sin" | "plan_trifinio" | "otras"
  >("sin");
  const [institucionOtra, setInstitucionOtra] = useState("");

  useEffect(() => {
    if (!registro) return;
    setDpi(registro.dpi);
    setNombre(registro.nombre);
    setEmail(registro.email ?? "");
    setTelefono(registro.telefono ?? "");
    setPuesto(registro.puesto ?? "");
    setFechaNacimiento(normalizarFechaInput(registro.fecha_nacimiento));
    setGenero(registro.genero);
    const { tipo, otra } = institucionDesdeRegistro(registro.institucion);
    setTipoInstitucion(tipo);
    setInstitucionOtra(otra);
  }, [registro]);

  const handleClose = () => {
    if (editar.isPending) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registro) return;

    const parsed = registroEditSchema.safeParse({
      id: registro.id,
      actividad_id: actividadId,
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

    const res = await editar.mutateAsync(parsed.data);
    if (res.success) {
      toast.success("Registro actualizado.");
      onClose();
    } else {
      toast.error(
        actionErrorMessage(res, "No se pudo actualizar el registro."),
        { autoClose: res.detail ? 8000 : 3000 },
      );
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Editar registro"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <ModalLabel htmlFor="edit-dpi">DPI</ModalLabel>
          <ModalInput
            id="edit-dpi"
            inputMode="numeric"
            value={dpi}
            onChange={(e) => setDpi(normalizarDpiInput(e.target.value))}
            maxLength={13}
            required
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-nombre">Nombre completo</ModalLabel>
          <ModalInput
            id="edit-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-email">
            Correo electrónico (opcional)
          </ModalLabel>
          <ModalInput
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-telefono">Teléfono (opcional)</ModalLabel>
          <ModalInput
            id="edit-telefono"
            type="tel"
            inputMode="numeric"
            value={telefono}
            onChange={(e) =>
              setTelefono(normalizarTelefonoInput(e.target.value))
            }
            maxLength={8}
          />
          <p className="text-xs text-muted-foreground">8 dígitos</p>
        </div>

        <CamposInstitucionPuesto
          tipoInstitucion={tipoInstitucion}
          institucionOtra={institucionOtra}
          puesto={puesto}
          onTipoInstitucionChange={setTipoInstitucion}
          onInstitucionOtraChange={setInstitucionOtra}
          onPuestoChange={setPuesto}
          selectId="edit-institucion"
          puestoId="edit-puesto"
          otraId="edit-institucion-otra"
        />

        <div className="space-y-2">
          <ModalLabel htmlFor="edit-fecha-nac">Fecha de nacimiento</ModalLabel>
          <FechaNacimientoCampos
            value={fechaNacimiento}
            onChange={setFechaNacimiento}
            required
            diaId="edit-fecha-nac-dia"
            mesId="edit-fecha-nac-mes"
            anioId="edit-fecha-nac-anio"
          />
        </div>

        <div className="space-y-2">
          <ModalLabel htmlFor="genero-switch-edit">Género</ModalLabel>
          <GeneroSwitch
            id="genero-switch-edit"
            value={genero}
            onChange={setGenero}
          />
        </div>

        <ModalFooter>
          <ModalCancelButton onClick={handleClose} disabled={editar.isPending} />
          <ModalSubmit disabled={editar.isPending || !fechaNacimiento} />
        </ModalFooter>
      </form>
    </ModalShell>
  );
}
