import Link from "next/link";

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Restaurants", href: "/restaurants" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    title: "For Partners",
    links: [
      { label: "Restaurant partner", href: "/register?role=PROVIDER" },
      { label: "Delivery partner", href: "/register?role=DELIVERY_PARTNER" },
      { label: "Provider dashboard", href: "/provider" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "Track orders", href: "/dashboard" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/90 text-card-foreground backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/8 via-background to-background p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Food delivery made elegant
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight sm:text-4xl">A cleaner, faster food ordering experience for every user.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Browse top restaurants, place orders with confidence, and manage customer, partner, and delivery workflows from one polished platform.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delivery promise</p>
                <p className="mt-2 text-lg font-semibold">Fast doorstep service</p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Experience</p>
                <p className="mt-2 text-lg font-semibold">Live order tracking</p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Platform</p>
                <p className="mt-2 text-lg font-semibold">Customers, partners, riders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 border-t border-border/60 pt-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl ring-1 ring-primary/15">🍽️</span>
              <div>
                <p className="text-lg font-black tracking-tight text-foreground">FoodPartner</p>
                <p className="text-sm text-muted-foreground">Professional food ordering for modern customers.</p>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Thoughtfully designed to help customers order faster and help restaurants and delivery teams operate with more confidence.
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">{group.title}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} FoodPartner. Crafted for a smoother ordering experience.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/restaurants" className="transition-colors hover:text-primary">Browse restaurants</Link>
            <Link href="/login" className="transition-colors hover:text-primary">Sign in</Link>
            <Link href="/register" className="transition-colors hover:text-primary">Create account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
