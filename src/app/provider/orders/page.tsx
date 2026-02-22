"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProviderOrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    hasNext: false,
    hasPrev: false,
    totalPages: 1,
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Play a subtle beep using the Web Audio API without needing external assets
  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      // A pleasant high-pitched double-beep
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio Context not supported or failed to play");
    }
  }, []);

  // Use a ref for orders to safely access them inside the socket listener without stale closures
  const ordersRef = useRef<Order[]>([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Auth Protection
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) router.push("/login");
      else if (String(user.role) !== "PROVIDER") router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const fetchOrders = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/provider/orders?page=${pageNum}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && String(user.role) === "PROVIDER") {
      fetchOrders(page);
    }
  }, [user, page]);

  const processedOrdersRef = useRef<Set<string>>(new Set());

  // Handle Socket Events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewOrder = (payload: any) => {
      // 1. Prevent duplicate insertion from rapid duplicated socket events
      if (processedOrdersRef.current.has(payload.orderId)) return;
      processedOrdersRef.current.add(payload.orderId);

      // 2. Play sound
      playNotificationSound();

      // 3. Show toast
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🚨 New Order Received!</span>
          <span className="text-sm">Order ID: {payload.orderId.slice(-6).toUpperCase()} - ${payload.totalAmount.toFixed(2)}</span>
        </div>,
        { duration: 8000 }
      );

      // 4. Update UI
      const existingIds = new Set(ordersRef.current.map(o => o._id));
      if (!existingIds.has(payload.orderId)) {
        // Fetch the full order details from the server to get populated User/Items
        // A quick direct fetch for just this single order could be done, but a simpler
        // approach is to just re-fetch the first page to get the freshest data at the top.
        // We will just fetch page 1 again to prepend it nicely with populated data.
        if (page === 1) {
          fetchOrders(1);
        } else {
          // If on another page, prompt them they have new orders on page 1
          toast.info("A new order is available on Page 1");
        }
      }
    };

    const handleOrderStatusUpdate = (payload: any) => {
       // Since the provider is changing the status, they probably already know, but just in case
       // another admin or the system changes it:
       setOrders((prev) => {
          const idx = prev.findIndex((o) => o._id === payload.orderId);
          if (idx === -1) return prev; // Order not in current view
          if (prev[idx].status === payload.status) return prev; // Idempotent check

          const newOrders = [...prev];
          newOrders[idx] = { ...newOrders[idx], status: payload.status, updatedAt: payload.updatedAt };
          return newOrders;
       });
    };

    socket.on("new_order", handleNewOrder);
    socket.on("order_status_update", handleOrderStatusUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [socket, isConnected, playNotificationSound, page]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/provider/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      
      toast.success("Order status updated");
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING": return "secondary";
      case "ACCEPTED":
      case "PREPARING":
      case "OUT_FOR_DELIVERY": return "default";
      case "DELIVERED": return "outline";
      case "CANCELLED":
      case "REJECTED": return "destructive";
      default: return "outline";
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold mb-8">Restaurant Orders</h1>
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Live Orders</h1>
        {isConnected ? (
           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 hidden sm:flex">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
             Live Connection Active
           </Badge>
        ) : (
           <Badge variant="secondary" className="gap-1.5 hidden sm:flex">
             Offline Server
           </Badge>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 mt-12 text-center rounded-2xl border border-dashed text-muted-foreground bg-muted/20">
          <div className="text-4xl mb-4">🍽️</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No active orders</h2>
          <p className="mb-6 max-w-sm">When customers place orders, they will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden border-l-4" style={{ 
               borderLeftColor: order.status === 'PENDING' ? '#eab308' : 
                                order.status === 'CANCELLED' ? '#ef4444' : 
                                order.status === 'DELIVERED' ? '#22c55e' : '#3b82f6' 
            }}>
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Order #{order._id.slice(-6).toUpperCase()}</CardTitle>
                    <CardDescription>
                      Placed at {format(new Date(order.createdAt), "h:mm a, MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusBadgeVariant(order.status)} className="px-3 py-1 uppercase text-xs tracking-wider font-bold">
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="font-semibold text-sm mb-3">Customer Details</h4>
                     <div className="text-sm space-y-1 text-muted-foreground">
                        <p><span className="font-medium text-foreground">Name:</span> {order.user?.name || "Guest"}</p>
                        <p><span className="font-medium text-foreground">Email:</span> {order.user?.email || "N/A"}</p>
                        <p className="mt-2 text-foreground font-medium">Delivery Address:</p>
                        <p>{order.deliveryAddress.street}</p>
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.pincode}</p>
                     </div>
                   </div>
                   
                   <div>
                     <h4 className="font-semibold text-sm mb-3 flex justify-between">
                        Order Items
                        <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
                     </h4>
                     <div className="space-y-2 text-sm max-h-[150px] overflow-y-auto pr-2">
                        {order.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-muted">
                           <div className="flex items-center gap-2">
                              <span className="font-medium w-4">{item.quantity}x</span>
                              <span className="text-muted-foreground">{item.name}</span>
                           </div>
                           <span className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                           </span>
                           </div>
                        ))}
                     </div>
                   </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 border-t pt-4 flex flex-wrap gap-2 justify-end">
                {/* Status transition controls based on current state */}
                {order.status === "PENDING" && (
                  <>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" size="sm" onClick={() => updateOrderStatus(order._id, "REJECTED")} disabled={updatingId === order._id}>Reject Order</Button>
                    <Button size="sm" onClick={() => updateOrderStatus(order._id, "ACCEPTED")} disabled={updatingId === order._id}>Accept Order</Button>
                  </>
                )}
                
                {order.status === "ACCEPTED" && (
                  <Button size="sm" onClick={() => updateOrderStatus(order._id, "PREPARING")} disabled={updatingId === order._id}>Start Preparing</Button>
                )}
                
                {order.status === "PREPARING" && (
                  <Button size="sm" onClick={() => updateOrderStatus(order._id, "OUT_FOR_DELIVERY")} disabled={updatingId === order._id}>Out For Delivery</Button>
                )}
                
                {order.status === "OUT_FOR_DELIVERY" && (
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateOrderStatus(order._id, "DELIVERED")} disabled={updatingId === order._id}>Mark Delivered</Button>
                )}
              </CardFooter>
            </Card>
          ))}

          {/* Pagination Controls */}
          {(pagination.hasNext || pagination.hasPrev) && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
