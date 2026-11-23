"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, KpiCard, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { TreasuryDay } from "@/lib/types";
import { Banknote, CreditCard, Loader2, Lock, Wallet } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function TreasuryPage() {
  const { t, formatMoney } = useI18n();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [day, setDay] = useState<TreasuryDay | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load(d = date) {
    try {
      setDay(await api.getTreasuryDay(d));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function openClose() {
    setSaving(true);
    try {
      await api.openTreasuryClose(date);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  async function onClose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!day?.close?.id) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.closeTreasuryDay(day.close.id, {
        cashCounted: Number(fd.get("cashCounted")),
        notes: fd.get("notes") || null,
        closedBy: fd.get("closedBy") || "Agent Luxen",
      });
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
        title={t.treasury.title}
        subtitle={t.treasury.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.treasury },
          { label: t.nav.treasuryPage },
        ]}
        actions={
          <input
            className="field w-auto"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      {day && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Banknote} label="Espèces attendues" value={`${Number(day.cashExpected).toLocaleString("fr-MA")} MAD`} tone="green" />
            <KpiCard icon={CreditCard} label="Carte" value={`${Number(day.cardExpected).toLocaleString("fr-MA")} MAD`} tone="slate" />
            <KpiCard icon={Wallet} label="Virements" value={`${Number(day.transferExpected).toLocaleString("fr-MA")} MAD`} tone="orange" />
            <KpiCard icon={Lock} label="Total encaissé" value={`${Number(day.totalIn).toLocaleString("fr-MA")} MAD`} tone="red" />
          </div>

          <div className="mb-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="card overflow-hidden">
              <div className="border-b border-[#e8eaee] px-4 py-3 font-display font-bold">Mouvements du jour</div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Heure</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Méthode</th>
                    <th className="px-4 py-2">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {day.movements.map((m) => (
                    <tr key={m.id} className="border-t border-[#e8eaee]">
                      <td className="px-4 py-2 text-xs">{new Date(m.paidAt).toLocaleTimeString("fr-MA")}</td>
                      <td className="px-4 py-2 font-semibold">{m.kind}</td>
                      <td className="px-4 py-2 text-xs">{m.method}</td>
                      <td className="px-4 py-2 font-bold text-[#e10600]">
                        {Number(m.amount).toLocaleString("fr-MA")}
                      </td>
                    </tr>
                  ))}
                  {!day.movements.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        Aucun mouvement ce jour.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card space-y-4 p-5">
              <div>
                <h2 className="font-display text-lg font-bold">Clôture</h2>
                <p className="text-sm text-gray-500">
                  Dépenses du jour : {Number(day.expensesTotal).toLocaleString("fr-MA")} MAD
                </p>
              </div>

              {!day.close && (
                <button type="button" className="btn-primary" disabled={saving} onClick={openClose}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Ouvrir la feuille de caisse
                </button>
              )}

              {day.close?.status === "OPEN" && (
                <form onSubmit={onClose} className="space-y-3">
                  <div className="rounded-[10px] bg-gray-50 p-3 text-sm">
                    <div>Espèces système : <strong>{Number(day.close.cashExpected).toLocaleString("fr-MA")} MAD</strong></div>
                    <div>Carte : {Number(day.close.cardExpected).toLocaleString("fr-MA")} MAD</div>
                    <div>Virement : {Number(day.close.transferExpected).toLocaleString("fr-MA")} MAD</div>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Espèces comptées</span>
                    <input
                      className="field"
                      name="cashCounted"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={String(day.close.cashExpected)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Clôturé par</span>
                    <input className="field" name="closedBy" defaultValue="Agent Luxen" required />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Notes / écart</span>
                    <input className="field" name="notes" placeholder="Écart justifié par…" />
                  </label>
                  <button className="btn-primary" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Clôturer la journée
                  </button>
                </form>
              )}

              {day.close?.status === "CLOSED" && (
                <div className="space-y-2 rounded-[12px] border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <div className="font-bold text-emerald-800">Journée clôturée</div>
                  <div>Compté : {Number(day.close.cashCounted || 0).toLocaleString("fr-MA")} MAD</div>
                  <div>
                    Écart :{" "}
                    <strong className={Number(day.close.variance || 0) === 0 ? "text-emerald-700" : "text-red-600"}>
                      {Number(day.close.variance || 0).toLocaleString("fr-MA")} MAD
                    </strong>
                  </div>
                  <div className="text-xs text-emerald-700">
                    Par {day.close.closedBy} · {day.close.closedAt ? new Date(day.close.closedAt).toLocaleString("fr-MA") : ""}
                  </div>
                  {day.close.notes && <div className="text-xs">{day.close.notes}</div>}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
