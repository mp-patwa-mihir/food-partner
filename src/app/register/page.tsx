"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "CUSTOMER",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role === "CUSTOMER" || role === "PROVIDER" || role === "DELIVERY_PARTNER") {
      form.setValue("role", role);
    }
  }, [form]);

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.message || "Registration failed");
        toast.error("Registration failed", {
          description: json.message,
        });
      } else {
        setIsSuccess(true);
        toast.success("Account created!", {
          description: "Please sign in with your new credentials.",
        });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      toast.error("Error", {
        description: "Something went wrong.",
      });
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center space-y-4 text-center py-12"
      >
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Registration Successful!</h2>
          <p className="text-muted-foreground">
            Redirecting you to the login page...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Create your role-based account
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
        <p className="text-base text-muted-foreground">
          Join as a customer, restaurant partner, or delivery partner and get a cleaner onboarding experience from the first screen.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{serverError}</span>
            </motion.div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="John Doe"
                      className="h-12 rounded-xl border-border/70 bg-background/90 pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="name@example.com"
                      className="h-12 rounded-xl border-border/70 bg-background/90 pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl border-border/70 bg-background/90">
                      <SelectValue placeholder="Select an account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer (Order Food)</SelectItem>
                    <SelectItem value="PROVIDER">Restaurant Partner</SelectItem>
                    <SelectItem value="DELIVERY_PARTNER">Delivery Partner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose the experience that matches how you&apos;ll use FoodPartner.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-xl border-border/70 bg-background/90 pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-xl border-border/70 bg-background/90 pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="h-12 w-full rounded-xl text-base shadow-sm shadow-primary/20" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>

      <div className="rounded-2xl border bg-muted/35 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What happens next?</p>
        <p className="mt-1">After signup, you&apos;ll be able to access the dashboard and workflow designed for your selected role.</p>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
