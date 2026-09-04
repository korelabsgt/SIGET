"use client";

import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { ModalInput } from "@/components/ui/general-modal";
import { aplicarMascaraEnInput, maskFechaHoraManual, maskFechaManual } from "./fechas-input";

type GvFechaInputBaseProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "autoComplete" | "placeholder" | "maxLength"
>;

function mergeMaskedChange(
  e: React.ChangeEvent<HTMLInputElement>,
  mask: (raw: string) => string,
  onChange?: ComponentProps<typeof Input>["onChange"],
) {
  aplicarMascaraEnInput(e.target, mask);
  onChange?.(e);
}

export const GvFechaInput = forwardRef<HTMLInputElement, GvFechaInputBaseProps>(
  function GvFechaInput({ className, onChange, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        className={className}
        onChange={(e) => mergeMaskedChange(e, maskFechaManual, onChange)}
        {...props}
      />
    );
  },
);

export const GvFechaHoraInput = forwardRef<HTMLInputElement, GvFechaInputBaseProps>(
  function GvFechaHoraInput({ className, onChange, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/AAAA HH:mm"
        maxLength={16}
        className={className}
        onChange={(e) => mergeMaskedChange(e, maskFechaHoraManual, onChange)}
        {...props}
      />
    );
  },
);

type GvModalFechaInputProps = Omit<
  ComponentProps<typeof ModalInput>,
  "type" | "inputMode" | "autoComplete" | "placeholder" | "maxLength"
>;

export function GvModalFechaInput({ className, onChange, ...props }: GvModalFechaInputProps) {
  return (
    <ModalInput
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/AAAA"
      maxLength={10}
      className={className}
      onChange={(e) => mergeMaskedChange(e, maskFechaManual, onChange)}
      {...props}
    />
  );
}

export function GvModalFechaHoraInput({ className, onChange, ...props }: GvModalFechaInputProps) {
  return (
    <ModalInput
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/AAAA HH:mm"
      maxLength={16}
      className={className}
      onChange={(e) => mergeMaskedChange(e, maskFechaHoraManual, onChange)}
      {...props}
    />
  );
}
