import { MessageSquareDashed } from "lucide-react";

export function EmptyState({
  title = "暂无话题",
  description = "这里还没有内容，稍后再来看看吧。",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <span className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground">
        <MessageSquareDashed className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
