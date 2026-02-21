"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UtensilsCrossed, AlertCircle, Loader2, Plus, IndianRupee } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").trim(),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  category: z.string().min(1, "You must select a category"),
  isVeg: z.boolean(),
});

type MenuItemFormValues = z.infer<typeof createMenuItemSchema>;

type Category = { _id: string; name: string };
type MenuItemType = {
  _id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category: string; // The category ID to map back
};

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Security Locks
  const [hasRestaurant, setHasRestaurant] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(createMenuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: "",
      category: "",
      isVeg: true,
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Restaurant Context & verify approval
      const restResponse = await fetch("/api/provider/restaurant");
      if (!restResponse.ok) {
        if (restResponse.status === 404) setHasRestaurant(false);
        throw new Error("Could not load restaurant context.");
      }
      
      const restData = await restResponse.json();
      if (!restData.restaurant) {
        setHasRestaurant(false);
        return;
      }

      setHasRestaurant(true);
      setIsApproved(restData.restaurant.isApproved);

      // 2. Load Categories & Items from the public unified details route
      const detailsResponse = await fetch(`/api/restaurants/${restData.restaurant._id}`);
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        
        // Flatten the structured grouping back into pure arrays for the UI state
        const fetchedCategories: Category[] = [];
        const fetchedItems: MenuItemType[] = [];

        details.categories.forEach((group: any) => {
          fetchedCategories.push(group.category);
          fetchedItems.push(...group.items);
        });

        setCategories(fetchedCategories);
        setItems(fetchedItems);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message !== "Could not load restaurant context.") {
        setError("Failed to load your menu catalog.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function onSubmit(data: MenuItemFormValues) {
    if (!isApproved) {
      setError("Your restaurant must be approved by an admin before adding items.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/provider/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...data,
           // Zod coerce handled string->number.
           // API uses false for non-veg if explicitly set, defaulting isVeg boolean natively via shadcn checkbox ideally, but select works too.
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create menu item.");
      }

      // Add to table
      setItems((prev) => [...prev, result.menuItem]);
      form.reset();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRestaurant) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold">Restaurant Required</AlertTitle>
          <AlertDescription>
            You must set up your Restaurant Profile before managing menu items.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
        </div>
      </div>

      {!isApproved && (
         <Alert className="bg-amber-50 text-amber-800 border-amber-200">
           <AlertCircle className="h-4 w-4 text-amber-600" />
           <AlertTitle className="font-semibold">Account Pending Approval</AlertTitle>
           <AlertDescription>
             Your restaurant profile is currently under review. You cannot publish menu items until an Administrator approves your account.
           </AlertDescription>
         </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD ITEM FORM (Requires Approval && Categories) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className={!isApproved ? "opacity-60 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
              <CardDescription>
                Fill out the details to add a new dish to your menu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 && isApproved ? (
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle>No Categories</AlertTitle>
                  <AlertDescription>
                    Please create a Menu Category first before adding items.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Garlic Naan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat._id} value={cat._id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Prefix (₹) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="pl-9" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Delicious oven baked bread..." 
                              className="resize-none h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting || !isApproved}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Add Menu Item
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ITEMS LIST TABLE */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Menu ({items.length})</CardTitle>
              <CardDescription>
                Overview of all dishes actively published on your restaurant profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                  No menu items found. {isApproved ? "Start by adding one on the left!" : "Await admin approval to begin."}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dish</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const catName = categories.find(c => c._id === item.category)?.name || "Unknown";
                        
                        return (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">{catName}</TableCell>
                            <TableCell>₹{item.price}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  item.isAvailable
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.isAvailable ? "In Stock" : "Sold Out"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                                 Manage
                               </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
