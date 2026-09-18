import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==================== ENUMS ====================
export const invoiceTypeEnum = pgEnum("invoice_type", [
  "sale",
  "purchase",
  "sale_return",
  "purchase_return",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "confirmed",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
]);
export const currencyEnum = pgEnum("currency", ["rial", "toman"]);

// ==================== SETTINGS ====================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== ROLES ====================
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  permissions: jsonb("permissions").notNull().default("{}"),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== USERS ====================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  avatar: varchar("avatar", { length: 10 }).default("👤"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== PRODUCT CATEGORIES ====================
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }),
  parentId: integer("parent_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== PRODUCTS ====================
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 300 }).notNull(),
  categoryId: integer("category_id").references(() => productCategories.id),
  unit: varchar("unit", { length: 50 }).default("عدد"),
  purchasePrice: numeric("purchase_price", { precision: 18, scale: 2 }).default("0"),
  salePrice: numeric("sale_price", { precision: 18, scale: 2 }).default("0"),
  stock: numeric("stock", { precision: 18, scale: 2 }).default("0"),
  minStock: numeric("min_stock", { precision: 18, scale: 2 }).default("0"),
  description: text("description"),
  barcode: varchar("barcode", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== CUSTOMERS ====================
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }),
  name: varchar("name", { length: 300 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  email: varchar("email", { length: 200 }),
  address: text("address"),
  nationalId: varchar("national_id", { length: 20 }),
  economicCode: varchar("economic_code", { length: 50 }),
  creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }).default("0"),
  balance: numeric("balance", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== SUPPLIERS ====================
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }),
  name: varchar("name", { length: 300 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  email: varchar("email", { length: 200 }),
  address: text("address"),
  nationalId: varchar("national_id", { length: 20 }),
  economicCode: varchar("economic_code", { length: 50 }),
  balance: numeric("balance", { precision: 18, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== INVOICES ====================
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  type: invoiceTypeEnum("type").notNull(),
  status: invoiceStatusEnum("status").default("confirmed"),
  customerId: integer("customer_id").references(() => customers.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: integer("user_id").references(() => users.id),
  date: varchar("date", { length: 20 }).notNull(),
  dueDate: varchar("due_date", { length: 20 }),
  subtotal: numeric("subtotal", { precision: 18, scale: 2 }).default("0"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).default("0"),
  paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).default("0"),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid"),
  referenceInvoiceId: integer("reference_invoice_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== INVOICE ITEMS ====================
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productCode: varchar("product_code", { length: 100 }),
  productName: varchar("product_name", { length: 300 }),
  unit: varchar("unit", { length: 50 }),
  quantity: numeric("quantity", { precision: 18, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).default("0"),
  total: numeric("total", { precision: 18, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0),
});

// ==================== PAYMENTS ====================
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // 'receive' | 'pay'
  customerId: integer("customer_id").references(() => customers.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  userId: integer("user_id").references(() => users.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).default("cash"), // cash, card, transfer, check
  date: varchar("date", { length: 20 }).notNull(),
  reference: varchar("reference", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== RELATIONS ====================
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  supplier: one(suppliers, { fields: [invoices.supplierId], references: [suppliers.id] }),
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  product: one(products, { fields: [invoiceItems.productId], references: [products.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
  supplier: one(suppliers, { fields: [payments.supplierId], references: [suppliers.id] }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
  payments: many(payments),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  invoices: many(invoices),
  payments: many(payments),
}));
