"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  AtenderFallaSchema, 
  type AtenderFallaFormData, 
  SolventarFallaSchema, 
  type SolventarFallaFormData,
  type FallaRow,
  type MecanicoOption,
} from "../lib/zod";
import { useAtenderFalla, useSolventarFalla } from "../lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Wrench, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VerEditar({ 
  falla, 
  mecanicos,
  isAuthorized 
}: { 
  falla: FallaRow; 
  mecanicos: MecanicoOption[];
  isAuthorized: boolean;
}) {
  const [open, setOpen] = useState(false);
  const atender = useAtenderFalla();
  const solventar = useSolventarFalla();

  const isPendiente = falla.estado === "PENDIENTE";
  const isEnReparacion = falla.estado === "EN_REPARACION";

  const formAtender = useForm<AtenderFallaFormData>({
    resolver: zodResolver(AtenderFallaSchema),
    defaultValues: {
      falla_id: falla.id,
      mecanico_id: "",
      taller_externo: "",
    },
  });

  const formSolventar = useForm<SolventarFallaFormData>({
    resolver: zodResolver(SolventarFallaSchema),
    defaultValues: {
      falla_id: falla.id,
      diagnostico: "",
      reparacion_detalle: "",
    },
  });

  if (!isAuthorized) return null;
  if (falla.estado === "SOLVENTADA") return null;

  async function onAtender(data: AtenderFallaFormData) {
    try {
      await atender.mutateAsync(data);
      toast.success("Vehículo en reparación.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la avería.");
    }
  }

  async function onSolventar(data: SolventarFallaFormData) {
    try {
      await solventar.mutateAsync(data);
      toast.success("Avería solventada exitosamente.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al solventar la avería.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isPendiente ? (
          <Button variant="outline" size="sm" className="gap-2 text-orange-600 border-orange-600 hover:bg-orange-50">
            <Wrench className="w-4 h-4" />
            Atender Falla
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-600 hover:bg-green-50">
            <CheckCircle className="w-4 h-4" />
            Marcar Solventada
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isPendiente ? "Iniciar Reparación" : "Finalizar Reparación"}
          </DialogTitle>
        </DialogHeader>

        {isPendiente && (
          <Form {...formAtender}>
            <form onSubmit={formAtender.handleSubmit(onAtender)} className="space-y-4 mt-4">
              <FormField
                control={formAtender.control}
                name="mecanico_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar Mecánico Interno</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-white dark:bg-zinc-950">
                          <SelectValue placeholder="Seleccione un mecánico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="bg-white dark:bg-zinc-950 border border-border shadow-md z-[100]">
                        {mecanicos.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center text-sm text-zinc-500 font-medium">O</div>

              <FormField
                control={formAtender.control}
                name="taller_externo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taller Externo (Si aplica)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del taller externo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={atender.isPending}>
                  {atender.isPending ? "Procesando..." : "Pasar a En Reparación"}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {isEnReparacion && (
          <Form {...formSolventar}>
            <form onSubmit={formSolventar.handleSubmit(onSolventar)} className="space-y-4 mt-4">
              <FormField
                control={formSolventar.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico Técnico</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Diagnóstico encontrado..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formSolventar.control}
                name="reparacion_detalle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalle de la Reparación y Repuestos</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Repuestos utilizados, trabajos realizados..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={solventar.isPending} className="bg-green-600 hover:bg-green-700">
                  {solventar.isPending ? "Guardando..." : "Solventar Avería"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
