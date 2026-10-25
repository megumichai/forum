import { ArrowUpRight, Hash } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";

export function CategoriesPage() {
  const categories = useAsync(() => api.categories(), []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">分类</h1>
        <p className="mt-1 text-sm text-muted-foreground">按分类浏览社区内容</p>
      </div>

      {categories.status === "loading" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-md" />
          ))}
        </div>
      )}

      {categories.status === "error" && (
        <ErrorState
          message={categories.error.message}
          onRetry={categories.reload}
        />
      )}

      {categories.status === "success" &&
        (categories.data.length === 0 ? (
          <EmptyState title="暂无分类" description="管理员还没有创建分类。" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.data.map((category) => (
              <Link
                key={category.id}
                to={`/c/${category.slug}`}
                className="group flex flex-col rounded-md border bg-card p-5 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground">
                    <Hash className="size-4" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="mt-4 font-medium">{category.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {category.description ?? "暂无描述"}
                </p>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
