"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    ["días", Math.floor(s / 86400)],
    ["horas", Math.floor((s % 86400) / 3600)],
    ["min", Math.floor((s % 3600) / 60)],
    ["seg", s % 60],
  ] as const;
}

export function Countdown({ to, compact = false }: { to: string; compact?: boolean }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = parts(target - (now ?? target));
  const date = new Date(to).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
  return (
    <div>
      <div className={`flex gap-3 ${compact ? "" : "md:gap-5"}`} aria-label={`Disponible el ${date}`}>
        {p.map(([label, v]) => (
          <div key={label} className="text-center">
            <div className={`num font-black tabular-nums ${compact ? "text-2xl" : "text-4xl md:text-5xl"}`}>
              {now === null ? "--" : String(v).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase tracking-widest opacity-60">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs opacity-60">{date}</p>
    </div>
  );
}
