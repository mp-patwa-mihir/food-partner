"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock, Info, CheckCircle2 } from "lucide-react";

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

type RestaurantDetail = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
};

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        {/* Skeleton Top Banner */}
        <Skeleton className="w-full h-64 md:h-80 lg:h-96 rounded-none object-cover" />
        <div className="container mx-auto px-4 max-w-6xl -mt-16 md:-mt-24 relative z-10">
           <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-zinc-950 shadow-md mb-4" />
           <Skeleton className="h-10 w-64 mb-4" />
           <Skeleton className="h-5 w-full max-w-xl mb-6" />
           
           <div className="mt-12 space-y-8">
             <Skeleton className="h-8 w-48 mb-6" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Skeleton className="h-32 w-full rounded-xl" />
               <Skeleton className="h-32 w-full rounded-xl" />
               <Skeleton className="h-32 w-full rounded-xl" />
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <span className="text-6xl mb-4">🏪</span>
        <h2 className="text-2xl font-bold mb-2">Oops!</h2>
        <p className="text-zinc-500 mb-6 max-w-md text-center">
          {error || "We couldn't find the restaurant you were looking for. It might be closed or unapproved."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24">
      {/* 1. Hero Cover Banner */}
      <div className="w-full h-64 md:h-80 lg:h-96 relative bg-zinc-200 dark:bg-zinc-900 overflow-hidden">
        {restaurant.coverImage ? (
          <Image
            src={restaurant.coverImage}
            alt={`${restaurant.name} cover`}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center text-white/20 text-9xl">
            🍽️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl -mt-16 md:-mt-24 relative z-10">
        
        {/* 2. Restaurant Header Box */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-end border border-zinc-100 dark:border-zinc-800">
          
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0 -mt-16 md:-mt-20">
            {restaurant.logo ? (
              <Image
                src={restaurant.logo}
                alt={`${restaurant.name} logo`}
                fill
                className="object-contain p-2"
              />
            ) : (
              <span className="text-5xl">🏪</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-2">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {restaurant.name}
                  </h1>
                  {restaurant.isOpen ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent">Open</Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base mb-4 max-w-2xl line-clamp-2">
                  {restaurant.description}
                </p>
              </div>
              
              {/* Stats Box */}
              <div className="flex md:flex-col gap-4 md:gap-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 font-semibold text-lg text-zinc-900 dark:text-zinc-50">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span>{restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}</span>
                </div>
                {restaurant.totalReviews > 0 && (
                  <span className="text-xs text-zinc-500 font-medium">
                    {restaurant.totalReviews}+ ratings
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                <MapPin className="w-4 h-4 text-primary" />
                {restaurant.city}, {restaurant.state}
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                <Clock className="w-4 h-4 text-primary" />
                Delivery: 30-45 min
              </span>
            </div>
          </div>
        </div>

        {/* 3. Menu Content Grouped by Categories */}
        <div className="mt-12 space-y-12">
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl block mb-4">📋</span>
              <h3 className="text-lg font-bold">No Menu Items Yet</h3>
              <p className="text-zinc-500">This restaurant hasn't mapped their menu catalog yet.</p>
            </div>
          ) : (
            categories.map((group) => {
              // Hide empty categories
              if (group.items.length === 0) return null;

              return (
                <div key={group.category._id} className="scroll-mt-24" id={`cat-${group.category._id}`}>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                    {group.category.name}
                    <span className="text-sm font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                      {group.items.length}
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {group.items.map((item) => (
                      <Card 
                        key={item._id} 
                        className={`overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all hover:border-primary/50 ${!item.isAvailable && 'opacity-60 grayscale-[0.5]'}`}
                      >
                        <div className="flex h-full p-4 gap-4">
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-start gap-2 mb-1">
                                {/* Veg / Non-Veg Standardized Indian Icon */}
                                <div className={`w-4 h-4 mt-0.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                </div>
                                <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-zinc-900 dark:text-white">
                                  {item.name}
                                </h3>
                              </div>
                              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 mb-2">
                                ₹{item.price}
                              </p>
                              {item.description && (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between">
                              {!item.isAvailable && (
                                <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-transparent dark:bg-red-950/50">Sold Out</Badge>
                              )}
                              {/* Future Add To Cart Button placement can go here */}
                              {item.isAvailable && (
                                <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                                  Customizable
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Optional Item Image Right Rail */}
                          {item.image && (
                            <div className="w-28 h-28 relative rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
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
    </div>
  );
}
