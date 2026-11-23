"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { MaintenanceOrder, Vehicle } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function MaintenancePage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<MaintenanceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const [m, v] = await Promise.all([api.getMaintenance(), api.getVehicles()]);
      setRows(m);
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
      await api.createMaintenance({
        vehicleId: fd.get("vehicleId"),
        kind: fd.get("kind"),
        title: fd.get("title"),
        dueDate: fd.get("dueDate") || null,
        dueMileage: fd.get("dueMileage") ? Number(fd.get("dueMileage")) : null,
        cost: Number(fd.get("cost") || 0),
        vendor: fd.get("vendor") || null,
        notes: fd.get("notes") || null,
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
        title={t.maintenance.title}
        subtitle={t.maintenance.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.risks },
          { label: t.nav.maintenance },
        ]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> {t.new}
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
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Type</span>
            <select className="field" name="kind" defaultValue="OIL_CHANGE">
              <option value="OIL_CHANGE">Vidange</option>
              <option value="FILTERS">Filtres</option>
              <option value="TIRES">Pneus</option>
              <option value="BRAKES">Freins</option>
              <option value="BATTERY">Batterie</option>
              <option value="SERVICE">Révision</option>
              <option value="REPAIR">Réparation</option>
              <option value="TECHNICAL_CONTROL">Contrôle technique</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Titre</span>
            <input className="field" name="title" required placeholder="Vidange 15 000 km" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Coût estimé</span>
            <input className="field" name="cost" type="number" step="0.01" defaultValue={0} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Échéance</span>
            <input className="field" name="dueDate" type="date" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Km cible</span>
            <input className="field" name="dueMileage" type="number" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Garage</span>
            <input className="field" name="vendor" />
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
            <input type="checkbox" name="immobilize" /> Immobiliser le véhicule
          </label>
          <div className="sm:col-span-3">
            <button className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Créer
            </button>
          </div>
        </form>
      )}
      <div className="card overflow-hidden">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Ordre</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Coût</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-[#e5e7eb]">
                <td className="px-4 py-3 font-semibold">{m.title}</td>
                <td className="px-4 py-3 text-xs">{m.kind}</td>
                <td className="px-4 py-3 text-xs">{m.dueDate || "—"}{m.dueMileage ? ` / ${m.dueMileage} km` : ""}</td>
                <td className="px-4 py-3 font-bold text-[#e10600]">{Number(m.cost).toLocaleString("fr-MA")} MAD</td>
                <td className="px-4 py-3"><StatusBadge value={m.status} /></td>
                <td className="px-4 py-3">
                  {m.status !== "DONE" && (
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      disabled={busy === m.id}
                      onClick={async () => {
                        setBusy(m.id);
                        try {
                          await api.completeMaintenance(m.id, { cost: m.cost, releaseVehicle: true });
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : t.error);
                        } finally {
                          setBusy("");
                        }
                      }}
                    >
                      Terminer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t.maintenance.empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
