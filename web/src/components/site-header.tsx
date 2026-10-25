import { BookOpenText, MessageSquare } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "最新" },
  { to: "/categories", label: "分类" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <MessageSquare className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Forum</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href="/api/docs" target="_blank" rel="noreferrer">
              <BookOpenText />
              API
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
