import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/empty-state";
import { ErrorState, TopicListSkeleton } from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { RoleBadge } from "@/components/role-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api, type AdminUser, type Role } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/use-async";
import { formatCount, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<Role, string> = {
  user: "用户",
  moderator: "版主",
  admin: "管理员",
};

type RoleFilter = Role | "";

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const users = useAsync(
    () =>
      api.adminUsers({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
      }),
    [page, search, roleFilter],
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(input.trim());
  };

  const handleRoleChange = async (target: AdminUser, role: Role) => {
    if (role === target.role) return;

    setError(null);
    setPendingId(target.id);
    try {
      await api.adminUpdateUserRole(target.id, role);
      users.reload();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "操作失败",
      );
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">用户管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        搜索用户并调整其角色权限
      </p>

      <form className="mt-4 flex flex-wrap gap-2" onSubmit={handleSearch}>
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="pl-9"
            placeholder="搜索用户名、显示名称或邮箱"
          />
        </div>
        <Select
          value={roleFilter}
          aria-label="筛选角色"
          className="w-28"
          onChange={(event) => {
            setRoleFilter(event.target.value as RoleFilter);
            setPage(1);
          }}
        >
          <option value="">全部角色</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          搜索
        </Button>
      </form>

      <Card className="mt-4 gap-0 py-0">
        {users.status === "loading" && (
          <div className="px-5 py-2">
            <TopicListSkeleton />
          </div>
        )}

        {users.status === "error" && (
          <ErrorState message={users.error.message} onRetry={users.reload} />
        )}

        {users.status === "success" && (
          <>
            {error && (
              <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
            )}

            {users.data.items.length === 0 ? (
              <EmptyState
                title="没有找到用户"
                description="尝试调整搜索关键词或角色筛选。"
              />
            ) : (
              <div className="divide-y">
                {users.data.items.map((user) => {
                  const isSelf = currentUser?.id === user.id;

                  return (
                    <article
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          user={user}
                          className="size-9"
                          fallbackClassName="text-xs"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to={`/u/${user.username}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {user.display_name}
                            </Link>
                            <RoleBadge role={user.role} />
                            {isSelf && (
                              <Badge variant="outline">当前账号</Badge>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            @{user.username} · {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {formatCount(user.topic_count)} 话题 ·{" "}
                          {formatCount(user.post_count)} 回复
                        </span>
                        <span>加入于 {formatDate(user.created_at)}</span>
                        <Select
                          value={user.role}
                          aria-label={`设置 ${user.display_name} 的角色`}
                          className="w-28"
                          disabled={isSelf || pendingId === user.id}
                          onChange={(event) =>
                            handleRoleChange(
                              user,
                              event.target.value as Role,
                            )
                          }
                        >
                          <option value="user">用户</option>
                          <option value="moderator">版主</option>
                          <option value="admin">管理员</option>
                        </Select>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="px-5 pb-4">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={users.data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
