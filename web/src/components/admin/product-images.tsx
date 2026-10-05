"use client";

import { useState, useTransition } from "react";
import { addProductImages } from "@/app/admin/actions";
import { uploadFile } from "./upload";

/** Botón para subir varias fotos (o videos cortos) a un color del producto. */
export function ProductImageUploader({ productId, color, label }: { productId: string; color: string; label: string }) {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const id = `up-${color || "general"}`.replace(/\W+/g, "-");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setStatus(null);
    const urls: string[] = [];
    try {
      for (const [i, f] of [...files].entries()) {
        urls.push(await uploadFile(f, (p) => setProgress(`Subiendo ${i + 1} de ${files.length} · ${p}%`)));
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

  const busy = !!progress || pending;
  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className={`grid aspect-[4/5] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line bg-white p-3 text-center text-xs font-bold text-muted transition-colors hover:border-ink hover:text-ink ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <span>
          <span className="block text-2xl leading-none">+</span>
          {progress ?? (pending ? "Guardando…" : label)}
        </span>
      </label>
      <input
        id={id}
        type="file"
        multiple
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {status && <p className={status.ok ? "text-xs font-bold text-ok" : "text-xs text-sale"}>{status.text}</p>}
    </div>
  );
}
