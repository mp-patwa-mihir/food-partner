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
import { Trash2, ShieldAlert, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${!currentStatus ? "blocked" : "unblocked"} successfully`);
        setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !currentStatus } : u));
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        setUsers(users.filter(u => u._id !== id));
      }
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage platform customers and providers.</p>
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
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {user.role.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.isBlocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                    title={user.isBlocked ? "Unblock User" : "Block User"}
                  >
                    {user.isBlocked ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-amber-600" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user._id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
