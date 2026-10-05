/** Normaliza el nombre de un color para comparar ("Negro ", "negro" y "NEGRO" son el mismo). */
export function colorKey(v: string | null | undefined) {
  return (v ?? "").normalize("NFC").trim().toLowerCase();
}
