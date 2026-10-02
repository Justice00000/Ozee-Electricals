import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProductVariation = Database["public"]["Tables"]["product_variations"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Faq = Database["public"]["Tables"]["faqs"]["Row"];
export type Policy = Database["public"]["Tables"]["policies"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type DeliveryZone = Database["public"]["Tables"]["delivery_zones"]["Row"];

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories: Pick<Category, "id" | "name" | "slug"> | null;
  product_variations: ProductVariation[];
  product_images: ProductImage[];
};

export type BusinessInfo = {
  name?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  tiktok?: string;
  facebook?: string;
};

export type HomepageContent = {
  hero_title?: string;
  hero_description?: string;
  hero_image?: string;
  hero_video?: string;
  hero_poster?: string;
  hero_images?: string[];
  hero_media?: "image" | "video" | "gallery";
};

export type SiteSettings = {
  business?: BusinessInfo;
  homepage?: HomepageContent;
  delivery?: { pickup?: string; note?: string };
  about?: { intro?: string };
};

export const PRODUCT_SELECT =
  "*, categories(id, name, slug), product_variations(*), product_images(*)";

export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"] as const,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

export const categoryBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug] as const,
    queryFn: async (): Promise<Category | null> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products"] as const,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_available", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 30_000,
  });

export const productBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug] as const,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("is_available", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
    staleTime: 30_000,
  });

export const featuredProductsQueryOptions = () =>
  queryOptions({
    queryKey: ["products", "featured"] as const,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_available", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 30_000,
  });

export const productsByCategoryQueryOptions = (categoryId: string) =>
  queryOptions({
    queryKey: ["products", "category", categoryId] as const,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_available", true)
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 30_000,
  });

/** Products in a category AND every descendant of it (pass a single-item array for a leaf). */
export const productsByCategoryIdsQueryOptions = (categoryIds: string[]) =>
  queryOptions({
    queryKey: ["products", "category-ids", [...categoryIds].sort()] as const,
    queryFn: async (): Promise<Product[]> => {
      if (categoryIds.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_available", true)
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 30_000,
  });

export const servicesQueryOptions = () =>
  queryOptions({
    queryKey: ["services"] as const,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

export const serviceBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["service", slug] as const,
    queryFn: async (): Promise<Service | null> => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const faqsQueryOptions = () =>
  queryOptions({
    queryKey: ["faqs"] as const,
    queryFn: async (): Promise<Faq[]> => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

export const policyBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["policy", slug] as const,
    queryFn: async (): Promise<Policy | null> => {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const siteSettingsQueryOptions = () =>
  queryOptions({
    queryKey: ["site_settings"] as const,
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const settings: SiteSettings = {};
      for (const row of data ?? []) {
        (settings as Record<string, unknown>)[row.key] = row.value;
      }
      return settings;
    },
    staleTime: 60_000,
  });

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentMethod: "delivery" | "pickup";
  deliveryAddress?: string;
  state?: string;
  city?: string;
  instructions?: string;
  paymentMethod?: string;
  deliveryZoneId?: string;
  items: { variationId: string; quantity: number }[];
};

export type OrderConfirmation = {
  id: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  fulfillment_method: string;
  created_at: string;
  customer_name: string;
  items: {
    product_name: string;
    variation_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

/**
 * Creates an order via the `create_order` RPC. That function — not this
 * client call — is the source of truth: it re-validates stock/availability
 * and re-prices every line from the database, so a tampered cart price or a
 * stale stock number in local state can't produce a bad order.
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderConfirmation> {
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
    p_customer_email: input.customerEmail ?? null,
    p_fulfillment_method: input.fulfillmentMethod,
    p_delivery_address: input.deliveryAddress ?? null,
    p_state: input.state ?? null,
    p_city: input.city ?? null,
    p_instructions: input.instructions ?? null,
    p_payment_method: input.paymentMethod ?? null,
    p_delivery_zone_id: input.deliveryZoneId ?? null,
    p_items: input.items.map((item) => ({
      variation_id: item.variationId,
      quantity: item.quantity,
    })),
  });
  if (error) throw error;
  return data as unknown as OrderConfirmation;
}

export function whatsappLink(business: BusinessInfo | undefined, message: string): string {
  const raw = business?.whatsapp ?? business?.phone_primary ?? "";
  const digits = raw.replace(/[^0-9]/g, "");
  const number = digits.startsWith("234") ? digits : `234${digits.replace(/^0/, "")}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// ---- Customer order history (RLS scopes these to the signed-in user's own orders) ----

export type CustomerOrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type CustomerOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: CustomerOrderItem[];
};

export const myOrdersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["my-orders", userId] as const,
    queryFn: async (): Promise<CustomerOrder[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustomerOrder[];
    },
    staleTime: 10_000,
  });

export const myOrderByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["my-order", id] as const,
    queryFn: async (): Promise<CustomerOrder | null> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CustomerOrder | null;
    },
    staleTime: 10_000,
  });

export const deliveryZonesQueryOptions = () =>
  queryOptions({
    queryKey: ["delivery-zones"] as const,
    queryFn: async (): Promise<DeliveryZone[]> => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
