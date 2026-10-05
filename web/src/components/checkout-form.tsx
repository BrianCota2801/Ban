"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/actions/checkout";
import { MX_STATES } from "@/lib/mx";

type Props = { email: string; name: string; payLabel: string };

export function CheckoutForm({ email, name, payLabel }: Props) {
  const [state, action, pending] = useActionState(placeOrder, null);
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} className="grid gap-8" noValidate>
      <fieldset className="grid gap-4">
        <legend className="h-section mb-4">Contacto</legend>
        <Field id="email" label="Correo" type="email" autoComplete="email" required error={e.email} defaultValue={v.email ?? email} />
        <p className="help -mt-2">Aquí te enviaremos la confirmación y el número de guía.</p>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="h-section mb-4">Envío</legend>
        <Field id="name" label="Nombre y apellido" autoComplete="name" required error={e.name} defaultValue={v.name ?? name} />
        <Field id="phone" label="Teléfono" type="tel" autoComplete="tel" inputMode="tel" placeholder="631 123 4567" required error={e.phone} defaultValue={v.phone} />
        <Field id="street" label="Calle y número" autoComplete="address-line1" required error={e.street} defaultValue={v.street} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="neighborhood" label="Colonia" autoComplete="address-line2" required error={e.neighborhood} defaultValue={v.neighborhood} />
          <Field id="zip" label="Código postal" autoComplete="postal-code" inputMode="numeric" maxLength={5} required error={e.zip} defaultValue={v.zip} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label="Ciudad o municipio" autoComplete="address-level2" required error={e.city} defaultValue={v.city} />
          <div className="field">
            <label htmlFor="state" className="label">Estado</label>
            <select key={v.state ?? ""} id="state" name="state" className="input" defaultValue={v.state ?? ""} autoComplete="address-level1" required>
              <option value="" disabled>Elige…</option>
              {MX_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {e.state && <p className="error">{e.state}</p>}
          </div>
        </div>
        <div className="field">
          <label htmlFor="notes" className="label">Referencias (opcional)</label>
          <textarea id="notes" name="notes" className="input" maxLength={300} defaultValue={v.notes} placeholder="Entre calles, color de la casa…" />
        </div>
      </fieldset>

      {state?.message && <p className="error" role="alert">{state.message}</p>}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Procesando…" : payLabel}
      </button>
    </form>
  );
}

function Field({ id, label, error, ...rest }: { id: string; label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} className="input" aria-invalid={!!error} {...rest} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
