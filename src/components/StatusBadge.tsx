"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/context";

const TONES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RESERVED: "bg-amber-50 text-amber-700 border-amber-200",
  RENTED: "bg-orange-50 text-orange-700 border-orange-200",
  MAINTENANCE: "bg-red-50 text-red-700 border-red-200",
  IMMOBILIZED: "bg-red-50 text-red-700 border-red-200",
  ACCIDENTED: "bg-red-100 text-red-800 border-red-300",
  SOLD: "bg-gray-100 text-gray-500 border-gray-200",
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CONVERTED_TO_RENTAL: "bg-sky-50 text-sky-700 border-sky-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
  WEBSITE: "bg-red-50 text-red-700 border-red-200",
  OPEN: "bg-sky-50 text-sky-700 border-sky-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  DISPUTED: "bg-orange-50 text-orange-700 border-orange-200",
  HELD: "bg-amber-50 text-amber-700 border-amber-200",
  RELEASED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIALLY_RETAINED: "bg-orange-50 text-orange-700 border-orange-200",
  FULLY_RETAINED: "bg-red-50 text-red-700 border-red-200",
  PLANNED: "bg-sky-50 text-sky-700 border-sky-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ value }: { value: string }) {
  const { statusLabel } = useI18n();
  return (
    <span
      className={cn(
        "badge border",
        TONES[value] || "bg-gray-100 text-gray-600 border-gray-200",
      )}
    >
      {statusLabel(value)}
    </span>
  );
}
