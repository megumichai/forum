import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, type Post } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";

import { RoleBadge } from "./role-badge";
import { UserAvatar } from "./user-avatar";

export function PostCard({
  post,
  floor,
  onChanged,
}: {
  post: Post;
  floor: number;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const staff = user?.role === "admin" || user?.role === "moderator";
  const canManage = user !== null && (user.id === post.author.id || staff);

  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSave = async () => {
    setError(null);
    setPending(true);
    try {
      await api.updatePost(post.id, { content });
      setEditing(false);
      onChanged();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setPending(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("确定删除这条回复吗？")) return;

    setError(null);
    try {
      await api.deletePost(post.id);
      onChanged();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "删除失败",
      );
    }
  };

  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to={`/u/${post.author.username}`} className="shrink-0">
              <UserAvatar user={post.author} className="size-8" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/u/${post.author.username}`}
                  className="text-sm font-medium hover:underline"
                >
                  {post.author.display_name}
                </Link>
                <RoleBadge role={post.author.role} />
              </div>
              <p className="text-xs text-muted-foreground">
                <time dateTime={post.created_at}>
                  {formatRelativeTime(post.created_at)}
                </time>
                <span className="mx-1.5">·</span>#{floor}
              </p>
            </div>
          </div>

          {canManage && !editing && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setContent(post.content);
                  setEditing(true);
                }}
              >
                <Pencil />
                编辑
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                <Trash2 />
                删除
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-4 space-y-3">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-32"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={pending || !content.trim()}
              >
                {pending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
              {post.content}
            </p>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
