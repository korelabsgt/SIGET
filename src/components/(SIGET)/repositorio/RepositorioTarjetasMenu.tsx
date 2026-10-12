"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { IconNode } from "lucide";
import { motion } from "framer-motion";
import { MorphHoverIcon } from "@/components/ui/morph-hover-icon";

export type RepositorioMenuCard = {
  id: string;
  href: string;
  badge: string;
  title: string;
  description: string;
  cta: string;
  iconFrom: IconNode;
  iconTo: IconNode;
  iconColor: string;
  accent: {
    border: string;
    ring: string;
    badge: string;
    button: string;
    check: string;
    iconBg: string;
  };
  features: { label: string; iconFrom: IconNode; iconTo: IconNode }[];
};

type RepositorioTarjetasMenuProps = {
  cards: RepositorioMenuCard[];
  gridClassName?: string;
};

export function RepositorioTarjetasMenu({
  cards,
  gridClassName = "grid-cols-1 gap-8 md:grid-cols-2",
}: RepositorioTarjetasMenuProps) {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className={`relative z-10 mx-auto mt-8 grid w-full ${gridClassName}`}>
      {cards.map((card) => (
        <div
          key={card.id}
          className={`group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border bg-card p-0 shadow-lg ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${card.accent.border} ${card.accent.ring}`}
          onMouseEnter={() => setHoveredCard(card.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => router.push(card.href)}
        >
          <div
            className={`py-2 text-center text-[10px] font-black uppercase tracking-widest text-white ${card.accent.badge}`}
          >
            {card.badge}
          </div>
          <div className="flex h-full flex-col px-5 py-8">
            <div className="mb-8 flex flex-col gap-3">
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${card.accent.iconBg}`}
                >
                  <MorphHoverIcon
                    from={card.iconFrom}
                    to={card.iconTo}
                    hovered={hoveredCard === card.id}
                    size={40}
                    color={card.iconColor}
                  />
                </div>
                <h3 className="min-w-0 text-2xl font-black leading-none text-slate-900 dark:text-white">
                  {card.title}
                </h3>
              </div>
              <p className="text-sm font-medium leading-snug text-slate-500 dark:text-slate-400">
                {card.description}
              </p>
            </div>
            <button
              type="button"
              className={`pointer-events-none mb-8 w-full cursor-pointer rounded-xl py-3.5 text-center text-sm font-bold text-white shadow-sm transition-colors ${card.accent.button}`}
            >
              {card.cta}
            </button>
            <ul className="mt-auto w-full space-y-4">
              {card.features.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center ${card.accent.check}`}
                  >
                    <MorphHoverIcon
                      from={feature.iconFrom}
                      to={feature.iconTo}
                      hovered={hoveredCard === card.id}
                      size={18}
                      color={card.iconColor}
                      spring="snappy"
                    />
                  </span>
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RepositorioMenuShell({
  children,
  encabezado,
}: {
  children: ReactNode;
  encabezado?: ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px] dark:bg-[radial-gradient(oklch(36%_0_0)_1px,transparent_1px)] opacity-60" />
      <div className="flex-1 w-full px-2 md:px-6 lg:px-12 max-w-[1600px] mx-auto pt-5 md:pt-8 pb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {encabezado}
          {children}
        </motion.div>
      </div>
    </>
  );
}
