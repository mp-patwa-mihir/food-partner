"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { Loader2, MapPin, ShoppingCart, Star, Clock, User, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";

type GroupOrderItem = {
  _id: string;
  user: string;
  userName: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type GroupOrderData = {
  _id: string;
  inviteCode: string;
  status: string;
  totalAmount: number;
  creator: string;
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    rating: number;
  };
  items: GroupOrderItem[];
};

type MenuItemType = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isVeg: boolean;
};

type CategoryGroup = {
  category: {
    _id: string;
    name: string;
  };
  items: MenuItemType[];
};

export default function GroupOrderPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user } = useAuth();
  const { socket } = useSocket();

  const [groupOrder, setGroupOrder] = useState<GroupOrderData | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const fetchGroupOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/group-orders/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load group order");
      setGroupOrder(data.data);
      return data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    }
  }, [code]);

  const fetchMenu = useCallback(async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load menu");
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Menu fetch error:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const order = await fetchGroupOrder();
      if (order) {
        await fetchMenu(order.restaurant._id);
      }
      setIsLoading(false);
    }
    init();
  }, [fetchGroupOrder, fetchMenu]);

  // Real-time updates
  useEffect(() => {
    if (!socket || !groupOrder?._id) return;

    socket.emit("joinGroupOrder", groupOrder._id);

    socket.on(`group-order-updated:${groupOrder._id}`, (updatedOrder: GroupOrderData) => {
      setGroupOrder(updatedOrder);
    });

    return () => {
      socket.off(`group-order-updated:${groupOrder._id}`);
      socket.emit("leaveGroupOrder", groupOrder._id);
    };
  }, [socket, groupOrder?._id]);

  const handleUpdateItem = async (item: Partial<GroupOrderItem>, action: "ADD" | "UPDATE" | "REMOVE") => {
    if (!user) {
      toast.error("Please log in to add items");
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setActiveItemId(item.menuItemId || null);
    try {
      const res = await fetch(`/api/group-orders/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update item");
      setGroupOrder(data.data);
      toast.success(action === "ADD" ? "Item added to shared cart" : "Cart updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActiveItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !groupOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Group Order Not Found</h2>
        <p className="text-zinc-500 mb-6">{error || "This link might be invalid or expired."}</p>
        <Button onClick={() => router.push("/restaurants")}>Browse Restaurants</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 border">
              {groupOrder.restaurant.logo ? (
                <Image src={groupOrder.restaurant.logo} alt="logo" fill className="object-contain p-1" />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">🏪</div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{groupOrder.restaurant.name}</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Badge variant="outline" className="font-mono text-primary border-primary/20 bg-primary/5">
                  Code: {groupOrder.inviteCode}
                </Badge>
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{groupOrder.restaurant.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold">
            Status: {groupOrder.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Menu Section */}
          <div className="lg:col-span-2 space-y-12">
            {categories.map((group) => (
              <div key={group.category._id}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  {group.category.name}
                  <Badge variant="secondary">{group.items.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((item) => (
                    <Card key={item._id} className="p-4 flex gap-4 h-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                         <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                          </div>
                          <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                        </div>
                        <p className="text-sm font-bold mt-1">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{item.description}</p>
                        
                        <Button 
                          size="sm" 
                          className="mt-4 w-full"
                          variant="outline"
                          disabled={!item.isAvailable || activeItemId === item._id}
                          onClick={() => handleUpdateItem({
                            menuItemId: item._id,
                            name: item.name,
                            price: item.price,
                            quantity: 1
                          }, "ADD")}
                        >
                          {activeItemId === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Group Cart"}
                        </Button>
                      </div>
                      {item.image && (
                         <div className="w-20 h-20 relative rounded-lg overflow-hidden border flex-shrink-0">
                           <Image src={item.image} alt={item.name} fill className="object-cover" />
                         </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar: Shared Cart */}
          <div className="space-y-6">
            <Card className="sticky top-24 overflow-hidden border-2 border-primary/20">
              <div className="bg-primary p-4 text-white">
                <h2 className="font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Shared Cart
                </h2>
              </div>
              
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {groupOrder.items.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <p className="text-4xl mb-4">🛒</p>
                    <p>No items added yet.</p>
                    <p className="text-xs">Items you add will appear here with your name.</p>
                  </div>
                ) : (
                  groupOrder.items.map((item, idx) => {
                    const isMine = user?.id === item.user;
                    return (
                      <div key={`${item.menuItemId}-${item.user}-${idx}`} className="flex flex-col gap-1 pb-4 border-b last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                               <Badge variant="outline" className={`text-[10px] h-4 px-1 ${isMine ? 'text-primary border-primary/30 bg-primary/5' : 'text-zinc-500'}`}>
                                 <User className="w-2 h-2 mr-1" />
                                 {isMine ? "You" : item.userName}
                               </Badge>
                               <span className="text-xs text-zinc-400">×{item.quantity}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        
                        {isMine && (
                          <div className="flex items-center justify-end gap-2 mt-2">
                             <div className="flex items-center gap-2 rounded-lg border bg-zinc-50 p-1">
                                <button 
                                  className="p-1 hover:bg-zinc-200 rounded"
                                  onClick={() => handleUpdateItem({ menuItemId: item.menuItemId, quantity: item.quantity - 1 }, "UPDATE")}
                                >
                                  {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                                </button>
                                <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                                <button 
                                  className="p-1 hover:bg-zinc-200 rounded"
                                  onClick={() => handleUpdateItem({ menuItemId: item.menuItemId, quantity: item.quantity + 1 }, "UPDATE")}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-zinc-50 border-t space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold text-primary">{formatCurrency(groupOrder.totalAmount)}</span>
                </div>
                
                {user?.id === groupOrder.creator ? (
                   <Button className="w-full" size="lg" disabled={groupOrder.items.length === 0}>
                     Checkout Group Order
                   </Button>
                ) : (
                   <div className="text-center p-3 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100">
                     Waiting for the host to finalize the order.
                   </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
