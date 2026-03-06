"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
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
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const redirectTo = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;

      const result = await login(values, redirectTo);
      if (!result.success) {
        setServerError(result.message);
        toast.error("Login failed", {
          description: result.message,
        });
      } else {
        toast.success("Welcome back!", {
          description: "Login successful.",
        });
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      toast.error("Error", {
        description: "Something went wrong.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Welcome back
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
        <p className="text-base text-muted-foreground">
          Enter your email and password to access your dashboard, live orders, and saved account activity.
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
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

          <Button type="submit" className="h-12 w-full rounded-xl text-base shadow-sm shadow-primary/20" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <div className="rounded-2xl border bg-muted/35 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Why sign in?</p>
        <p className="mt-1">Track orders in real time, access your role-specific dashboard, and continue checkout without interruption.</p>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
