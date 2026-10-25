import { ArrowUpRight, Megaphone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, type TopicSummary } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatRelativeTime } from "@/lib/utils";

export function AdminAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<TopicSummary | null>(null);
  const recent = useAsync(
    () =>
      api.adminTopics({
        page: 1,
        pageSize: 6,
        category: "announcements",
      }),
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPublished(null);
    setPending(true);
    try {
      const topic = await api.adminCreateAnnouncement({ title, content });
      setTitle("");
      setContent("");
      setPublished(topic);
      recent.reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "发布失败",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight">公告管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        发布站务公告，公告会自动置顶在「站务公告」分类中
      </p>

      <Card className="mt-4 gap-5 py-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Megaphone className="size-4" />
            发布公告
          </CardTitle>
          <CardDescription>
            内容会立即发布，所有访客都能看到
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="announcement-title" className="text-sm font-medium">
                标题
              </label>
              <Input
                id="announcement-title"
                value={title}
                maxLength={200}
                placeholder="公告标题"
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="announcement-content"
                className="text-sm font-medium"
              >
                正文
              </label>
              <Textarea
                id="announcement-content"
                value={content}
                className="min-h-40"
                placeholder="公告内容..."
                onChange={(event) => setContent(event.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {published && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span>公告已发布</span>
                <Link
                  to={`/t/${published.id}`}
                  className="inline-flex items-center gap-1 font-medium hover:underline"
                >
                  查看公告
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={pending || !title.trim() || !content.trim()}
              >
                {pending ? "发布中..." : "发布公告"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 gap-0 py-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="text-sm">最近公告</CardTitle>
          <CardDescription>「站务公告」分类中的最新话题</CardDescription>
        </CardHeader>
        <CardContent className="mt-3 px-5 pb-4">
          {recent.status === "loading" && (
            <div className="space-y-2 py-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          )}

          {recent.status === "error" && (
            <div className="flex items-center justify-between gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                最近公告加载失败
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={recent.reload}
              >
                重试
              </Button>
            </div>
          )}

          {recent.status === "success" &&
            (recent.data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                还没有公告
              </p>
            ) : (
              <div className="divide-y">
                {recent.data.items.map((topic) => (
                  <article
                    key={topic.id}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/t/${topic.id}`}
                        className="line-clamp-2 text-sm font-medium hover:underline"
                      >
                        {topic.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(topic.created_at)} ·{" "}
                        {topic.reply_count} 回复
                      </p>
                    </div>
                    {topic.is_pinned && (
                      <Badge variant="secondary">置顶</Badge>
                    )}
                  </article>
                ))}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
