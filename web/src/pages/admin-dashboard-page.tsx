import {
  Eye,
  FileText,
  MessageSquare,
  Megaphone,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatCount } from "@/lib/utils";

export function AdminDashboardPage() {
  const stats = useAsync(() => api.adminStats(), []);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">管理后台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            站点内容与用户概览
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/users">
              <Users />
              用户管理
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/announcements">
              <Megaphone />
              发布公告
            </Link>
          </Button>
        </div>
      </div>

      {stats.status === "loading" && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-md" />
          ))}
        </div>
      )}

      {stats.status === "error" && (
        <div className="mt-5">
          <ErrorState message={stats.error.message} onRetry={stats.reload} />
        </div>
      )}

      {stats.status === "success" && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users className="size-4" />}
              label="用户"
              value={stats.data.users}
              hint={`近 7 天 +${stats.data.new_users_7d}`}
            />
            <StatCard
              icon={<FileText className="size-4" />}
              label="话题"
              value={stats.data.topics}
              hint={`近 7 天 +${stats.data.new_topics_7d}`}
            />
            <StatCard
              icon={<MessageSquare className="size-4" />}
              label="回复"
              value={stats.data.posts}
              hint={`近 7 天 +${stats.data.new_posts_7d}`}
            />
            <StatCard
              icon={<Eye className="size-4" />}
              label="总浏览"
              value={stats.data.views}
              hint="累计浏览量"
            />
          </div>

          <Card className="mt-4 gap-0 py-0">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="text-sm">分类分布</CardTitle>
              <CardDescription>各分类的话题数量与浏览量</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 px-5 pb-5">
              {stats.data.categories.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  暂无分类数据
                </p>
              ) : (
                <CategoryBreakdown categories={stats.data.categories} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="px-5">
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
          {formatCount(value)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({
  categories,
}: {
  categories: {
    id: number;
    name: string;
    slug: string;
    topic_count: number;
    view_count: number;
  }[];
}) {
  const maxTopics = Math.max(
    1,
    ...categories.map((category) => category.topic_count),
  );

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <Link
              to={`/c/${category.slug}`}
              className="font-medium hover:underline"
            >
              {category.name}
            </Link>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatCount(category.topic_count)} 话题 ·{" "}
              {formatCount(category.view_count)} 浏览
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{
                width: `${(category.topic_count / maxTopics) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
