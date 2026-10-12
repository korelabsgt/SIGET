"use client";

import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import {
  miniaturaVideoNoticia,
  parsearVideoNoticia,
} from "./lib/noticia-video";

export function NoticiaVideo({
  url,
  title,
  posterSrc,
}: {
  url: string | null | undefined;
  title: string;
  posterSrc?: string | null;
}) {
  const embed = parsearVideoNoticia(url);
  if (!embed) return null;

  return (
    <HeroVideoDialog
      className={embed.vertical ? "mx-auto max-w-sm" : undefined}
      animationStyle="top-in-bottom-out"
      videoSrc={embed.src}
      thumbnailSrc={miniaturaVideoNoticia(embed, posterSrc)}
      thumbnailAlt={title}
      vertical={embed.vertical}
    />
  );
}
