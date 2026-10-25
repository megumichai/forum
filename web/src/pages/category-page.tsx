import { Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ErrorState, TopicListSkeleton } from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { TopicList } from "@/components/topic-list";
import { TopicListHeader } from "@/components/topic-list-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";

const PAGE_SIZE = 20;

export function CategoryPage() {
  const { slug = "" } = useParams();
  const [page, setPage] = useState(1);
  const category = useAsync(() => api.category(slug), [slug]);
  const topics = useAsync(
    () => api.topics({ category: slug, page, pageSize: PAGE_SIZE }),
    [slug, page],
  );

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const changePage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "首页", to: "/" },
          { label: category.data?.name ?? "分类" },
        ]}
      />

      <header className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Hash className="size-4" />
        </span>
        <div className="min-w-0">
          {category.status === "loading" && <Skeleton className="h-6 w-40" />}
          {category.status === "success" && (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                {category.data.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {category.data.description ?? "暂无描述"}
              </p>
            </>
          )}
          {category.status === "error" && (
            <p className="mt-1 text-sm text-muted-foreground">
              分类不存在或加载失败
            </p>
          )}
        </div>
      </header>

      <Card className="gap-0 py-0">
        <div className="px-4 py-2 sm:px-5">
          <TopicListHeader />
          {topics.status === "loading" && <TopicListSkeleton />}
          {topics.status === "error" && (
            <ErrorState message={topics.error.message} onRetry={topics.reload} />
          )}
          {topics.status === "success" && (
            <>
              <TopicList topics={topics.data.items} />
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={topics.data.total}
                onPageChange={changePage}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
