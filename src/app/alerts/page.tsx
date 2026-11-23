"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { AlertDetail } from "@/lib/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const SEVERITY: Record<string, string> = {
  critical: "border-red-300 bg-red-50 text-red-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

function hrefFor(a: AlertDetail) {
  if (a.resourceType === "RENTAL") return "/rentals";
  if (a.resourceType === "VEHICLE") return "/vehicles";
  if (a.resourceType === "INCIDENT") return "/incidents";
  if (a.resourceType === "MAINTENANCE") return "/maintenance";
  if (a.resourceType === "INSURANCE_POLICY") return "/insurance";
  if (a.resourceType === "TREASURY") return "/treasury";
  if (a.resourceType === "CALENDAR") return "/calendar";
  return "/dashboard";
}

export default function AlertsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<AlertDetail[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRows(await api.getDashboardAlerts());
      } catch (e) {
        setError(e instanceof Error ? e.message : t.error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.alerts.title}
        subtitle={t.alerts.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.pilotage },
          { label: t.nav.alerts },
        ]}
      />
      {error && <AlertBox>{error}</AlertBox>}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((a, i) => (
            <Link
              key={`${a.code}-${a.resourceId || i}`}
              href={hrefFor(a)}
              className={`block rounded-[12px] border px-4 py-3 ${SEVERITY[a.severity] || SEVERITY.info}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wide opacity-70">{a.category}</div>
                <div className="text-[10px] font-bold uppercase">{a.severity}</div>
              </div>
              <div className="mt-1 text-sm font-semibold">{a.message}</div>
              {a.dueDate && <div className="mt-1 text-xs opacity-70">Échéance {a.dueDate}</div>}
            </Link>
          ))}
          {!rows.length && (
            <div className="py-12 text-center text-sm text-gray-500">{t.alerts.empty}</div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
