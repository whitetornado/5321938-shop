"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  maxQty: number | null; // null = onbeperkt
};

export const MAX_PER_LINE = 25;

type CartState = {
  lines: CartLine[];
  open: boolean;
  add: (line: Omit<CartLine, "quantity">, qty: number) => number; // returns effective added qty
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => CartLine | undefined;
  restore: (line: CartLine) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

const cap = (qty: number, max: number | null) =>
  Math.max(0, Math.min(qty, MAX_PER_LINE, max ?? Infinity));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      open: false,
      add: (line, qty) => {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        const current = existing?.quantity ?? 0;
        const next = cap(current + qty, line.maxQty);
        const added = next - current;
        if (added <= 0) return 0;
        set((s) => ({
          lines: existing
            ? s.lines.map((l) => (l.variantId === line.variantId ? { ...l, ...line, quantity: next } : l))
            : [...s.lines, { ...line, quantity: next }],
        }));
        return added;
      },
      setQty: (variantId, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.variantId === variantId ? { ...l, quantity: cap(qty, l.maxQty) } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (variantId) => {
        const line = get().lines.find((l) => l.variantId === variantId);
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
        return line;
      },
      restore: (line) => set((s) => ({ lines: [...s.lines, line] })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "cart-5321938",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity * l.priceCents, 0);
