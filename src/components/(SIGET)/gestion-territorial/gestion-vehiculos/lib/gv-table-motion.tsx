"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

import { useGvSection, type GvSubmoduloId } from "./tab-context";

export const GV_TABLE_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export function gvTableMotionTransition(reduced: boolean) {
  return reduced ? { duration: 0 } : { duration: 0.36, ease: GV_TABLE_MOTION_EASE };
}

export function GvTableSectionMotion({
  panelId,
  children,
}: {
  panelId: GvSubmoduloId;
  children: ReactNode;
}) {
  const section = useGvSection()?.section;
  const active = section === panelId;
  const prefersReducedMotion = useReducedMotion();

  if (!active) return null;

  return (
    <motion.div
      key={panelId}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={gvTableMotionTransition(Boolean(prefersReducedMotion))}
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}

export function GvTableContentMotion({
  contentKey,
  children,
}: {
  contentKey: string;
  children: ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();
  const transition = gvTableMotionTransition(Boolean(prefersReducedMotion));

  return (
    <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-visible">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={contentKey}
          initial={prefersReducedMotion ? false : { opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, x: -18 }}
          transition={transition}
          className="flex min-h-full flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
