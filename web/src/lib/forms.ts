export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Valores enviados, para no borrar lo que la persona escribió cuando hay errores. */
  values?: Record<string, string>;
} | null;

export function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!errors[k]) errors[k] = i.message;
  }
  return errors;
}

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
