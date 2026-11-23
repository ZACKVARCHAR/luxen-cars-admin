import { cn } from "@/lib/cn";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-xs font-semibold text-gray-400">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-[#e10600]">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "red",
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "red" | "green" | "orange" | "slate";
  active?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    red: "bg-red-50 text-[#e10600]",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    slate: "bg-slate-100 text-slate-600",
  };
  const className = cn(
    "card kpi w-full text-start",
    onClick && "cursor-pointer hover:border-gray-300",
    active && "border-[#e10600] ring-2 ring-[#e10600]/15",
  );
  const content = (
    <>
      <div className={cn("kpi-icon", tones[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[1.35rem] font-extrabold leading-none tracking-tight">{value}</div>
        <div className="mt-1 truncate text-xs font-semibold text-gray-500">{label}</div>
        {hint && <div className="mt-0.5 truncate text-[11px] text-gray-400">{hint}</div>}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[#e8eaee] px-4 py-3 sm:px-5">
          {title ? <h2 className="font-display text-base font-bold">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function AlertBox({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "warn" | "info";
}) {
  const styles =
    tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-red-200 bg-red-50 text-red-700";
  return <div className={cn("mb-4 rounded-[12px] border px-4 py-3 text-sm", styles)}>{children}</div>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
