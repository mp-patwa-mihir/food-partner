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
import { toast } from "sonner";
import { Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Driver {
  _id: string;
  name: string;
  email: string;
  isApproved: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/admin/drivers");
      const data = await res.json();
      if (data.success) {
        setDrivers(data.drivers);
      }
    } catch (error) {
      toast.error("Failed to load delivery partners");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/drivers/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Partner ${!currentStatus ? "approved" : "unapproved"} successfully`);
        setDrivers(drivers.map(d => d._id === id ? { ...d, isApproved: !currentStatus } : d));
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.email.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Delivery Partners</h1>
          <p className="text-muted-foreground">Approve and manage platform delivery personnel.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
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
              <TableHead>Partner</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrivers.map((driver) => (
              <TableRow key={driver._id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-slate-900">{driver.name}</div>
                    <div className="text-xs text-slate-500">{driver.email}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {new Date(driver.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {driver.isApproved ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Approved</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className={driver.isApproved ? "text-rose-600 border-rose-200 hover:bg-rose-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
                    onClick={() => handleToggleApproval(driver._id, driver.isApproved)}
                  >
                    {driver.isApproved ? (
                      <><XCircle className="h-4 w-4 mr-2" /> Unapprove</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredDrivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No partners found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
