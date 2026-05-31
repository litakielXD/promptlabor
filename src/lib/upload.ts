export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Nur JPG, PNG, WebP oder GIF sind erlaubt.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: "Das Bild darf maximal 4 MB groß sein.",
    };
  }

  return { valid: true };
}

export function safeImageFilename(file: File) {
  const extension = ALLOWED_IMAGE_TYPES.get(file.type) || "img";
  const basename = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .slice(0, 80);

  return `${Date.now()}-${basename || "upload"}.${extension}`;
}
