"use client";

import { useActionState, useRef, startTransition, useEffect } from "react";
import type { FormState } from "@/lib/forms";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/**
 * Formulario del panel: envía sin recargar, muestra el resultado y no borra lo escrito si hay errores.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Guardar",
  className = "grid gap-5",
  resetOnSuccess = false,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok || !ref.current) return;
    ref.current.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((i) => (i.value = ""));
    if (resetOnSuccess) ref.current.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-sm h-10 px-5" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </button>
        {state?.message && (
          <p role="status" className={state.ok ? "text-sm font-bold text-ok" : "error"}>
            {state.message}
          </p>
        )}
      </div>
      {state?.errors && (
        <ul className="grid gap-1 text-sm text-sale">
          {Object.entries(state.errors).map(([k, v]) => (
            <li key={k}>• {v}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
