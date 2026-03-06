"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Clock, Search } from "lucide-react";
import Image from "next/image";

type RestaurantListItem = {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
  coverImage?: string;
  city: string;
  state: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  cuisine: string[];
  location?: string;
};

export default function RestaurantsListPage() {
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      let url = "/api/restaurants?limit=20";
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (cuisineFilter) url += `&cuisine=${encodeURIComponent(cuisineFilter)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load restaurants.");
      const data = await response.json();
      setRestaurants(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load restaurants.");
    } finally {
      setIsLoading(false);
    }
  }, [search, cuisineFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchCatalog]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Restaurant discovery
              </div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                Find restaurants that match your mood.
              </h1>
              <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
                Explore menus, compare cuisines, and choose from carefully presented local favorites.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="rounded-2xl border bg-zinc-50/80 p-4 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Results</p>
                <p className="mt-2 text-2xl font-bold">{isLoading ? "--" : restaurants.length}</p>
              </div>
              <div className="rounded-2xl border bg-zinc-50/80 p-4 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Discovery</p>
                <p className="mt-2 text-sm font-semibold">Search by cuisine or name</p>
              </div>
              <div className="rounded-2xl border bg-zinc-50/80 p-4 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Order flow</p>
                <p className="mt-2 text-sm font-semibold">Faster browse-to-checkout journey</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/70 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
              <Input 
                placeholder="Search name or cuisine..."
                className="h-12 rounded-xl border-zinc-200 bg-white pl-10 dark:border-zinc-800 dark:bg-zinc-900"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-primary outline-none"
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
            >
              <option value="">All Cuisines</option>
              <option value="Italian">Italian</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Mexican">Mexican</option>
              <option value="Japanese">Japanese</option>
              <option value="American">American</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="mb-6 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
            <p>{restaurants.length} restaurant{restaurants.length === 1 ? "" : "s"} available</p>
            {(search || cuisineFilter) && <p>Filtered results shown</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden border-zinc-100 dark:border-zinc-800 shadow-sm rounded-2xl">
                <Skeleton className="h-56 w-full rounded-none" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex gap-2 mt-6">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : restaurants.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <span className="text-5xl mb-6 block opacity-50">🍱</span>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
                No restaurants matched your search
              </h3>
              <p className="text-zinc-500 max-w-md mx-auto">
                Try adjusting your search terms or filters to find what you&apos;re looking for.
              </p>
            </div>
          ) : (
            restaurants.map((rest) => (
              <Link key={rest._id} href={`/restaurants/${rest._id}`} className="group block outline-none">
                <Card className="overflow-hidden h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl">
                  <div className="relative h-56 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <Image
                      src={rest.image || rest.coverImage || "/placeholder-restaurant.jpg"}
                      alt={rest.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      {rest.isOpen ? (
                        <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-lg backdrop-blur-md border-none px-3 py-1">Open</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-950/80 text-white backdrop-blur-md border-none px-3 py-1">Closed</Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <h3 className="text-2xl font-bold line-clamp-1 text-zinc-900 dark:text-zinc-50 tracking-tight">
                        {rest.name}
                      </h3>
                      <div className="flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg text-sm font-bold flex-shrink-0 border border-amber-100 dark:border-amber-800">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{rest.rating > 0 ? rest.rating.toFixed(1) : "New"}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-zinc-500 dark:text-zinc-400 text-sm mb-4 font-medium">
                      <MapPin className="w-4 h-4 mr-1.5 text-rose-500" />
                      <span className="line-clamp-1">{rest.location || `${rest.city}, ${rest.state}`}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {rest.cuisine?.slice(0, 3).map((c, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-6 flex-1 leading-relaxed">
                      {rest.description || "Indulge in an extraordinary dining experience with handpicked ingredients."}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                        30-40 MIN
                      </div>
                      <span className="text-primary text-sm font-bold group-hover:translate-x-1 transition-transform duration-300">
                        View Menu →
                      </span>
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
