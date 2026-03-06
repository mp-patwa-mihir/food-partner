"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingBag, 
  Users, 
  Utensils, 
  IndianRupee, 
  ArrowUpRight, 
  Clock,
  ExternalLink
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/constants/roles";
import Link from "next/link";

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    menuItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [ordersRes, menuRes] = await Promise.all([
          fetch("/api/provider/orders?limit=5"),
          fetch("/api/provider/menu")
        ]);

        if (ordersRes.ok && menuRes.ok) {
          const ordersData = await ordersRes.json();
          const menuData = await menuRes.json();

          setRecentOrders(ordersData.orders || []);
          
          // Calculate mock stats based on data
          const revenue = (ordersData.orders || []).reduce((acc: number, o: any) => 
            o.status === "DELIVERED" ? acc + o.totalAmount : acc, 0);
          
          setStats({
            totalOrders: ordersData.pagination?.totalElements || 0,
            activeOrders: (ordersData.orders || []).filter((o: any) => 
              ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status)).length,
            totalRevenue: revenue,
            menuItems: menuData.items?.length || 0
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout
      role={UserRole.PROVIDER}
      userName={user?.name || "Partner"}
      heading={`Welcome back, ${user?.name?.split(" ")[0] || "Partner"}!`}
      description="Here's what's happening with your restaurant today."
      icon="👋"
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Revenue" 
            value={`₹${stats.totalRevenue.toLocaleString()}`} 
            icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
            description="+20.1% from last month"
          />
          <StatCard 
            title="Active Orders" 
            value={stats.activeOrders.toString()} 
            icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            description="3 orders in preparation"
          />
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders.toString()} 
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            description="Since you joined"
          />
          <StatCard 
            title="Menu Items" 
            value={stats.menuItems.toString()} 
            icon={<Utensils className="h-4 w-4 text-muted-foreground" />}
            description="5 categories"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Orders Table */}
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  You have {stats.activeOrders} active orders.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/provider/orders">
                  View All <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order: any) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs">
                          #{order._id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === "DELIVERED" ? "outline" : 
                            order.status === "PENDING" ? "secondary" : "default"
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{order.totalAmount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  No orders found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your restaurant operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActionButton 
                href="/provider/menu" 
                title="Manage Menu" 
                subtitle="Add or edit your dishes"
                icon={<Utensils className="h-5 w-5" />}
              />
              <ActionButton 
                href="/provider/restaurant" 
                title="Restaurant Profile" 
                subtitle="Update location and hours"
                icon={<ExternalLink className="h-5 w-5" />}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ActionButton({ href, title, subtitle, icon }: any) {
  return (
    <Button variant="outline" className="h-auto w-full justify-start p-4 text-left" asChild>
      <Link href={href}>
        <div className="mr-4 rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </Link>
    </Button>
  );
}
