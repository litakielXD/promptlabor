import sharp from "sharp";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

type UploadValidation =
  | { valid: true }
  | { valid: false; error: string };

type PreparedUpload =
  | { valid: true; buffer: Buffer; filename: string }
  | { valid: false; error: string };

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function validateImageFile(file: File): UploadValidation {
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

export async function prepareImageUpload(file: File): Promise<PreparedUpload> {
  const validation = validateImageFile(file);
  if (!validation.valid) return validation;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer, { animated: false }).metadata();

    if (!metadata.width || !metadata.height || !metadata.format) {
      return { valid: false, error: "Das Bild konnte nicht gelesen werden." };
    }

    const normalizedBuffer = await sharp(buffer, { animated: false })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    if (normalizedBuffer.length > MAX_IMAGE_BYTES) {
      return { valid: false, error: "Das optimierte Bild ist zu groß. Bitte lade ein kleineres Bild hoch." };
    }

    return {
      valid: true,
      buffer: normalizedBuffer,
      filename: safeImageFilename(file, "webp"),
    };
  } catch {
    return { valid: false, error: "Die Datei ist kein gültiges Bild." };
  }
}

export function safeImageFilename(file: File, extension = ALLOWED_IMAGE_TYPES.get(file.type) || "img") {
  const basename = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .slice(0, 80);

  return `${Date.now()}-${basename || "upload"}.${extension}`;
}
