"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    city: string;
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
}

export default function OrdersPage() {
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

  // Redirect if not logged in or not customer
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push("/login");
      } else if (String(user.role) !== "CUSTOMER") {
        router.push("/dashboard");
      }
    }
  }, [user, isAuthLoading, router]);

  const fetchOrders = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/orders/customer?page=${pageNum}&limit=10`);
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
    if (user && String(user.role) === "CUSTOMER") {
      fetchOrders(page);
    }
  }, [user, page]);

  // Handle Real-time Socket Updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderStatusUpdate = (payload: any) => {
      setOrders((prev) => {
        // Only react if the updated order exists in the current view
        const orderExists = prev.some((o) => o._id === payload.orderId);
        if (!orderExists) return prev;

        toast.info(
          <div className="flex flex-col gap-1">
            <span className="font-bold">🔔 Order Status Updated!</span>
            <span className="text-sm">
              Order <span className="font-mono bg-muted px-1 rounded">#{payload.orderId.slice(-6).toUpperCase()}</span> is now <span className="font-bold text-primary">{payload.status.replace(/_/g, " ")}</span>.
            </span>
          </div>,
          { duration: 6000 }
        );

        return prev.map((o) =>
          o._id === payload.orderId
            ? { ...o, status: payload.status, updatedAt: payload.updatedAt }
            : o
        );
      });
    };

    socket.on("order_status_update", handleOrderStatusUpdate);

    return () => {
      socket.off("order_status_update", handleOrderStatusUpdate);
    };
  }, [socket, isConnected]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel order");
      }
      toast.success("Order cancelled safely.");
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "ACCEPTED":
      case "PREPARING":
      case "OUT_FOR_DELIVERY":
        return "default";
      case "DELIVERED":
        return "default"; // or can use custom green
      case "CANCELLED":
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl mt-20 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 mt-12 text-center rounded-2xl border border-dashed text-muted-foreground bg-muted/20">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No orders yet
          </h2>
          <p className="mb-6 max-w-sm">
            You haven't placed any food orders. Discover amazing local
            restaurants and start eating!
          </p>
          <Button onClick={() => router.push("/")}>Browse Restaurants</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <CardHeader className="bg-muted/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>{order.restaurant?.name || "Unknown Restaurant"}</CardTitle>
                    <CardDescription>
                      Order ID: {order._id.slice(-6).toUpperCase()} •{" "}
                      {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground hidden sm:block">Total</p>
                      <p className="font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
                    </div>
                    <motion.div
                      key={order.status} // Re-animate every time status changes
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge variant={getStatusBadgeVariant(order.status)} className="px-3 py-1 uppercase text-[10px] tracking-wider font-bold shadow-sm">
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full border-none">
                  <AccordionItem value="items" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-0 text-sm font-medium">
                      View Order Details ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items)
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-0">
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 font-medium">
                                {item.quantity}
                              </Badge>
                              <span>{item.name}</span>
                            </div>
                            <span className="text-muted-foreground">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />
                      
                      <div className="text-sm">
                        <span className="font-semibold block mb-1">Delivering to:</span>
                        <span className="text-muted-foreground block">
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
                        </span>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>

              {order.status === "PENDING" && (
                <CardFooter className="pt-0 justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelOrder(order._id)}
                  >
                    Cancel Order
                  </Button>
                </CardFooter>
              )}
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
