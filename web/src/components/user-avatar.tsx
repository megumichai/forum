import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Author } from "@/lib/api";
import { cn } from "@/lib/utils";

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: {
  user: Pick<Author, "display_name" | "username"> & {
    avatar_url?: string | null;
  };
  className?: string;
  fallbackClassName?: string;
}) {
  const name = user.display_name || user.username;
  const initial = Array.from(name)[0]?.toUpperCase() ?? "?";

  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarImage src={user.avatar_url ?? undefined} alt={name} />
      <AvatarFallback className={cn("text-sm", fallbackClassName)}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
