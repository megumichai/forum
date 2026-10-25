import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/api";

const labels: Record<Exclude<Role, "user">, string> = {
  moderator: "版主",
  admin: "管理员",
};

export function RoleBadge({ role }: { role: Role }) {
  if (role === "user") return null;

  return (
    <Badge variant="secondary" className="font-normal">
      {labels[role]}
    </Badge>
  );
}
