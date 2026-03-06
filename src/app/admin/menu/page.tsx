"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Search, Loader2, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  restaurantId: { name: string };
  image?: string;
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/menu");
      const data = await res.json();
      if (data.success) {
        setItems(data.menuItems);
      }
    } catch (error) {
      toast.error("Failed to load menu items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Menu item deleted");
        setItems(items.filter(i => i._id !== id));
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.restaurantId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
          <p className="text-muted-foreground">Global view of all food items across restaurants.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search item or restaurant..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Utensils className="h-5 w-5" />}
                    </div>
                    <div className="font-medium text-slate-900">{item.name}</div>
                  </div>
                </TableCell>
                <TableCell>{item.restaurantId?.name || "Unknown"}</TableCell>
                <TableCell className="capitalize text-sm text-slate-600">{item.category}</TableCell>
                <TableCell className="font-medium text-slate-900">${item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item._id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No menu items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
