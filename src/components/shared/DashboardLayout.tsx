import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserRole } from "@/models/User";

interface DashboardLayoutProps {
  role:        UserRole;
  userName:    string;
  heading:     string;
  description: string;
  icon:        string;
  children?:   React.ReactNode;
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CUSTOMER: "default",
  PROVIDER: "secondary",
  ADMIN:    "destructive",
};

export function DashboardLayout({
  role,
  userName,
  heading,
  description,
  icon,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-xl font-bold tracking-tight">🍽️ FoodPartner</span>
          <div className="flex items-center gap-4">
            <Badge variant={roleBadgeVariant[role]}>{role}</Badge>
            <span className="text-sm text-muted-foreground">
              {userName}
            </span>
            {/* Logout is handled client-side via useAuth — placeholder button */}
            <form action="/api/auth/logout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon}</span>
              <div>
                <CardTitle className="text-2xl">{heading}</CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          {children && <CardContent>{children}</CardContent>}
        </Card>

        {/* Placeholder content grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-dashed opacity-50">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Module {i} — Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This section is under construction.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
