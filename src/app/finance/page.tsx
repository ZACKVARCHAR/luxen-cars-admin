"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { FleetCompositionResult, ProjectAssumptions, ProjectResult, ScenarioResult } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const DEFAULTS: ProjectAssumptions = {
  availableCapital: 370000,
  minReserve: 100000,
  vehicleCount: 7,
  purchasePricePerVehicle: 145000,
  downPaymentPerVehicle: 40000,
  annualInterestRate: 7.5,
  financeMonths: 48,
  insurancePerVehicleMonthly: 450,
  rentLocal: 3500,
  advertising: 2000,
  salaries: 8000,
  otherFixed: 1500,
  maintenancePerDay: 25,
  otherVariablePerDay: 10,
  averageDailyRate: 300,
  occupancyRate: 60,
  setupCosts: 15000,
};

type FieldKey = keyof ProjectAssumptions;

export default function FinancePage() {
  const { t, formatMoney, locale } = useI18n();
  const [form, setForm] = useState<ProjectAssumptions>(DEFAULTS);
  const [result, setResult] = useState<ProjectResult | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [compositions, setCompositions] = useState<FleetCompositionResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fields = useMemo(
    () =>
      [
        ["availableCapital", t.finance.availableCapital],
        ["minReserve", t.finance.minReserve],
        ["vehicleCount", t.finance.vehicleCount],
        ["purchasePricePerVehicle", t.finance.purchasePrice],
        ["downPaymentPerVehicle", t.finance.downPayment],
        ["annualInterestRate", t.finance.annualRate],
        ["financeMonths", t.finance.financeMonths],
        ["insurancePerVehicleMonthly", t.finance.insuranceMonthly],
        ["rentLocal", t.finance.rentLocal],
        ["advertising", t.finance.advertising],
        ["salaries", t.finance.salaries],
        ["otherFixed", t.finance.otherFixed],
        ["maintenancePerDay", t.finance.maintenancePerDay],
        ["otherVariablePerDay", t.finance.otherVariablePerDay],
        ["averageDailyRate", t.finance.averageDailyRate],
        ["occupancyRate", t.finance.occupancyRate],
        ["setupCosts", t.finance.setupCosts],
      ] as const satisfies ReadonlyArray<readonly [FieldKey, string]>,
    [t],
  );

  function num(name: FieldKey, value: string) {
    setForm((f) => ({ ...f, [name]: Number(value) }));
  }

  async function runSimulate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const [proj, scen] = await Promise.all([api.simulateFinance(form), api.simulateScenarios(form)]);
      setResult(proj);
      setScenarios(scen);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  async function runFleetCompare() {
    setLoading(true);
    setError("");
    try {
      const rows = await api.compareFleetCompositions({
        availableCapital: form.availableCapital,
        minReserve: form.minReserve,
        annualInterestRate: form.annualInterestRate,
        financeMonths: form.financeMonths,
        insurancePerVehicleMonthly: form.insurancePerVehicleMonthly,
        rentLocal: form.rentLocal,
        advertising: form.advertising,
        otherFixed: form.otherFixed + form.salaries,
        maintenancePerDay: form.maintenancePerDay + form.otherVariablePerDay,
        occupancyRate: form.occupancyRate,
        compositions: [
          {
            name: "Mix économique 7",
            lines: [
              { model: "Sandero", quantity: 3, purchasePrice: 125000, downPayment: 35000, dailyRate: 250 },
              { model: "Logan", quantity: 2, purchasePrice: 135000, downPayment: 38000, dailyRate: 270 },
              { model: "208", quantity: 2, purchasePrice: 160000, downPayment: 45000, dailyRate: 320 },
            ],
          },
          {
            name: "Mix premium 7",
            lines: [
              { model: "208 Auto", quantity: 3, purchasePrice: 175000, downPayment: 50000, dailyRate: 350 },
              { model: "Corsa Auto", quantity: 2, purchasePrice: 170000, downPayment: 48000, dailyRate: 340 },
              { model: "Duster", quantity: 2, purchasePrice: 210000, downPayment: 60000, dailyRate: 400 },
            ],
          },
          {
            name: "Citadines 7",
            lines: [
              { model: "208", quantity: 4, purchasePrice: 155000, downPayment: 42000, dailyRate: 300 },
              { model: "Corsa", quantity: 3, purchasePrice: 150000, downPayment: 40000, dailyRate: 290 },
            ],
          },
        ],
      });
      setCompositions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.finance.title}
        subtitle={t.finance.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.pilotage },
          { label: t.nav.finance },
        ]}
      />

      {error && <AlertBox>{error}</AlertBox>}

      <form onSubmit={runSimulate} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</span>
            <input
              className="field"
              type="number"
              step="0.01"
              value={form[key]}
              onChange={(e) => num(key, e.target.value)}
            />
          </label>
        ))}
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.finance.simulate}
          </button>
          <button type="button" className="btn-ghost" disabled={loading} onClick={runFleetCompare}>
            {t.finance.compareFleet}
          </button>
        </div>
      </form>

      {result && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label={t.finance.monthlyRevenue} value={formatMoney(result.monthlyRevenue)} />
          <Metric label={t.finance.monthlyProfit} value={formatMoney(result.monthlyProfit)} />
          <Metric label={t.finance.roiAnnual} value={`${result.roiAnnualPct} %`} />
          <Metric
            label={t.finance.payback}
            value={result.paybackMonths < 0 ? "N/A" : `${result.paybackMonths} ${t.finance.months}`}
          />
          <Metric label={t.finance.monthlyInstallment} value={formatMoney(result.monthlyInstallment)} />
          <Metric label={t.finance.treasuryAfterSetup} value={formatMoney(result.treasuryAfterSetup)} />
          <Metric label={t.finance.breakEvenDays} value={String(result.breakEvenRentalDays)} />
          <Metric label={t.finance.minOccupancy} value={`${result.breakEvenOccupancyPct} %`} />
        </div>
      )}

      {!!scenarios.length && (
        <div className="card mb-6 overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4 font-display text-lg font-bold">
            {t.finance.scenariosTitle}
          </div>
          <table className="w-full min-w-[720px] text-start text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t.finance.scenario}</th>
                <th className="px-4 py-3">{t.finance.revenue}</th>
                <th className="px-4 py-3">{t.finance.costs}</th>
                <th className="px-4 py-3">{t.finance.profit}</th>
                <th className="px-4 py-3">{t.finance.treasury}</th>
                <th className="px-4 py-3">{t.finance.risk}</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.label} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3 font-semibold">{s.label}</td>
                  <td className="px-4 py-3">{Number(s.revenue).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}</td>
                  <td className="px-4 py-3">{Number(s.costs).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}</td>
                  <td className="px-4 py-3 font-bold text-[#e10600]">
                    {Number(s.profit).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}
                  </td>
                  <td className="px-4 py-3">
                    {Number(s.treasuryProjection).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">{s.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!!compositions.length && (
        <div className="card overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4 font-display text-lg font-bold">
            {t.finance.compositionsTitle}
          </div>
          <table className="w-full min-w-[980px] text-start text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t.finance.composition}</th>
                <th className="px-4 py-3">{t.finance.totalDown}</th>
                <th className="px-4 py-3">{t.finance.installment}</th>
                <th className="px-4 py-3">{t.finance.requiredOcc}</th>
                <th className="px-4 py-3">{t.finance.profitMonth}</th>
                <th className="px-4 py-3">{t.finance.remainingCash}</th>
                <th className="px-4 py-3">{t.finance.risk}</th>
              </tr>
            </thead>
            <tbody>
              {compositions.map((c) => (
                <tr key={c.name} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3 font-semibold">
                    {c.name}
                    <div className="text-xs text-gray-500">
                      {c.vehicleCount} {t.finance.vehiclesCount} · {c.avgDailyRate} {t.finance.perDay}
                    </div>
                  </td>
                  <td className="px-4 py-3">{Number(c.totalDown).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}</td>
                  <td className="px-4 py-3">
                    {Number(c.monthlyInstallment).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}
                  </td>
                  <td className="px-4 py-3">{c.requiredOccupancyPct} %</td>
                  <td className="px-4 py-3 font-bold text-[#e10600]">
                    {Number(c.monthlyProfit).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}
                  </td>
                  <td className="px-4 py-3">
                    {Number(c.remainingCash).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">{c.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 font-display text-xl font-extrabold">{value}</div>
    </div>
  );
}
