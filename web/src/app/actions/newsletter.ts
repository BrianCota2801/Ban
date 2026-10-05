"use server";

import { z } from "zod";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { str, type FormState } from "@/lib/forms";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200),
  source: z.string().max(80).regex(/^[a-z0-9:_-]+$/),
});

export async function joinList(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ email: str(fd, "email"), source: str(fd, "source") || "newsletter" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.insert(waitlist).values(parsed.data).onConflictDoNothing();
  return { ok: true, message: "Listo. Te avisaremos antes que a nadie." };
}
