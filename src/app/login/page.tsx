"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { api } from "@/lib/api";
import { getAuth, saveAgencyId, saveAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Lock, Mail } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { t, dir, locale } = useI18n();
  const [email, setEmail] = useState("admin@luxencars.ma");
  const [password, setPassword] = useState("ChangeMe123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAuth()) router.replace("/dashboard");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      saveAuth(email.trim(), password);
      const agencies = await api.getAgencies();
      const fes =
        agencies.find((a) => a.city.toLowerCase().includes("fès") || a.city.toLowerCase().includes("fes")) ||
        agencies[0];
      if (!fes) throw new Error(t.login.noAgency);
      saveAgencyId(fes.id);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]" dir={dir} lang={locale}>
      <div className="absolute end-4 top-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="relative hidden w-[46%] overflow-hidden bg-black lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(225,6,0,0.28),transparent_50%)]" />
        <div className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
          {t.login.eyebrow}
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center py-8">
          <Image
            src="/brand/luxen-logo.png"
            alt={t.brand}
            width={720}
            height={520}
            priority
            className="h-auto w-full max-w-[520px] object-contain"
          />
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-2xl font-extrabold leading-tight text-white">
            {t.login.heroTitle}
          </h2>
          <p className="mt-3 max-w-sm text-sm text-white/55">{t.login.heroSub}</p>
          <div className="mt-6 text-xs text-white/35">{t.login.heroMeta}</div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="card w-full max-w-md p-7 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 w-full overflow-hidden rounded-[14px] bg-black px-4 py-5">
              <Image
                src="/brand/luxen-logo.png"
                alt={t.brand}
                width={480}
                height={340}
                priority
                className="mx-auto h-auto w-full max-w-[280px] object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-extrabold">{t.login.titleMobile}</h1>
            <p className="mt-1 text-sm text-gray-500">{t.login.subtitleMobile}</p>
          </div>

          <div className="mb-6 hidden lg:block">
            <div className="mb-5 overflow-hidden rounded-[14px] bg-black px-5 py-4">
              <Image
                src="/brand/luxen-logo.png"
                alt={t.brand}
                width={480}
                height={340}
                priority
                className="mx-auto h-auto w-full max-w-[260px] object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-extrabold">{t.login.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{t.login.subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {t.login.email}
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e10600]" />
                <input
                  className="field ps-10"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {t.login.password}
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e10600]" />
                <input
                  className="field ps-10"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>
            {error && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.login.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
