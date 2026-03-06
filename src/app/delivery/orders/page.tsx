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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, CheckCircle, Package, User, Phone } from "lucide-react";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  restaurant?: {
    _id: string;
    name: string;
    address: string;
  };
  user?: {
    _id: string;
    name: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  deliveryPartnerId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DriverProfile {
  _id: string;
  name: string;
  phone: string;
  vehicleType: string;
  availability: boolean;
  currentOrder: string | null;
}

export default function DeliveryOrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auth Protection
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) router.push("/login");
      else if (String(user.role) !== "DELIVERY_PARTNER") router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/driver/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.data.orders);
      setDriverProfile(data.data.driverProfile);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && String(user.role) === "DELIVERY_PARTNER") {
      fetchOrders();
    }
  }, [user]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderReady = (payload: any) => {
      toast.info("New order ready for pickup!", { duration: 5000 });
      fetchOrders();
    };

    socket.on("order_preparing", handleOrderReady);
    return () => {
      socket.off("order_preparing", handleOrderReady);
    };
  }, [socket, isConnected]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/driver/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept order");
      
      toast.success("Order accepted successfully!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/driver/deliver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as delivered");
      
      toast.success("Order delivered successfully!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PREPARING": return "secondary";
      case "OUT_FOR_DELIVERY": return "default";
      case "DELIVERED": return "outline";
      default: return "outline";
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold mb-8">Delivery Orders</h1>
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Active Deliveries</h1>
           <p className="text-sm text-muted-foreground mt-1">Accept and manage your delivery tasks.</p>
        </div>
        {isConnected && (
           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 hidden sm:flex">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
             </span>
             Online
           </Badge>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 mt-12 text-center rounded-2xl border border-dashed text-muted-foreground bg-muted/20">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No available orders</h2>
          <p className="mb-6 max-w-sm">When restaurants mark orders as ready for pickup, they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const isAssignedToMe = order.deliveryPartnerId === (user as any)?.id || order.deliveryPartnerId === (user as any)?._id;
            
            return (
              <Card key={order._id} className={`overflow-hidden border-t-4 ${isAssignedToMe ? 'border-t-blue-500' : 'border-t-amber-500'}`}>
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                         <Package className="h-5 w-5 text-muted-foreground" />
                         Order #{order._id.slice(-6).toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(order.createdAt), "MMM d, h:mm a")}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                       {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Pickup
                      </h4>
                      <p className="font-medium">{order.restaurant?.name}</p>
                      <p className="text-sm text-muted-foreground">{order.restaurant?.address}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Destination
                      </h4>
                      <p className="font-medium">{order.deliveryAddress.street}</p>
                      <p className="text-sm text-muted-foreground">{order.deliveryAddress.city}, {order.deliveryAddress.pincode}</p>
                    </div>
                  </div>

                  {isAssignedToMe && order.user && (
                    <div className="pt-4 border-t flex flex-wrap gap-6">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{order.user.name}</span>
                      </div>
                      {order.user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{order.user.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-muted/10 border-t flex justify-between items-center py-4">
                  <div className="text-lg font-bold">
                    ${order.totalAmount.toFixed(2)}
                  </div>
                  <div>
                    {order.status === "PREPARING" && !driverProfile?.currentOrder && (
                      <Button 
                        size="sm"
                        onClick={() => handleAcceptOrder(order._id)}
                        disabled={!!updatingId}
                      >
                        Accept Delivery
                      </Button>
                    )}
                    {isAssignedToMe && order.status === "OUT_FOR_DELIVERY" && (
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleDeliverOrder(order._id)}
                        disabled={!!updatingId}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Delivery
                      </Button>
                    )}
                    {driverProfile?.currentOrder && !isAssignedToMe && order.status === "PREPARING" && (
                      <Badge variant="secondary">Busy with active delivery</Badge>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
