import Link from "next/link";

export function PageHead({ title, children, back }: { title: string; children?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="text-xs text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function Card({ title, children, help }: { title?: string; help?: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-white p-5 md:p-6">
      {title && <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>}
      {help && <p className="help mt-1">{help}</p>}
      <div className={title ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function Input({
  label,
  name,
  help,
  className = "",
  ...rest
}: { label: string; name: string; help?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <input id={`f-${name}`} name={name} className="input" {...rest} />
      {help && <p className="help">{help}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  help,
  className = "",
  ...rest
}: { label: string; name: string; options: [string, string][]; help?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <select id={`f-${name}`} name={name} className="input" {...rest}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {help && <p className="help">{help}</p>}
    </div>
  );
}

export function Textarea({ label, name, help, ...rest }: { label: string; name: string; help?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="field">
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <textarea id={`f-${name}`} name={name} className="input" {...rest} />
      {help && <p className="help">{help}</p>}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "muted" | "ink"; children: React.ReactNode }) {
  const c = { ok: "border-ok text-ok", warn: "border-warn text-warn", muted: "border-line text-muted", ink: "border-ink bg-ink text-white" }[tone];
  return <span className={`inline-block whitespace-nowrap border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${c}`}>{children}</span>;
}

export const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted";
export const td = "px-3 py-3 align-middle";
