import { getCurrentUser } from "@/lib/auth";
import { saveImage, UploadError } from "@/lib/media";

// Subida de fotos a la base cuando no hay Supabase Storage. Solo admins y solo desde el mismo sitio.
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: "Origen no permitido." }, { status: 403 });
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "No autorizado." }, { status: 401 });

  try {
    const id = await saveImage((await req.formData()).get("file"));
    if (!id) return Response.json({ error: "No se recibió archivo." }, { status: 400 });
    return Response.json({ url: `/media/${id}` });
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
