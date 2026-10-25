import {
  ArrowUpRight,
  Lock,
  LockOpen,
  Pin,
  PinOff,
  Search,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/empty-state";
import { ErrorState, TopicListSkeleton } from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type TopicSummary } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatCount, formatRelativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

export function AdminTopicsPage() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const topics = useAsync(
    () =>
      api.adminTopics({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
      }),
    [page, search],
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(input.trim());
  };

  const updateTopic = async (
    topic: TopicSummary,
    payload: { is_pinned?: boolean; is_locked?: boolean },
  ) => {
    setError(null);
    setPendingId(topic.id);
    try {
      await api.adminUpdateTopic(topic.id, payload);
      topics.reload();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "操作失败",
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (topic: TopicSummary) => {
    if (!window.confirm(`确定删除话题「${topic.title}」吗？`)) return;

    setError(null);
    setPendingId(topic.id);
    try {
      await api.adminDeleteTopic(topic.id);
      if (
        topics.status === "success" &&
        topics.data.items.length === 1 &&
        page > 1
      ) {
        setPage(page - 1);
      } else {
        topics.reload();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "删除失败",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">话题管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        置顶、锁定或删除社区中的话题
      </p>

      <form className="mt-4 flex gap-2" onSubmit={handleSearch}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="pl-9"
            placeholder="搜索话题标题"
          />
        </div>
        <Button type="submit" variant="outline">
          搜索
        </Button>
      </form>

      <Card className="mt-4 gap-0 py-0">
        {topics.status === "loading" && (
          <div className="px-5 py-2">
            <TopicListSkeleton />
          </div>
        )}

        {topics.status === "error" && (
          <ErrorState message={topics.error.message} onRetry={topics.reload} />
        )}

        {topics.status === "success" && (
          <>
            {error && (
              <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
            )}

            {topics.data.items.length === 0 ? (
              <EmptyState
                title="没有找到话题"
                description="尝试调整搜索关键词。"
              />
            ) : (
              <div className="divide-y">
                {topics.data.items.map((topic) => (
                  <article
                    key={topic.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {topic.is_pinned && (
                          <Badge variant="secondary">置顶</Badge>
                        )}
                        {topic.is_locked && (
                          <Badge variant="outline">已锁定</Badge>
                        )}
                        <Link
                          to={`/t/${topic.id}`}
                          className="line-clamp-2 font-medium hover:underline"
                        >
                          {topic.title}
                        </Link>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="rounded-md border px-1.5 py-0.5">
                          {topic.category.name}
                        </span>
                        <Link
                          to={`/u/${topic.author.username}`}
                          className="hover:text-foreground"
                        >
                          {topic.author.display_name}
                        </Link>
                        <span>{formatCount(topic.reply_count)} 回复</span>
                        <span>{formatCount(topic.view_count)} 浏览</span>
                        <time dateTime={topic.updated_at}>
                          {formatRelativeTime(topic.updated_at)}
                        </time>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === topic.id}
                        onClick={() =>
                          updateTopic(topic, {
                            is_pinned: !topic.is_pinned,
                          })
                        }
                      >
                        {topic.is_pinned ? <PinOff /> : <Pin />}
                        {topic.is_pinned ? "取消置顶" : "置顶"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === topic.id}
                        onClick={() =>
                          updateTopic(topic, {
                            is_locked: !topic.is_locked,
                          })
                        }
                      >
                        {topic.is_locked ? <LockOpen /> : <Lock />}
                        {topic.is_locked ? "解锁" : "锁定"}
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/t/${topic.id}`}>
                          <ArrowUpRight />
                          查看
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === topic.id}
                        onClick={() => handleDelete(topic)}
                      >
                        <Trash2 />
                        删除
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="px-5 pb-4">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={topics.data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
