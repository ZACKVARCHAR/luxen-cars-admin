"use client";

import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/cn";
import { vehicleImageUrl } from "@/lib/media";
import type { Vehicle } from "@/lib/types";
import { Fuel, ImageIcon, Pencil, Settings2 } from "lucide-react";

export function VehicleCard({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: Vehicle;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "card overflow-hidden text-start",
        selected ? "border-[#e10600] ring-2 ring-[#e10600]/20" : "hover:border-gray-300",
      )}
    >
      <div className="relative aspect-[16/10] bg-[#eef0f3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vehicleImageUrl(vehicle.imageUrl)}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute start-2.5 top-2.5">
          <StatusBadge value={vehicle.status} />
        </div>
        <div className="absolute bottom-2.5 end-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-[#e10600]">
          {vehicle.dailyRate} MAD/j
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display truncate text-[15px] font-bold">
              {vehicle.brand} {vehicle.model}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-gray-500">{vehicle.registration}</div>
          </div>
          <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
            {vehicle.category}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
            <Fuel className="h-3 w-3 text-[#e10600]" />
            {vehicle.fuel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1">
            <Settings2 className="h-3 w-3 text-[#e10600]" />
            {vehicle.transmission}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#e8eaee] pt-2.5 text-[11px] font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </span>
          <span className="inline-flex items-center gap-1 text-[#e10600]">
            <ImageIcon className="h-3.5 w-3.5" />
            Photos
          </span>
        </div>
      </div>
    </button>
  );
}
