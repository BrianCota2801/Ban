import "server-only";
import { randomBytes } from "node:crypto";
import { StorageClient } from "@supabase/storage-js";
import { IMAGE_TYPES, MAX_IMAGE_MB, MAX_VIDEO_MB, VIDEO_TYPES } from "./media-url";

const BUCKET = "ban-media";

/** Supabase Storage se activa con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Sin ellas, las fotos se guardan en la base. */
export function storageEnabled() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function client() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return new StorageClient(`${process.env.SUPABASE_URL!.replace(/\/$/, "")}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
}

let bucketReady: Promise<void> | null = null;
function ensureBucket() {
  return (bucketReady ??= (async () => {
    const c = client();
    const { data } = await c.getBucket(BUCKET);
    if (data) return;
    const { error } = await c.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_VIDEO_MB}MB`,
      allowedMimeTypes: [...IMAGE_TYPES, ...VIDEO_TYPES],
    });
    if (error && !/exist/i.test(error.message)) {
      bucketReady = null;
      throw new Error(`No se pudo crear el bucket de medios: ${error.message}`);
    }
  })());
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export class UploadRequestError extends Error {}

/** Prepara una subida directa del navegador a Supabase: devuelve la URL firmada y la URL pública final. */
export async function createSignedUpload(type: string, size: number) {
  const isImg = IMAGE_TYPES.includes(type);
  const isVid = VIDEO_TYPES.includes(type);
  if (!isImg && !isVid) throw new UploadRequestError("Formato no válido. Usa JPG, PNG, WebP, AVIF, MP4, WebM o MOV.");
  const max = (isImg ? MAX_IMAGE_MB : MAX_VIDEO_MB) * 1024 * 1024;
  if (size > max) throw new UploadRequestError(`El archivo pesa más de ${isImg ? MAX_IMAGE_MB : MAX_VIDEO_MB} MB.`);

  await ensureBucket();
  const month = new Date().toISOString().slice(0, 7);
  const path = `${isImg ? "img" : "video"}/${month}/${randomBytes(12).toString("hex")}.${EXT[type]}`;
  const { data, error } = await client().from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Supabase no generó la URL de subida: ${error?.message}`);
  const publicUrl = client().from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { signedUrl: data.signedUrl, publicUrl };
}
