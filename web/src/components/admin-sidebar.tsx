import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

const items = [
  { to: "/admin", label: "概览", icon: LayoutDashboard, end: true },
  { to: "/admin/topics", label: "话题", icon: FileText },
  { to: "/admin/posts", label: "回复", icon: MessageSquare },
  { to: "/admin/users", label: "用户", icon: Users },
  { to: "/admin/announcements", label: "公告", icon: Megaphone },
];

export function AdminSidebar() {
  return (
    <aside className="lg:w-52 lg:shrink-0 lg:border-r lg:pr-5">
      <div className="lg:sticky lg:top-20">
        <p className="mb-3 hidden text-xs font-medium tracking-wide text-muted-foreground uppercase lg:block">
          管理后台
        </p>

        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:pb-0">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent",
                    isActive
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 hidden border-t pt-4 lg:block">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            返回论坛
          </Link>
        </div>
      </div>
    </aside>
  );
}
