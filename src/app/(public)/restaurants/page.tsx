"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Clock } from "lucide-react";
import Image from "next/image";

type RestaurantListItem = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  city: string;
  state: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
};

export default function RestaurantsListPage() {
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/restaurants?limit=20");
        if (!response.ok) throw new Error("Failed to load restaurants.");
        const data = await response.json();
        setRestaurants(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatalog();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
              Discover Restaurants
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
              Explore the best local eateries, ranging from cozy cafes to fine dining experiences.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // SKELETON LOADERS
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden border-transparent shadow-sm">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : restaurants.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-4xl mb-4 block">🍽️</span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                No restaurants found
              </h3>
              <p className="text-zinc-500">
                We couldn't find any open restaurants right now. Check back later!
              </p>
            </div>
          ) : (
            // ACTUAL CARDS
            restaurants.map((rest) => (
              <Link key={rest._id} href={`/restaurants/${rest._id}`} className="group block focus:outline-none focus:ring-2 focus:ring-primary rounded-xl">
                <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="relative h-48 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {rest.coverImage ? (
                      <Image
                        src={rest.coverImage}
                        alt={rest.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                    {/* Floating Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      {rest.isOpen ? (
                        <Badge className="bg-green-500/90 hover:bg-green-500 text-white shadow-sm backdrop-blur-sm">Open</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-900/80 text-white backdrop-blur-sm">Closed</Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="text-xl font-bold line-clamp-1 text-zinc-900 dark:text-zinc-50">
                        {rest.name}
                      </h3>
                      {rest.rating > 0 && (
                        <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-1.5 py-0.5 rounded text-sm font-medium flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rest.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm mb-3">
                      <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{rest.city}, {rest.state}</span>
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {rest.description || "Incredible culinary experience delivered straight to your table."}
                    </p>

                    <div className="flex items-center gap-2 mt-auto">
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-normal">
                        <Clock className="w-3 h-3 mr-1" />
                        30-40 min
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
