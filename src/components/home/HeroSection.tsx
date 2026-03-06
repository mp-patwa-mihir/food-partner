"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Search, Utensils, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const floatingVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const floatingVariantsReverse: Variants = {
  animate: {
    y: [0, 10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-28 pb-24 sm:pb-28">
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[10%] -left-[10%] h-[45%] w-[45%] rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] h-[50%] w-[50%] rounded-full bg-secondary/12 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center text-center lg:text-left"
          >
            <div className="mb-6 inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm font-medium mx-auto lg:mx-0">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Now delivering with a smoother ordering flow
            </div>
            
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Order food with a
              <span className="block text-primary">cleaner, faster experience.</span>
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:mx-0">
              Discover the best local restaurants, browse menus effortlessly, and check out with a polished ordering experience that feels modern from start to finish.
            </p>

            <div className="mx-auto w-full max-w-xl lg:mx-0">
              <div className="relative flex items-center rounded-[1.75rem] border border-border/70 bg-background/85 p-2 shadow-xl shadow-black/5 backdrop-blur-sm">
                <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search restaurants, cuisines, or dishes" 
                  className="h-14 border-0 bg-transparent pl-11 pr-32 text-base shadow-none focus-visible:ring-0"
                />
                <Button asChild className="absolute right-1.5 top-1.5 h-11 rounded-full px-6 shadow-md shadow-primary/20">
                  <Link href="/restaurants">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <div className="rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  4.8+ experience rating
                </div>
                <div className="rounded-full border bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  Live checkout & tracking
                </div>
                <Button variant="outline" className="rounded-full bg-background/80" asChild>
                  <Link href="/register?role=PROVIDER">Join as Partner</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block h-[600px] w-full"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-96 w-96 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl" />
            </div>

            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute left-[10%] top-[16%] flex items-center gap-3 rounded-[1.75rem] border bg-background/85 p-5 shadow-xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Curated local restaurants</p>
                <p className="text-xs text-muted-foreground">Menus organized for faster browsing</p>
              </div>
            </motion.div>

            <motion.div 
              variants={floatingVariantsReverse}
              animate="animate"
              className="absolute right-[5%] top-[47%] flex items-center gap-3 rounded-[1.75rem] border bg-background/85 p-5 shadow-xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Checkout designed for clarity</p>
                <p className="text-xs text-muted-foreground">Transparent totals and delivery details</p>
              </div>
            </motion.div>

            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute bottom-[18%] left-[18%] flex items-center gap-3 rounded-[1.75rem] border bg-background/85 p-5 shadow-xl backdrop-blur-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Professional user experience</p>
                <p className="text-xs text-muted-foreground">From discovery to order confirmation</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
