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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Store, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

// Matches our backend schema exactly
const restaurantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  address: z.string().min(5, "Please enter a complete address."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  pincode: z.string().min(5, "Valid pincode is required."),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;

export default function RestaurantProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRestaurant, setHasExistingRestaurant] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      logo: "",
      coverImage: "",
    },
  });

  // Fetch existing restaurant data on mount
  useEffect(() => {
    async function loadRestaurantData() {
      try {
        const response = await fetch("/api/provider/restaurant");
        if (response.ok) {
          const data = await response.json();
          if (data.restaurant) {
            setHasExistingRestaurant(true);
            setIsApproved(data.restaurant.isApproved);
            
            // Populate form with existing data
            form.reset({
              name: data.restaurant.name || "",
              description: data.restaurant.description || "",
              address: data.restaurant.address || "",
              city: data.restaurant.city || "",
              state: data.restaurant.state || "",
              pincode: data.restaurant.pincode || "",
              logo: data.restaurant.logo || "",
              coverImage: data.restaurant.coverImage || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch restaurant:", error);
        setGeneralError("Failed to load restaurant profile. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRestaurantData();
  }, [form]);

  async function onSubmit(data: RestaurantFormValues) {
    setIsSubmitting(true);
    setGeneralError("");
    setSuccessMessage("");

    try {
      // If they already have a restaurant, this form could become a PATCH route later.
      // For now, our backend MVP supports POST to create. 
      // We will prevent POSTing if hasExistingRestaurant is true.
      if (hasExistingRestaurant) {
         setGeneralError("Updates are currently restricted. Contact support.");
         setIsSubmitting(false);
         return;
      }

      const response = await fetch("/api/provider/restaurant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit profile.");
      }

      setSuccessMessage("Restaurant profile created! Awaiting admin approval.");
      setHasExistingRestaurant(true);
      // isApproved is false by default on new creations
    } catch (error: any) {
      setGeneralError(error.message || "An unexpected error occurred.");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Store className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Restaurant Profile</h1>
      </div>

      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Approval Status Banner */}
      {hasExistingRestaurant && (
        <Alert
          className={
            isApproved
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }
        >
          {isApproved ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <AlertTitle className="font-semibold">
            Status: {isApproved ? "Approved & Live" : "Pending Approval"}
          </AlertTitle>
          <AlertDescription>
            {isApproved
              ? "Your restaurant is visible to customers. You can now publish menu items."
              : "Your profile is under review by our admin team. You cannot publish menu items yet."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            {hasExistingRestaurant 
              ? "Your current restaurant details." 
              : "Enter your restaurant details to begin onboarding."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Restaurant Name *</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="e.g. The Spicy Kitchen" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={hasExistingRestaurant}
                          placeholder="Tell customers about your cuisine and specialties..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="123 Food Street, Shop #4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="Maharashtra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode *</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="400001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Image URL</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>Optimal size: 500x500px</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input disabled={hasExistingRestaurant} placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>Optimal size: 1200x400px</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!hasExistingRestaurant && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Approval
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
