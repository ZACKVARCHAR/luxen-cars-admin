"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { FleetCompositionResult, ProjectAssumptions, ProjectResult, ScenarioResult } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

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

export default function FinancePage() {
  const [form, setForm] = useState<ProjectAssumptions>(DEFAULTS);
  const [result, setResult] = useState<ProjectResult | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [compositions, setCompositions] = useState<FleetCompositionResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function num(name: keyof ProjectAssumptions, value: string) {
    setForm((f) => ({ ...f, [name]: Number(value) }));
  }

  async function runSimulate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const [proj, scen] = await Promise.all([
        api.simulateFinance(form),
        api.simulateScenarios(form),
      ]);
      setResult(proj);
      setScenarios(scen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur simulation");
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
      setError(err instanceof Error ? err.message : "Erreur comparaison");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <PageHeader
        title="Finance & Simulateur"
        subtitle="Rentabilité, scénarios d’occupation et compositions de flotte."
        crumbs={[{ label: "Accueil", href: "/dashboard" }, { label: "Pilotage" }, { label: "Finance" }]}
      />

      {error && <AlertBox>{error}</AlertBox>}

      <form onSubmit={runSimulate} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["availableCapital", "Capital disponible"],
            ["minReserve", "Réserve minimale"],
            ["vehicleCount", "Nb véhicules"],
            ["purchasePricePerVehicle", "Prix d’achat / véhicule"],
            ["downPaymentPerVehicle", "Apport / véhicule"],
            ["annualInterestRate", "Taux annuel %"],
            ["financeMonths", "Durée crédit (mois)"],
            ["insurancePerVehicleMonthly", "Assurance / mois / véhicule"],
            ["rentLocal", "Loyer local"],
            ["advertising", "Publicité"],
            ["salaries", "Salaires"],
            ["otherFixed", "Autres fixes"],
            ["maintenancePerDay", "Entretien / jour loc."],
            ["otherVariablePerDay", "Autres variables / jour"],
            ["averageDailyRate", "Prix moyen / jour"],
            ["occupancyRate", "Occupation %"],
            ["setupCosts", "Frais de démarrage"],
          ] as const
        ).map(([key, label]) => (
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
            Simuler le projet
          </button>
          <button type="button" className="btn-ghost" disabled={loading} onClick={runFleetCompare}>
            Comparer compositions flotte
          </button>
        </div>
      </form>

      {result && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="CA mensuel" value={`${Number(result.monthlyRevenue).toLocaleString("fr-MA")} MAD`} />
          <Metric label="Bénéfice mensuel" value={`${Number(result.monthlyProfit).toLocaleString("fr-MA")} MAD`} />
          <Metric label="ROI annuel" value={`${result.roiAnnualPct} %`} />
          <Metric label="Payback" value={result.paybackMonths < 0 ? "N/A" : `${result.paybackMonths} mois`} />
          <Metric label="Mensualité crédit" value={`${Number(result.monthlyInstallment).toLocaleString("fr-MA")} MAD`} />
          <Metric label="Trésorerie après setup" value={`${Number(result.treasuryAfterSetup).toLocaleString("fr-MA")} MAD`} />
          <Metric label="Point mort (jours)" value={String(result.breakEvenRentalDays)} />
          <Metric label="Occupation mini" value={`${result.breakEvenOccupancyPct} %`} />
        </div>
      )}

      {!!scenarios.length && (
        <div className="card mb-6 overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-5 py-4 font-display text-lg font-bold">Scénarios d’occupation</div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Scénario</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">Coûts</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3">Trésorerie</th>
                <th className="px-4 py-3">Risque</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.label} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3 font-semibold">{s.label}</td>
                  <td className="px-4 py-3">{Number(s.revenue).toLocaleString("fr-MA")}</td>
                  <td className="px-4 py-3">{Number(s.costs).toLocaleString("fr-MA")}</td>
                  <td className="px-4 py-3 font-bold text-[#e10600]">{Number(s.profit).toLocaleString("fr-MA")}</td>
                  <td className="px-4 py-3">{Number(s.treasuryProjection).toLocaleString("fr-MA")}</td>
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
            Comparaison compositions de flotte
          </div>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Composition</th>
                <th className="px-4 py-3">Apport</th>
                <th className="px-4 py-3">Mensualité</th>
                <th className="px-4 py-3">Occ. requise</th>
                <th className="px-4 py-3">Profit / mois</th>
                <th className="px-4 py-3">Cash restant</th>
                <th className="px-4 py-3">Risque</th>
              </tr>
            </thead>
            <tbody>
              {compositions.map((c) => (
                <tr key={c.name} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3 font-semibold">
                    {c.name}
                    <div className="text-xs text-gray-500">{c.vehicleCount} véhicules · {c.avgDailyRate} MAD/j</div>
                  </td>
                  <td className="px-4 py-3">{Number(c.totalDown).toLocaleString("fr-MA")}</td>
                  <td className="px-4 py-3">{Number(c.monthlyInstallment).toLocaleString("fr-MA")}</td>
                  <td className="px-4 py-3">{c.requiredOccupancyPct} %</td>
                  <td className="px-4 py-3 font-bold text-[#e10600]">{Number(c.monthlyProfit).toLocaleString("fr-MA")}</td>
                  <td className="px-4 py-3">{Number(c.remainingCash).toLocaleString("fr-MA")}</td>
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
