import { CalendarDays, MessageSquare, NotebookText } from "lucide-react";
import { useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { DetailSkeleton, ErrorState } from "@/components/loading";
import { RoleBadge } from "@/components/role-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatDate } from "@/lib/utils";

export function UserPage() {
  const { username = "" } = useParams();
  const user = useAsync(() => api.user(username), [username]);

  if (user.status === "loading") return <DetailSkeleton />;

  if (user.status === "error") {
    return <ErrorState message={user.error.message} onRetry={user.reload} />;
  }

  const data = user.data;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "首页", to: "/" },
          { label: data.display_name },
        ]}
      />

      <Card className="gap-0 py-6">
        <CardContent className="px-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              user={data}
              className="size-16"
              fallbackClassName="text-xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  {data.display_name}
                </h1>
                <RoleBadge role={data.role} />
              </div>
              <p className="text-sm text-muted-foreground">@{data.username}</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-foreground/90">
            {data.bio ?? "这个用户还没有填写个人简介。"}
          </p>

          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            加入于 {formatDate(data.created_at)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md border p-4">
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <NotebookText className="size-3.5" />
                主题
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {data.topic_count}
              </p>
            </div>
            <div className="rounded-md border p-4">
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="size-3.5" />
                回复
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {data.post_count}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
