"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  MapPin, 
  ChevronLeft, 
  Receipt,
  Truck,
  AlertTriangle
} from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    city: string;
    address: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  createdAt: string;
}

const statusSteps = [
  { id: "PENDING", label: "Confirmed", icon: Clock },
  { id: "CONFIRMED", label: "Processing", icon: CheckCircle2 },
  { id: "PREPARING", label: "Preparing", icon: Package },
  { id: "OUT_FOR_DELIVERY", label: "On the way", icon: Truck },
  { id: "DELIVERED", label: "Delivered", icon: MapPin },
];

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/customer`); // Reuse customer orders or create specific detail API if needed
      // Since we don't have a GET /api/orders/[id] for customers specifically yet, we can filter or search the customer orders
      // In a real app, GET /api/orders/[id] would be better.
      const data = await res.json();
      const foundOrder = data.orders.find((o: any) => o._id === id);
      
      if (!foundOrder) {
        toast.error("Order not found or unauthorized");
        router.push("/orders");
        return;
      }
      setOrder(foundOrder);
    } catch (error: any) {
      toast.error("Failed to fetch order details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchOrder();
    }
  }, [user, id]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderStatusUpdate = (payload: any) => {
      if (payload.orderId === id) {
        setOrder(prev => prev ? { ...prev, status: payload.status } : null);
        toast.info(`Order status updated to ${payload.status.replace(/_/g, " ")}`);
      }
    };

    socket.on("order_status_update", handleOrderStatusUpdate);
    return () => {
      socket.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [socket, isConnected, id]);

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(s => s.id === status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl mt-20">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl mt-20 min-h-screen">
      <Button 
        variant="ghost" 
        className="mb-6 -ml-4 hover:bg-transparent pl-0"
        onClick={() => router.push("/orders")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Order Details</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Order <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">#{order._id.slice(-6).toUpperCase()}</span>
            • {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Badge variant={order.paymentStatus === "COMPLETED" ? "default" : "secondary"} className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 font-semibold uppercase text-[10px]">
                Payment: {order.paymentStatus || "PENDING"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 uppercase text-[10px] tracking-wider font-bold shadow-sm">
                {order.status.replace(/_/g, " ")}
            </Badge>
        </div>
      </div>

      {/* Progress Tracker */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="pt-8 pb-10">
          <div className="relative flex justify-between">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
            <motion.div 
               className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0"
               initial={{ width: "0%" }}
               animate={{ width: `${(Math.max(0, currentStatusIndex) / (statusSteps.length - 1)) * 100}%` }}
               transition={{ duration: 1, ease: "easeOut" }}
            />

            {statusSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              const isTerminated = ["CANCELLED", "REJECTED"].includes(order.status);

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={isActive ? { scale: [1, 1.2, 1], backgroundColor: "var(--primary)" } : {}}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                      isActive ? "bg-primary border-background text-primary-foreground shadow-md" : "bg-background border-muted text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  <span className={`absolute top-12 whitespace-nowrap text-[11px] font-bold uppercase tracking-tight ${
                    isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {(order.status === "CANCELLED" || order.status === "REJECTED") && (
             <div className="mt-16 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold uppercase text-xs tracking-wide">This order was {order.status.toLowerCase()}</span>
             </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content: Items */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-1">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                      {item.quantity}
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Total</span>
                  <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-md font-bold">Restaurant</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-bold text-lg mb-1">{order.restaurant.name}</p>
              <p className="text-muted-foreground italic mb-4">{order.restaurant.city}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push(`/restaurants/${order.restaurant._id}`)}
              >
                Order Again
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-md font-bold">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.deliveryAddress.street}</p>
              <p className="text-muted-foreground">
                {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
              </p>
            </CardContent>
          </Card>
          
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 text-center">
             <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
             </div>
             <p className="text-sm font-bold mb-1">Estimated Delivery</p>
             <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">30-45 Minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
