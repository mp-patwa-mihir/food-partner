"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Copy, 
  CopyCheck, 
  Share2, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  ShoppingCart,
  MapPin,
  Clock
} from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

type GroupOrderItem = {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type GroupOrderData = {
  _id: string;
  creator: {
    _id: string;
    name: string;
  };
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
    address: string;
    city: string;
  };
  inviteCode: string;
  status: string;
  totalAmount: number;
  items: GroupOrderItem[];
  createdAt: string;
};

export default function GroupOrderPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [data, setData] = useState<GroupOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function fetchGroupOrder() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/group-orders/${code}`);
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.message || "Failed to load group order");
        setData(result.data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load group order"));
      } finally {
        setIsLoading(false);
      }
    }

    if (code) fetchGroupOrder();
  }, [code]);

  const copyLink = () => {
    const link = `${window.location.origin}/group-order/${code}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Card className="p-8 space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4 unite-text-gradient">Group Order Not Found</h1>
        <p className="text-zinc-500 mb-8">The invite link might be invalid or the group order has been cancelled.</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  const shareableLink = `${typeof window !== "undefined" ? window.location.origin : ""}/group-order/${code}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-8 hover:bg-zinc-100 dark:hover:bg-zinc-900 gap-2"
          onClick={() => router.push(`/restaurants/${data.restaurant._id}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Restaurant
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Card */}
            <Card className="p-6 md:p-8 border-none bg-white dark:bg-zinc-900 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-24 h-24" />
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {data.restaurant.logo ? (
                    <Image src={data.restaurant.logo} alt={data.restaurant.name} width={64} height={64} className="rounded-xl object-cover" />
                  ) : (
                    data.restaurant.name.charAt(0)
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Group Order</h1>
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{data.restaurant.name}, {data.restaurant.city}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                <Badge variant="secondary" className="px-3 py-1 bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400">
                  Status: {data.status}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Started {new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>

              {/* Shareable Link Box */}
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 px-1">Share link with friends</h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-xl font-mono text-sm truncate select-all flex items-center">
                    {shareableLink}
                  </div>
                  <Button 
                    className="md:w-32 rounded-xl gap-2 h-12"
                    onClick={copyLink}
                  >
                    {isCopied ? (
                      <>
                        <CopyCheck className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-zinc-400 mt-4 px-1 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3" />
                  Anyone with this link can join and add items to this order.
                </p>
              </div>
            </Card>

            {/* Participants Section */}
            <Card className="p-6 md:p-8 border-none bg-white dark:bg-zinc-900 shadow-lg">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Participants
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {data.creator.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{data.creator.name}</p>
                      <p className="text-xs text-zinc-500">Host • {data.items.filter(i => i.user._id === data.creator._id).length} items added</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter bg-white dark:bg-zinc-900">Online</Badge>
                </div>
                {/* Future participants will be listed here */}
              </div>
            </Card>
          </div>

          {/* Sidebar / Summary */}
          <div className="space-y-6">
            <Card className="p-6 border-none bg-white dark:bg-zinc-900 shadow-lg sticky top-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                 {data.items.length === 0 ? (
                   <div className="text-center py-8">
                     <p className="text-zinc-400 text-sm">No items added yet.</p>
                     <Button 
                       variant="link" 
                       size="sm" 
                       className="text-primary mt-2"
                       onClick={() => router.push(`/restaurants/${data.restaurant._id}`)}
                     >
                       Add items from Menu
                     </Button>
                   </div>
                 ) : (
                   <div className="space-y-3">
                      {data.items.map((item) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span className="text-zinc-500">{item.quantity}x {item.name}</span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between text-zinc-500 text-sm">
                  <span>Subtotal</span>
                  <span>₹{data.totalAmount}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-sm">
                  <span>Delivery Fee</span>
                  <span>₹40</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span className="text-primary">₹{data.totalAmount + 40}</span>
                </div>
              </div>

              <Button 
                className="w-full mt-8 h-12 rounded-xl text-md font-bold"
                disabled={data.items.length === 0 || data.status !== "COLLECTING"}
              >
                Checkout Group Order
              </Button>
              <p className="text-center text-xs text-zinc-400 mt-4">
                Wait for all friends to finish adding items.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
