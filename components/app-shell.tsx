"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, LogOut, Package, Settings, ShoppingCart } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Дашборд",
    icon: LayoutDashboard,
  },
  {
    href: "/products",
    label: "Товары",
    icon: Package,
  },
  {
    href: "/orders",
    label: "Заказы",
    icon: ShoppingCart,
  },
  {
    href: "/analytics",
    label: "Аналитика",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "Настройки",
    icon: Settings,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link href="/dashboard" className="truncate font-semibold">
            OUTSET CRM
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Выход</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 md:flex-row md:gap-6">
        <aside className="md:w-64 md:shrink-0">
          <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:grid md:grid-cols-1 md:overflow-visible md:px-0 md:pb-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-[132px] flex-shrink-0 items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors md:min-w-0",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
