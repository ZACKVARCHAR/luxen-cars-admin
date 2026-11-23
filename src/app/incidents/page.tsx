"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { Incident, Vehicle } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function IncidentsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Incident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const [i, v] = await Promise.all([api.getIncidents(), api.getVehicles()]);
      setRows(i);
      setVehicles(v);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
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
      await api.createIncident({
        vehicleId: fd.get("vehicleId"),
        description: fd.get("description"),
        location: fd.get("location") || null,
        responsibility: fd.get("responsibility") || null,
        repairCost: Number(fd.get("repairCost") || 0),
        reimbursedAmount: Number(fd.get("reimbursedAmount") || 0),
        immobilize: fd.get("immobilize") === "on",
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.incidents.title}
        subtitle={t.incidents.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.risks },
          { label: t.nav.incidents },
        ]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}
      {open && (
        <form onSubmit={onCreate} className="card mb-5 grid gap-3 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Véhicule</span>
            <select className="field" name="vehicleId" required>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.registration}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Lieu</span>
            <input className="field" name="location" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Description</span>
            <textarea className="field min-h-24" name="description" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Responsabilité</span>
            <select className="field" name="responsibility" defaultValue="UNKNOWN">
              <option value="CLIENT">Client</option>
              <option value="THIRD_PARTY">Tiers</option>
              <option value="AGENCY">Agence</option>
              <option value="UNKNOWN">Inconnue</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Coût réparation</span>
            <input className="field" name="repairCost" type="number" step="0.01" defaultValue={0} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="immobilize" defaultChecked /> Immobiliser (ACCIDENTED)
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enregistrer
            </button>
          </div>
        </form>
      )}
      <div className="card overflow-hidden">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Coûts</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-[#e5e7eb]">
                <td className="px-4 py-3 text-xs">{new Date(i.occurredAt).toLocaleString("fr-MA")}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold line-clamp-2">{i.description}</div>
                  <div className="text-xs text-gray-500">{i.location || "—"} · {i.responsibility || "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  Réparation {Number(i.repairCost).toLocaleString("fr-MA")}
                  <br />
                  Reste {Number(i.remainingCharge).toLocaleString("fr-MA")} MAD
                </td>
                <td className="px-4 py-3"><StatusBadge value={i.status} /></td>
                <td className="px-4 py-3">
                  {i.status === "OPEN" && (
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={busy === i.id}
                      onClick={async () => {
                        setBusy(i.id);
                        try {
                          await api.closeIncident(i.id);
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : t.error);
                        } finally {
                          setBusy("");
                        }
                      }}
                    >
                      Clôturer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{t.incidents.empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
