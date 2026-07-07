const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function normalizeImageMimeType(file: Pick<File, "type" | "name">): string {
  if (ALLOWED_IMAGE_MIME_TYPES.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (/\.(jpe?g)$/.test(name)) return "image/jpeg";
  if (/\.png$/.test(name)) return "image/png";
  if (/\.webp$/.test(name)) return "image/webp";
  if (/\.hei[cf]$/.test(name)) return name.endsWith(".heif") ? "image/heif" : "image/heic";
  return file.type;
}
