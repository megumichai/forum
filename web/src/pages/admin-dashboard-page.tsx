import {
  Eye,
  FileText,
  MessageSquare,
  Megaphone,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorState } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AdminCategoryStats } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatCount } from "@/lib/utils";

const chartConfig = {
  topic_count: {
    label: "话题",
    color: "var(--chart-1)",
  },
  view_count: {
    label: "浏览",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

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
              <CardDescription>柱状为话题数量，折线为浏览量</CardDescription>
            </CardHeader>
            <CardContent className="mt-4 px-5 pb-5">
              {stats.data.categories.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  暂无分类数据
                </p>
              ) : (
                <CategoryChart categories={stats.data.categories} />
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

function CategoryChart({
  categories,
}: {
  categories: AdminCategoryStats[];
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[320px] w-full"
    >
      <ComposedChart
        accessibilityLayer
        data={categories}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
        />
        <YAxis
          yAxisId="topics"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <YAxis
          yAxisId="views"
          orientation="right"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          yAxisId="topics"
          dataKey="topic_count"
          fill="var(--color-topic_count)"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="views"
          type="monotone"
          dataKey="view_count"
          stroke="var(--color-view_count)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
