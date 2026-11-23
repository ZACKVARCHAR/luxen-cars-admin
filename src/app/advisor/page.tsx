"use client";

import { AdminShell } from "@/components/AdminShell";
import { AlertBox, KpiCard, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import type { AiConversationItem, AiMessageItem, IntelBrief } from "@/lib/types";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function AdvisorPage() {
  const { t } = useI18n();
  const PROMPTS = useMemo(
    () => [
      {
        topic: "DEMAND",
        label: t.advisor.demand,
        q: "Quelles voitures sont les plus demandées à Fès et lesquelles dois-je acheter ensuite ?",
      },
      {
        topic: "PRICE",
        label: t.advisor.price,
        q: "Quels tarifs journaliers recommander pour Sandero et Duster cette semaine face à la concurrence aéroport ?",
      },
      {
        topic: "RISK",
        label: t.advisor.risk,
        q: "Quels risques prioritaires pour mon agence Luxen au Maroc et comment les réduire en 7 jours ?",
      },
      {
        topic: "REVIEW",
        label: t.advisor.review,
        q: "Comment améliorer ma note Google et répondre aux avis négatifs sur la caution ?",
      },
      {
        topic: "COMPETITION",
        label: t.advisor.competition,
        q: "Comment me différencier des loueurs WhatsApp et des enseignes aéroport à Fès ?",
      },
    ],
    [t],
  );

  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [conversations, setConversations] = useState<AiConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessageItem[]>([]);
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("GENERAL");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const [b, c] = await Promise.all([api.getIntelBrief(), api.getAiConversations()]);
      setBrief(b);
      setConversations(c);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    api.getAiMessages(activeId)
      .then(setMessages)
      .catch((e) => setError(e instanceof Error ? e.message : t.error));
  }, [activeId, t.error]);

  async function ask(q: string, tpc = topic) {
    if (!q.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.askAdvisor({
        conversationId: activeId,
        topic: tpc,
        question: q.trim(),
      });
      setActiveId(res.conversationId);
      setQuestion("");
      await refresh();
      setMessages(await api.getAiMessages(res.conversationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.advisor.askFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await ask(question, topic);
  }

  return (
    <AdminShell searchPlaceholder={t.advisor.placeholder}>
      <PageHeader
        title={t.advisor.title}
        subtitle={t.advisor.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.advisor.crumbIntel },
          { label: t.nav.advisor },
        ]}
      />
      {error && <AlertBox>{error}</AlertBox>}

      {brief && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Sparkles} label={t.advisor.marketCity} value={brief.city} tone="slate" />
          <KpiCard
            icon={Bot}
            label={t.advisor.reviewAvg}
            value={brief.reviewCount ? `${brief.reviewAvg.toFixed(1)}/5` : t.none}
            hint={`${brief.reviewCount} · ${brief.negativeReviews} ${t.advisor.negativeReviews}`}
            tone="green"
          />
          <KpiCard icon={Bot} label={t.advisor.hotGmail} value={brief.hotGmailSignals} tone="orange" />
          <KpiCard
            icon={Bot}
            label={t.advisor.aiEngine}
            value={brief.geminiEnabled ? "Gemini" : "Local"}
            hint={brief.geminiEnabled ? t.advisor.geminiOn : t.advisor.geminiOff}
            tone={brief.geminiEnabled ? "green" : "red"}
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p.topic}
            type="button"
            className="btn-ghost text-xs"
            disabled={busy}
            onClick={() => {
              setTopic(p.topic);
              void ask(p.q, p.topic);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <aside className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display font-bold">{t.advisor.conversations}</h2>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                setActiveId(null);
                setMessages([]);
              }}
            >
              {t.advisor.newChat}
            </button>
          </div>
          <ul className="space-y-1.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-[10px] px-3 py-2 text-start text-sm ${
                    activeId === c.id ? "bg-red-50 font-semibold text-[#e10600]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="truncate">{c.title}</div>
                  <div className="text-[11px] text-gray-400">{c.topic}</div>
                </button>
              </li>
            ))}
            {!conversations.length && (
              <li className="py-6 text-center text-sm text-gray-500">{t.advisor.noChat}</li>
            )}
          </ul>
        </aside>

        <section className="card flex min-h-[520px] flex-col p-4">
          <div className="flex-1 space-y-3 overflow-y-auto pe-1">
            {!messages.length && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-sm text-gray-500">
                <Bot className="mb-2 h-8 w-8 text-[#e10600]" />
                {t.advisor.emptyHint}
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-[12px] px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-8 bg-[#16181f] text-white"
                    : "mr-8 border border-[#e8eaee] bg-[#fafbfc] text-gray-800"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-2 border-t border-[#eee] pt-4">
            <select className="field w-auto text-xs" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="GENERAL">{t.advisor.general}</option>
              <option value="DEMAND">{t.advisor.topicDemand}</option>
              <option value="PRICE">{t.advisor.topicPrice}</option>
              <option value="RISK">{t.advisor.topicRisk}</option>
              <option value="REVIEW">{t.advisor.topicReview}</option>
              <option value="COMPETITION">{t.advisor.topicCompetition}</option>
            </select>
            <div className="flex gap-2">
              <input
                className="field flex-1"
                placeholder={t.advisor.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button className="btn-primary" disabled={busy || !question.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}