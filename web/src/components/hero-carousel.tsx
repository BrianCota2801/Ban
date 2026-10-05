"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { isVideo, mediaSrc } from "@/lib/media-url";
import { ArrowIcon, PauseIcon, PlayIcon } from "./icons";
import { TeeArt } from "./tee-art";

type Slide = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  media: string;
  mobileMedia: string;
  background: string;
  tone: "light" | "dark";
  position: "bottom-left" | "center-left" | "center" | "bottom-center";
  overlay: number;
};

const HEIGHT = {
  full: "h-[calc(100svh-7rem)] min-h-[520px]",
  large: "h-[78svh] min-h-[480px] max-h-[860px]",
  medium: "h-[58svh] min-h-[400px] max-h-[640px]",
  small: "h-[40svh] min-h-[300px] max-h-[440px]",
};

const POSITION = {
  "bottom-left": "items-start justify-end text-left",
  "center-left": "items-start justify-center text-left",
  center: "items-center justify-center text-center",
  "bottom-center": "items-center justify-end text-center",
};

export function HeroCarousel({
  slides,
  height,
  autoplay,
  inset,
  priority = false,
}: {
  slides: Slide[];
  height: keyof typeof HEIGHT;
  autoplay: number;
  inset: boolean;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const many = slides.length > 1;

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!many || !playing || autoplay <= 0) return;
    const t = setTimeout(() => go(index + 1), autoplay * 1000);
    return () => clearTimeout(t);
  }, [index, playing, autoplay, many, go]);

  // El botón de pausa también detiene los videos.
  useEffect(() => {
    root.current?.querySelectorAll("video").forEach((v) => (playing ? v.play().catch(() => {}) : v.pause()));
  }, [playing, index]);

  const hasVideo = slides.some((s) => isVideo(s.media) || isVideo(s.mobileMedia));

  return (
    <section className={inset ? "container-x pt-4" : ""} aria-roledescription={many ? "carrusel" : undefined}>
      <div
        ref={root}
        className={`relative overflow-hidden ${HEIGHT[height] ?? HEIGHT.large} ${inset ? "r-card" : ""}`}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || !many) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {slides.map((s, i) => (
          <SlideView key={i} s={s} active={i === index} eager={priority && i === 0} label={many ? `${i + 1} de ${slides.length}` : undefined} />
        ))}

        {(many || hasVideo) && (
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 md:bottom-8 md:right-8">
            {many && (
              <>
                <button type="button" onClick={() => go(index - 1)} aria-label="Anterior" className="hidden h-10 w-10 place-items-center rounded-full bg-white/85 text-ink backdrop-blur hover:bg-white md:grid">
                  <ArrowIcon dir="left" />
                </button>
                <div className="flex gap-1.5 rounded-full bg-black/25 px-3 py-2 backdrop-blur">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Ir a la diapositiva ${i + 1}`}
                      aria-current={i === index}
                      onClick={() => go(i)}
                      className={`h-2 rounded-full bg-white transition-all ${i === index ? "w-6" : "w-2 opacity-60"}`}
                    />
                  ))}
                </div>
                <button type="button" onClick={() => go(index + 1)} aria-label="Siguiente" className="hidden h-10 w-10 place-items-center rounded-full bg-white/85 text-ink backdrop-blur hover:bg-white md:grid">
                  <ArrowIcon />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pausar" : "Reproducir"}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-black/20 text-white backdrop-blur hover:bg-black/40"
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SlideView({ s, active, eager, label }: { s: Slide; active: boolean; eager: boolean; label?: string }) {
  const desktop = mediaSrc(s.media);
  const mobile = mediaSrc(s.mobileMedia);
  const light = s.tone === "light";
  const ov = Math.min(70, Math.max(0, s.overlay)) / 100;

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ${active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
      style={{ background: s.background || "#e9e7e2" }}
      aria-hidden={!active}
      role={label ? "group" : undefined}
      aria-roledescription={label ? "diapositiva" : undefined}
      aria-label={label}
    >
      {desktop && <Media src={desktop} className={mobile ? "hidden md:block" : ""} eager={eager} />}
      {mobile && <Media src={mobile} className="md:hidden" eager={eager} />}
      {!desktop && !mobile && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 items-center justify-center md:flex" aria-hidden="true">
          <TeeArt fit="oversize" color={light ? "#2a2a2a" : "#fafafa"} className="h-[80%]" />
        </div>
      )}
      {ov > 0 && (
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(0,0,0,${ov}), rgba(0,0,0,${ov * 0.35}))` }} />
      )}
      <div className={`container-x relative flex h-full flex-col pb-20 pt-12 md:pb-24 ${POSITION[s.position] ?? POSITION["bottom-left"]} ${light ? "text-white" : "text-ink"}`}>
        {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
        {s.heading && (
          <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight [font-stretch:110%] md:text-7xl">{s.heading}</h2>
        )}
        {s.subheading && <p className="mt-4 max-w-xl text-base md:text-lg">{s.subheading}</p>}
        {s.ctaLabel && s.ctaHref && (
          <Link href={s.ctaHref} tabIndex={active ? 0 : -1} className={`mt-7 ${light ? "btn bg-white! text-ink!" : "btn"}`}>
            {s.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function Media({ src, className, eager }: { src: string; className: string; eager: boolean }) {
  return isVideo(src) ? (
    <video src={src} className={`absolute inset-0 h-full w-full object-cover ${className}`} autoPlay muted loop playsInline preload={eager ? "auto" : "metadata"} />
  ) : (
    <img src={src} alt="" className={`absolute inset-0 h-full w-full object-cover ${className}`} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} />
  );
}
