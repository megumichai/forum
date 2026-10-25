import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { DetailSkeleton } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/use-async";

export function NewTopicPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const categories = useAsync(() => api.categories(), []);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (loading) return <DetailSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryId) {
      setError("请选择分类");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const topic = await api.createTopic({
        category_id: Number(categoryId),
        title,
        content,
      });
      navigate(`/t/${topic.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "发布失败",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Breadcrumbs
        items={[{ label: "首页", to: "/" }, { label: "发布话题" }]}
      />

      <h1 className="text-xl font-semibold tracking-tight">发布话题</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        分享一个想法，或者向社区提问
      </p>

      <Card className="mt-4 gap-0 py-6">
        <CardContent className="px-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-medium">
                分类
              </label>
              <Select
                id="category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={categories.status !== "success"}
                required
              >
                <option value="">选择分类</option>
                {categories.status === "success" &&
                  categories.data.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </Select>
              {categories.status === "error" && (
                <p className="text-sm text-destructive">分类加载失败</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                标题
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="一句话说明你的话题"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="text-sm font-medium">
                正文
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-48"
                placeholder="详细描述你的内容..."
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "发布中..." : "发布"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
