"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/constants/roles";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, CheckCircle2, Package, Search } from "lucide-react";

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
    address: string;
    coverImage?: string;
  };
  deliveryPartnerId?: {
    _id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch orders");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && String(user.role) === "CUSTOMER") {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  // Socket Live Tracking
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStatusUpdate = (payload: { orderId: string; status: string; updatedAt: string }) => {
      setOrders(prev => {
        const idx = prev.findIndex(o => o._id === payload.orderId);
        if (idx === -1) return prev;

        // If status changed to DELIVERED, we could optionally play a sound or toast
        if (payload.status === "DELIVERED" && prev[idx].status !== "DELIVERED") {
           toast.success(`Order from ${prev[idx].restaurant.name} has been delivered!`, {
              duration: 5000,
           });
        } 
        else if (payload.status !== prev[idx].status) {
           toast.info(`Order #${payload.orderId.slice(-6).toUpperCase()} status updated to ${payload.status.replace(/_/g, " ")}`);
        }

        const newOrders = [...prev];
        newOrders[idx] = { ...newOrders[idx], status: payload.status, updatedAt: payload.updatedAt };
        
        // Let's refetch occasionally if maybe delivery partner was assigned
        if (payload.status === "OUT_FOR_DELIVERY") {
           fetchOrders();
        }

        return newOrders;
      });
    };

    socket.on("order_status_update", handleStatusUpdate);

    return () => {
      socket.off("order_status_update", handleStatusUpdate);
    };
  }, [fetchOrders, isConnected, socket]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING": return "secondary";
      case "CONFIRMED":
      case "PREPARING":
      case "OUT_FOR_DELIVERY": return "default";
      case "DELIVERED": return "outline";
      case "CANCELLED":
      case "REJECTED": return "destructive";
      default: return "outline";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
       case "PENDING": return { text: "Awaiting Confirmation", icon: Clock, color: "text-amber-500" };
       case "CONFIRMED": return { text: "Order Confirmed", icon: CheckCircle2, color: "text-primary" };
       case "PREPARING": return { text: "Preparing your food", icon: Package, color: "text-blue-500" };
       case "OUT_FOR_DELIVERY": return { text: "Out for Delivery", icon: MapPin, color: "text-orange-500" };
       case "DELIVERED": return { text: "Delivered ✓", icon: CheckCircle2, color: "text-green-500" };
       case "REJECTED":
       case "CANCELLED": return { text: "Cancelled", icon: Clock, color: "text-red-500" };
       default: return { text: status, icon: Clock, color: "text-zinc-500" };
    }
  };

  if (isAuthLoading) return null;

  const activeOrders = orders.filter(o => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status));
  const pastOrders = orders.filter(o => ["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <DashboardLayout
      role={UserRole.CUSTOMER}
      userName={user?.name || "Customer"}
      heading="Welcome to FoodPartner"
      description="Track your active orders and recent history."
      icon="🛍️"
    >
      <div className="space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[1.75rem] border-border/70 bg-background/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Active now</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Package className="h-5 w-5" /></span>
                <div>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Orders currently in progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70 bg-background/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Delivered</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-600"><CheckCircle2 className="h-5 w-5" /></span>
                <div>
                  <p className="text-2xl font-bold">{deliveredOrders}</p>
                  <p className="text-sm text-muted-foreground">Completed successfully</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70 bg-background/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Live tracking</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600"><MapPin className="h-5 w-5" /></span>
                <div>
                  <p className="text-2xl font-bold">{isConnected ? "On" : "Off"}</p>
                  <p className="text-sm text-muted-foreground">Realtime order updates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-border/70 bg-background/90 shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Total spend</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600"><Clock className="h-5 w-5" /></span>
                <div>
                  <p className="text-2xl font-bold">₹{totalSpent.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Across all orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        
        {/* Active Orders Section */}
        <section>
           <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              Live Orders
              {activeOrders.length > 0 && <span className="bg-primary text-primary-foreground text-xs px-2.5 py-0.5 rounded-full">{activeOrders.length}</span>}
              {isConnected && activeOrders.length > 0 && (
                <span className="relative flex h-2.5 w-2.5 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              )}
           </h2>

           {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                 <Skeleton className="h-40 rounded-xl w-full" />
              </div>
           ) : activeOrders.length === 0 ? (
              <Card className="border-2 border-dashed bg-muted/10 rounded-[2rem]">
                 <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="text-4xl mb-4">🍽️</div>
                    <h3 className="text-lg font-semibold mb-2">No active orders</h3>
                    <p className="text-muted-foreground mb-6 text-sm max-w-sm">You haven&apos;t placed any orders recently. Explore restaurants to find your next meal!</p>
                    <Button asChild>
                       <Link href="/restaurants">Explore Restaurants <Search className="w-4 h-4 ml-2" /></Link>
                    </Button>
                 </CardContent>
              </Card>
           ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {activeOrders.map(order => {
                    const statusConfig = getStatusDisplay(order.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                       <Card key={order._id} className="overflow-hidden rounded-[1.75rem] border-t-4 shadow-sm" style={{ borderTopColor: 'var(--primary)' }}>
                          <CardHeader className="pb-3 bg-muted/20">
                             <div className="flex justify-between items-start">
                                <div>
                                   <CardTitle className="text-base truncate pr-2" title={order.restaurant?.name}>
                                      {order.restaurant?.name || "Restaurant"}
                                   </CardTitle>
                                   <CardDescription className="text-xs mt-1">
                                      Order #{order._id.slice(-6).toUpperCase()}
                                   </CardDescription>
                                </div>
                                <div className="font-bold text-sm">₹{order.totalAmount.toFixed(2)}</div>
                             </div>
                          </CardHeader>
                          <CardContent className="pt-4 pb-2">
                             <div className={`flex items-center gap-2 font-medium ${statusConfig.color} bg-zinc-50 dark:bg-zinc-900 border rounded-lg p-3 w-full`}>
                                <StatusIcon className="w-5 h-5 flex-shrink-0 animate-pulse" />
                                <span className="text-sm">{statusConfig.text}</span>
                             </div>

                             {order.status === "OUT_FOR_DELIVERY" && order.deliveryPartnerId && (
                                <div className="mt-4 flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                   <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">🛵</div>
                                   <div>
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Rider</p>
                                      <p className="text-sm font-semibold">{order.deliveryPartnerId.name}</p>
                                      <p className="text-xs text-muted-foreground">{order.deliveryPartnerId.phone}</p>
                                   </div>
                                </div>
                             )}
                          </CardContent>
                          <CardFooter className="pt-2 pb-4 flex justify-between items-center text-xs text-muted-foreground">
                             <span>Placed {format(new Date(order.createdAt), "h:mm a")}</span>
                             <span className="truncate max-w-[120px]">
                                {order.items.length} items
                             </span>
                          </CardFooter>
                       </Card>
                    );
                 })}
              </div>
           )}
        </section>

        {/* Past Orders Section */}
        <section>
           <h2 className="text-xl font-bold mb-4">Past Orders</h2>
           {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                 <Skeleton className="h-32 rounded-xl w-full" />
                 <Skeleton className="h-32 rounded-xl w-full" />
              </div>
           ) : pastOrders.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/20 p-6 rounded-lg border text-center">
                 No past orders found.
              </div>
           ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {pastOrders.map(order => (
                    <Card key={order._id} className="rounded-[1.75rem] shadow-sm">
                       <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-base truncate pr-2">
                                   {order.restaurant?.name || "Restaurant"}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                   {format(new Date(order.createdAt), "MMM d, yyyy")}
                                </CardDescription>
                             </div>
                             <Badge variant={getStatusBadgeVariant(order.status)} className="text-[10px] uppercase">
                                {order.status}
                             </Badge>
                          </div>
                       </CardHeader>
                       <CardContent className="pb-4">
                          <p className="text-sm text-foreground mb-1">
                             {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ").slice(0, 50)}...
                          </p>
                          <p className="font-semibold text-sm">₹{order.totalAmount.toFixed(2)}</p>
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </section>

      </div>
    </DashboardLayout>
  );
}
