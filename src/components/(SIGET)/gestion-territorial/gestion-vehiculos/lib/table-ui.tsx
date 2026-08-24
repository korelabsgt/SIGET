import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GestionVehiculosTableShell({
  toolbar,
  children,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-700 dark:bg-zinc-900/40",
        className,
      )}
    >
      {toolbar ? <div className="h-1 w-full bg-celeste-trifinio" /> : null}
      {toolbar ? (
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] md:items-center dark:border-zinc-700">
          {toolbar}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function GestionVehiculosTableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("overflow-x-auto", className)}>{children}</div>;
}

export function GestionVehiculosTable({
  minWidth = 980,
  children,
}: {
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <GestionVehiculosTableScroll>
      <table
        className="w-full text-left text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </GestionVehiculosTableScroll>
  );
}

export type GestionVehiculosThCell = {
  key: string;
  label: string;
  className?: string;
};

export function GestionVehiculosThead({ cells }: { cells: GestionVehiculosThCell[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-sky-50/80 text-[10px] font-bold uppercase tracking-widest text-celeste-trifinio dark:border-zinc-700 dark:bg-sky-950/30">{cells.map((cell) => (
        <th key={cell.key} className={cn("px-4 py-3", cell.className)}>
          {cell.label}
        </th>
      ))}</tr>
    </thead>
  );
}

export type GestionVehiculosTdCell = {
  key: string;
  content: ReactNode;
  className?: string;
};

export function GestionVehiculosTr({ cells }: { cells: GestionVehiculosTdCell[] }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-sky-50/40 dark:border-zinc-800 dark:hover:bg-sky-950/20">{cells.map((cell) => (
      <td key={cell.key} className={cn("px-4 py-3", cell.className)}>
        {cell.content}
      </td>
    ))}</tr>
  );
}

export function GestionVehiculosTableEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex size-10 items-center justify-center text-celeste-trifinio/70">
        {icon}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function GestionVehiculosTableLoading({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-20">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
