"use client";

import { useRef, useState } from "react";
import { isVideo, mediaSrc } from "@/lib/media-url";
import { uploadFile } from "./upload";

/**
 * Campo de foto o video para el panel: sube el archivo, o acepta un enlace, y guarda la URL en un input oculto.
 */
export function MediaField({
  label,
  name,
  defaultValue,
  allowVideo = false,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  allowVideo?: boolean;
  help?: string;
}) {
  const [value, setValue] = useState(mediaSrc(defaultValue) ?? "");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const id = `m-${name}`;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      setValue(await uploadFile(file, setProgress));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir.");
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="field">
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-tile">
          {value ? (
            isVideo(value) ? (
              <video src={value} muted playsInline loop autoPlay className="h-full w-full object-cover" />
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="px-2 text-center text-[11px] text-muted">Sin {allowVideo ? "foto ni video" : "foto"}</span>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <label htmlFor={id} className="btn-outline btn-sm cursor-pointer">
              {progress !== null ? `Subiendo ${progress}%` : value ? "Cambiar" : allowVideo ? "Subir foto o video" : "Subir foto"}
            </label>
            <input
              ref={fileRef}
              id={id}
              type="file"
              className="sr-only"
              disabled={progress !== null}
              accept={allowVideo ? "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif"}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button type="button" className="btn-outline btn-sm" onClick={() => setShowLink((v) => !v)}>
              Pegar enlace
            </button>
            {value && (
              <button type="button" className="btn-sm text-xs text-sale underline underline-offset-4" onClick={() => setValue("")}>
                Quitar
              </button>
            )}
          </div>
          {progress !== null && (
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-ink transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
      {showLink && (
        <input
          className="input"
          placeholder={allowVideo ? "https://…/video.mp4 o https://…/foto.jpg" : "https://…/foto.jpg"}
          defaultValue={value.startsWith("https://") ? value : ""}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (!v) return;
            if (!v.startsWith("https://")) return setError("El enlace debe empezar con https://");
            setError(null);
            setValue(v);
          }}
        />
      )}
      <p className="help">
        {help ??
          (allowVideo
            ? "Foto (JPG, PNG, WebP) o video corto (MP4 o WebM, sin sonido, máx. 50 MB)."
            : "JPG, PNG, WebP o AVIF.")}
      </p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
