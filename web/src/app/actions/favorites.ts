"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toggleFavoriteFor } from "@/lib/favorites";

export async function toggleFavorite(productId: string): Promise<boolean | null> {
  const id = z.string().uuid().safeParse(productId);
  if (!id.success) return null;
  try {
    const on = await toggleFavoriteFor(id.data);
    revalidatePath("/favoritos");
    return on;
  } catch {
    return null; // p. ej. el producto ya no existe
  }
}
