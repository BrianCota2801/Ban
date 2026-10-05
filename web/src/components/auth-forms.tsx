"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword, login, register } from "@/app/actions/auth";

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="error">{msg}</p> : null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="field">
        <label htmlFor="email" className="label">Correo</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" defaultValue={state?.values?.email} />
      </div>
      <div className="field">
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state?.message && <p className="error" role="alert">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, null);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="field">
        <label htmlFor="name" className="label">Nombre</label>
        <input id="name" name="name" required autoComplete="name" className="input" defaultValue={state?.values?.name} />
        <Err msg={e.name} />
      </div>
      <div className="field">
        <label htmlFor="email" className="label">Correo</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" defaultValue={state?.values?.email} />
        <Err msg={e.email} />
      </div>
      <div className="field">
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
        <p className="help">Mínimo 10 caracteres. Una frase fácil de recordar funciona bien.</p>
        <Err msg={e.password} />
      </div>
      <div className="field">
        <label htmlFor="confirm" className="label">Repite la contraseña</label>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
        <Err msg={e.confirm} />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-black" />
        <span>
          Acepto los <Link href="/ayuda/terminos" className="link">términos y condiciones</Link> y el{" "}
          <Link href="/ayuda/privacidad" className="link">aviso de privacidad</Link>.
        </span>
      </label>
      <Err msg={e.terms} />
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid max-w-md gap-4">
      <div className="field">
        <label htmlFor="current" className="label">Contraseña actual</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
        <Err msg={e.current} />
      </div>
      <div className="field">
        <label htmlFor="password" className="label">Nueva contraseña</label>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
        <Err msg={e.password} />
      </div>
      <div className="field">
        <label htmlFor="confirm" className="label">Repite la nueva contraseña</label>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
        <Err msg={e.confirm} />
      </div>
      {state?.message && <p className={state.ok ? "text-sm font-bold text-ok" : "error"}>{state.message}</p>}
      <button type="submit" className="btn-outline" disabled={pending}>
        Cambiar contraseña
      </button>
    </form>
  );
}
