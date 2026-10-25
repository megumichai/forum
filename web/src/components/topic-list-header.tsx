export function TopicListHeader() {
  return (
    <div className="hidden items-center gap-4 border-b py-2 text-xs text-muted-foreground sm:flex">
      <div className="flex-1 pl-[56px]">话题</div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="w-10 text-right">回复</span>
        <span className="w-10 text-right">浏览</span>
        <span className="w-[70px] text-right">活动</span>
      </div>
    </div>
  );
}
