"use client";

import { AdminShell } from "@/components/AdminShell";
import { AttachmentList, FileDropzone, type PendingFile } from "@/components/FileDropzone";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { Expense, StoredDocument, Vehicle } from "@/lib/types";
import { Loader2, Paperclip, Plus, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "CREDIT_VEHICLE", label: "Crédit véhicule" },
  { value: "INSURANCE", label: "Assurance" },
  { value: "MAINTENANCE", label: "Entretien" },
  { value: "REPAIR", label: "Réparation" },
  { value: "FUEL", label: "Carburant" },
  { value: "WASH", label: "Lavage" },
  { value: "PARKING", label: "Parking" },
  { value: "RENT", label: "Loyer" },
  { value: "SALARY", label: "Salaires" },
  { value: "ADS", label: "Publicité" },
  { value: "SOFTWARE", label: "Logiciels" },
  { value: "ACCOUNTING", label: "Comptabilité" },
  { value: "TAX", label: "Taxes / vignette" },
  { value: "PARTNER_COMMISSION", label: "Commission partenaire" },
  { value: "OTHER", label: "Autre" },
];

export default function ExpensesPage() {
  const { t, formatMoney } = useI18n();
  const [rows, setRows] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  async function load() {
    try {
      const [e, v] = await Promise.all([api.getExpenses(), api.getVehicles()]);
      setRows(e);
      setVehicles(v);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDocs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await api.listDocuments("EXPENSE", selectedId);
        if (!cancelled) setDocs(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(
    () => (categoryFilter === "ALL" ? rows : rows.filter((r) => r.category === categoryFilter)),
    [rows, categoryFilter],
  );

  const total = filtered.reduce((s, r) => s + Number(r.amount), 0);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const expense = await api.createExpense({
        category: fd.get("category"),
        label: fd.get("label"),
        amount: Number(fd.get("amount")),
        expenseDate: fd.get("expenseDate"),
        vehicleId: fd.get("vehicleId") || null,
        vendor: fd.get("vendor") || null,
        notes: fd.get("notes") || null,
        currency: "MAD",
      });
      for (const pf of pendingFiles) {
        await api.uploadDocument("EXPENSE", expense.id, pf.file, {
          category: "INVOICE",
          label: "Facture / ticket",
        });
      }
      setOpen(false);
      setPendingFiles([]);
      setSelectedId(expense.id);
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
        title={t.expenses.title}
        subtitle={`${t.expenses.subtitle} · ${formatMoney(total)}`}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.treasury },
          { label: t.nav.expenses },
        ]}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setOpen((v) => !v);
              if (open) setPendingFiles([]);
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {open ? t.form.close : t.form.newExpense}
          </button>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      {open && (
        <form onSubmit={onCreate} className="card mb-5 space-y-4 p-5">
          <div>
            <h2 className="font-display text-lg font-bold">{t.expenses.formTitle}</h2>
            <p className="mt-1 text-sm text-gray-500">{t.expenses.formHint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.category}</span>
              <select className="field" name="category" defaultValue="MAINTENANCE" required>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.label}</span>
              <input className="field" name="label" required placeholder="Vidange Duster · Garage Atlas" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.amountMad}</span>
              <input className="field" name="amount" type="number" step="0.01" min="0.01" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.date}</span>
              <input
                className="field"
                name="expenseDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.vehicle}</span>
              <select className="field" name="vehicleId" defaultValue="">
                <option value="">{t.expenses.generalCharge}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} · {v.registration}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.vendor}</span>
              <input className="field" name="vendor" placeholder="Garage, assureur, station…" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.notes}</span>
              <input className="field" name="notes" placeholder="N° facture, période couverte…" />
            </label>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {t.expenses.attachInvoice}
            </div>
            <FileDropzone files={pendingFiles} onChange={setPendingFiles} />
          </div>
          <button className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t.form.save}
          </button>
        </form>
      )}

      <div className="mb-4">
        <select className="field w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="ALL">{t.expenses.allCategories}</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="card overflow-hidden">
          <table className="w-full min-w-[800px] text-start text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t.form.date}</th>
                <th className="px-4 py-3">{t.form.category}</th>
                <th className="px-4 py-3">{t.form.label}</th>
                <th className="px-4 py-3">{t.form.amount}</th>
                <th className="px-4 py-3">{t.form.vendor}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const cat = CATEGORIES.find((c) => c.value === e.category)?.label || e.category;
                return (
                  <tr
                    key={e.id}
                    className={`cursor-pointer border-t border-[#e5e7eb] hover:bg-red-50/40 ${selectedId === e.id ? "bg-red-50/60" : ""}`}
                    onClick={() => setSelectedId(e.id)}
                  >
                    <td className="px-4 py-3 text-xs">{e.expenseDate}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{cat}</td>
                    <td className="px-4 py-3">{e.label}</td>
                    <td className="px-4 py-3 font-bold text-[#e10600]">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.vendor || t.none}</td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {t.expenses.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="card p-5">
          {!selectedId ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center text-sm text-gray-500">
              <Paperclip className="mb-2 h-7 w-7 text-gray-300" />
              {t.expenses.selectHint}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-display text-lg font-bold">{t.expenses.proofs}</h3>
              <AttachmentList
                items={docs}
                onDownload={(id) => {
                  const doc = docs.find((d) => d.id === id);
                  void api.downloadDocument(id, doc?.originalName);
                }}
                onDelete={async (id) => {
                  try {
                    await api.deleteDocument(id);
                    setDocs(await api.listDocuments("EXPENSE", selectedId));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : t.payments.deleteFailed);
                  }
                }}
              />
            </div>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
