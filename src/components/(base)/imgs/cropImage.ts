export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export async function cropImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  options?: { fillWhite?: boolean },
): Promise<Blob> {
  const fillWhite = options?.fillWhite !== false;
  const px = {
    x: Math.round(pixelCrop.x),
    y: Math.round(pixelCrop.y),
    width: Math.max(1, Math.round(pixelCrop.width)),
    height: Math.max(1, Math.round(pixelCrop.height)),
  };

  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener el contexto del canvas");

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) {
    throw new Error("No se pudo obtener el contexto del canvas recortado");
  }

  croppedCanvas.width = px.width;
  croppedCanvas.height = px.height;

  if (fillWhite) {
    croppedCtx.fillStyle = "#ffffff";
    croppedCtx.fillRect(0, 0, px.width, px.height);
  }

  croppedCtx.drawImage(
    canvas,
    px.x,
    px.y,
    px.width,
    px.height,
    0,
    0,
    px.width,
    px.height,
  );

  return new Promise((resolve, reject) => {
    const mime = fillWhite ? "image/jpeg" : "image/png";
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Error al generar la imagen recortada"));
          return;
        }
        resolve(blob);
      },
      mime,
      fillWhite ? 0.92 : undefined,
    );
  });
}

/** Recorta centrado un archivo al aspecto indicado (ancho/alto) y devuelve un JPEG. */
export async function autoCropFileToAspect(
  file: File,
  aspect: number,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await createImage(url);
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;

    let cw = iw;
    let ch = ih;
    if (iw / ih > aspect) {
      cw = Math.round(ih * aspect);
      ch = ih;
    } else {
      cw = iw;
      ch = Math.round(iw / aspect);
    }

    const sx = Math.max(0, Math.round((iw - cw) / 2));
    const sy = Math.max(0, Math.round((ih - ch) / 2));

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto del canvas");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(image, sx, sy, cw, ch, 0, 0, cw, ch);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Error al procesar la imagen")),
        "image/jpeg",
        0.92,
      );
    });

    return new File([blob], "imagen.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
