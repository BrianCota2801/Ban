"use client";

import { useActionState } from "react";
import { joinList } from "@/app/actions/newsletter";

export function NewsletterForm({ source = "newsletter", cta = "Suscribirme", dark = false }: { source?: string; cta?: string; dark?: boolean }) {
  const [state, action, pending] = useActionState(joinList, null);
  if (state?.ok) return <p className="text-sm font-bold">{state.message}</p>;
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="source" value={source} />
      <div className="flex">
        <label htmlFor={`nl-${source}`} className="sr-only">
          Correo electrónico
        </label>
        <input
          id={`nl-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          className={`input flex-1 ${dark ? "border-white/30 bg-transparent text-white placeholder:text-white/50 focus:border-white" : ""}`}
        />
        <button type="submit" disabled={pending} className={dark ? "btn bg-white text-ink" : "btn"}>
          {cta}
        </button>
      </div>
      {state?.message && <p className={dark ? "text-sm text-red-300" : "error"}>{state.message}</p>}
    </form>
  );
}
