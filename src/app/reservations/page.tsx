"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Reservation } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const STATUSES = ["DRAFT", "PENDING", "CONFIRMED", "CONVERTED_TO_RENTAL", "CANCELLED", "EXPIRED"];

export default function ReservationsPage() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setRows(await api.getReservations());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.publicCode} ${r.channel} ${r.pickupLocation} ${r.status}`.toLowerCase().includes(q),
    );
  }, [rows, query]);

  return (
    <AdminShell searchPlaceholder="Rechercher une réservation…" onSearch={setQuery}>
      <PageHeader
        title="Réservations"
        subtitle="Demandes web + back-office — codes publics LX-XXXXXXXX."
        crumbs={[{ label: "Accueil", href: "/dashboard" }, { label: "Opérations" }, { label: "Réservations" }]}
      />
      {error && <AlertBox>{error}</AlertBox>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.publicCode || r.id.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500">
                      {r.pickupLocation || "—"} → {r.returnLocation || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(r.startAt).toLocaleString("fr-MA")}
                    <br />
                    {new Date(r.endAt).toLocaleString("fr-MA")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge border border-gray-200 bg-gray-50 text-gray-700">
                      {r.channel || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#e10600]">
                    {Number(r.totalAmount).toLocaleString("fr-MA")} MAD
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.paymentMethod || "—"}
                    {r.paymentBank ? ` · ${r.paymentBank}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-2">
                      <StatusBadge value={r.status} />
                    </div>
                    <select
                      className="field max-w-[180px] py-2 text-xs"
                      value={r.status}
                      onChange={async (e) => {
                        const next = e.target.value;
                        if (next === r.status) return;
                        try {
                          setError("");
                          await api.patchReservationStatus(r.id, next);
                          await load();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Erreur statut");
                          e.target.value = r.status;
                        }
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucune réservation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
