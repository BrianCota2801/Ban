import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => (Buffer.isBuffer(v) ? v : Buffer.from(v)),
});

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ─── Usuarios y sesiones ────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 del token; el token en claro solo vive en la cookie del navegador.
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("login_attempts_key_idx").on(t.key, t.createdAt)],
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  detail: jsonb("detail"),
  createdAt: createdAt(),
});

// ─── Catálogo ───────────────────────────────────────────────────────────────

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  mime: text("mime").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: createdAt(),
});

export const FITS = ["oversize", "regular", "boxy"] as const;
export type Fit = (typeof FITS)[number];

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("playeras"),
  fit: text("fit", { enum: FITS }).notNull().default("oversize"),
  collection: text("collection", { enum: ["core", "drop"] }).notNull().default("core"),
  // Precios en centavos de MXN, IVA incluido.
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  gsm: integer("gsm"),
  composition: text("composition").notNull().default(""),
  madeIn: text("made_in").notNull().default(""),
  care: text("care").notNull().default(""),
  status: text("status", { enum: ["draft", "active", "archived"] }).notNull().default("draft"),
  // Para drops: antes de esta fecha se muestra cuenta regresiva y no se puede comprar.
  releaseAt: timestamp("release_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    // Foto guardada en la base (mediaId) o enlace a Supabase Storage u otro servidor (url).
    mediaId: uuid("media_id").references(() => media.id, { onDelete: "cascade" }),
    url: text("url"),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const variants = pgTable(
  "variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    color: text("color").notNull(),
    colorHex: text("color_hex").notNull().default("#111111"),
    size: text("size").notNull(),
    sku: text("sku").notNull().unique(),
    stock: integer("stock").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

// ─── Página principal, promociones y ajustes ────────────────────────────────

export const SECTION_TYPES = ["hero", "promo_strip", "product_grid", "category_grid", "fit_tiles", "editorial", "countdown"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const homeSections = pgTable("home_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: SECTION_TYPES }).notNull(),
  title: text("title").notNull().default(""),
  data: jsonb("data").notNull().$type<Record<string, unknown>>().default({}),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  kind: text("kind", { enum: ["percent", "fixed"] }).notNull(),
  // percent: 1–100. fixed: centavos.
  value: integer("value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    source: text("source").notNull().default("newsletter"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("waitlist_email_source_idx").on(t.email, t.source)],
);

// Favoritos: owner es "u:<id de usuario>" o "g:<id de invitado en cookie>".
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    owner: text("owner").notNull(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("favorites_owner_product_idx").on(t.owner, t.productId)],
);

// ─── Carrito y pedidos ──────────────────────────────────────────────────────

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  couponCode: text("coupon_code"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    cartId: text("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").notNull().references(() => variants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => [uniqueIndex("cart_items_cart_variant_idx").on(t.cartId, t.variantId)],
);

export const ORDER_STATUSES = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").generatedAlwaysAsIdentity({ startWith: 10001 }),
    accessToken: text("access_token").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending_payment"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    shipName: text("ship_name").notNull(),
    shipPhone: text("ship_phone").notNull(),
    shipStreet: text("ship_street").notNull(),
    shipNeighborhood: text("ship_neighborhood").notNull(),
    shipCity: text("ship_city").notNull(),
    shipState: text("ship_state").notNull(),
    shipZip: text("ship_zip").notNull(),
    shipNotes: text("ship_notes").notNull().default(""),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    paymentProvider: text("payment_provider"),
    paymentRef: text("payment_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").references(() => variants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  color: text("color").notNull(),
  size: text("size").notNull(),
  sku: text("sku").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type HomeSection = typeof homeSections.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Order = typeof orders.$inferSelect;
