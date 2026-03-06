"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MoreHorizontal, CheckCircle2, Search, Store, Plus, Pencil, Trash2 } from "lucide-react";

type Restaurant = {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  cuisine?: string[];
  image?: string;
  city: string;
  state: string;
  pincode?: string;
  isApproved: boolean;
  owner: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
};

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");

  // Approval/Delete Dialog State
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Add/Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [users, setUsers] = useState<{ _id: string; name: string; email: string }[]>([]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const url = filterStatus === "all" 
        ? "/api/admin/restaurants" 
        : `/api/admin/restaurants?status=${filterStatus}`;
        
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      
      const data = await response.json();
      setRestaurants(data.restaurants || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [filterStatus]);

  const handleApprove = async () => {
    if (!selectedRestaurant) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/admin/restaurant/${selectedRestaurant._id}/approve`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to approve restaurant");
      setRestaurants(prev => prev.map(r => r._id === selectedRestaurant._id ? { ...r, isApproved: true } : r));
      setIsApproveDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
      setSelectedRestaurant(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedRestaurant) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${selectedRestaurant._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete restaurant");
      setRestaurants(prev => prev.filter(r => r._id !== selectedRestaurant._id));
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsActionLoading(false);
      setSelectedRestaurant(null);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {}
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = formData._id ? `/api/restaurants/${formData._id}` : "/api/restaurants";
      const method = formData._id ? "PUT" : "POST";

      // When creating, send owner as a plain string ID (the real MongoDB ObjectId)
      const payload = {
        ...formData,
        owner: typeof formData.owner === "object" ? (formData.owner as any)?._id : formData.owner,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save restaurant");
      }
      
      await fetchRestaurants();
      setIsFormOpen(false);
      setFormData({});
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (restaurant: Restaurant) => {
    setFormData({
      ...restaurant,
      cuisine: restaurant.cuisine || [],
    });
    setIsFormOpen(true);
  };

  const openAddForm = async () => {
    setFormData({});
    await fetchUsers();
    setIsFormOpen(true);
  };

  // Client-side search filtering
  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Partners</h1>
          <p className="text-muted-foreground mt-1">
            Manage and approve provider restaurant applications.
          </p>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus className="h-4 w-4" /> Add Restaurant
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Applications</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, owner, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select 
                className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center">
              <Store className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No restaurants found</h3>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant._id}>
                      <TableCell className="font-medium">
                        {restaurant.name}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {restaurant.cuisine?.join(", ") || "No cuisine"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {restaurant.city}, {restaurant.state}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{restaurant.owner?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{restaurant.owner?.email}</div>
                      </TableCell>
                      <TableCell>
                        {restaurant.isApproved ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditForm(restaurant)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            {!restaurant.isApproved && (
                              <DropdownMenuItem 
                                className="text-green-600"
                                onClick={() => { setSelectedRestaurant(restaurant); setIsApproveDialogOpen(true); }}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => { setSelectedRestaurant(restaurant); setIsDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>{formData._id ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle>
              <DialogDescription>Fill in the details for the restaurant partner.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" className="col-span-3" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea id="description" className="col-span-3" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" className="col-span-3" value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cuisine" className="text-right">Cuisines</Label>
                <Input id="cuisine" placeholder="Comma separated" className="col-span-3" value={formData.cuisine?.join(", ") || ""} onChange={(e) => setFormData({ ...formData, cuisine: e.target.value.split(",").map(c => c.trim()) })} />
              </div>
              <div className="grid grid-cols-2 gap-4 ml-24">
                <div className="grid grid-cols-2 items-center gap-2">
                   <Label htmlFor="city" className="text-right">City</Label>
                   <Input id="city" value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 items-center gap-2">
                   <Label htmlFor="state" className="text-right">State</Label>
                   <Input id="state" value={formData.state || ""} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                </div>
              </div>
              {!formData._id && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="owner" className="text-right">Owner</Label>
                  <select
                    id="owner"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={typeof formData.owner === "object" ? (formData.owner as any)?._id ?? "" : ((formData.owner as unknown) as string) || ""}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value as any })}
                    required
                  >
                    <option value="">-- Select an owner --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formData._id ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {selectedRestaurant?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will allow the restaurant to go live on the public landing page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <Button onClick={handleApprove} disabled={isActionLoading} className="bg-green-600 hover:bg-green-700">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Approval
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the restaurant and all associated menu items.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <Button onClick={handleDelete} disabled={isActionLoading} variant="destructive">
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
