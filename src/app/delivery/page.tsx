"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import { 
  Bike, 
  Clock, 
  History, 
  MapPin, 
  Package, 
  Navigation, 
  Power,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  IndianRupee,
  Phone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserRole } from "@/constants/roles";

type Order = {
  _id: string;
  restaurant: {
    _id: string;
    name: string;
    location: string;
  };
  user: {
    _id: string;
    name: string;
  };
  items: any[];
  totalAmount: number;
  status: string;
  deliveryAddress: {
    street: string;
    city: string;
    pincode: string;
  };
  updatedAt: string;
};

export default function DeliveryDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"available" | "accepted" | "history">("available");
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const fetchAvailable = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders/available", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setAvailableOrders(result.data);
    } catch (err) {
      console.error("Failed to fetch available orders", err);
    }
  }, [token]);

  const fetchMyOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders/delivery-partner", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setAcceptedOrders(result.data.accepted);
        setHistoryOrders(result.data.history);
      }
    } catch (err) {
      console.error("Failed to fetch my orders", err);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== UserRole.DELIVERY_PARTNER)) {
      router.replace("/login?callbackUrl=/delivery");
      return;
    }

    if (token) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchAvailable(), fetchMyOrders()]);
        setIsLoading(false);
      };
      loadData();
    }
  }, [authLoading, user, token, router, fetchAvailable, fetchMyOrders]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("new_delivery_available", (data) => {
        toast.info("New delivery available near you!", {
          description: `Order from ${data.restaurantName} is ready for pickup.`
        });
        fetchAvailable();
      });

      return () => {
        socket.off("new_delivery_available");
      };
    }
  }, [socket, isConnected, fetchAvailable]);

  const handleAcceptOrder = async (orderId: string) => {
    setIsActionLoading(orderId);
    try {
      const res = await fetch("/api/orders/accept", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Order accepted!");
        fetchAvailable();
        fetchMyOrders();
        setActiveTab("accepted");
      } else {
        toast.error(result.message || "Failed to accept order");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setIsActionLoading(`${orderId}-${status}`);
    try {
      const res = await fetch("/api/orders/update-delivery-status", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, status })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Order status updated to ${status.replace(/_/g, " ")}`);
        fetchMyOrders();
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsActionLoading(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bike className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delivery Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "outline" : "destructive"} className="px-3 py-1">
            <div className={`mr-2 h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            {isConnected ? "Live Updates Active" : "Offline"}
          </Badge>
        </div>
      </div>

      <div className="mt-8 flex border-b border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "available"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Available Orders
          {availableOrders.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {availableOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "accepted"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Navigation className="h-4 w-4" />
          My Active Deliveries
          {acceptedOrders.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {acceptedOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          Delivery History
        </button>
      </div>

      <div className="mt-8">
        {activeTab === "available" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed p-20 text-center">
                <Package className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-semibold">No orders available</h3>
                <p className="mt-2 text-muted-foreground">New orders will appear here in real-time when restaurants mark them ready.</p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  type="available" 
                  onAction={() => handleAcceptOrder(order._id)}
                  loading={isActionLoading === order._id}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "accepted" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {acceptedOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed p-20 text-center">
                <Navigation className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-semibold">No active deliveries</h3>
                <p className="mt-2 text-muted-foreground">Pick an order from the available tab to start earning.</p>
              </div>
            ) : (
              acceptedOrders.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  type="accepted" 
                  onAction={(status) => handleUpdateStatus(order._id, status)}
                  loadingAction={isActionLoading}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {historyOrders.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed p-20 text-center">
                <History className="h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-semibold">No delivery history</h3>
                <p className="mt-2 text-muted-foreground">Your completed deliveries will be listed here.</p>
              </div>
            ) : (
              historyOrders.map((order) => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  type="history" 
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ 
  order, 
  type, 
  onAction, 
  loading,
  loadingAction
}: { 
  order: Order; 
  type: "available" | "accepted" | "history"; 
  onAction?: (val: any) => void;
  loading?: boolean;
  loadingAction?: string | null;
}) {
  const getNextStatus = (current: string) => {
    switch (current) {
      case "READY_FOR_PICKUP": return "PICKED_UP";
      case "PICKED_UP": return "OUT_FOR_DELIVERY";
      case "OUT_FOR_DELIVERY": return "DELIVERED";
      default: return null;
    }
  };

  const nextStatus = getNextStatus(order.status);
  const isUpdating = loadingAction?.startsWith(order._id);

  return (
    <Card className="overflow-hidden border-border bg-card/50 transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">#{order._id.slice(-6)}</Badge>
          <Badge className={
            order.status === "DELIVERED" ? "bg-green-500/10 text-green-600 hover:bg-green-500/10" :
            order.status === "READY_FOR_PICKUP" ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/10" :
            "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
          }>
            {order.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <CardTitle className="mt-2 text-lg">{order.restaurant.name}</CardTitle>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {order.restaurant.location}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <div className="rounded-xl bg-muted/50 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</p>
              <p className="font-medium truncate">{order.user?.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{order.deliveryAddress.street}, {order.deliveryAddress.city}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Earning</p>
              <p className="font-bold">₹{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {type === "available" && (
          <Button 
            className="w-full bg-primary hover:bg-primary/90" 
            onClick={() => onAction?.(order._id)}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Accept Delivery"}
          </Button>
        )}

        {type === "accepted" && nextStatus && (
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => onAction?.(nextStatus)}
            disabled={!!loadingAction}
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Mark as ${nextStatus.replace(/_/g, " ")}`}
          </Button>
        )}

        {type === "history" && (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg py-2">
            <CheckCircle2 className="h-4 w-4" />
            Successfully Delivered
          </div>
        )}
      </CardContent>
    </Card>
  );
}
