"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";

export function ClearCart() {
  useEffect(() => {
    useCart.getState().clear();
    useCart.getState().setOpen(false);
  }, []);
  return null;
}
