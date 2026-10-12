export type NoticiaVideoEmbed = {
  provider: "youtube" | "facebook";
  src: string;
  vertical: boolean;
  thumbnailSrc: string | null;
};

const VIDEO_POSTER_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect fill="#18181b" width="1600" height="900"/></svg>`,
  );

const YOUTUBE_ID = /^[\w-]{11}$/;

function hostSinWww(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function youtubeIdDesdeUrl(url: URL): string | null {
  const host = hostSinWww(url.hostname);
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }
  if (
    host !== "youtube.com" &&
    host !== "m.youtube.com" &&
    host !== "music.youtube.com" &&
    host !== "youtube-nocookie.com"
  ) {
    return null;
  }
  const v = url.searchParams.get("v");
  if (v && YOUTUBE_ID.test(v)) return v;
  const parts = url.pathname.split("/").filter(Boolean);
  const kind = parts[0] ?? "";
  if (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") {
    const id = parts[1] ?? "";
    if (YOUTUBE_ID.test(id)) return id;
  }
  return null;
}

function youtubeEsVertical(url: URL): boolean {
  return url.pathname.split("/").filter(Boolean)[0] === "shorts";
}

function esHostFacebook(hostname: string): boolean {
  const host = hostSinWww(hostname);
  return (
    host === "facebook.com" ||
    host === "m.facebook.com" ||
    host === "web.facebook.com" ||
    host === "fb.watch" ||
    host === "m.fb.watch"
  );
}

function facebookEsVertical(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  return path.includes("/reel/") || path.includes("/reels/");
}

function facebookHrefValido(url: URL): string | null {
  if (!esHostFacebook(url.hostname)) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const path = url.pathname.toLowerCase();
  if (path.includes("/plugins/video.php")) {
    const href = url.searchParams.get("href");
    if (!href) return null;
    try {
      return facebookHrefValido(new URL(href));
    } catch {
      return null;
    }
  }

  const host = hostSinWww(url.hostname);
  if (host === "fb.watch" || host === "m.fb.watch") {
    return url.href;
  }

  const esVideo =
    path.includes("/videos/") ||
    path.includes("/watch") ||
    path.includes("/reel/") ||
    path.includes("/reels/") ||
    path.includes("/share/v/") ||
    path.includes("/share/r/") ||
    path.includes("/share/video/");
  if (!esVideo) return null;
  return url.href;
}

function extraerUrlPegada(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("<")) return trimmed;
  const src = trimmed.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  return src ? src.replace(/&amp;/g, "&") : trimmed;
}

export function parsearVideoNoticia(
  raw: string | null | undefined,
): NoticiaVideoEmbed | null {
  const trimmed = extraerUrlPegada(raw?.trim() ?? "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const youtubeId = youtubeIdDesdeUrl(url);
    if (youtubeId) {
      return {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`,
        vertical: youtubeEsVertical(url),
        thumbnailSrc: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      };
    }
    const facebookHref = facebookHrefValido(url);
    if (facebookHref) {
      const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookHref)}&show_text=false`;
      return {
        provider: "facebook",
        src,
        vertical: facebookEsVertical(url),
        thumbnailSrc: null,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function normalizarVideoNoticia(
  raw: string | null | undefined,
): string | null {
  const trimmed = raw?.trim() || null;
  if (!trimmed) return null;
  return parsearVideoNoticia(trimmed) ? trimmed : null;
}

export function miniaturaVideoNoticia(
  embed: NoticiaVideoEmbed,
  posterSrc?: string | null,
): string {
  return embed.thumbnailSrc ?? posterSrc ?? VIDEO_POSTER_FALLBACK;
}
