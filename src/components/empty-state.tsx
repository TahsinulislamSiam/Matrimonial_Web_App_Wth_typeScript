import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="text-xl text-forest">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {actionHref && actionLabel && (
          <Link href={actionHref} className="btn-primary btn-sm">
            {actionLabel}
          </Link>
        )}
        {secondaryHref && secondaryLabel && (
          <Link href={secondaryHref} className="btn-secondary btn-sm">
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
