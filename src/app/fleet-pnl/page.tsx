"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, KpiCard, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { VehiclePnl } from "@/lib/types";
import { CircleDollarSign, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function FleetPnlPage() {
  const { t, formatMoney } = useI18n();
  const now = new Date();
  const [from, setFrom] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => now.toISOString().slice(0, 10));
  const [rows, setRows] = useState<VehiclePnl[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setRows(await api.getVehiclePnl(from, to));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const totals = useMemo(() => {
    const revenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
    const costs = rows.reduce((s, r) => s + Number(r.costs), 0);
    const profit = rows.reduce((s, r) => s + Number(r.profit), 0);
    return { revenue, costs, profit };
  }, [rows]);

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.fleetPnl.title}
        subtitle={t.fleetPnl.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.pilotage },
          { label: t.nav.fleetPnl },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <input className="field w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="field w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <KpiCard icon={TrendingUp} label="CA période" value={`${totals.revenue.toLocaleString("fr-MA")} MAD`} tone="green" />
        <KpiCard icon={TrendingDown} label="Coûts" value={`${totals.costs.toLocaleString("fr-MA")} MAD`} tone="orange" />
        <KpiCard
          icon={CircleDollarSign}
          label="Résultat"
          value={`${totals.profit.toLocaleString("fr-MA")} MAD`}
          tone={totals.profit >= 0 ? "green" : "red"}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Calcul P&L…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Jours</th>
                  <th className="px-4 py-3">CA</th>
                  <th className="px-4 py-3">Coûts</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3">Marge</th>
                  <th className="px-4 py-3">Détail coûts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.vehicleId} className="border-t border-[#e8eaee]">
                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        {r.brand} {r.model}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.registration} · {r.status}
                      </div>
                    </td>
                    <td className="px-4 py-3">{Number(r.rentedDays).toLocaleString("fr-MA")}</td>
                    <td className="px-4 py-3 font-semibold">{Number(r.revenue).toLocaleString("fr-MA")}</td>
                    <td className="px-4 py-3">{Number(r.costs).toLocaleString("fr-MA")}</td>
                    <td className={`px-4 py-3 font-bold ${Number(r.profit) >= 0 ? "text-emerald-600" : "text-[#e10600]"}`}>
                      {Number(r.profit).toLocaleString("fr-MA")}
                    </td>
                    <td className="px-4 py-3">{Number(r.marginPct).toLocaleString("fr-MA")}%</td>
                    <td className="px-4 py-3 text-[11px] text-gray-500">
                      Exp {Number(r.expenses).toLocaleString("fr-MA")} · Maint {Number(r.maintenanceCost).toLocaleString("fr-MA")} ·
                      Répar {Number(r.repairCost).toLocaleString("fr-MA")} · Crédit {Number(r.financeCost).toLocaleString("fr-MA")}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Aucune donnée sur la période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
