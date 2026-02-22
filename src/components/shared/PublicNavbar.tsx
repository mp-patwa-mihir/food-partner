"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Restaurants", href: "/restaurants" }, // placeholder
];

export function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { cart, setDrawerOpen } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect scrolling to toggle sticky header styling with shadow/blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile sheet on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <motion.header
      className={cn(
        "fixed top-0 z-50 w-full transition-colors duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        boxShadow: isScrolled ? "0 1px 2px 0 rgb(0 0 0 / 0.05)" : "none",
      }}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold inline-block">🍽️ FoodPartner</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop Auth Buttons & Cart */}
        <div className="hidden md:flex items-center gap-4">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart && cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cart.items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
              <span className="sr-only">Open Cart</span>
            </Button>
          )}

          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Navigation (Sheet) */}
        <div className="flex md:hidden items-center">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="text-left font-bold text-xl mb-6">
                🍽️ FoodPartner
              </SheetTitle>
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block px-2 py-1 text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="mt-8 flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button
                    className="w-full justify-center"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
