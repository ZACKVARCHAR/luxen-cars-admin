"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { vehicleImageUrl } from "@/lib/media";
import type { Dashboard, Vehicle } from "@/lib/types";
import {
  CalendarDays,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { t, formatMoney } = useI18n();
  const [data, setData] = useState<Dashboard | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getVehicles()])
      .then(([dash, fleet]) => {
        setData(dash);
        setVehicles(fleet);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t.error));
  }, []);

  const available = vehicles.filter((v) => v.status === "AVAILABLE");

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.dashboard.title}
        subtitle={t.dashboard.subtitle}
        crumbs={[{ label: t.home }, { label: t.dashboard.crumbPilotage }]}
        actions={
          <>
            <Link href="/rentals" className="btn-ghost">
              <ClipboardList className="h-4 w-4" /> {t.nav.rentals}
            </Link>
            <Link href="/vehicles" className="btn-primary">
              <CarFront className="h-4 w-4" /> {t.dashboard.fleet}
            </Link>
          </>
        }
      />

      {error && <AlertBox tone="warn">{error} — {t.apiDown}</AlertBox>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={CarFront}
          label={t.dashboard.vehicles}
          value={data?.fleetSize ?? vehicles.length}
          hint={`${data?.available ?? available.length} ${t.dashboard.available}`}
          tone="red"
        />
        <KpiCard
          icon={Gauge}
          label={t.dashboard.utilization}
          value={data ? `${data.utilizationRate}%` : t.none}
          hint={`${data?.rented ?? 0} ${t.dashboard.rented}`}
          tone="orange"
        />
        <KpiCard
          icon={CircleDollarSign}
          label={t.dashboard.collected}
          value={data ? formatMoney(data.collectedThisMonth) : t.none}
          hint={`${data?.outstanding ?? 0} ${t.dashboard.outstanding}`}
          tone="green"
        />
        <KpiCard
          icon={Wrench}
          label={t.dashboard.unavailable}
          value={data?.unavailable ?? t.none}
          hint={`${data?.pickupsToday ?? 0} · ${data?.returnsToday ?? 0} (${t.dashboard.pickupsReturns})`}
          tone="slate"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <KpiCard
          icon={CalendarDays}
          label={t.dashboard.pickupsToday}
          value={data?.pickupsToday ?? 0}
          tone="orange"
        />
        <KpiCard
          icon={ClipboardList}
          label={t.dashboard.openRentals}
          value={data?.openRentals ?? 0}
          tone="red"
        />
        <KpiCard
          icon={CircleDollarSign}
          label={t.nav.expenses}
          value={
            data?.expensesThisMonth != null ? formatMoney(data.expensesThisMonth) : t.none
          }
          tone="slate"
        />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <SectionCard
          title={t.dashboard.availableVehicles}
          action={
            <Link href="/vehicles" className="text-sm font-bold text-[#e10600] hover:underline">
              {t.dashboard.seeAll}
            </Link>
          }
        >
          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.slice(0, 6).map((v) => (
              <Link
                key={v.id}
                href="/vehicles"
                className="overflow-hidden rounded-[12px] border border-[#e8eaee] bg-white hover:border-gray-300"
              >
                <div className="relative aspect-[16/10] bg-[#eef0f3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicleImageUrl(v.imageUrl)}
                    alt={`${v.brand} ${v.model}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute start-2 top-2">
                    <StatusBadge value={v.status} />
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-display text-sm font-bold">
                    {v.brand} {v.model}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-gray-500">{v.registration}</div>
                  <div className="mt-2 text-xs font-extrabold text-[#e10600]">{formatMoney(v.dailyRate)}/j</div>
                </div>
              </Link>
            ))}
            {!available.length && !error && <EmptyState>{t.vehicles.empty}</EmptyState>}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title={t.dashboard.fleetOverview}>
            <div className="grid grid-cols-2 gap-2 p-3">
              <MiniStat label={t.status.AVAILABLE} value={data?.available ?? available.length} tone="ok" />
              <MiniStat label={t.status.RESERVED} value={data?.reserved} tone="warn" />
              <MiniStat label={t.status.RENTED} value={data?.rented} tone="info" />
              <MiniStat label={t.status.MAINTENANCE} value={data?.unavailable} tone="bad" />
            </div>
          </SectionCard>

          <SectionCard title={t.nav.alerts}>
            <ul className="space-y-2 p-3">
              {(data?.alerts || []).map((a) => (
                <li key={a.message} className="rounded-[10px] border border-[#e8eaee] bg-[#fafbfc] px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[#e10600]">{a.category}</div>
                  <div className="mt-0.5 text-sm text-gray-700">{a.message}</div>
                </li>
              ))}
              {!data?.alerts?.length && <li className="px-1 py-3 text-sm text-gray-500">{t.alerts.empty}</li>}
            </ul>
          </SectionCard>

          <SectionCard title={t.dashboard.shortcuts}>
            <div className="grid grid-cols-2 gap-2 p-3">
              <Quick href="/reservations" label={t.nav.reservations} />
              <Quick href="/payments" label={t.nav.payments} />
              <Quick href="/maintenance" label={t.nav.maintenance} />
              <Quick href="/finance" label={t.nav.finance} />
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value?: number;
  tone: "ok" | "warn" | "info" | "bad";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "info"
          ? "text-sky-600"
          : "text-red-600";
  return (
    <div className="rounded-[10px] border border-[#e8eaee] bg-[#fafbfc] px-3 py-2.5">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-extrabold ${color}`}>{value ?? "—"}</div>
    </div>
  );
}

function Quick({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-[10px] border border-[#e8eaee] bg-white px-3 py-3 text-center text-xs font-bold hover:border-[#e10600]/40 hover:text-[#e10600]"
    >
      {label}
    </Link>
  );
}
