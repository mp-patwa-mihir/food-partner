"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/constants/roles";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Package, Bike, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DeliveryDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/driver/orders");
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (isAuthLoading || isLoading) {
    return (
      <DashboardLayout role={UserRole.DELIVERY_PARTNER} userName="..." heading="Dashboard" description="..." icon="🛵">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const activeOrder = data?.orders?.find((o: any) => o.status === "OUT_FOR_DELIVERY");
  const driver = data?.driverProfile;

  return (
    <DashboardLayout
      role={UserRole.DELIVERY_PARTNER}
      userName={user?.name || "Delivery Partner"}
      heading="Delivery Dashboard"
      description="Manage your deliveries and track earnings."
      icon="🛵"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Active Delivery or Stats */}
        <Card className="md:col-span-2 overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>
                  {activeOrder ? "You have an ongoing delivery" : "Ready for new deliveries"}
                </CardDescription>
              </div>
              <Badge variant={activeOrder ? "default" : "outline"} className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">
                {activeOrder ? "On Duty" : "Available"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeOrder ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-muted-foreground/10">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bike className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Delivering Order #{activeOrder._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">To: {activeOrder.deliveryAddress.street}</p>
                  </div>
                  <Link href="/delivery/orders">
                    <Button size="sm">Manage</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">No active deliveries</h3>
                <p className="text-sm text-muted-foreground mb-6">Check back later or view live requests.</p>
                <Link href="/delivery/orders">
                  <Button variant="outline">View Open Orders</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile/Vehicle Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Profile</CardTitle>
            <CardDescription>Your details & performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Bike className="h-4 w-4" /> Vehicle
              </span>
              <span className="font-medium text-primary">{driver?.vehicleType || "Scooter"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" /> Rating
              </span>
              <span className="font-medium">
                {driver?.rating ? `${driver.rating.toFixed(1)} (${driver.totalDeliveries || 0})` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Lifetime
              </span>
              <span className="font-medium">
                {driver?.totalDeliveries != null ? `${driver.totalDeliveries} Trips` : "—"}
              </span>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
             <Button variant="ghost" size="sm" className="w-full text-xs" disabled>Edit Profile</Button>
          </CardFooter>
        </Card>

        {/* Earnings Summary */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Earnings</CardTitle>
                <CardDescription>Summary of your income this week.</CardDescription>
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {driver?.weeklyEarnings != null ? `₹${driver.weeklyEarnings.toFixed(2)}` : "Track earnings coming soon"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex">
               <div className="h-full bg-emerald-500 w-[70%]"></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
               <span>Mon</span>
               <span>Tue</span>
               <span>Wed</span>
               <span>Thu</span>
               <span>Fri</span>
               <span>Sat</span>
               <span>Sun</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
