"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/context/CartContext";
import { useCart } from "@/context/CartContext";

interface CartItemProps {
  item: CartItemType;
  showImage?: boolean; // In case we want to show images in the future
}

export function CartItem({ item, showImage = false }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex-1">
        <h4 className="font-medium text-sm sm:text-base">{item.name}</h4>
        <p className="text-muted-foreground text-sm mt-1">
          ${item.price.toFixed(2)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="font-semibold text-sm sm:text-base">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
        <div className="flex items-center gap-2 rounded-md border p-1 bg-background">
          <button
            type="button"
            className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors disabled:opacity-50"
            onClick={() => {
              if (item.quantity === 1) {
                removeItem(item.menuItem);
              } else {
                updateQuantity(item.menuItem, item.quantity - 1);
              }
            }}
          >
            {item.quantity === 1 ? (
              <Trash2 className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
          </button>
          <span className="w-4 text-center text-sm font-medium">
            {item.quantity}
          </span>
          <button
            type="button"
            className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
            onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
