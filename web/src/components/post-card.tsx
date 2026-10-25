import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import type { Post } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

import { RoleBadge } from "./role-badge";
import { UserAvatar } from "./user-avatar";

export function PostCard({ post, floor }: { post: Post; floor: number }) {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="px-5">
        <div className="flex items-center gap-3">
          <Link to={`/u/${post.author.username}`} className="shrink-0">
            <UserAvatar user={post.author} className="size-8" />
          </Link>
          <div className="min-w-0 flex-1">
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

        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
          {post.content}
        </p>
      </CardContent>
    </Card>
  );
}
