"use client";

import { useState } from "react";
import {
  ModalField,
  ModalForm,
  ModalLabel,
  ModalShell,
  ModalTextarea,
  modalActionMessage,
  toast,
} from "@/components/ui/general-modal";
import { SigetActionButton, sigetAccent } from "@/components/ui/siget-action-button";
import { Ban, Check, X } from "lucide";
import { useRechazarDocumento } from "../lib/hooks";

export function RechazarDocumento({
  open,
  slug,
  onClose,
}: {
  open: boolean;
  slug: string;
  onClose: () => void;
}) {
  const rechazar = useRechazarDocumento();
  const [reason, setReason] = useState("");

  const handleClose = () => {
    if (rechazar.isPending) return;
    setReason("");
    onClose();
  };

  return (
    <ModalShell open={open} onClose={handleClose} title="Rechazar" maxWidth="max-w-lg">
      {open ? (
        <ModalForm
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await rechazar.mutateAsync({ slug, reason });
            if (!res.success) {
              toast.error(
                modalActionMessage(res.error ?? undefined, "No se pudo rechazar."),
              );
              return;
            }
            toast.success("Publicación rechazada.");
            setReason("");
            onClose();
          }}
        >
          <ModalField>
            <ModalLabel htmlFor="rejection_reason">Motivo</ModalLabel>
            <ModalTextarea
              id="rejection_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              autoFocus
            />
          </ModalField>
          <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <SigetActionButton
              label="Cancelar"
              accentColor={sigetAccent.cancelar}
              morphFrom={X}
              morphTo={X}
              morphOnHover={false}
              onClick={handleClose}
              disabled={rechazar.isPending}
              className="w-auto shrink-0"
            />
            <SigetActionButton
              type="submit"
              label="Rechazar"
              accentColor={sigetAccent.quitar}
              morphFrom={Ban}
              morphTo={Check}
              disabled={rechazar.isPending}
              className="w-auto shrink-0"
            />
          </div>
        </ModalForm>
      ) : null}
    </ModalShell>
  );
}
