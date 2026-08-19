"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children, delayDuration = 200 }: { children: React.ReactNode; delayDuration?: number }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open } as any);
        }
        return child;
      })}
    </div>
  );
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return <span className="cursor-pointer">{children}</span>;
}

export function TooltipContent({
  className,
  children,
  open,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { open?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-50 shadow-md ring-1 ring-zinc-800 dark:bg-zinc-50 dark:text-zinc-900",
            className
          )}
          {...(props as any)}
        >
          {children}
          {/* Arrow */}
          <div className="absolute left-1/2 top-full -mt-[1px] h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-900 ring-1 ring-zinc-800 dark:bg-zinc-50 border-r border-b border-transparent"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
