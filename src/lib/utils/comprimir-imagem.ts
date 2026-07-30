"use client";

const LADO_MAXIMO = 1200;
const QUALIDADE_JPEG = 0.82;

export async function comprimirImagem(arquivo: File): Promise<File> {
  const ehHeic =
    arquivo.type === "image/heic" ||
    arquivo.type === "image/heif" ||
    /\.(heic|heif)$/i.test(arquivo.name);

  if (ehHeic) {
    throw new Error(
      "Fotos em formato HEIC (padrão do iPhone) não são suportadas. No iPhone, vá em Ajustes > Câmera > Formatos e escolha 'Mais Compatível', ou envie a foto pelo WhatsApp Web antes."
    );
  }

  const bitmap = await createImageBitmap(arquivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) return arquivo;

  ctx.drawImage(bitmap, 0, 0, largura, altura);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE_JPEG)
  );
  if (!blob) return arquivo;

  const nomeSemExtensao = arquivo.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${nomeSemExtensao}.jpg`, { type: "image/jpeg" });
}