"use client";

import { useState, useTransition } from "react";
import { addProductImages } from "@/app/admin/actions";
import { uploadFile } from "./upload";

/** Sube varias fotos (o videos cortos) del producto y las agrega en el color elegido. */
export function ProductImageUploader({ productId, colors }: { productId: string; colors: string[] }) {
  const [color, setColor] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setStatus(null);
    const urls: string[] = [];
    try {
      for (const [i, f] of [...files].entries()) {
        await uploadFile(f, (p) => setProgress(`Subiendo ${i + 1} de ${files.length} · ${p}%`)).then((u) => urls.push(u));
      }
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "No se pudo subir." });
    }
    setProgress(null);
    if (!urls.length) return;
    const fd = new FormData();
    fd.append("productId", productId);
    fd.append("color", color);
    urls.forEach((u) => fd.append("urls", u));
    start(async () => {
      const res = await addProductImages(null, fd);
      setStatus({ ok: !!res?.ok, text: res?.message ?? "" });
    });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="field">
          <label htmlFor="img-color" className="label">Color de estas fotos</label>
          <select id="img-color" className="input" value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="">Todos los colores</option>
            {colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className={`btn cursor-pointer ${progress || pending ? "pointer-events-none opacity-50" : ""}`}>
          {progress ?? (pending ? "Guardando…" : "Subir fotos")}
          <input
            type="file"
            multiple
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="help">Vertical 4:5 con fondo claro. Puedes elegir varias a la vez. También acepta videos cortos (con Supabase Storage).</p>
      {status && <p className={status.ok ? "text-sm font-bold text-ok" : "error"}>{status.text}</p>}
    </div>
  );
}
