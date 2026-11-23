"use client";

import { AdminShell } from "@/components/AdminShell";
import { AttachmentList, FileDropzone, type PendingFile } from "@/components/FileDropzone";
import { AlertBox, KpiCard, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { Customer, Payment, Rental, Reservation, StoredDocument } from "@/lib/types";
import {
  Banknote,
  CreditCard,
  FileStack,
  Loader2,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const PAYMENT_KINDS = ["PAYMENT", "DEPOSIT", "REFUND", "RETENTION", "EXTRA"] as const;
const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "CHECK", "ONLINE", "OTHER"] as const;

export default function PaymentsPage() {
  const { t, formatMoney, locale } = useI18n();
  const dateLocale = locale === "ar" ? "ar-MA" : "fr-MA";
  const kindLabels = t.payments.kind as Record<string, string>;
  const methodLabels = t.payments.method as Record<string, string>;
  const [rows, setRows] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [method, setMethod] = useState("CASH");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [extraFiles, setExtraFiles] = useState<PendingFile[]>([]);

  async function load() {
    try {
      const [p, c, r, res] = await Promise.all([
        api.getPayments(),
        api.getCustomers(),
        api.getRentals(),
        api.getReservations(),
      ]);
      setRows(p);
      setCustomers(c);
      setRentals(r);
      setReservations(res);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
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
      setDocsLoading(true);
      try {
        const list = await api.listDocuments("PAYMENT", selectedId);
        if (!cancelled) setDocs(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t.error);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
      if (kindFilter !== "ALL" && p.kind !== kindFilter) return false;
      if (!q) return true;
      const customer = customers.find((c) => c.id === p.customerId);
      const hay = [
        p.reference,
        p.bankName,
        p.receiptNumber,
        p.notes,
        p.kind,
        p.method,
        customer ? `${customer.firstName} ${customer.lastName}` : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, customers, query, methodFilter, kindFilter]);

  const totals = useMemo(() => {
    const collected = rows
      .filter((p) => p.kind === "PAYMENT" || p.kind === "DEPOSIT" || p.kind === "EXTRA")
      .reduce((s, p) => s + Number(p.amount), 0);
    const refunds = rows.filter((p) => p.kind === "REFUND").reduce((s, p) => s + Number(p.amount), 0);
    const withFiles = rows.filter((p) => (p.attachmentCount || 0) > 0).length;
    return { collected, refunds, withFiles, count: rows.length };
  }, [rows]);

  const selected = rows.find((p) => p.id === selectedId) || null;
  const needsBank = method === "TRANSFER" || method === "CHECK" || method === "CARD";

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const payment = await api.createPayment({
        kind: fd.get("kind"),
        method: fd.get("method"),
        amount: Number(fd.get("amount")),
        currency: "MAD",
        customerId: fd.get("customerId") || null,
        rentalId: fd.get("rentalId") || null,
        reservationId: fd.get("reservationId") || null,
        reference: fd.get("reference") || null,
        bankName: fd.get("bankName") || null,
        receiptNumber: fd.get("receiptNumber") || null,
        notes: fd.get("notes") || null,
      });
      for (const pf of pendingFiles) {
        await api.uploadDocument("PAYMENT", payment.id, pf.file, {
          category: "RECEIPT",
          label: t.payments.receiptLabel,
        });
      }
      setOpen(false);
      setPendingFiles([]);
      setMethod("CASH");
      setSelectedId(payment.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  async function uploadExtra() {
    if (!selectedId || !extraFiles.length) return;
    setSaving(true);
    try {
      for (const pf of extraFiles) {
        await api.uploadDocument("PAYMENT", selectedId, pf.file, { category: "RECEIPT" });
      }
      setExtraFiles([]);
      setDocs(await api.listDocuments("PAYMENT", selectedId));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.payments.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell searchPlaceholder={t.searchOps} onSearch={setQuery}>
      <PageHeader
        title={t.payments.title}
        subtitle={t.payments.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.treasury },
          { label: t.nav.payments },
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
            {open ? t.form.close : t.form.newPayment}
          </button>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Banknote} label={t.payments.collected} value={formatMoney(totals.collected)} tone="green" />
        <KpiCard icon={CreditCard} label={t.payments.refunded} value={formatMoney(totals.refunds)} tone="orange" />
        <KpiCard icon={FileStack} label={t.payments.entries} value={totals.count} tone="slate" />
        <KpiCard icon={Paperclip} label={t.payments.withAttachments} value={totals.withFiles} tone="red" />
      </div>

      {open && (
        <form onSubmit={onCreate} className="card mb-5 space-y-5 p-5">
          <div>
            <h2 className="font-display text-lg font-bold">{t.payments.formTitle}</h2>
            <p className="mt-1 text-sm text-gray-500">{t.payments.formHint}</p>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.type}</span>
              <select className="field" name="kind" defaultValue="PAYMENT" required>
                {PAYMENT_KINDS.map((k) => (
                  <option key={k} value={k}>{kindLabels[k]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.method}</span>
              <select
                className="field"
                name="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                required
              >
                {PAYMENT_METHODS.map((k) => (
                  <option key={k} value={k}>{methodLabels[k]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.amountMad}</span>
              <input className="field" name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.payments.receiptNumber}</span>
              <input className="field" name="receiptNumber" placeholder="REC-2026-014" />
            </label>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.client}</span>
              <select className="field" name="customerId" defaultValue="">
                <option value="">{t.form.unlinked}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} · {c.phone}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.rental}</span>
              <select className="field" name="rentalId" defaultValue="">
                <option value="">{t.form.unlinked}</option>
                {rentals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.contractRef || r.id.slice(0, 8)} · {formatMoney(r.balance)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.form.reservation}</span>
              <select className="field" name="reservationId" defaultValue="">
                <option value="">{t.form.unlinked}</option>
                {reservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.publicCode || r.id.slice(0, 8)} · {formatMoney(r.totalAmount)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.payments.opReference}</span>
              <input className="field" name="reference" placeholder="VIR-ATTIJARI-8891" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
                {t.form.bank} {needsBank ? "*" : ""}
              </span>
              <input
                className="field"
                name="bankName"
                placeholder="Attijariwafa, BMCE, CIH…"
                required={needsBank}
              />
            </label>
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.payments.internalNotes}</span>
              <input className="field" name="notes" placeholder="Acompte 50 %, reste à la remise" />
            </label>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              {t.payments.attachHint}
            </div>
            <FileDropzone files={pendingFiles} onChange={setPendingFiles} />
          </section>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t.payments.savePayment}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setOpen(false);
                setPendingFiles([]);
              }}
            >
              {t.form.cancel}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="field ps-9"
            placeholder={t.payments.filterPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="field w-auto" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
          <option value="ALL">{t.form.allTypes}</option>
          {PAYMENT_KINDS.map((k) => (
            <option key={k} value={k}>{kindLabels[k]}</option>
          ))}
        </select>
        <select className="field w-auto" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option value="ALL">{t.form.allMethods}</option>
          {PAYMENT_METHODS.map((k) => (
            <option key={k} value={k}>{methodLabels[k]}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-start text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t.form.date}</th>
                  <th className="px-4 py-3">{t.form.type}</th>
                  <th className="px-4 py-3">{t.payments.clientLink}</th>
                  <th className="px-4 py-3">{t.form.method}</th>
                  <th className="px-4 py-3">{t.form.amount}</th>
                  <th className="px-4 py-3">{t.form.attachments}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const customer = customers.find((c) => c.id === p.customerId);
                  const active = selectedId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`cursor-pointer border-t border-[#e5e7eb] transition hover:bg-red-50/40 ${active ? "bg-red-50/60" : ""}`}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {new Date(p.paidAt).toLocaleString(dateLocale)}
                      </td>
                      <td className="px-4 py-3 font-semibold">{kindLabels[p.kind] || p.kind}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {customer ? `${customer.firstName} ${customer.lastName}` : t.none}
                        </div>
                        <div className="text-xs text-gray-500">
                          {p.receiptNumber || p.reference || p.bankName || t.payments.noReference}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{methodLabels[p.method] || p.method}</td>
                      <td className="px-4 py-3 font-bold text-[#e10600]">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          <Paperclip className="h-3 w-3" />
                          {p.attachmentCount || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      {t.payments.empty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="card p-5">
          {!selected ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center text-sm text-gray-500">
              <Paperclip className="mb-2 h-8 w-8 text-gray-300" />
              {t.payments.selectHint}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{t.form.detail}</div>
                <h3 className="mt-1 font-display text-xl font-bold">
                  {kindLabels[selected.kind] || selected.kind}
                </h3>
                <p className="mt-1 text-2xl font-extrabold text-[#e10600]">
                  {formatMoney(selected.amount)}
                </p>
              </div>

              <dl className="grid gap-2 text-sm">
                <Row label={t.form.method} value={methodLabels[selected.method] || selected.method} />
                <Row label={t.form.bank} value={selected.bankName || t.none} />
                <Row label={t.payments.receiptShort} value={selected.receiptNumber || t.none} />
                <Row label={t.form.reference} value={selected.reference || t.none} />
                <Row label={t.form.notes} value={selected.notes || t.none} />
                <Row label={t.form.date} value={new Date(selected.paidAt).toLocaleString(dateLocale)} />
              </dl>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t.form.attachments}
                </div>
                {docsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t.form.loading}
                  </div>
                ) : (
                  <AttachmentList
                    items={docs}
                    onDownload={(id) => {
                      const doc = docs.find((d) => d.id === id);
                      void api.downloadDocument(id, doc?.originalName);
                    }}
                    onDelete={async (id) => {
                      try {
                        await api.deleteDocument(id);
                        setDocs(await api.listDocuments("PAYMENT", selected.id));
                        await load();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : t.payments.deleteFailed);
                      }
                    }}
                  />
                )}
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t.payments.addProof}
                </div>
                <FileDropzone files={extraFiles} onChange={setExtraFiles} />
                {extraFiles.length > 0 && (
                  <button type="button" className="btn-primary mt-3" disabled={saving} onClick={uploadExtra}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    {t.payments.attachFiles} {extraFiles.length}{" "}
                    {extraFiles.length > 1 ? t.payments.filesPlural : t.payments.files}
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#f0f1f3] py-1.5">
      <dt className="text-xs font-semibold uppercase text-gray-400">{label}</dt>
      <dd className="text-end font-medium text-gray-800">{value}</dd>
    </div>
  );
}
