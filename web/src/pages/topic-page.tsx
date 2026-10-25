import { Eye, Lock, MessageSquare, Pencil, Pin, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  DetailSkeleton,
  ErrorState,
  PostListSkeleton,
} from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { RoleBadge } from "@/components/role-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/use-async";
import { formatCount, formatRelativeTime } from "@/lib/utils";

const PAGE_SIZE = 20;

export function TopicPage() {
  const { id = "" } = useParams();
  const topicId = Number(id);
  const topic = useAsync(() => api.topic(topicId), [topicId]);
  const [page, setPage] = useState(1);
  const posts = useAsync(
    () => api.topicPosts(topicId, page, PAGE_SIZE),
    [topicId, page],
  );
  const { user } = useAuth();
  const navigate = useNavigate();
  const repliesRef = useRef<HTMLElement>(null);

  const [viewCount, setViewCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .viewTopic(topicId)
      .then((result) => {
        if (active) setViewCount(result.view_count);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [topicId]);

  useEffect(() => {
    setPage(1);
  }, [topicId]);

  if (topic.status === "loading") return <DetailSkeleton />;

  if (topic.status === "error") {
    return <ErrorState message={topic.error.message} onRetry={topic.reload} />;
  }

  const data = topic.data;
  const staff = user?.role === "admin" || user?.role === "moderator";
  const canManageTopic = user !== null && (user.id === data.author.id || staff);
  const canReply = user !== null && (!data.is_locked || staff);
  const displayedPage = posts.status === "success" ? posts.data.page : page;
  const displayedViews = Math.max(data.view_count, viewCount ?? 0);

  const startEditing = () => {
    setEditTitle(data.title);
    setEditContent(data.content);
    setTopicError(null);
    setEditing(true);
  };

  const handleSaveTopic = async () => {
    setTopicError(null);
    setSaving(true);
    try {
      await api.updateTopic(topicId, {
        title: editTitle,
        content: editContent,
      });
      setEditing(false);
      topic.reload();
    } catch (saveError) {
      setTopicError(
        saveError instanceof Error ? saveError.message : "保存失败",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!window.confirm("确定删除这个主题吗？此操作无法撤销。")) return;

    setTopicError(null);
    try {
      await api.deleteTopic(topicId);
      navigate("/");
    } catch (deleteError) {
      setTopicError(
        deleteError instanceof Error ? deleteError.message : "删除失败",
      );
    }
  };

  const refreshPosts = () => {
    posts.reload();
    topic.reload();
  };

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim()) return;

    setReplyError(null);
    setReplying(true);
    try {
      await api.createPost(topicId, { content: reply });
      setReply("");
      topic.reload();

      const lastPage = Math.max(
        1,
        Math.ceil((data.reply_count + 1) / PAGE_SIZE),
      );
      if (lastPage === page) {
        posts.reload();
      } else {
        setPage(lastPage);
      }
    } catch (submitError) {
      setReplyError(
        submitError instanceof Error ? submitError.message : "回复失败",
      );
    } finally {
      setReplying(false);
    }
  };

  const changePage = (next: number) => {
    setPage(next);
    repliesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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
        <div className="flex flex-wrap items-start justify-between gap-3">
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

          {canManageTopic && !editing && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil />
                编辑
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDeleteTopic}>
                <Trash2 />
                删除
              </Button>
            </div>
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
            {formatCount(displayedViews)}
          </span>
        </div>

        {topicError && (
          <p className="mt-2 text-sm text-destructive">{topicError}</p>
        )}
      </header>

      {editing ? (
        <Card className="mt-5 gap-4 py-5">
          <CardContent className="space-y-3 px-5 sm:px-6">
            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-sm font-medium">
                标题
              </label>
              <Input
                id="edit-title"
                value={editTitle}
                maxLength={200}
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-content" className="text-sm font-medium">
                正文
              </label>
              <Textarea
                id="edit-content"
                value={editContent}
                className="min-h-40"
                onChange={(event) => setEditContent(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTopic}
                disabled={saving || !editTitle.trim() || !editContent.trim()}
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
      )}

      <section ref={repliesRef} className="mt-8 scroll-mt-20">
        <h2 className="text-sm font-medium">
          回复
          <span className="ml-1.5 font-normal text-muted-foreground">
            {data.reply_count}
          </span>
        </h2>

        {posts.status === "loading" && <PostListSkeleton />}

        {posts.status === "error" && (
          <ErrorState message={posts.error.message} onRetry={posts.reload} />
        )}

        {posts.status === "success" && (
          <>
            {posts.data.items.length === 0 ? (
              <Card className="mt-3 py-0">
                <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
                  还没有回复。
                </CardContent>
              </Card>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {posts.data.items.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    floor={
                      (displayedPage - 1) * PAGE_SIZE + index + 1
                    }
                    onChanged={refreshPosts}
                  />
                ))}
              </div>
            )}

            <Pagination
              page={displayedPage}
              pageSize={PAGE_SIZE}
              total={posts.data.total}
              onPageChange={changePage}
            />
          </>
        )}

        {canReply ? (
          <Card className="mt-3 gap-3 py-4">
            <CardContent className="px-5">
              <form className="space-y-3" onSubmit={handleReply}>
                <Textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  className="min-h-28"
                  placeholder="写下你的回复..."
                />
                {replyError && (
                  <p className="text-sm text-destructive">{replyError}</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">请文明发言</p>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={replying || !reply.trim()}
                  >
                    {replying ? "发送中..." : "回复"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : !user ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <Link
              to="/login"
              className="font-medium text-foreground hover:underline"
            >
              登录
            </Link>{" "}
            后参与讨论。
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            该主题已锁定，暂时无法回复。
          </p>
        )}
      </section>
    </div>
  );
}
