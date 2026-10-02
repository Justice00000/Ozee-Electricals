import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  PRODUCT_SELECT,
  type Category,
  type DeliveryZone,
  type Faq,
  type Policy,
  type Product,
  type Service,
} from "@/lib/queries";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderWithItems = OrderRow & { order_items: OrderItemRow[] };

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ---- Reads (admin sees everything; RLS's "... OR has_role(admin)" clause
// already lifts the is_active/is_available filter for an authenticated admin) ----

export const adminProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "products"] as const,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 10_000,
  });

export const adminProductByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["admin", "product", id] as const,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
    staleTime: 10_000,
  });

export const adminCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "categories"] as const,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export const adminOrdersQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "orders"] as const,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export const adminOrderByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["admin", "order", id] as const,
    queryFn: async (): Promise<OrderWithItems | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as OrderWithItems | null;
    },
    staleTime: 10_000,
  });

export type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockVariations: number;
  recentOrders: OrderRow[];
  recentProducts: Product[];
};

export const dashboardStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "dashboard"] as const,
    queryFn: async (): Promise<DashboardStats> => {
      const [
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        lowStockVariations,
        recentOrders,
        recentProducts,
      ] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
        supabase
          .from("product_variations")
          .select("stock, low_stock_threshold")
          .eq("is_available", true),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      for (const result of [
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        lowStockVariations,
        recentOrders,
        recentProducts,
      ]) {
        if (result.error) throw result.error;
      }

      return {
        totalProducts: totalProducts.count ?? 0,
        totalOrders: totalOrders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        completedOrders: completedOrders.count ?? 0,
        lowStockVariations: (lowStockVariations.data ?? []).filter(
          (v) => v.stock <= v.low_stock_threshold,
        ).length,
        recentOrders: recentOrders.data ?? [],
        recentProducts: (recentProducts.data ?? []) as unknown as Product[],
      };
    },
    staleTime: 10_000,
  });

// ---- Writes ----

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ProductFormVariation = {
  id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  is_available: boolean;
  image_url: string;
};

export type ProductFormInput = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string | null;
  description: string;
  warranty: string;
  brand: string;
  imageUrl: string;
  videoUrl: string;
  isFeatured: boolean;
  isAvailable: boolean;
  specs: Record<string, string>;
  gallery: string[];
  variations: ProductFormVariation[];
};

/** Creates or updates a product plus its variations (insert/update/delete-diffed) in sequence. */
export async function saveProduct(input: ProductFormInput): Promise<string> {
  const productPayload = {
    name: input.name,
    slug: input.slug,
    category_id: input.categoryId,
    description: input.description || null,
    warranty: input.warranty || null,
    brand: input.brand || null,
    image_url: input.imageUrl || null,
    video_url: input.videoUrl || null,
    is_featured: input.isFeatured,
    is_available: input.isAvailable,
    specs: input.specs,
  };

  let productId = input.id;

  if (productId) {
    const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single();
    if (error) throw error;
    productId = data.id;
  }

  const { data: existingVariations, error: fetchError } = await supabase
    .from("product_variations")
    .select("id")
    .eq("product_id", productId);
  if (fetchError) throw fetchError;

  const existingIds = new Set((existingVariations ?? []).map((v) => v.id));
  const keptIds = new Set(input.variations.filter((v) => v.id).map((v) => v.id as string));
  const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));

  if (idsToDelete.length > 0) {
    const { error } = await supabase.from("product_variations").delete().in("id", idsToDelete);
    if (error) throw error;
  }

  for (const variation of input.variations) {
    const payload = {
      product_id: productId,
      name: variation.name,
      sku: variation.sku || null,
      price: variation.price,
      stock: variation.stock,
      is_available: variation.is_available,
      image_url: variation.image_url || null,
    };
    if (variation.id) {
      const { error } = await supabase
        .from("product_variations")
        .update(payload)
        .eq("id", variation.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("product_variations").insert(payload);
      if (error) throw error;
    }
  }

  // Gallery: replace the full set (small lists; keeps ordering simple).
  const { error: clearError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (clearError) throw clearError;
  if (input.gallery.length > 0) {
    const { error: galleryError } = await supabase
      .from("product_images")
      .insert(
        input.gallery.map((url, index) => ({ product_id: productId, url, sort_order: index })),
      );
    if (galleryError) throw galleryError;
  }

  return productId;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export type CategoryFormInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
};

export async function saveCategory(input: CategoryFormInput): Promise<void> {
  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    image_url: input.imageUrl || null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    parent_id: input.parentId,
  };
  if (input.id) {
    const { error } = await supabase.from("categories").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("categories").insert(payload);
    if (error) throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateSiteSetting(
  key: string,
  value: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: value as Json }, { onConflict: "key" });
  if (error) throw error;
}

// ---- Services ----

export const adminServicesQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "services"] as const,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export type ServiceFormInput = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  pricingNote: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export async function saveService(input: ServiceFormInput): Promise<void> {
  const payload = {
    title: input.title,
    slug: input.slug,
    description: input.description || null,
    content: input.content || null,
    pricing_note: input.pricingNote || null,
    image_url: input.imageUrl || null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await supabase.from("services").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("services").insert(payload);
    if (error) throw error;
  }
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

// ---- FAQs ----

export const adminFaqsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "faqs"] as const,
    queryFn: async (): Promise<Faq[]> => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export type FaqFormInput = {
  id?: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

export async function saveFaq(input: FaqFormInput): Promise<void> {
  const payload = {
    question: input.question,
    answer: input.answer,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await supabase.from("faqs").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("faqs").insert(payload);
    if (error) throw error;
  }
}

export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw error;
}

// ---- Policies (fixed slugs; content-only edits) ----

export const adminPoliciesQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "policies"] as const,
    queryFn: async (): Promise<Policy[]> => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export async function updatePolicyContent(id: string, content: string): Promise<void> {
  const { error } = await supabase.from("policies").update({ content }).eq("id", id);
  if (error) throw error;
}

// ---- Delivery zones ----

export const adminDeliveryZonesQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "delivery-zones"] as const,
    queryFn: async (): Promise<DeliveryZone[]> => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export type DeliveryZoneFormInput = {
  id?: string;
  name: string;
  fee: number;
  estimatedTime: string;
  sortOrder: number;
  isActive: boolean;
};

export async function saveDeliveryZone(input: DeliveryZoneFormInput): Promise<void> {
  const payload = {
    name: input.name,
    fee: input.fee,
    estimated_time: input.estimatedTime || null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await supabase.from("delivery_zones").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("delivery_zones").insert(payload);
    if (error) throw error;
  }
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
  if (error) throw error;
}

// ---- Inventory ----

export type InventoryRow = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  is_available: boolean;
  product: { id: string; name: string; brand: string | null } | null;
};

export const adminInventoryQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "inventory"] as const,
    queryFn: async (): Promise<InventoryRow[]> => {
      const { data, error } = await supabase
        .from("product_variations")
        .select(
          "id, name, sku, stock, low_stock_threshold, is_available, product:products(id, name, brand)",
        )
        .order("stock", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as InventoryRow[];
    },
    staleTime: 10_000,
  });

export async function adjustStock(
  variationId: string,
  delta: number,
  reason: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("adjust_stock", {
    p_variation_id: variationId,
    p_delta: delta,
    p_reason: reason || null,
  });
  if (error) throw error;
  return data as number;
}

export async function setLowStockThreshold(variationId: string, threshold: number): Promise<void> {
  const { error } = await supabase
    .from("product_variations")
    .update({ low_stock_threshold: threshold })
    .eq("id", variationId);
  if (error) throw error;
}

// ---- Contact messages ----

export type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"];

export const adminMessagesQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "messages"] as const,
    queryFn: async (): Promise<ContactMessage[]> => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });

export async function setMessageRead(id: string, isRead: boolean): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ is_read: isRead })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) throw error;
}

export async function sendContactMessage(input: {
  name: string;
  phone: string;
  email: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    message: input.message,
  });
  if (error) throw error;
}
