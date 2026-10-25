import { Hash, Home } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { cn } from "@/lib/utils";

function SidebarLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
        active
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function SiteSidebar() {
  const { pathname } = useLocation();
  const categories = useAsync(() => api.categories(), []);

  return (
    <aside className="hidden w-[240px] shrink-0 border-r pr-5 lg:block">
      <div className="sticky top-20 flex flex-col gap-6">
        <nav className="flex flex-col gap-0.5">
          <SidebarLink to="/" active={pathname === "/"}>
            <Home className="size-4 shrink-0" />
            最新话题
          </SidebarLink>
          <SidebarLink to="/categories" active={pathname === "/categories"}>
            <Hash className="size-4 shrink-0" />
            全部分类
          </SidebarLink>
        </nav>

        <div>
          <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
            分类
          </p>
          <div className="flex flex-col gap-0.5">
            {categories.status === "loading" &&
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="mx-2 h-7" />
              ))}

            {categories.status === "error" && (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                分类加载失败
              </p>
            )}

            {categories.status === "success" &&
              categories.data.map((category) => {
                const active = pathname === `/c/${category.slug}`;
                return (
                  <Link
                    key={category.id}
                    to={`/c/${category.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
                      active
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        active ? "bg-foreground" : "bg-muted-foreground/50",
                      )}
                    />
                    <span className="truncate">{category.name}</span>
                  </Link>
                );
              })}
          </div>
        </div>

        <p className="px-2 text-xs leading-5 text-muted-foreground">
          一个用于交流技术、分享想法的小社区。
        </p>
      </div>
    </aside>
  );
}
