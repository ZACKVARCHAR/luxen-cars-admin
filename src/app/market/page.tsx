"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { IntelBrief, MarketCompetitorItem } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function MarketPage() {
  const { t, formatMoney } = useI18n();
  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [rows, setRows] = useState<MarketCompetitorItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [b, c] = await Promise.all([api.getIntelBrief(), api.getCompetitors()]);
      setBrief(b);
      setRows(c);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.createCompetitor({
        name: fd.get("name"),
        city: fd.get("city") || brief?.city || "Fès",
        focus: fd.get("focus") || null,
        avgDailyRate: fd.get("avgDailyRate") ? Number(fd.get("avgDailyRate")) : null,
        fleetSizeEstimate: fd.get("fleetSizeEstimate") ? Number(fd.get("fleetSizeEstimate")) : null,
        strengths: fd.get("strengths") || null,
        weaknesses: fd.get("weaknesses") || null,
      });
      e.currentTarget.reset();
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
        title={t.market.title}
        subtitle={t.market.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.intelligence },
          { label: t.nav.market },
        ]}
        actions={
          <Link href="/advisor" className="btn-primary">
            {t.market.openAdvisor}
          </Link>
        }
      />
      {error && <AlertBox>{error}</AlertBox>}

      {brief && (
        <div className="card mb-5 p-5">
          <h2 className="font-display text-lg font-bold">
            {t.market.brief} {brief.city}
          </h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
            {brief.marketBrief}
          </pre>
        </div>
      )}

      <form onSubmit={onCreate} className="card mb-5 grid gap-3 p-5 sm:grid-cols-3">
        <h2 className="font-display text-lg font-bold sm:col-span-3">{t.market.addCompetitor}</h2>
        <input className="field" name="name" required placeholder={t.market.name} />
        <input className="field" name="city" placeholder={t.market.city} defaultValue={brief?.city || "Fès"} />
        <input className="field" name="focus" placeholder={t.market.focus} />
        <input className="field" name="avgDailyRate" type="number" step="0.01" placeholder={t.market.avgRate} />
        <input className="field" name="fleetSizeEstimate" type="number" placeholder={t.market.fleetSize} />
        <input className="field" name="strengths" placeholder={t.market.strengths} />
        <input className="field sm:col-span-2" name="weaknesses" placeholder={t.market.weaknesses} />
        <button className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t.add}
        </button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t.market.competitor}</th>
              <th className="px-4 py-3">{t.market.focus}</th>
              <th className="px-4 py-3">{t.market.rate}</th>
              <th className="px-4 py-3">{t.market.fleet}</th>
              <th className="px-4 py-3">{t.market.strengthsWeak}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#e8eaee]">
                <td className="px-4 py-3">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-gray-500">
                    {r.city} · {r.source}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{r.focus || t.none}</td>
                <td className="px-4 py-3 font-bold text-[#e10600]">
                  {r.avgDailyRate != null ? formatMoney(r.avgDailyRate) : t.none}
                </td>
                <td className="px-4 py-3">{r.fleetSizeEstimate ?? t.none}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <div>{r.strengths || t.none}</div>
                  <div className="text-gray-400">{r.weaknesses || ""}</div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {t.market.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}