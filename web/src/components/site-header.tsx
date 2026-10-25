import { BookOpenText, LogOut, MessageSquare } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "最新" },
  { to: "/categories", label: "分类" },
];

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <a href="/api/docs" target="_blank" rel="noreferrer">
              <BookOpenText />
              API
            </a>
          </Button>

          {loading && <Skeleton className="h-8 w-20" />}

          {!loading && user && (
            <div className="flex items-center gap-1">
              <Link
                to={`/u/${user.username}`}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent"
              >
                <UserAvatar
                  user={user}
                  className="size-7"
                  fallbackClassName="text-xs"
                />
                <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                  {user.display_name}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="退出登录"
                onClick={handleLogout}
              >
                <LogOut />
              </Button>
            </div>
          )}

          {!loading && !user && (
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">登录</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
