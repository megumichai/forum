import { Lock, Pin } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { TopicSummary } from "@/lib/api";
import { formatCount, formatRelativeTime } from "@/lib/utils";

import { UserAvatar } from "./user-avatar";

export function TopicRow({ topic }: { topic: TopicSummary }) {
  return (
    <article className="-mx-3 flex gap-4 rounded-md px-3 py-4 transition-colors hover:bg-accent/50">
      <Link
        to={`/u/${topic.author.username}`}
        className="mt-0.5 shrink-0"
        aria-label={`查看 ${topic.author.display_name} 的主页`}
      >
        <UserAvatar user={topic.author} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {topic.is_pinned && (
            <Badge variant="secondary" className="gap-1">
              <Pin />
              置顶
            </Badge>
          )}
          <Link
            to={`/t/${topic.id}`}
            className="line-clamp-2 text-[15px] font-medium leading-snug hover:underline"
          >
            {topic.title}
          </Link>
          {topic.is_locked && (
            <Lock className="size-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Link
            to={`/c/${topic.category.slug}`}
            className="rounded-md border px-1.5 py-0.5 transition-colors hover:bg-background hover:text-foreground"
          >
            {topic.category.name}
          </Link>
          <Link
            to={`/u/${topic.author.username}`}
            className="hover:text-foreground"
          >
            {topic.author.display_name}
          </Link>
          <time dateTime={topic.created_at}>
            {formatRelativeTime(topic.created_at)}
          </time>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-4 self-center text-xs tabular-nums text-muted-foreground sm:flex">
        <span className="w-10 text-right" title="回复数">
          {formatCount(topic.reply_count)}
        </span>
        <span className="w-10 text-right" title="浏览量">
          {formatCount(topic.view_count)}
        </span>
        <span className="w-[70px] text-right" title="最后活动">
          {formatRelativeTime(topic.updated_at)}
        </span>
      </div>
    </article>
  );
}
