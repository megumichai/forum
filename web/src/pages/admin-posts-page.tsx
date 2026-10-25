import { ArrowUpRight, Search, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/empty-state";
import { ErrorState, PostListSkeleton } from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type AdminPost } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatRelativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

export function AdminPostsPage() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const posts = useAsync(
    () =>
      api.adminPosts({
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

  const handleDelete = async (post: AdminPost) => {
    if (!window.confirm("确定删除这条回复吗？")) return;

    setError(null);
    setPendingId(post.id);
    try {
      await api.adminDeletePost(post.id);
      if (
        posts.status === "success" &&
        posts.data.items.length === 1 &&
        page > 1
      ) {
        setPage(page - 1);
      } else {
        posts.reload();
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
      <h1 className="text-xl font-semibold tracking-tight">回复管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        查看并删除不当回复
      </p>

      <form className="mt-4 flex gap-2" onSubmit={handleSearch}>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="pl-9"
            placeholder="搜索回复内容"
          />
        </div>
        <Button type="submit" variant="outline">
          搜索
        </Button>
      </form>

      <Card className="mt-4 gap-0 py-0">
        {posts.status === "loading" && (
          <div className="px-5">
            <PostListSkeleton />
          </div>
        )}

        {posts.status === "error" && (
          <ErrorState message={posts.error.message} onRetry={posts.reload} />
        )}

        {posts.status === "success" && (
          <>
            {error && (
              <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
            )}

            {posts.data.items.length === 0 ? (
              <EmptyState
                title="没有找到回复"
                description="尝试调整搜索关键词。"
              />
            ) : (
              <div className="divide-y">
                {posts.data.items.map((post) => (
                  <article
                    key={post.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <Link
                        to={`/u/${post.author.username}`}
                        className="mt-0.5 shrink-0"
                      >
                        <UserAvatar
                          user={post.author}
                          className="size-8"
                          fallbackClassName="text-xs"
                        />
                      </Link>
                      <div className="min-w-0">
                        <p className="text-sm">
                          <Link
                            to={`/u/${post.author.username}`}
                            className="font-medium hover:underline"
                          >
                            {post.author.display_name}
                          </Link>
                          <span className="text-muted-foreground"> 回复了 </span>
                          <Link
                            to={`/t/${post.topic.id}`}
                            className="font-medium hover:underline"
                          >
                            {post.topic.title}
                          </Link>
                        </p>
                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                          {post.content}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          <time dateTime={post.created_at}>
                            {formatRelativeTime(post.created_at)}
                          </time>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/t/${post.topic.id}`}>
                          <ArrowUpRight />
                          查看
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === post.id}
                        onClick={() => handleDelete(post)}
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
                total={posts.data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
