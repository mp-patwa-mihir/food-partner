"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Star, Clock, Info, CheckCircle2, Plus, Loader2, UtensilsCrossed, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Restaurant and menu types
interface RestaurantDetail {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  coverImage?: string;
  address?: string;
  city?: string;
  cuisine?: string[];
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  isApproved: boolean;
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  image?: string;
}

interface CategoryGroup {
  category: { _id: string; name: string };
  items: MenuItem[];
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem } = useCart();
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddToCart = async (item: MenuItem) => {
    if (!restaurant) return;
    setAddingItemId(item._id);
    try {
      await addItem(item._id, 1, restaurant._id);
    } finally {
      setAddingItemId(null);
    }
  };

  const handleRefreshData = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/restaurants/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to refresh data", err);
    }
  };

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Restaurant not found.");
          throw new Error("Failed to load restaurant details.");
        }
        
        const data = await response.json();
        setRestaurant(data.restaurant);
        setCategories(data.categories || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load restaurant details.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-center p-8">
        <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Restaurant not found</h2>
        <p className="text-muted-foreground">{error || "This restaurant could not be loaded."}</p>
      </div>
    );
  }

  const locationLabel = restaurant.address || restaurant.city || "Available in your area";
  const cuisineLabel = restaurant.cuisine?.join(" • ") || "Curated kitchen selections";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      <div className="relative h-[320px] overflow-hidden md:h-[380px]">
        <Image
          src={restaurant.coverImage || "/placeholder-restaurant.jpg"}
          alt={restaurant.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-x-0 top-0">
          <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
            <Link href="/restaurants" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/45">
              <ArrowLeft className="h-4 w-4" /> Back to restaurants
            </Link>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="container mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="max-w-3xl text-white">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {restaurant.isOpen ? <Badge className="bg-emerald-500 text-white">Open now</Badge> : <Badge variant="secondary">Closed</Badge>}
                {restaurant.isApproved && <Badge className="bg-white/15 text-white border border-white/20">Verified partner</Badge>}
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{restaurant.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">{restaurant.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-12 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 md:-mt-16">
        <div className="rounded-[2rem] border border-zinc-200 bg-white/95 p-6 shadow-xl shadow-black/5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            <div className="relative -mt-20 flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-lg dark:border-zinc-900 md:h-36 md:w-36 md:-mt-24">
            {restaurant.logo ? (
              <Image src={restaurant.logo} alt={`${restaurant.name} logo`} fill className="object-contain p-2" />
            ) : (
              <span className="text-5xl">🏪</span>
            )}
          </div>
            <div className="grid flex-1 gap-4 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
              <div className="rounded-3xl border bg-zinc-50/90 p-5 dark:bg-zinc-950/70 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">About</p>
                <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{locationLabel}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{cuisineLabel}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border bg-zinc-50/90 p-5 dark:bg-zinc-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Rating</p>
                <div className="mt-4 flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                  <span>{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{restaurant.totalReviews > 0 ? `${restaurant.totalReviews} customer reviews` : "Be the first to review"}</p>
              </div>
              <div className="rounded-3xl border bg-zinc-50/90 p-5 dark:bg-zinc-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Service</p>
                <div className="mt-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>30-40 min</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Estimated delivery window</p>
              </div>
              <div className="rounded-3xl border bg-zinc-50/90 p-5 dark:bg-zinc-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Assurance</p>
                <div className="mt-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>Freshly prepared</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Clear menu presentation and easier ordering</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Tabs (Menu / Reviews) */}
        <div className="mt-8">
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="bg-white dark:bg-zinc-900 p-1 border border-zinc-100 dark:border-zinc-800 rounded-2xl mb-8 flex w-full md:w-fit h-auto">
              <TabsTrigger value="menu" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold text-sm">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Menu Catalog
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold text-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Customer Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="mt-0">
               {/* ... existing menu implementation ... */}
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-4">
                      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-4 px-2">Categories</h3>
                        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                          {categories.map((group) => (
                            <button
                              key={group.category._id}
                              onClick={() => {
                                const el = document.getElementById(`cat-${group.category._id}`);
                                if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                              }}
                              className="whitespace-nowrap text-left px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary focus:outline-none"
                            >
                              {group.category.name}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-3 space-y-12">
                    {/* ... MenuItem logic ... */}
                    {categories.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <span className="text-4xl block mb-4">📋</span>
                        <h3 className="text-lg font-bold">No Menu Items Yet</h3>
                        <p className="text-zinc-500">This restaurant hasn&apos;t mapped their menu catalog yet.</p>
                      </div>
                    ) : (
                      categories.map((group) => {
                        if (group.items.length === 0) return null;
                        return (
                          <div key={group.category._id} className="scroll-mt-24" id={`cat-${group.category._id}`}>
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                              {group.category.name}
                              <span className="text-sm font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">{group.items.length}</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                              {/* MenuItem cards... (same as before) */}
                              {group.items.map((item) => (
                                <Card key={item._id} className={`group overflow-hidden rounded-[1.75rem] border-zinc-100 dark:border-zinc-800 bg-white/95 transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900/95 ${!item.isAvailable && 'opacity-60 grayscale-[0.5]'}`}>
                                  {/* Item implementation... */}
                                  <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
                                    <div className="p-5 flex-1 flex flex-col">
                                       <h3 className="font-bold text-xl mb-1 text-zinc-900 dark:text-white leading-tight">{item.name}</h3>
                                       {item.description && <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed italic">{item.description}</p>}
                                       <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
                                          <span className="text-xl font-black text-primary">₹{item.price}</span>
                                          {item.isAvailable ? (
                                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-6 py-5" disabled={addingItemId === item._id} onClick={() => handleAddToCart(item)}>
                                              {addingItemId === item._id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2 stroke-[3]" />}
                                              ADD
                                            </Button>
                                          ) : <Badge variant="secondary" className="bg-zinc-100 text-zinc-400 border-transparent dark:bg-zinc-800 px-4 py-1.5 rounded-lg font-bold">Sold Out</Badge>}
                                       </div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <ReviewForm 
                      restaurantId={restaurant._id} 
                      onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        handleRefreshData();
                      }} 
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                      Customer Voice
                      <span className="text-sm font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                        {restaurant.totalReviews} reviews
                      </span>
                    </h2>
                  </div>
                  
                  <ReviewList 
                    restaurantId={restaurant._id} 
                    refreshTrigger={refreshTrigger} 
                    onReviewDeleted={() => {
                      handleRefreshData();
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
