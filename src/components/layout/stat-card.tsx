import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "muted";
  className?: string;
}

const TONE: Record<
  NonNullable<StatCardProps["tone"]>,
  { icon: string; value?: string }
> = {
  primary: { icon: "bg-primary/10 text-primary" },
  success: { icon: "bg-success/10 text-success", value: "text-success" },
  warning: { icon: "bg-warning/10 text-warning", value: "text-warning" },
  muted: { icon: "bg-background text-muted" },
};

export function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "primary",
  className,
}: StatCardProps) {
  const styles = TONE[tone];
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p
            className={cn(
              "mt-2 text-[1.75rem] font-semibold tabular-nums tracking-tight text-foreground",
              styles.value,
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
    </>
  );

  const shell = cn(
    "rounded-2xl border border-border/80 bg-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    href &&
      "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {content}
      </Link>
    );
  }

  return <div className={shell}>{content}</div>;
}
