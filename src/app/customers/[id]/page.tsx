"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, KpiCard, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { Customer360 } from "@/lib/types";
import { Loader2, TriangleAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Customer360Page() {
  const { t, formatMoney } = useI18n();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Customer360 | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        setData(await api.getCustomer360(params.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : t.error);
      }
    })();
  }, [params.id]);

  const c = data?.customer;

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={c ? `${c.firstName} ${c.lastName}` : t.customers.profile}
        subtitle={t.customers.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.customers, href: "/customers" },
          { label: c ? `${c.firstName} ${c.lastName}` : t.customers.profile },
        ]}
        actions={
          <Link href="/customers" className="btn-ghost">
            Retour liste
          </Link>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}
      {!data ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> {t.loading}
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Wallet} label="CA lifetime" value={formatMoney(data.lifetimeRevenue)} tone="green" />
            <KpiCard
              icon={Wallet}
              label={t.nav.rentals}
              value={formatMoney(data.openRentalBalance)}
              tone="orange"
            />
            <KpiCard
              icon={Wallet}
              label={t.nav.reservations}
              value={formatMoney(data.openReservationBalance)}
              tone="slate"
            />
            <KpiCard
              icon={TriangleAlert}
              label="Niveau de risque"
              value={data.riskLevel}
              tone={data.riskLevel === "OK" ? "green" : "red"}
              hint={`${data.rentalCount} locations · ${data.openIncidents} incident(s)`}
            />
          </div>

          <div className="mb-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="card space-y-3 p-5 text-sm">
              <h2 className="font-display text-lg font-bold">Identité</h2>
              <Row label="Téléphone" value={c!.phone} />
              <Row label="Email" value={c!.email || "—"} />
              <Row label="Nationalité" value={c!.nationality} />
              <Row label="Source" value={c!.source} />
              <Row label="CIN / ID" value={c!.idDocument || "—"} />
              <Row label="Permis" value={c!.driverLicense || "—"} />
              <Row label="Blacklist" value={c!.blacklist ? t.yes : t.no} />
              <Row label="Notes" value={c!.notes || "—"} />
            </div>

            <div className="card p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Timeline</h2>
              <ol className="space-y-3">
                {data.timeline.map((ev) => (
                  <li key={`${ev.type}-${ev.id}`} className="rounded-[10px] border border-[#e8eaee] bg-[#fafbfc] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge value={ev.type} />
                      <span className="text-[11px] text-gray-500">
                        {ev.at ? new Date(ev.at).toLocaleString("fr-MA") : t.none}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{ev.label}</div>
                    <div className="text-xs text-gray-500">
                      {ev.status}
                      {ev.amount != null ? ` · ${formatMoney(ev.amount)}` : ""}
                    </div>
                  </li>
                ))}
                {!data.timeline.length && (
                  <li className="py-8 text-center text-sm text-gray-500">Aucun événement.</li>
                )}
              </ol>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#f0f1f3] py-1.5">
      <dt className="text-xs font-semibold uppercase text-gray-400">{label}</dt>
      <dd className="text-end font-medium">{value}</dd>
    </div>
  );
}
