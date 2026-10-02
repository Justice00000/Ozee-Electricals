import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  variationId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variationName: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variationId: string, quantity: number) => void;
  removeItem: (variationId: string) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ozee-cart-v1";

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart after mount only, so SSR markup always starts empty.
  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const cap = item.maxStock > 0 ? item.maxStock : 99;
      const existing = current.find((entry) => entry.variationId === item.variationId);
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, cap);
        return current.map((entry) =>
          entry.variationId === item.variationId ? { ...entry, quantity: nextQuantity } : entry,
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, cap) }];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((variationId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((entry) => entry.variationId !== variationId);
      }
      return current.map((entry) =>
        entry.variationId === variationId
          ? { ...entry, quantity: Math.min(quantity, entry.maxStock > 0 ? entry.maxStock : 99) }
          : entry,
      );
    });
  }, []);

  const removeItem = useCallback((variationId: string) => {
    setItems((current) => current.filter((entry) => entry.variationId !== variationId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const subtotal = useMemo(
    () => items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
    [items],
  );
  const count = useMemo(() => items.reduce((sum, entry) => sum + entry.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      count,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      count,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
