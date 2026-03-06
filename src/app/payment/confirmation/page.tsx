"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Package, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function PaymentConfirmationFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Finalizing your order...</h2>
        <p className="text-muted-foreground mt-2">Checking payment status and confirming with the restaurant.</p>
      </motion.div>
    </div>
  );
}

function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");
  const orderHref = orderId ? `/orders/${orderId}` : "/orders";
  
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Simulate a brief delay to make it feel like we're finalising the status
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Finalizing your order...</h2>
            <p className="text-muted-foreground mt-2">Checking payment status and confirming with the restaurant.</p>
        </motion.div>
      </div>
    );
  }

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className={`h-2 w-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`} />
          <CardHeader className="text-center pt-10 pb-6">
            <div className="flex justify-center mb-6">
              {isSuccess ? (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                >
                    <CheckCircle2 className="w-20 h-20 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                >
                    <XCircle className="w-20 h-20 text-red-500" />
                </motion.div>
              )}
            </div>
            <CardTitle className="text-3xl font-bold">
              {isSuccess ? "Order Confirmed!" : "Payment Failed"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isSuccess 
                ? "Your delicious meal is on its way!" 
                : "Something went wrong with your payment. Please try again."}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8">
            {isSuccess && orderId && (
                <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Order ID</p>
                            <p className="font-mono text-sm font-semibold">{orderId.substring(orderId.length - 12)}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/5">
                        <Link href={orderHref}>View Order <ArrowRight className="ml-2 w-4 h-4"/></Link>
                    </Button>
                </div>
            )}

            {!isSuccess && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Don&apos;t worry, if any money was deducted, it will be refunded within 3-5 business days. You can try placing the order again using Cash on Delivery.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                <Button className="w-full h-12 rounded-xl text-lg font-semibold" asChild>
                    <Link href={isSuccess ? orderHref : "/checkout"}>
                        {isSuccess ? "Track My Order" : "Try Again"}
                    </Link>
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-xl text-lg font-semibold" asChild>
                    <Link href="/">
                        <Home className="mr-2 w-5 h-5" /> Back to Home
                    </Link>
                </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t py-4 justify-center">
             <p className="text-xs text-muted-foreground">Thank you for choosing FoodPartner!</p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<PaymentConfirmationFallback />}>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
