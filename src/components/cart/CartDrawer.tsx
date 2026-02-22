"use client";

import { useCart } from "@/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
    warningModalOpen,
    setWarningModalOpen,
    confirmSwitchRestaurant,
  } = useCart();
  const router = useRouter();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", pincode: "" });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.street || !address.city || !address.pincode) {
      toast.error("Please fill in your complete delivery address.");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryAddress: address }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to place order.");
      }

      toast.success("Order placed successfully!");
      setDrawerOpen(false);
      setIsCheckingOut(false);
      setAddress({ street: "", city: "", pincode: "" });
      
      // Needs to wait for cart context to empty itself (we can force a fetch)
      // fetchCart(); But the redirect handles it.
      router.push("/orders"); // Assuming customers have an orders page, or we can just go to /
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            {!cart || cart.items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Looks like you haven't added any food yet.
                </p>
                <Button onClick={() => setDrawerOpen(false)}>
                  Browse Restaurants
                </Button>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <ScrollArea className="flex-1 p-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      From {cart.restaurant.name}
                    </h4>
                  </div>
                  <div className="flex flex-col gap-6">
                    {cart.items.map((item) => (
                      <div key={item.menuItem} className="flex gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-muted-foreground text-sm mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 rounded-md border p-1">
                            <button
                              type="button"
                              className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-50"
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
                              className="p-1 hover:bg-muted rounded text-muted-foreground"
                              onClick={() => updateQuantity(item.menuItem, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isCheckingOut && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="font-semibold mb-4">Delivery Details</h3>
                      <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            required
                            placeholder="123 Main St, Apt 4B"
                            value={address.street}
                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              required
                              placeholder="New York"
                              value={address.city}
                              onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                              id="pincode"
                              required
                              placeholder="10001"
                              value={address.pincode}
                              onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-6 pb-8 bg-muted/30">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">${cart.totalAmount.toFixed(2)}</span>
                  </div>

                  {isCheckingOut ? (
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsCheckingOut(false)}
                        disabled={isPlacingOrder}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        form="checkout-form"
                        className="w-full"
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder ? "Placing Order..." : "Place Order"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full text-base py-6"
                      onClick={() => setIsCheckingOut(true)}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Warning Modal for Switching Restaurants */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Restaurants?</DialogTitle>
            <DialogDescription>
              Your cart currently contains items from another restaurant. Adding this item will clear your current cart. Do you wish to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setWarningModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmSwitchRestaurant}>
              Clear Cart & Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
