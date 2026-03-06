"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  LogOut,
  Menu,
  UserCheck,
  Users,
  Activity,
  ChefHat
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SocketIndicator } from "@/components/shared/SocketIndicator";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Restaurants", href: "/admin/restaurants", icon: Store },
  { name: "Orders", href: "/admin/orders", icon: Activity },
  { name: "Drivers", href: "/admin/drivers", icon: UserCheck },
  { name: "Menu Items", href: "/admin/menu", icon: ChefHat },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950/95 text-slate-50 backdrop-blur-xl">
      <div className="border-b border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-lg ring-1 ring-blue-500/20">🛡️</span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Admin Portal</p>
            <p className="text-sm text-slate-400">System-wide operations and oversight</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive = 
               link.href === "/admin" 
                 ? pathname === "/admin" 
                 : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 rounded-2xl px-3 py-3 transition-all font-medium ${
                isActive
                  ? "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3">
          <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold overflow-hidden flex-shrink-0">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-50 truncate">
              {user?.name || "Administrator"}
            </p>
            <p className="text-xs text-slate-400 truncate">System Admin</p>
          </div>
        </div>
        </div>
        <div className="px-3 mb-4">
          <SocketIndicator />
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white group"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2 group-hover:text-red-400 transition-colors" />
          <span className="group-hover:text-red-400 transition-colors">
            Logout
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-900">
      <aside className="hidden md:block w-72 flex-shrink-0 sticky top-0 h-screen shadow-sm">
        {sidebarContent}
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/95 text-slate-50 border-b border-slate-800 flex items-center justify-between px-4 z-50 backdrop-blur">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🛡️</span>
          <span className="font-bold">Admin Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <SocketIndicator />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-50">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 md:pt-0">
        <div className="p-4 md:p-8 xl:p-12 h-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
