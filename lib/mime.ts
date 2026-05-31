/** MIME por extensão — fonte única usada pelo upload e pelo stream de preview. */
export const MIME_POR_EXT: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp", avif: "image/avif",
  heic: "image/heic", heif: "image/heif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  mkv: "video/x-matroska", m4v: "video/mp4", avi: "video/x-msvideo",
  mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg",
  pdf: "application/pdf",
  txt: "text/plain", md: "text/markdown", csv: "text/csv", json: "application/json",
  xml: "application/xml", yml: "text/yaml", yaml: "text/yaml", log: "text/plain",
  zip: "application/zip", rar: "application/vnd.rar", "7z": "application/x-7z-compressed",
};

export function extDe(nome: string): string {
  return (nome.split(".").pop() ?? "").toLowerCase();
}

/** Garante MIME real: usa o do browser quando bom, ou infere por extensão. */
export function resolverMime(fileType: string | null | undefined, ext: string): string {
  const tipo = (fileType ?? "").trim();
  // Se o MIME veio como fallback "application/<ext>" (ex: application/png),
  // sobrescreve pela inferência por extensão. Isso conserta arquivos antigos.
  const ehFallbackInvalido = tipo.startsWith("application/") &&
    !["application/pdf","application/json","application/zip","application/xml",
      "application/vnd.rar","application/x-7z-compressed","application/octet-stream"].includes(tipo);
  if (tipo && !ehFallbackInvalido) return tipo;
  return MIME_POR_EXT[ext] ?? tipo ?? "application/octet-stream";
}
