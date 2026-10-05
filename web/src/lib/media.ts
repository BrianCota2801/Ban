import "server-only";
import { db } from "@/db";
import { media } from "@/db/schema";

const MAX_BYTES = 5 * 1024 * 1024;

/** Revisa los primeros bytes del archivo para no confiar en la extensión ni en el tipo que manda el navegador. */
function sniff(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (b.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(b.toString("ascii", 8, 12))) return "image/avif";
  return null;
}

export class UploadError extends Error {}

/** Guarda una imagen subida y devuelve su id, o null si no se envió archivo. */
export async function saveImage(file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new UploadError("La imagen pesa más de 5 MB. Redúcela e inténtalo de nuevo.");
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime) throw new UploadError("Formato no válido. Usa JPG, PNG, WebP o AVIF.");
  const [row] = await db
    .insert(media)
    .values({ mime, filename: file.name.slice(0, 200), size: buf.length, data: buf })
    .returning({ id: media.id });
  return row.id;
}
