import { Card, PageHead } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Nuevo producto" };

export default function NewProduct() {
  return (
    <>
      <PageHead title="Nuevo producto" back={{ href: "/admin/productos", label: "Productos" }} />
      <div className="max-w-3xl">
        <Card help="Después de crearlo podrás agregar colores, tallas, inventario y fotos.">
          <ProductForm />
        </Card>
      </div>
    </>
  );
}
