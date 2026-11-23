"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const SOURCES = [
  { value: "WEBSITE", label: "Site web" },
  { value: "GOOGLE", label: "Google" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "RETURNING", label: "Client récurrent" },
  { value: "PARTNER", label: "Partenaire / hôtel" },
  { value: "AIRPORT", label: "Aéroport" },
  { value: "WORD_OF_MOUTH", label: "Bouche à oreille" },
  { value: "OTHER", label: "Autre" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  async function load() {
    try {
      setCustomers(await api.getCustomers());
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
    return customers.filter((c) => {
      if (sourceFilter !== "ALL" && c.source !== sourceFilter) return false;
      if (!q) return true;
      return `${c.firstName} ${c.lastName} ${c.phone} ${c.email || ""} ${c.nationality}`
        .toLowerCase()
        .includes(q);
    });
  }, [customers, query, sourceFilter]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.createCustomer({
        firstName: String(fd.get("firstName") || "").trim(),
        lastName: String(fd.get("lastName") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        email: String(fd.get("email") || "").trim() || null,
        nationality: String(fd.get("nationality") || "").trim(),
        source: fd.get("source") || "WEBSITE",
        idDocument: String(fd.get("idDocument") || "").trim() || null,
        driverLicense: String(fd.get("driverLicense") || "").trim() || null,
        notes: String(fd.get("notes") || "").trim() || null,
        blacklist: fd.get("blacklist") === "on",
      });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell searchPlaceholder="Rechercher un client…" onSearch={setQuery}>
      <PageHeader
        title="Clients"
        subtitle="Fiches clients, sources d’acquisition et historique."
        crumbs={[{ label: "Accueil", href: "/dashboard" }, { label: "Opérations" }, { label: "Clients" }]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {open ? "Fermer" : "Nouveau client"}
          </button>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      {open && (
        <form onSubmit={onCreate} className="card mb-6 space-y-4 p-5">
          <div>
            <h2 className="font-display text-lg font-bold">Nouvelle fiche client</h2>
            <p className="mt-1 text-sm text-gray-500">
              Identité, contact et provenance — indispensables pour relier paiements et locations.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field name="firstName" label="Prénom" required placeholder="Youssef" />
            <Field name="lastName" label="Nom" required placeholder="Benali" />
            <Field name="phone" label="Téléphone" required placeholder="+212 6…" />
            <Field name="email" label="Email" type="email" placeholder="client@email.com" />
            <Field name="nationality" label="Nationalité" required defaultValue="Maroc" />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Source d&apos;acquisition
              </span>
              <select className="field" name="source" defaultValue="WEBSITE">
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <Field name="idDocument" label="CIN / passeport" placeholder="AB123456" />
            <Field name="driverLicense" label="N° permis" placeholder="Permis B…" />
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Notes</span>
              <input className="field" name="notes" placeholder="Préférences, historique litiges…" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="blacklist" className="h-4 w-4 accent-[#e10600]" />
              Client à risque / blacklist
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Enregistrer le client
          </button>
        </form>
      )}

      <div className="mb-4">
        <select className="field w-auto" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="ALL">Toutes les sources</option>
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Nationalité</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Fiche</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-[#e5e7eb]">
                  <td className="px-4 py-3 font-semibold">
                    {c.firstName} {c.lastName}
                    {c.blacklist ? <span className="ms-2 text-[10px] font-bold uppercase text-[#e10600]">Risque</span> : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{c.phone}</div>
                    <div className="text-xs text-gray-500">{c.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3">{c.nationality}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={c.source} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`} className="btn-ghost text-xs">
                      Vue 360
                    </Link>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucun client.
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
  required,
  type = "text",
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        className="field"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}
