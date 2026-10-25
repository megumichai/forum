import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-semibold tracking-tight">404</p>
      <p className="text-sm text-muted-foreground">找不到这个页面。</p>
      <Button asChild variant="outline" size="sm">
        <Link to="/">回到首页</Link>
      </Button>
    </div>
  );
}
