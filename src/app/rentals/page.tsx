"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Customer, Rental, Reservation, Vehicle } from "@/lib/types";
import { Loader2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const FUEL_OPTIONS = ["Vide", "1/4", "1/2", "3/4", "Plein"];

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);

  async function load() {
    try {
      const [r, res, c, v] = await Promise.all([
        api.getRentals(),
        api.getReservations(),
        api.getCustomers(),
        api.getVehicles(),
      ]);
      setRentals(r);
      setReservations(res.filter((x) => x.status === "CONFIRMED" || x.status === "PENDING"));
      setCustomers(c);
      setVehicles(v);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openReservation = useMemo(
    () => reservations.find((r) => r.id === openId) || null,
    [reservations, openId],
  );
  const closeRental = useMemo(() => rentals.find((r) => r.id === closeId) || null, [rentals, closeId]);

  function customerName(id?: string) {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "—";
  }
  function vehicleLabel(id?: string) {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.brand} ${v.model} · ${v.registration}` : "—";
  }

  async function onOpen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!openId) return;
    const fd = new FormData(e.currentTarget);
    setBusy(openId);
    try {
      await api.openRentalFromReservation(openId, {
        depositAmount: Number(fd.get("depositAmount") || 0),
        startMileage: Number(fd.get("startMileage") || 0) || null,
        startFuel: fd.get("startFuel") || null,
        bodyNotes: fd.get("bodyNotes") || null,
        interiorNotes: fd.get("interiorNotes") || null,
        damages: fd.get("damages") || null,
        inspector: fd.get("inspector") || null,
        notes: fd.get("notes") || null,
      });
      setOpenId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy("");
    }
  }

  async function onClose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!closeId || !closeRental) return;
    const fd = new FormData(e.currentTarget);
    setBusy(closeId);
    try {
      await api.closeRental(closeId, {
        endMileage: Number(fd.get("endMileage") || 0) || null,
        endFuel: fd.get("endFuel") || null,
        extraFees: Number(fd.get("extraFees") || 0),
        depositStatus: fd.get("depositStatus"),
        sendToMaintenance: fd.get("sendToMaintenance") === "on",
        bodyNotes: fd.get("bodyNotes") || null,
        interiorNotes: fd.get("interiorNotes") || null,
        damages: fd.get("damages") || null,
        inspector: fd.get("inspector") || null,
        notes: fd.get("notes") || null,
      });
      setCloseId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminShell searchPlaceholder="Rechercher une location…">
      <PageHeader
        title="Locations"
        subtitle="Conversion réservation → contrat, inspection départ/retour, caution."
        crumbs={[{ label: "Accueil", href: "/dashboard" }, { label: "Opérations" }, { label: "Locations" }]}
      />
      {error && <AlertBox>{error}</AlertBox>}

      <div className="card mb-5 p-5">
        <h2 className="font-display text-lg font-bold">Ouvrir depuis une réservation</h2>
        <p className="mt-1 text-sm text-gray-500">
          Remplissez l&apos;état du véhicule au départ avant de générer le contrat.
        </p>
        <div className="mt-3 space-y-2">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-xl border border-[#e5e7eb] bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <div className="font-semibold">{r.publicCode || r.id.slice(0, 8)}</div>
                <div className="text-xs text-gray-500">
                  {customerName(r.customerId)} · {vehicleLabel(r.vehicleId)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(r.startAt).toLocaleString("fr-MA")} → {new Date(r.endAt).toLocaleString("fr-MA")} ·{" "}
                  {Number(r.totalAmount).toLocaleString("fr-MA")} MAD
                </div>
              </div>
              <button type="button" className="btn-primary text-sm" onClick={() => setOpenId(r.id)}>
                Préparer départ
              </button>
            </div>
          ))}
          {!reservations.length && (
            <div className="text-sm text-gray-500">Aucune réservation confirmée à convertir.</div>
          )}
        </div>
      </div>

      {openReservation && (
        <form onSubmit={onOpen} className="card mb-5 space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold">Inspection de départ</h3>
              <p className="text-sm text-gray-500">
                {openReservation.publicCode || openReservation.id.slice(0, 8)} ·{" "}
                {vehicleLabel(openReservation.vehicleId)}
              </p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setOpenId(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              name="depositAmount"
              label="Caution (MAD)"
              type="number"
              defaultValue="3000"
              step="0.01"
              required
            />
            <Field
              name="startMileage"
              label="Kilométrage départ"
              type="number"
              defaultValue={String(vehicles.find((v) => v.id === openReservation.vehicleId)?.mileage || 10000)}
              required
            />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Carburant</span>
              <select className="field" name="startFuel" defaultValue="Plein">
                {FUEL_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <Field name="inspector" label="Inspecteur" defaultValue="Agent Luxen" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="bodyNotes" label="Carrosserie" placeholder="RAS, rayure aile AV droite…" />
            <Field name="interiorNotes" label="Intérieur" placeholder="Propre, siège enfant…" />
            <Field name="damages" label="Dommages constatés" placeholder="Aucun" />
            <Field name="notes" label="Notes contrat" placeholder="Remise aéroport, GPS inclus…" />
          </div>
          <button className="btn-primary" disabled={busy === openReservation.id}>
            {busy === openReservation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ouvrir la location
          </button>
        </form>
      )}

      {closeRental && (
        <form onSubmit={onClose} className="card mb-5 space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold">Inspection de retour</h3>
              <p className="text-sm text-gray-500">
                {closeRental.contractRef || closeRental.id.slice(0, 8)} · {vehicleLabel(closeRental.vehicleId)}
              </p>
            </div>
            <button type="button" className="btn-ghost" onClick={() => setCloseId(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              name="endMileage"
              label="Kilométrage retour"
              type="number"
              defaultValue={String((closeRental.startMileage || 10000) + 200)}
              required
            />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Carburant</span>
              <select className="field" name="endFuel" defaultValue="3/4">
                {FUEL_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <Field name="extraFees" label="Frais annexes (MAD)" type="number" defaultValue="0" step="0.01" />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Caution</span>
              <select className="field" name="depositStatus" defaultValue="RELEASED">
                <option value="RELEASED">Restituée</option>
                <option value="HELD">Conservée</option>
                <option value="PARTIALLY_RETAINED">Retenue partielle</option>
                <option value="FULLY_RETAINED">Retenue totale</option>
              </select>
            </label>
            <Field name="inspector" label="Inspecteur" defaultValue="Agent Luxen" required />
            <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
              <input type="checkbox" name="sendToMaintenance" className="h-4 w-4 accent-[#e10600]" />
              Envoyer en maintenance
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="bodyNotes" label="Carrosserie retour" />
            <Field name="interiorNotes" label="Intérieur retour" />
            <Field name="damages" label="Nouveaux dommages" />
            <Field name="notes" label="Notes de clôture" />
          </div>
          <button className="btn-primary" disabled={busy === closeRental.id}>
            {busy === closeRental.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Clôturer la location
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Contrat</th>
                <th className="px-4 py-3">Client / véhicule</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Montants</th>
                <th className="px-4 py-3">Caution</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.id} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3 font-semibold">{r.contractRef || r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="font-semibold text-gray-900">{customerName(r.customerId)}</div>
                    {vehicleLabel(r.vehicleId)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(r.startAt).toLocaleString("fr-MA")}
                    <br />
                    {new Date(r.endAt).toLocaleString("fr-MA")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#e10600]">{Number(r.totalAmount).toLocaleString("fr-MA")} MAD</div>
                    <div className="text-xs text-gray-500">Solde {Number(r.balance).toLocaleString("fr-MA")}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {Number(r.depositAmount).toLocaleString("fr-MA")} · <StatusBadge value={r.depositStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "OPEN" && (
                      <button type="button" className="btn-ghost text-xs" onClick={() => setCloseId(r.id)}>
                        Clôturer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!rentals.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucune location.
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

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  placeholder,
  required,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</span>
      <input
        className="field"
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        step={step}
      />
    </label>
  );
}
