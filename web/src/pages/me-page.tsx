import {
  CalendarDays,
  MessageSquare,
  NotebookText,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import {
  ErrorState,
  PostListSkeleton,
  TopicListSkeleton,
} from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { RoleBadge } from "@/components/role-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type UserPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/use-async";
import {
  formatCount,
  formatDate,
  formatRelativeTime,
} from "@/lib/utils";

const PAGE_SIZE = 10;

type Tab = "topics" | "replies";

export function MePage() {
  const { user } = useAuth();
  const username = user?.username ?? "";
  const profile = useAsync(() => api.user(username), [username]);
  const [tab, setTab] = useState<Tab>("topics");

  if (!user) return null;

  const counts =
    profile.status === "success"
      ? {
          topics: profile.data.topic_count,
          posts: profile.data.post_count,
        }
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Breadcrumbs items={[{ label: "首页", to: "/" }, { label: "个人中心" }]} />

      <Card className="gap-0 py-6">
        <CardContent className="px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                user={user}
                className="size-16"
                fallbackClassName="text-xl"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">
                    {user.display_name}
                  </h1>
                  <RoleBadge role={user.role} />
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <p className="mt-2 text-sm text-foreground/90">
                  {user.bio ?? "还没有填写个人简介。"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/u/${user.username}`}>查看主页</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/settings">
                  <Settings />
                  编辑资料
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              加入于 {formatDate(user.created_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <NotebookText className="size-3.5" />
              主题 {counts ? counts.topics : "—"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              回复 {counts ? counts.posts : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center gap-1 border-b">
        <TabButton
          active={tab === "topics"}
          count={counts?.topics}
          onClick={() => setTab("topics")}
        >
          我的主题
        </TabButton>
        <TabButton
          active={tab === "replies"}
          count={counts?.posts}
          onClick={() => setTab("replies")}
        >
          我的回复
        </TabButton>
      </div>

      {tab === "topics" ? (
        <MyTopics username={user.username} onChanged={profile.reload} />
      ) : (
        <MyPosts username={user.username} onChanged={profile.reload} />
      )}
    </div>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "-mb-px border-b-2 border-foreground px-3 py-2 text-sm font-medium text-foreground"
          : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      }
    >
      {children}
      {count !== undefined && (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

function MyTopics({
  username,
  onChanged,
}: {
  username: string;
  onChanged: () => void;
}) {
  const [page, setPage] = useState(1);
  const topics = useAsync(
    () => api.userTopics(username, page, PAGE_SIZE),
    [username, page],
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const handleDelete = async (topicId: number) => {
    if (!window.confirm("确定删除这个主题吗？此操作无法撤销。")) return;

    setError(null);
    setPendingId(topicId);
    try {
      await api.deleteTopic(topicId);
      onChanged();
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
          {error && <p className="px-5 pt-3 text-sm text-destructive">{error}</p>}

          {topics.data.items.length === 0 ? (
            <EmptyState
              title="还没有发布主题"
              description="你发布的主题会显示在这里。"
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
                      <span>{formatCount(topic.reply_count)} 回复</span>
                      <span>{formatCount(topic.view_count)} 浏览</span>
                      <time dateTime={topic.created_at}>
                        {formatRelativeTime(topic.created_at)}
                      </time>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/t/${topic.id}`}>
                        <Pencil />
                        编辑
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingId === topic.id}
                      onClick={() => handleDelete(topic.id)}
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
  );
}

function MyPosts({
  username,
  onChanged,
}: {
  username: string;
  onChanged: () => void;
}) {
  const [page, setPage] = useState(1);
  const posts = useAsync(
    () => api.userPosts(username, page, PAGE_SIZE),
    [username, page],
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const startEditing = (post: UserPost) => {
    setEditingId(post.id);
    setDraft(post.content);
    setError(null);
  };

  const handleSave = async (post: UserPost) => {
    if (!draft.trim()) return;

    setError(null);
    setPendingId(post.id);
    try {
      await api.updatePost(post.id, { content: draft });
      setEditingId(null);
      posts.reload();
      onChanged();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (post: UserPost) => {
    if (!window.confirm("确定删除这条回复吗？")) return;

    setError(null);
    setPendingId(post.id);
    try {
      await api.deletePost(post.id);
      onChanged();
      setEditingId(null);
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
          {error && <p className="px-5 pt-3 text-sm text-destructive">{error}</p>}

          {posts.data.items.length === 0 ? (
            <EmptyState
              title="还没有回复"
              description="参与讨论后，你的回复会显示在这里。"
            />
          ) : (
            <div className="divide-y">
              {posts.data.items.map((post) => (
                <article key={post.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/t/${post.topic.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                      >
                        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-1">{post.topic.title}</span>
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        回复于{" "}
                        <time dateTime={post.created_at}>
                          {formatRelativeTime(post.created_at)}
                        </time>
                      </p>
                    </div>

                    {editingId !== post.id && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(post)}
                        >
                          <Pencil />
                          编辑
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
                    )}
                  </div>

                  {editingId === post.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={draft}
                        className="min-h-28"
                        onChange={(event) => setDraft(event.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === post.id}
                          onClick={() => setEditingId(null)}
                        >
                          取消
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            pendingId === post.id || !draft.trim()
                          }
                          onClick={() => handleSave(post)}
                        >
                          {pendingId === post.id ? "保存中..." : "保存"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                      {post.content}
                    </p>
                  )}
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
  );
}
