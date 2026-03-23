export function BrowserFrame({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-xl ${className}`}
    >
      {/* macOS-style window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/40">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[11px] text-muted-foreground truncate">
          {title}
        </span>
      </div>
      {/* Content */}
      <div className="bg-background/80">{children}</div>
    </div>
  );
}
