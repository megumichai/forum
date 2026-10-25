import type { TopicSummary } from "@/lib/api";

import { EmptyState } from "./empty-state";
import { TopicRow } from "./topic-row";

export function TopicList({ topics }: { topics: TopicSummary[] }) {
  if (topics.length === 0) return <EmptyState />;

  return (
    <div className="divide-y">
      {topics.map((topic) => (
        <TopicRow key={topic.id} topic={topic} />
      ))}
    </div>
  );
}
