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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Order {
  _id: string;
  user: { name: string; email: string };
  restaurant: { name: string };
  total: number;
  status: string;
  createdAt: string;
  deliveryPartnerId?: { name: string };
}

interface Driver {
  _id: string;
  name: string;
  isApproved: boolean;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const [ordersRes, driversRes] = await Promise.all([
        fetch(`/api/admin/orders${statusParam}`),
        fetch("/api/admin/drivers")
      ]);
      
      const ordersData = await ordersRes.json();
      const driversData = await driversRes.json();

      if (ordersData.orders) setOrders(ordersData.orders);
      if (driversData.drivers) setDrivers(driversData.drivers.filter((d: Driver) => d.isApproved));
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleAssignDriver = async () => {
    if (!selectedOrder || !selectedDriver) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriver }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Driver assigned successfully");
        fetchData();
        setSelectedOrder(null);
        setSelectedDriver(null);
      }
    } catch (error) {
      toast.error("Assignment failed");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">Monitor and assign delivery partners to orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PREPARING">Preparing</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Info</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-24 text-center">
                   <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                 </TableCell>
               </TableRow>
            ) : orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>
                  <div className="font-medium">#{order._id.slice(-6).toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</div>
                </TableCell>
                <TableCell>{order.restaurant?.name}</TableCell>
                <TableCell>
                  <div className="font-medium">{order.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                </TableCell>
                <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    order.status === "DELIVERED" ? "bg-green-50 text-green-700 border-green-200" :
                    order.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  }>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.deliveryPartnerId ? (
                    <span className="text-sm font-medium">{order.deliveryPartnerId.name}</span>
                  ) : (
                    <span className="text-xs text-rose-500 font-medium italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={selectedOrder === order._id} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        disabled={order.status === "DELIVERED" || order.status === "CANCELLED"}
                        onClick={() => setSelectedOrder(order._id)}
                      >
                        <UserPlus className="h-4 w-4" /> Assign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Delivery Partner</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Select onValueChange={setSelectedDriver}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map(driver => (
                              <SelectItem key={driver._id} value={driver._id}>{driver.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          className="w-full" 
                          disabled={!selectedDriver || isAssigning}
                          onClick={handleAssignDriver}
                        >
                          {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Assignment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
