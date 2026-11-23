"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { GmailSignalItem, GoogleReviewItem, IntelSettings } from "@/lib/types";
import { Loader2, RefreshCw, Star } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function ReviewsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<IntelSettings | null>(null);
  const [reviews, setReviews] = useState<GoogleReviewItem[]>([]);
  const [mails, setMails] = useState<GmailSignalItem[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      const [s, r, g] = await Promise.all([
        api.getIntelSettings(),
        api.getGoogleReviews(),
        api.getGmailSignals(),
      ]);
      setSettings(s);
      setReviews(r);
      setMails(g);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy("settings");
    try {
      setSettings(
        await api.saveIntelSettings({
          googlePlaceId: fd.get("googlePlaceId") || null,
          googleBusinessName: fd.get("googleBusinessName") || null,
          gmailAddress: fd.get("gmailAddress") || null,
          marketCity: fd.get("marketCity") || "Fès",
          marketNotes: fd.get("marketNotes") || null,
        }),
      );
      setInfo(t.reviews.settingsSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy("");
    }
  }

  async function syncReviews() {
    setBusy("reviews");
    try {
      const res = await api.syncGoogleReviews();
      setInfo(res.message + ` · +${res.imported}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy("");
    }
  }

  async function syncGmail() {
    setBusy("gmail");
    try {
      const res = await api.syncGmailSignals();
      setInfo(res.message + ` · +${res.imported || res.seeded}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy("");
    }
  }

  async function importReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy("import-review");
    try {
      await api.importGoogleReview({
        authorName: fd.get("authorName"),
        rating: Number(fd.get("rating")),
        text: fd.get("text"),
        relativeTime: fd.get("relativeTime") || null,
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy("");
    }
  }

  async function importMail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy("import-mail");
    try {
      await api.importGmailSignal({
        fromAddress: fd.get("fromAddress"),
        subject: fd.get("subject"),
        snippet: fd.get("snippet"),
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminShell searchPlaceholder={t.searchOps}>
      <PageHeader
        title={t.reviews.title}
        subtitle={t.reviews.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.intelligence },
          { label: t.nav.reviews },
        ]}
      />
      {error && <AlertBox>{error}</AlertBox>}
      {info && (
        <div className="mb-4 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {info}
        </div>
      )}

      {settings && (
        <form onSubmit={saveSettings} className="card mb-5 grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="font-display text-lg font-bold sm:col-span-2">{t.reviews.connection}</h2>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.reviews.placeId}</span>
            <input className="field" name="googlePlaceId" defaultValue={settings.googlePlaceId || ""} placeholder="ChIJ…" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.reviews.businessName}</span>
            <input className="field" name="googleBusinessName" defaultValue={settings.googleBusinessName || ""} placeholder="Luxen Cars Fès" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.reviews.gmail}</span>
            <input className="field" name="gmailAddress" type="email" defaultValue={settings.gmailAddress || ""} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.reviews.marketCity}</span>
            <input className="field" name="marketCity" defaultValue={settings.marketCity || "Fès"} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold uppercase text-gray-500">{t.reviews.marketNotes}</span>
            <input className="field" name="marketNotes" defaultValue={settings.marketNotes || ""} placeholder="Focus aéroport, diaspora été…" />
          </label>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={busy === "settings"}>
              {busy === "settings" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
          </div>
        </form>
      )}

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">{t.reviews.googleReviews}</h2>
            <button type="button" className="btn-ghost text-xs" onClick={syncReviews} disabled={!!busy}>
              {busy === "reviews" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t.sync}
            </button>
          </div>
          <ul className="mb-4 max-h-[360px] space-y-2 overflow-y-auto">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-[10px] border border-[#e8eaee] px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <strong>{r.authorName}</strong>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-500" /> {r.rating}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {r.sentiment || t.none} · {r.source} · {r.relativeTime || t.none}
                </div>
                <p className="mt-1 text-gray-700">{r.text}</p>
              </li>
            ))}
            {!reviews.length && <li className="py-6 text-center text-sm text-gray-500">{t.reviews.noReviews}</li>}
          </ul>
          <form onSubmit={importReview} className="grid gap-2 border-t border-[#eee] pt-3 sm:grid-cols-2">
            <input className="field" name="authorName" required placeholder={t.reviews.author} />
            <input className="field" name="rating" type="number" min={1} max={5} defaultValue={5} required />
            <input className="field sm:col-span-2" name="text" placeholder={t.reviews.reviewText} />
            <button className="btn-primary sm:col-span-2" disabled={busy === "import-review"}>
              {t.reviews.importReview}
            </button>
          </form>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">{t.reviews.gmailSignals}</h2>
            <button type="button" className="btn-ghost text-xs" onClick={syncGmail} disabled={!!busy}>
              {busy === "gmail" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t.sync}
            </button>
          </div>
          <ul className="mb-4 max-h-[360px] space-y-2 overflow-y-auto">
            {mails.map((m) => (
              <li key={m.id} className="rounded-[10px] border border-[#e8eaee] px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase">{m.category}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${m.importance === "HIGH" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                    {m.importance}
                  </span>
                </div>
                <div className="mt-1 font-semibold">{m.subject}</div>
                <div className="text-xs text-gray-500">{m.fromAddress}</div>
                <p className="mt-1 text-gray-700">{m.snippet}</p>
              </li>
            ))}
            {!mails.length && <li className="py-6 text-center text-sm text-gray-500">{t.reviews.noMails}</li>}
          </ul>
          <form onSubmit={importMail} className="grid gap-2 border-t border-[#eee] pt-3">
            <input className="field" name="fromAddress" placeholder="from@mail.com" />
            <input className="field" name="subject" required placeholder={t.reviews.subject} />
            <input className="field" name="snippet" placeholder={t.reviews.snippet} />
            <button className="btn-primary" disabled={busy === "import-mail"}>
              {t.reviews.importMail}
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-500">{t.reviews.gmailHint}</p>
        </section>
      </div>
    </AdminShell>
  );
}