import { desc } from "drizzle-orm";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

// Escapa celdas y evita que Excel interprete fórmulas (=, +, -, @).
function cell(v: string) {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response("No encontrado", { status: 404 });
  const rows = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
  const csv = ["correo,origen,fecha", ...rows.map((r) => [r.email, r.source, r.createdAt.toISOString()].map(cell).join(","))].join("\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="suscriptores-ban.csv"',
      "Cache-Control": "no-store",
    },
  });
}
