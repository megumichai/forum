import { Pin } from "lucide-react";

import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";

import { TopicList } from "./topic-list";

const PINNED_PAGE_SIZE = 100;

export function PinnedTopics({ category }: { category?: string }) {
  const pinned = useAsync(
    () =>
      api.topics({
        category,
        pinned: true,
        page: 1,
        pageSize: PINNED_PAGE_SIZE,
      }),
    [category],
  );

  if (pinned.status !== "success" || pinned.data.items.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 gap-0 py-0">
      <div className="px-4 py-2 sm:px-5">
        <div className="flex items-center gap-1.5 border-b py-2.5 text-xs font-medium text-muted-foreground">
          <Pin className="size-3.5" />
          置顶话题
        </div>
        <TopicList topics={pinned.data.items} />
      </div>
    </Card>
  );
}
