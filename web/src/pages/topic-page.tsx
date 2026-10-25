import { Eye, Lock, MessageSquare, Pin } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { DetailSkeleton, ErrorState } from "@/components/loading";
import { PostCard } from "@/components/post-card";
import { RoleBadge } from "@/components/role-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatCount, formatRelativeTime } from "@/lib/utils";

export function TopicPage() {
  const { id = "" } = useParams();
  const topicId = Number(id);
  const topic = useAsync(() => api.topic(topicId), [topicId]);

  if (topic.status === "loading") return <DetailSkeleton />;

  if (topic.status === "error") {
    return <ErrorState message={topic.error.message} onRetry={topic.reload} />;
  }

  const data = topic.data;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "首页", to: "/" },
          { label: data.category.name, to: `/c/${data.category.slug}` },
          { label: "话题" },
        ]}
      />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/c/${data.category.slug}`}
            className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {data.category.name}
          </Link>
          {data.is_pinned && (
            <Badge variant="secondary" className="gap-1">
              <Pin />
              置顶
            </Badge>
          )}
          {data.is_locked && (
            <Badge variant="outline" className="gap-1">
              <Lock />
              已锁定
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight">
          {data.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Link
            to={`/u/${data.author.username}`}
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <UserAvatar
              user={data.author}
              className="size-5"
              fallbackClassName="text-[10px]"
            />
            {data.author.display_name}
          </Link>
          <RoleBadge role={data.author.role} />
          <time dateTime={data.created_at}>
            {formatRelativeTime(data.created_at)}
          </time>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {formatCount(data.reply_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            {formatCount(data.view_count)}
          </span>
        </div>
      </header>

      <Card className="mt-5 gap-4 py-5">
        <CardContent className="px-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link to={`/u/${data.author.username}`} className="shrink-0">
              <UserAvatar user={data.author} className="size-8" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/u/${data.author.username}`}
                  className="text-sm font-medium hover:underline"
                >
                  {data.author.display_name}
                </Link>
                <RoleBadge role={data.author.role} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(data.created_at)}
              </p>
            </div>
          </div>

          <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground/90">
            {data.content}
          </p>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="text-sm font-medium">
          回复
          <span className="ml-1.5 font-normal text-muted-foreground">
            {data.posts.length}
          </span>
        </h2>

        {data.posts.length === 0 ? (
          <Card className="mt-3 py-0">
            <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
              还没有回复。
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {data.posts.map((post, index) => (
              <PostCard key={post.id} post={post} floor={index + 1} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
