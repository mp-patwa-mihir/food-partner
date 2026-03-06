"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, UserX } from "lucide-react";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminApprovalsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/approvals");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error("Failed to load pending approvals");
      }
    } catch (error) {
      toast.error("An error occurred while fetching approvals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && String(user.role) === "ADMIN") {
      fetchPendingUsers();
    }
  }, [user]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Account approved successfully");
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } else {
        toast.error("Failed to approve account");
      }
    } catch (error) {
      toast.error("An error occurred during approval");
    }
  };

  const handleSelectRoleColor = (role: string) => {
    switch (role) {
      case "PROVIDER":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "DELIVERY_PARTNER":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelectRoleLabel = (role: string) => {
    switch (role) {
      case "PROVIDER":
        return "Restaurant Partner";
      case "DELIVERY_PARTNER":
        return "Delivery Partner";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review applications for new partners.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1 text-sm">Review applications for new restaurants and delivery drivers.</p>
      </div>

      {users.length === 0 ? (
        <Card className="border-dashed shadow-none bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-700">All caught up!</p>
            <p className="text-sm text-slate-500 mt-1">There are no pending accounts requiring your approval right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((pendingUser) => (
            <Card key={pendingUser._id} className="flex flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="bg-slate-50 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pendingUser.name}</CardTitle>
                    <CardDescription className="mt-1">{pendingUser.email}</CardDescription>
                  </div>
                  <Badge variant="secondary" className={handleSelectRoleColor(pendingUser.role)}>
                    {handleSelectRoleLabel(pendingUser.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 flex flex-col justify-between">
                <div className="text-sm text-slate-500 mb-6">
                  Applied on {new Date(pendingUser.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex gap-3 mt-auto">
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => handleApprove(pendingUser._id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-none text-destructive border-destructive hover:bg-destructive hover:text-white"
                    onClick={() => toast.info("Rejection feature not fully implemented yet.")}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
