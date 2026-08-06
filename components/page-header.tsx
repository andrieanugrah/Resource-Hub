import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
          {children}
        </div>
      ) : action ? (
        <Link
          href={action.href}
          className={buttonVariants({ variant: "default", className: "shrink-0 rounded-xl shadow-sm self-start sm:self-auto" })}
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

