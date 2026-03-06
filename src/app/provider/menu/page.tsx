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
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  category: string;
  isVeg?: boolean;
};

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  // Security Locks
  const [hasRestaurant, setHasRestaurant] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

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
      setRestaurantId(restData.restaurant._id);

      // 2. Load Categories & Items using the new standardized route
      const menuResponse = await fetch(`/api/menu/${restData.restaurant._id}`);
      if (menuResponse.ok) {
        const data = await menuResponse.json();
        
        const fetchedCategories: Category[] = [];
        const fetchedItems: MenuItemType[] = [];

        data.menu.forEach((group: any) => {
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
      const url = editingItem ? `/api/menu/item/${editingItem._id}` : "/api/menu";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editingItem ? 'update' : 'create'} menu item.`);
      }

      if (editingItem) {
        setItems((prev) => prev.map(item => item._id === editingItem._id ? result.menuItem : item));
        setEditingItem(null);
      } else {
        setItems((prev) => [...prev, result.menuItem]);
      }
      form.reset({
        name: "",
        description: "",
        price: 0,
        image: "",
        category: "",
        isVeg: true,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleAvailability(itemId: string, currentStatus: boolean) {
    try {
      setTogglingId(itemId);
      const res = await fetch(`/api/menu/item/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setItems(prev => prev.map(item => 
        item._id === itemId ? { ...item, isAvailable: !currentStatus } : item
      ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    
    try {
      setDeletingId(itemId);
      const res = await fetch(`/api/menu/item/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete item");
      
      setItems(prev => prev.filter(item => item._id !== itemId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(item: MenuItemType) {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description || "",
      price: item.price,
      image: item.image || "",
      category: item.category,
      isVeg: item.isVeg ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
            <p className="text-muted-foreground">Manage your restaurant catalog and availability.</p>
          </div>
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
              <CardTitle>{editingItem ? 'Edit Menu Item' : 'Add New Item'}</CardTitle>
              <CardDescription>
                {editingItem ? 'Update the details of your dish.' : 'Fill out the details to add a new dish to your menu.'}
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <FormLabel>Price (₹) *</FormLabel>
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

                       <div className="flex gap-2">
                         {editingItem && (
                           <Button 
                             type="button" 
                             variant="outline" 
                             className="flex-1"
                             onClick={() => {
                               setEditingItem(null);
                               form.reset({
                                 name: "",
                                 description: "",
                                 price: 0,
                                 image: "",
                                 category: "",
                                 isVeg: true,
                               });
                             }}
                           >
                             Cancel
                           </Button>
                         )}
                         <Button type="submit" className="flex-[2]" disabled={isSubmitting || !isApproved}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingItem ? <Plus className="mr-2 h-4 w-4 rotate-45" /> : <Plus className="mr-2 h-4 w-4" />)}
                           {editingItem ? 'Update Item' : 'Add Menu Item'}
                         </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ITEMS LIST */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Current Menu ({items.length})</h2>
            </div>
            
            {items.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <UtensilsCrossed className="h-10 w-10 opacity-20" />
                  </div>
                  <p>No menu items found.</p>
                  <p className="text-sm">{isApproved ? "Start by adding one on the left!" : "Await admin approval to begin."}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                  const catName = categories.find(c => c._id === item.category)?.name || "Unknown";
                  
                  return (
                    <Card key={item._id} className={`overflow-hidden transition-all hover:shadow-md ${!item.isAvailable ? 'opacity-75 grayscale-[0.2]' : ''}`}>
                      <div className="flex p-4 gap-4 h-full">
                        {item.image && (
                           <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                           </div>
                        )}
                        {!item.image && (
                          <div className="w-20 h-20 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                             <UtensilsCrossed className="h-8 w-8 text-primary/20" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                               <h3 className="font-bold text-lg truncate">{item.name}</h3>
                               <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider flex-shrink-0 ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {item.isAvailable ? "In Stock" : "Sold Out"}
                               </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight mb-1">{catName}</p>
                            <p className="text-sm font-bold text-primary">₹{item.price}</p>
                          </div>
                          
                          <div className="mt-4 flex gap-2">
                             <Button 
                               variant="outline"
                               size="sm" 
                               className="h-8 text-xs flex-1" 
                               onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                               disabled={togglingId === item._id || deletingId === item._id}
                             >
                               {togglingId === item._id ? <Loader2 className="h-3 w-3 animate-spin" /> : (item.isAvailable ? "Disable" : "Enable")}
                             </Button>
                             <Button 
                               variant="outline"
                               size="sm" 
                               className="h-8 text-xs flex-1" 
                               onClick={() => handleEdit(item)}
                               disabled={deletingId === item._id || togglingId === item._id}
                             >
                                Edit
                             </Button>
                             <Button 
                               variant="destructive" 
                               size="sm" 
                               className="h-8 text-xs w-8 p-0" 
                               onClick={() => handleDelete(item._id)}
                               disabled={deletingId === item._id || togglingId === item._id}
                             >
                               {deletingId === item._id ? <Loader2 className="h-3 w-3 animate-spin" /> : "×"}
                             </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
