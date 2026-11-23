"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { FleetCalendar } from "@/lib/types";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const TYPE_COLORS: Record<string, string> = {
  RESERVATION: "bg-sky-500",
  RENTAL: "bg-[#e10600]",
  MAINTENANCE: "bg-amber-500",
  BLOCK: "bg-slate-700",
};

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const { t } = useI18n();
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [data, setData] = useState<FleetCalendar | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockOpen, setBlockOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const from = useMemo(() => toIsoDate(anchor), [anchor]);
  const to = useMemo(() => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 13);
    return toIsoDate(d);
  }, [anchor]);

  const days = useMemo(() => {
    const list: string[] = [];
    const cur = new Date(anchor);
    for (let i = 0; i < 14; i++) {
      list.push(toIsoDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, [anchor]);

  async function load() {
    setLoading(true);
    try {
      setData(await api.getFleetCalendar(from, to));
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

  async function onBlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const start = String(fd.get("startDate"));
      const end = String(fd.get("endDate"));
      await api.createVehicleBlock({
        vehicleId: fd.get("vehicleId"),
        blockType: fd.get("blockType"),
        startAt: `${start}T00:00:00Z`,
        endAt: `${end}T23:59:59Z`,
        reason: fd.get("reason") || null,
      });
      setBlockOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  function covers(day: string, startAt: string, endAt: string) {
    const d = day;
    const s = startAt.slice(0, 10);
    const e = endAt.slice(0, 10);
    return s <= d && e >= d;
  }

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.calendar.title}
        subtitle={t.calendar.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.operations },
          { label: t.nav.calendar },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setAnchor((d) => {
                const n = new Date(d);
                n.setDate(n.getDate() - 7);
                return n;
              })}
            >
              <ChevronLeft className="h-4 w-4" /> Semaine
            </button>
            <button type="button" className="btn-ghost" onClick={() => setAnchor(new Date())}>
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setAnchor((d) => {
                const n = new Date(d);
                n.setDate(n.getDate() + 7);
                return n;
              })}
            >
              Semaine <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" className="btn-primary" onClick={() => setBlockOpen((v) => !v)}>
              <Plus className="h-4 w-4" /> Bloquer un créneau
            </button>
          </div>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      {data && data.conflicts.length > 0 && (
        <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>{data.conflicts.length} conflit(s)</strong> détecté(s) sur la période — un véhicule a des
          chevauchements.
        </div>
      )}

      {blockOpen && data && (
        <form onSubmit={onBlock} className="card mb-5 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Véhicule</span>
            <select className="field" name="vehicleId" required>
              {data.vehicles.map((v) => (
                <option key={v.vehicle.id} value={v.vehicle.id}>
                  {v.vehicle.brand} {v.vehicle.model} · {v.vehicle.registration}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Type</span>
            <select className="field" name="blockType" defaultValue="MANUAL">
              <option value="MANUAL">Manuel</option>
              <option value="OWNER_USE">Usage propriétaire</option>
              <option value="CLEANING">Nettoyage</option>
              <option value="HOLD">Hold commercial</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Début</span>
            <input className="field" type="date" name="startDate" required defaultValue={from} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Fin</span>
            <input className="field" type="date" name="endDate" required defaultValue={to} />
          </label>
          <label className="block sm:col-span-2 lg:col-span-4">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Motif</span>
            <input className="field" name="reason" placeholder="Ex: voiture chez le carrossier" />
          </label>
          <div className="flex items-end">
            <button className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enregistrer
            </button>
          </div>
        </form>
      )}

      <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold text-gray-600">
        {Object.entries(TYPE_COLORS).map(([k, c]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${c}`} /> {k}
          </span>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading || !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement du planning…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3">Véhicule</th>
                  {days.map((d) => (
                    <th key={d} className="px-1 py-3 text-center">
                      {new Date(d + "T12:00:00").toLocaleDateString("fr-MA", {
                        weekday: "short",
                        day: "2-digit",
                      })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.vehicles.map((row) => {
                  const hasConflict = data.conflicts.some((c) => c.vehicleId === row.vehicle.id);
                  return (
                    <tr key={row.vehicle.id} className="border-t border-[#e8eaee]">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2">
                        <div className="font-semibold text-sm text-gray-900">
                          {row.vehicle.brand} {row.vehicle.model}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {row.vehicle.registration}
                          {hasConflict ? " · conflit" : ""}
                        </div>
                      </td>
                      {days.map((day) => {
                        const hits = row.events.filter((ev) => covers(day, ev.startAt, ev.endAt));
                        return (
                          <td key={day} className="px-0.5 py-1 align-top">
                            <div className="flex min-h-[42px] flex-col gap-0.5">
                              {hits.map((ev) => (
                                <div
                                  key={`${ev.id}-${day}`}
                                  title={`${ev.type} · ${ev.label || ev.status}`}
                                  className={`truncate rounded px-1 py-0.5 text-[10px] font-bold text-white ${TYPE_COLORS[ev.type] || "bg-gray-500"}`}
                                >
                                  {ev.type.slice(0, 3)}
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
