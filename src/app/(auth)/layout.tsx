"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,520px)_1fr]">
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12 xl:px-16">
          <div className="w-full max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl ring-1 ring-primary/15">🍽️</span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">FoodPartner</p>
                <p className="text-sm text-muted-foreground">Secure access for customers, partners, and riders</p>
              </div>
            </Link>

            <div className="mt-8 rounded-[2rem] border border-border/70 bg-background/88 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl sm:p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Secure onboarding experience
              </div>
              {children}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background/75 p-4 shadow-sm">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Protected sessions</p>
                <p className="mt-1 text-xs text-muted-foreground">Secure account access across every role.</p>
              </div>
              <div className="rounded-2xl border bg-background/75 p-4 shadow-sm">
                <Clock3 className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Faster checkout</p>
                <p className="mt-1 text-xs text-muted-foreground">Get from sign in to order placement quickly.</p>
              </div>
              <div className="rounded-2xl border bg-background/75 p-4 shadow-sm">
                <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Role-based journeys</p>
                <p className="mt-1 text-xs text-muted-foreground">Customer, provider, and delivery access built in.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden p-8 lg:block xl:p-10">
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 p-10 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.25),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30%)]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 flex h-full flex-col justify-between"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">Professional food operations</p>
                <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight xl:text-5xl">
                  Seamless access for every part of your food delivery workflow.
                </h1>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                  <p className="text-sm text-white/70">Customer experience</p>
                  <p className="mt-3 text-2xl font-bold">Clean ordering, live tracking, easy reorders.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                  <p className="text-sm text-white/70">Partner operations</p>
                  <p className="mt-3 text-2xl font-bold">Restaurant and delivery dashboards that stay organized.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/8 p-6 backdrop-blur-sm sm:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-3xl font-black text-orange-300">24/7</p>
                      <p className="mt-2 text-sm text-white/70">Always-on ordering and order management.</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-orange-300">Live</p>
                      <p className="mt-2 text-sm text-white/70">Realtime order updates where available.</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-orange-300">Multi-role</p>
                      <p className="mt-2 text-sm text-white/70">One platform for customers, providers, and riders.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
