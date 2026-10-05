import { HomeSectionView } from "@/components/home-sections";
import { getLiveSections } from "@/lib/home";

export default async function HomePage() {
  const sections = await getLiveSections();
  if (!sections.length) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="h-section">Muy pronto</h1>
        <p className="mt-3 text-muted">Estamos preparando la tienda.</p>
      </div>
    );
  }
  return sections.map((s) => <HomeSectionView key={s.id} section={s} />);
}
