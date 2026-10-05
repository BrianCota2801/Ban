// Utilidades de medios que sirven igual en el servidor y en el navegador.

/** Convierte lo guardado (id de la base, ruta /media/… o enlace https) en una URL usable. */
export function mediaSrc(v: string | null | undefined): string | null {
  if (!v) return null;
  if (v.startsWith("https://") || v.startsWith("/media/")) return v;
  if (/^[0-9a-f-]{36}$/i.test(v)) return `/media/${v}`;
  return null;
}

export function isVideo(url: string | null | undefined) {
  return !!url && /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 50;
/** Límite de Vercel para subidas que pasan por la página (sin Supabase Storage). */
export const MAX_LOCAL_MB = 4;
