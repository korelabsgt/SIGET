import { NextResponse } from "next/server";
import {
  obtenerArchivoRepositorioPorSlug,
  registerDownloadAction,
} from "@/components/(SIGET)/repositorio/lib/actions";

function contentDisposition(filename: string, inline: boolean): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_") || "archivo";
  const encoded = encodeURIComponent(filename);
  const modo = inline ? "inline" : "attachment";
  return `${modo}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const forzarDescarga = new URL(request.url).searchParams.has("dl");
  const archivo = await obtenerArchivoRepositorioPorSlug(slug);
  if (!archivo) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (forzarDescarga) {
    await registerDownloadAction(slug);
  }

  return new NextResponse(archivo.body, {
    status: 200,
    headers: {
      "Content-Type": archivo.mime,
      "Content-Length": String(archivo.body.size),
      "Content-Disposition": contentDisposition(
        archivo.filename,
        archivo.inline && !forzarDescarga,
      ),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
