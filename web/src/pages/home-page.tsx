import { useState } from "react";

import { ErrorState, TopicListSkeleton } from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { PinnedTopics } from "@/components/pinned-topics";
import { TopicList } from "@/components/topic-list";
import { TopicListHeader } from "@/components/topic-list-header";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";

const PAGE_SIZE = 20;

export function HomePage() {
  const [page, setPage] = useState(1);
  const topics = useAsync(
    () => api.topics({ page, pageSize: PAGE_SIZE, pinned: false }),
    [page],
  );

  const changePage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">最新话题</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          看看社区里正在讨论什么
        </p>
      </div>

      <PinnedTopics />

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
