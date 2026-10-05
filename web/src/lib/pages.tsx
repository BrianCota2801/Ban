import Link from "next/link";

type Page = { title: string; description: string; body: React.ReactNode };

const SIZE_CHART: Record<string, [string, number, number, number][]> = {
  // [talla, ancho de pecho, largo, manga] en cm, prenda extendida. Ajustar con las medidas reales del proveedor.
  Oversize: [["S", 56, 70, 22], ["M", 58, 72, 23], ["L", 61, 74, 24], ["XL", 64, 76, 25], ["XXL", 67, 78, 26]],
  Regular: [["S", 48, 69, 19], ["M", 51, 71, 20], ["L", 54, 73, 21], ["XL", 57, 75, 22], ["XXL", 60, 77, 23]],
  Boxy: [["S", 55, 62, 21], ["M", 57, 64, 22], ["L", 60, 66, 23], ["XL", 63, 68, 24], ["XXL", 66, 70, 25]],
};

const P = ({ children }: { children: React.ReactNode }) => <p className="leading-relaxed text-muted">{children}</p>;
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-6 text-lg font-bold">{children}</h2>;

export const PAGES: Record<string, Page> = {
  envios: {
    title: "Envíos",
    description: "Tiempos y costos de envío de BAN a todo México.",
    body: (
      <>
        <P>Enviamos a todo México desde Nogales, Sonora, con paqueterías nacionales. Preparamos tu pedido en 1 a 2 días hábiles.</P>
        <H>Tiempos estimados</H>
        <P>Ciudades principales: 2 a 5 días hábiles. Zonas extendidas: 5 a 8 días hábiles.</P>
        <H>Costo</H>
        <P>El costo se muestra en el carrito antes de pagar. Los pedidos que superan el monto indicado en la barra superior tienen envío gratis.</P>
        <H>Rastreo</H>
        <P>Cuando sale tu paquete te mandamos el número de guía por correo. También lo ves en <Link href="/cuenta" className="link">Mi cuenta</Link>.</P>
      </>
    ),
  },
  devoluciones: {
    title: "Cambios y devoluciones",
    description: "Política de cambios y devoluciones de BAN.",
    body: (
      <>
        <P>Tienes 30 días naturales desde que recibes tu pedido para pedir un cambio de talla o una devolución.</P>
        <H>Condiciones</H>
        <P>La prenda debe estar sin uso, sin lavar y con sus etiquetas. Las piezas de drops con descuento final no tienen devolución, solo cambio de talla si hay disponibilidad.</P>
        <H>Cómo hacerlo</H>
        <P>Escríbenos con tu número de pedido. Te mandamos una guía de regreso. El primer cambio de talla es gratis.</P>
        <H>Garantía BAN</H>
        <P>Si tu playera encoge más de 5 % o el cuello se deforma en su primer año de uso normal, te la cambiamos.</P>
      </>
    ),
  },
  "guia-de-tallas": {
    title: "Guía de tallas",
    description: "Medidas de las playeras BAN por corte: oversize, regular y boxy.",
    body: (
      <>
        <P>Medidas de la prenda extendida, en centímetros. Compara con una playera tuya que te quede bien.</P>
        {Object.entries(SIZE_CHART).map(([fit, rows]) => (
          <div key={fit} className="mt-8">
            <h2 className="text-lg font-bold">{fit}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-ink text-left text-xs uppercase tracking-wider">
                    <th className="py-2">Talla</th><th>Ancho de pecho</th><th>Largo</th><th>Manga</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {rows.map(([s, a, l, m]) => (
                    <tr key={s} className="border-b border-line">
                      <td className="py-2 font-bold">{s}</td><td>{a}</td><td>{l}</td><td>{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <P>
          <br />
          ¿Entre dos tallas? En oversize elige tu talla normal para un efecto holgado, o una menos si lo quieres más discreto.
        </P>
      </>
    ),
  },
  "preguntas-frecuentes": {
    title: "Preguntas frecuentes",
    description: "Respuestas sobre pagos, envíos, tallas y cuidados.",
    body: (
      <>
        <H>¿Qué formas de pago aceptan?</H>
        <P>Tarjeta de crédito y débito, y pago en efectivo en OXXO.</P>
        <H>¿Encogen las playeras?</H>
        <P>Nuestra tela está preencogida. Lavando en agua fría y secando a temperatura baja, el encogimiento es menor al 5 %.</P>
        <H>¿Puedo pedir factura?</H>
        <P>Sí. Escríbenos con tu número de pedido y tus datos fiscales dentro del mismo mes de la compra.</P>
        <H>¿Los drops se resurten?</H>
        <P>No. Los drops son ediciones limitadas. Las prendas Core (colores básicos) siempre se resurten.</P>
      </>
    ),
  },
  nosotros: {
    title: "Nosotros",
    description: "BAN: básicos que duran, a precio justo.",
    body: (
      <>
        <P>BAN nace en Nogales, Sonora, con una idea simple: una playera básica debería durar años, no temporadas.</P>
        <P>Elegimos telas pesadas de algodón peinado, cortes pensados y acabados que aguantan. Vendemos directo, sin intermediarios, para que la calidad no cueste de más.</P>
        <P>Además de los básicos de siempre, lanzamos drops de edición limitada y colaboraciones con creadores.</P>
      </>
    ),
  },
  transparencia: {
    title: "Cuánto cuesta hacer una playera",
    description: "Desglose del costo de una playera BAN.",
    body: (
      <>
        <P>Creemos que puedes saber qué estás pagando. Este es el desglose aproximado de una playera heavyweight. Lo actualizamos con cada producción.</P>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[360px] border-collapse text-sm">
            <tbody className="num">
              {[
                ["Tela y confección", "Por definir con el proveedor"],
                ["Etiquetas y empaque", "Por definir"],
                ["Envío y logística", "Por definir"],
                ["Comisiones de pago", "≈ 4 %"],
                ["IVA", "16 %"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-line">
                  <td className="py-2 font-bold">{k}</td>
                  <td className="text-right text-muted">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  terminos: {
    title: "Términos y condiciones",
    description: "Términos y condiciones de compra en BAN.",
    body: (
      <>
        <p className="bg-tile p-4 text-sm"><b>Borrador.</b> Este texto debe revisarlo un abogado antes de lanzar la tienda.</p>
        <H>1. Quiénes somos</H>
        <P>BAN es una marca operada desde Nogales, Sonora, México. Datos fiscales y de contacto: por completar.</P>
        <H>2. Precios</H>
        <P>Los precios están en pesos mexicanos e incluyen IVA. El costo de envío se muestra antes de pagar.</P>
        <H>3. Pedidos y pagos</H>
        <P>Un pedido se confirma cuando recibimos el pago. Si una pieza se agota después de tu compra, te reembolsamos el total.</P>
        <H>4. Cambios, devoluciones y garantía</H>
        <P>Según nuestra <Link href="/ayuda/devoluciones" className="link">política de cambios y devoluciones</Link> y la Ley Federal de Protección al Consumidor.</P>
      </>
    ),
  },
  privacidad: {
    title: "Aviso de privacidad",
    description: "Cómo usamos tus datos personales.",
    body: (
      <>
        <p className="bg-tile p-4 text-sm"><b>Borrador.</b> Este texto debe revisarlo un abogado antes de lanzar la tienda.</p>
        <H>Datos que recabamos</H>
        <P>Nombre, correo, teléfono y dirección de envío. No guardamos datos de tarjetas: los procesa nuestro proveedor de pagos.</P>
        <H>Para qué los usamos</H>
        <P>Para procesar y enviar tus pedidos, darte servicio y, si lo aceptas, avisarte de lanzamientos.</P>
        <H>Tus derechos ARCO</H>
        <P>Puedes pedir acceso, rectificación, cancelación u oposición escribiéndonos al correo de contacto.</P>
      </>
    ),
  },
};
