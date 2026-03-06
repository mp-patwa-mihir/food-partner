"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CartItem } from "@/components/cart/CartItem";
import { ShoppingCart, ArrowRight, ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { cart, isLoading, clearCart } = useCart();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading your cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-24 px-4 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <div className="rounded-full bg-muted p-8 mb-6">
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          It looks like you haven't added any items to your cart yet. Discover delicious meals from top restaurants.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/restaurants">Browse Restaurants</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cart.totalAmount;
  const deliveryFee = 5.0; // Mock delivery fee
  const total = subtotal + deliveryFee;

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col gap-4">
          <Link 
            href={`/restaurants/${cart.restaurant._id}`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group w-fit"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
            Back to {cart.restaurant.name}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-4xl font-extrabold tracking-tight">Shopping Cart</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-fit"
              onClick={() => {
                 if (confirm("Are you sure you want to clear your cart?")) {
                    clearCart();
                 }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Cart Items Section */}
          <div className="lg:col-span-8">
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <CardHeader className="bg-white dark:bg-zinc-900 border-b pb-4 px-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  Items from {cart.restaurant.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-white dark:bg-zinc-900">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {cart.items.map((item) => (
                    <div key={item.menuItem} className="px-6">
                        <CartItem item={item} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 sticky top-24">
            <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 p-6">
                <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium font-mono">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center text-xl font-bold pt-2">
                    <span>Total</span>
                    <span className="text-primary font-mono">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 bg-zinc-50/50 dark:bg-zinc-900/50 border-t mt-4 flex flex-col gap-4">
                <Button 
                  className="w-full text-lg h-14 rounded-xl shadow-md bg-primary hover:bg-primary/90 transition-all active:scale-[0.98] font-bold"
                  onClick={() => router.push("/checkout")}
                >
                  Confirm & Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-[11px] text-center text-muted-foreground px-4">
                  By clicking "Confirm & Checkout", you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardFooter>
            </Card>

            <div className="mt-8 p-4 rounded-xl border border-dashed text-center">
                <p className="text-sm text-muted-foreground">
                    Hungry for more? <Link href="/restaurants" className="text-primary font-semibold hover:underline">Add more items</Link>
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
