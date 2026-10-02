import type { Product, ProductVariation } from "@/lib/queries";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return nairaFormatter.format(amount);
}

export function availableVariations(variations: ProductVariation[]): ProductVariation[] {
  return variations.filter((variation) => variation.is_available);
}

export function priceRange(variations: ProductVariation[]): { min: number; max: number } {
  const available = availableVariations(variations);
  if (available.length === 0) return { min: 0, max: 0 };
  const prices = available.map((variation) => variation.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** "₦1,350" for a single price, "From ₦1,350" when variations span a range. */
export function productPriceLabel(product: Product): string {
  const available = availableVariations(product.product_variations);
  if (available.length === 0) return "Unavailable";
  const { min, max } = priceRange(available);
  if (min === max) return formatNaira(min);
  return `From ${formatNaira(min)}`;
}

export function totalStock(product: Product): number {
  return availableVariations(product.product_variations).reduce(
    (sum, variation) => sum + variation.stock,
    0,
  );
}

export function isInStock(product: Product): boolean {
  return totalStock(product) > 0;
}

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock";

export function stockLevel(stock: number, lowThreshold = 5): StockLevel {
  if (stock <= 0) return "out-of-stock";
  if (stock <= lowThreshold) return "low-stock";
  return "in-stock";
}

export function stockLabel(stock: number, lowThreshold = 5): string {
  const level = stockLevel(stock, lowThreshold);
  if (level === "out-of-stock") return "Out of stock";
  if (level === "low-stock") return `Only ${stock} left`;
  return "In stock";
}
