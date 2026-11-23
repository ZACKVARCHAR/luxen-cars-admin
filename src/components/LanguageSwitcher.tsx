"use client";

import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import { Languages } from "lucide-react";

export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] border border-[#e8eaee] bg-white px-2.5 py-2 text-xs font-bold text-gray-700 hover:border-gray-300",
        compact && "h-10 w-10 justify-center px-0",
        className,
      )}
      title={t.langSwitch}
      aria-label={t.langSwitch}
    >
      <Languages className="h-4 w-4 text-[#e10600]" />
      {!compact && <span>{locale === "ar" ? "FR" : "ع"}</span>}
    </button>
  );
}
