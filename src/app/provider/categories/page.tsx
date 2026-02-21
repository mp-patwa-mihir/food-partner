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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MenuSquare, AlertCircle, Loader2, Plus } from "lucide-react";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
});

type CategoryFormValues = z.infer<typeof createCategorySchema>;

type Category = {
  _id: string;
  name: string;
  isActive: boolean;
};

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasRestaurant, setHasRestaurant] = useState(true);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch restaurant first to ensure they have one and extract its ID
      const restResponse = await fetch("/api/provider/restaurant");
      if (!restResponse.ok) {
        if (restResponse.status === 404) setHasRestaurant(false);
        throw new Error("Could not load restaurant context.");
      }
      
      const restData = await restResponse.json();
      if (!restData.restaurant) {
        setHasRestaurant(false);
        setIsLoading(false);
        return;
      }

      setHasRestaurant(true);

      // Now fetch the actual public or specific Categories.
      // Wait, we don't have a GET /api/provider/category route yet! 
      // Fortunately, the public route /api/restaurants/[id] returns all categories.
      const catResponse = await fetch(`/api/restaurants/${restData.restaurant._id}`);
      if (catResponse.ok) {
        const catData = await catResponse.json();
        // The public details route groups categories and items.
        // categories: [ { category: { _id, name, isActive }, items: [] } ]
        const mappedCategories = catData.categories.map((c: any) => c.category);
        setCategories(mappedCategories);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message !== "Could not load restaurant context.") {
        setError("Failed to load categories.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function onSubmit(data: CategoryFormValues) {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/provider/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create category.");
      }

      // Add the newly created category natively from the response API array
      setCategories((prev) => [...prev, result.category]);
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
          <AlertTitle className="font-semibold">Action Required</AlertTitle>
          <AlertDescription>
            You must set up your Restaurant Profile before creating menu categories.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MenuSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Menu Categories</h1>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Add Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>
            Categories organize your menu items (e.g., "Starters", "Main Course", "Desserts").
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
              <div className="flex-1 max-w-sm">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Beverages" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No categories found. Add your first category above!
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {category.isActive ? "Active" : "Archived"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
