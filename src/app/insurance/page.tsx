"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { InsurancePolicy, Vehicle } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function InsurancePage() {
  const [rows, setRows] = useState<InsurancePolicy[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [i, v] = await Promise.all([api.getInsurance(), api.getVehicles()]);
      setRows(i);
      setVehicles(v);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.createInsurance({
        vehicleId: fd.get("vehicleId"),
        insurer: fd.get("insurer"),
        policyNumber: fd.get("policyNumber"),
        coverage: fd.get("coverage") || null,
        deductible: Number(fd.get("deductible") || 0),
        annualPremium: Number(fd.get("annualPremium") || 0),
        startDate: fd.get("startDate"),
        endDate: fd.get("endDate"),
        notes: fd.get("notes") || null,
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <PageHeader
        title="Assurances"
        subtitle="Polices, franchises, renouvellements."
        crumbs={[{ label: "Accueil", href: "/dashboard" }, { label: "Risques" }, { label: "Assurances" }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Nouvelle police
          </button>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}
      {open && (
        <form onSubmit={onCreate} className="card mb-5 grid gap-3 p-5 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Véhicule</span>
            <select className="field" name="vehicleId" required>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.registration}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Assureur</span>
            <input className="field" name="insurer" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">N° police</span>
            <input className="field" name="policyNumber" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Couverture</span>
            <input className="field" name="coverage" placeholder="Tous risques" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Franchise</span>
            <input className="field" name="deductible" type="number" step="0.01" defaultValue={0} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Prime annuelle</span>
            <input className="field" name="annualPremium" type="number" step="0.01" defaultValue={0} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Début</span>
            <input className="field" name="startDate" type="date" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Fin</span>
            <input className="field" name="endDate" type="date" required />
          </label>
          <div className="sm:col-span-3">
            <button className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enregistrer
            </button>
          </div>
        </form>
      )}
      <div className="card overflow-hidden">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Assureur</th>
              <th className="px-4 py-3">Police</th>
              <th className="px-4 py-3">Période</th>
              <th className="px-4 py-3">Prime</th>
              <th className="px-4 py-3">Franchise</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-[#e5e7eb]">
                <td className="px-4 py-3 font-semibold">{p.insurer}</td>
                <td className="px-4 py-3 text-xs">{p.policyNumber}<div className="text-gray-500">{p.coverage || ""}</div></td>
                <td className="px-4 py-3 text-xs">{p.startDate} → {p.endDate}</td>
                <td className="px-4 py-3 font-bold text-[#e10600]">{Number(p.annualPremium).toLocaleString("fr-MA")} MAD</td>
                <td className="px-4 py-3">{Number(p.deductible).toLocaleString("fr-MA")} MAD</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucune police.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
