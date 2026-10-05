"use client";

import { prepareUpload } from "@/app/admin/actions";

/** Sube un archivo y devuelve su URL final. Reporta el avance de 0 a 100. */
export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const plan = await prepareUpload(file.type, file.size);
  if (plan.mode === "error") throw new Error(plan.message);

  if (plan.mode === "local") {
    const fd = new FormData();
    fd.append("file", file);
    const res = await send("POST", "/api/admin/upload", fd, onProgress);
    const json = JSON.parse(res || "{}") as { url?: string; error?: string };
    if (!json.url) throw new Error(json.error ?? "No se pudo subir la foto.");
    return json.url;
  }

  // Subida directa a Supabase Storage con la URL firmada (no pasa por Vercel, así no hay límite de 4.5 MB).
  const fd = new FormData();
  fd.append("cacheControl", "31536000");
  fd.append("", file);
  await send("PUT", plan.signedUrl, fd, onProgress, { "x-upsert": "false" });
  return plan.publicUrl;
}

function send(method: string, url: string, body: FormData, onProgress?: (pct: number) => void, headers: Record<string, string> = {}) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
      else {
        let msg = `Error ${xhr.status} al subir.`;
        try {
          const j = JSON.parse(xhr.responseText);
          msg = j.error || j.message || msg;
        } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Se perdió la conexión al subir el archivo."));
    xhr.send(body);
  });
}
