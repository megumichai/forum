import { Lock, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ErrorState } from "@/components/loading";
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
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type AdminCategory, type Role } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatCount } from "@/lib/utils";

type AccessValue = Role | "";

const ACCESS_OPTIONS: { value: AccessValue; label: string }[] = [
  { value: "", label: "所有用户" },
  { value: "user", label: "登录用户" },
  { value: "moderator", label: "版主及以上" },
  { value: "admin", label: "仅管理员" },
];

const ACCESS_LABELS: Record<Role, string> = {
  user: "登录用户",
  moderator: "版主及以上",
  admin: "仅管理员",
};

export function AdminCategoriesPage() {
  const categories = useAsync(() => api.adminCategories(), []);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [minRole, setMinRole] = useState<AccessValue>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreated(null);
    setCreating(true);
    try {
      const category = await api.adminCreateCategory({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        min_role: minRole || null,
      });
      setCreated(category.name);
      setName("");
      setSlug("");
      setDescription("");
      setMinRole("");
      categories.reload();
    } catch (submitError) {
      setCreateError(
        submitError instanceof Error ? submitError.message : "创建失败",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleAccessChange = async (
    category: AdminCategory,
    value: AccessValue,
  ) => {
    const nextRole = value || null;
    if (nextRole === category.min_role) return;

    setError(null);
    setPendingId(category.id);
    try {
      await api.adminUpdateCategory(category.id, { min_role: nextRole });
      categories.reload();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "操作失败",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold tracking-tight">分类管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        创建分类，并设置谁可以在其中发布新话题
      </p>

      <Card className="mt-4 gap-5 py-6">
        <CardHeader>
          <CardTitle className="text-sm">创建分类</CardTitle>
          <CardDescription>
            权限只影响发布新话题，所有用户仍可浏览和回复
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="category-name" className="text-sm font-medium">
                  名称
                </label>
                <Input
                  id="category-name"
                  value={name}
                  maxLength={64}
                  placeholder="例如：前端开发"
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category-slug" className="text-sm font-medium">
                  标识
                </label>
                <Input
                  id="category-slug"
                  value={slug}
                  maxLength={64}
                  pattern="[a-z0-9-]+"
                  placeholder="例如：frontend"
                  onChange={(event) => setSlug(event.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  仅小写字母、数字和连字符
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="category-description"
                className="text-sm font-medium"
              >
                简介（可选）
              </label>
              <Input
                id="category-description"
                value={description}
                maxLength={500}
                placeholder="一句话说明这个分类的用途"
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="category-access" className="text-sm font-medium">
                发布话题权限
              </label>
              <Select
                id="category-access"
                value={minRole}
                onChange={(event) =>
                  setMinRole(event.target.value as AccessValue)
                }
              >
                {ACCESS_OPTIONS.map((option) => (
                  <option
                    key={option.value || "public"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                发布话题需要登录，未登录访客始终只能浏览
              </p>
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            {created && (
              <p className="text-sm text-muted-foreground">
                「{created}」已创建
              </p>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={creating || !name.trim() || !slug.trim()}
              >
                <Plus />
                {creating ? "创建中..." : "创建分类"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 gap-0 py-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="text-sm">全部分类</CardTitle>
          <CardDescription>调整分类的发布话题权限</CardDescription>
        </CardHeader>

        {error && (
          <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
        )}

        {categories.status === "loading" && (
          <CardContent className="mt-3 space-y-2 px-5 pb-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </CardContent>
        )}

        {categories.status === "error" && (
          <ErrorState
            message={categories.error.message}
            onRetry={categories.reload}
          />
        )}

        {categories.status === "success" && (
          <CardContent className="mt-2 px-5 pb-4">
            <div className="divide-y">
              {categories.data.map((category) => (
                <article
                  key={category.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <span className="rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
                        /{category.slug}
                      </span>
                      {category.min_role && (
                        <Badge variant="outline" className="gap-1">
                          <Lock />
                          {ACCESS_LABELS[category.min_role]}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {category.description ?? "暂无简介"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatCount(category.topic_count)} 个话题
                    </p>
                  </div>

                  <Select
                    value={category.min_role ?? ""}
                    aria-label={`设置 ${category.name} 的发布话题权限`}
                    className="w-36"
                    disabled={pendingId === category.id}
                    onChange={(event) =>
                      handleAccessChange(
                        category,
                        event.target.value as AccessValue,
                      )
                    }
                  >
                    {ACCESS_OPTIONS.map((option) => (
                      <option
                        key={option.value || "public"}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </article>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
