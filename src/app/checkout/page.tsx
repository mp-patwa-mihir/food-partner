"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, CreditCard, ChevronLeft, Loader2, Info, Receipt, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart, fetchCart, isLoading: isCartLoading } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    pincode: "",
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
       router.push("/login?redirect=/checkout");
    }
  }, [user, isAuthLoading, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!address.street || !address.city || !address.pincode) {
      toast.error("Please fill in all address fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 1. Create Order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          deliveryAddress: address,
          paymentMethod: paymentMethod,
          deliveryFee: deliveryFee,
          taxRate: 0.05, // 5% GST
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      const orderId = data.order._id;

      if (paymentMethod === "ONLINE") {
        // 2. Initialize Online Payment
        toast.info("Initializing secure payment...");
        const paymentRes = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.error || "Failed to initialize payment");

        // 3. Mock Verification (Simulate user completing payment)
        toast.info("Processing mock payment...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        const verifyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId, 
            paymentId: paymentData.paymentData.id,
            status: "success" 
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
      }

      await fetchCart();

      toast.success(paymentMethod === "COD" ? "Order placed successfully!" : "Payment successful! Order placed.");
      
      setTimeout(() => {
          router.push(`/payment/confirmation?status=success&orderId=${orderId}`);
      }, 1500);
      
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to place order");
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 py-12">
        <div className="flex items-center gap-3 rounded-full border bg-background/85 px-5 py-3 shadow-sm backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Preparing your checkout...</span>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-24 text-center">
        <div className="rounded-[2rem] border bg-background/85 p-10 shadow-sm backdrop-blur-sm">
          <div className="bg-muted/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add some delicious items to your cart to proceed to checkout.</p>
          <Button asChild size="lg" className="rounded-xl px-8">
            <Link href="/restaurants">Browse Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cart.totalAmount || cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = 49;
  const taxes = subtotal * 0.05; // 5% GST estimate
  const total = subtotal + deliveryFee + taxes;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border bg-background/85 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <Link href="/restaurants" className="mb-4 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
             <ChevronLeft className="mr-1 w-4 h-4" /> Back to restaurants
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Secure checkout
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Review your order and place it confidently.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Confirm your address, choose a payment option, and see a clear summary before completing your order.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Receipt className="h-4 w-4 text-primary" /> Transparent totals
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Every fee and tax is visible before payment.</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Safe experience
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Smooth order creation with clear next steps.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
             <Card className="rounded-[2rem] border-border/70 bg-background/90 shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-4">
                   <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Delivery Details</CardTitle>
                        <p className="text-sm text-muted-foreground">Tell us where your order should arrive.</p>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="pt-6">
                   <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
                      <div className="space-y-2">
                         <Label htmlFor="street">Street Address</Label>
                         <Input 
                            id="street" 
                            placeholder="123 Main St, Apartment 4B" 
                            value={address.street}
                            onChange={(e) => setAddress({...address, street: e.target.value})}
                            className="h-12 rounded-xl border-border/70 bg-background"
                            required
                         />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                         <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input 
                               id="city" 
                               placeholder="New York" 
                               value={address.city}
                               onChange={(e) => setAddress({...address, city: e.target.value})}
                               className="h-12 rounded-xl border-border/70 bg-background"
                               required
                            />
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="pincode">PIN / Zip Code</Label>
                            <Input 
                               id="pincode" 
                               placeholder="10001" 
                               value={address.pincode}
                               onChange={(e) => setAddress({...address, pincode: e.target.value})}
                               className="h-12 rounded-xl border-border/70 bg-background"
                               required
                            />
                         </div>
                      </div>
                   </form>
                </CardContent>
             </Card>

             <Card className="rounded-[2rem] border-border/70 bg-background/90 shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-4">
                   <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Payment Method</CardTitle>
                        <p className="text-sm text-muted-foreground">Choose the option that feels best for this order.</p>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                   <div 
                      className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${paymentMethod === "COD" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background hover:border-primary/30"}`}
                      onClick={() => setPaymentMethod("COD")}
                   >
                      <div className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? "border-primary" : "border-zinc-400"}`}>
                            {paymentMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                         </div>
                         <div>
                            <p className="font-semibold">Cash on Delivery</p>
                            <p className="text-xs text-muted-foreground">Pay when your order reaches you</p>
                         </div>
                      </div>
                      <span className="text-2xl">💵</span>
                   </div>

                   <div 
                      className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-all ${paymentMethod === "ONLINE" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/70 bg-background hover:border-primary/30"}`}
                      onClick={() => setPaymentMethod("ONLINE")}
                   >
                      <div className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "ONLINE" ? "border-primary" : "border-zinc-400"}`}>
                            {paymentMethod === "ONLINE" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                         </div>
                         <div>
                            <p className="font-semibold">Online Payment</p>
                            <p className="text-xs text-muted-foreground">Secure payment via card, wallet, or UPI simulation</p>
                         </div>
                      </div>
                      <span className="text-2xl">💳</span>
                   </div>

                   <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
                      <Info className="mt-0.5 w-5 h-5 flex-shrink-0 text-zinc-500" />
                      <p className="text-xs leading-5 text-muted-foreground">Card payments are simulated for this demonstration. No actual funds will be transferred.</p>
                   </div>
                </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
             <Card className="sticky top-24 rounded-[2rem] border-border/70 bg-background/95 shadow-xl shadow-black/5">
                <CardHeader className="border-b bg-muted/20">
                   <div className="flex items-start justify-between gap-4">
                     <div>
                       <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
                       <p className="mt-1 text-sm text-muted-foreground text-balance">Ordering from <span className="font-semibold text-foreground">{cart.restaurant.name}</span></p>
                     </div>
                     <div className="rounded-full border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                       {cart.items.length} items
                     </div>
                   </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                   <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {cart.items.map((item, i) => (
                         <div key={i} className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm">
                            <div className="flex gap-3">
                               <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">{item.quantity}x</span>
                               <div>
                                 <p className="font-medium text-foreground">{item.name}</p>
                                 <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)} each</p>
                               </div>
                            </div>
                            <span className="font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                      ))}
                   </div>

                   <div className="space-y-3 pt-4 border-t border-dashed">
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Item Total</span>
                         <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Delivery Partner Fee</span>
                         <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Taxes & Charges (5%)</span>
                         <span className="font-medium">₹{taxes.toFixed(2)}</span>
                      </div>
                   </div>

                   <div className="rounded-2xl border bg-primary/5 p-4">
                     <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                       <ShieldCheck className="h-4 w-4 text-primary" /> Order protection
                     </div>
                     <p className="mt-2 text-xs leading-5 text-muted-foreground">You will be redirected to a confirmation screen immediately after placing the order.</p>
                   </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 border-t bg-muted/20 p-6">
                   <div className="flex w-full items-center justify-between text-xl font-bold">
                      <span>To Pay</span>
                      <span>₹{total.toFixed(2)}</span>
                   </div>
                   <Button 
                      type="submit" 
                      form="checkout-form"
                      className="h-14 w-full rounded-2xl text-lg shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                      disabled={isSubmitting}
                   >
                      {isSubmitting ? (
                         <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      ) : (
                         `Place Order ${paymentMethod === "COD" ? "• COD" : ""}`
                      )}
                   </Button>
                </CardFooter>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
