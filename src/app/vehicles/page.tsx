"use client";

import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import { VehicleCard } from "@/components/VehicleCard";
import { AlertBox, EmptyState, KpiCard, PageHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/context";
import { vehicleImageUrl } from "@/lib/media";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  CloudUpload,
  Grid2X2,
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Wrench,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const STATUSES: VehicleStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "MAINTENANCE",
  "IMMOBILIZED",
  "ACCIDENTED",
  "SOLD",
];

type Tab = "info" | "photos" | "rates" | "availability";
type StatusFilter = "ALL" | "AVAILABLE" | "RENTED" | "MAINTENANCE";

export default function VehiclesPage() {
  const { t, formatMoney, statusLabel } = useI18n();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("AVAILABLE");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("photos");

  async function load() {
    try {
      const rows = await api.getVehicles();
      setVehicles(rows);
      setSelectedId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        const preferred = rows.find((r) => r.status === "AVAILABLE") || rows[0];
        return preferred?.id || null;
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand))).sort(),
    [vehicles],
  );

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "AVAILABLE").length,
    rented: vehicles.filter((v) => v.status === "RENTED").length,
    maintenance: vehicles.filter((v) => v.status === "MAINTENANCE" || v.status === "IMMOBILIZED")
      .length,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (brand !== "all" && v.brand !== brand) return false;
      if (statusFilter === "AVAILABLE" && v.status !== "AVAILABLE") return false;
      if (statusFilter === "RENTED" && v.status !== "RENTED") return false;
      if (
        statusFilter === "MAINTENANCE" &&
        v.status !== "MAINTENANCE" &&
        v.status !== "IMMOBILIZED"
      ) {
        return false;
      }
      if (!q) return true;
      return `${v.brand} ${v.model} ${v.registration} ${v.category}`.toLowerCase().includes(q);
    });
  }, [vehicles, query, brand, statusFilter]);

  const selected =
    filtered.find((v) => v.id === selectedId) ||
    vehicles.find((v) => v.id === selectedId) ||
    filtered[0] ||
    null;

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const created = await api.createVehicle({
        brand: fd.get("brand"),
        model: fd.get("model"),
        registration: fd.get("registration"),
        category: fd.get("category"),
        fuel: fd.get("fuel"),
        transmission: fd.get("transmission"),
        mileage: Number(fd.get("mileage") || 0),
        dailyRate: Number(fd.get("dailyRate") || 0),
        deposit: Number(fd.get("deposit") || 3000),
        seats: Number(fd.get("seats") || 5),
        bags: Number(fd.get("bags") || 2),
        slug: fd.get("slug") || null,
        imageUrl: fd.get("imageUrl") || null,
        features: fd.get("features") || null,
        airConditioning: true,
      });
      setOpen(false);
      setStatusFilter("ALL");
      await load();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell searchPlaceholder={t.searchOps} onSearch={setQuery}>
      <PageHeader
        title={t.vehicles.title}
        subtitle={t.vehicles.subtitle}
        crumbs={[
          { label: t.home, href: "/dashboard" },
          { label: t.nav.operations },
          { label: t.nav.vehicles },
        ]}
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen((v) => !v)}>
            <Plus className="h-4 w-4" />
            {t.vehicles.add}
          </button>
        }
      />

      {error && <AlertBox>{error}</AlertBox>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CarFront} label="Véhicules au total" value={stats.total} active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")} tone="red" />
        <KpiCard icon={CheckCircle2} label="Disponibles" value={stats.available} active={statusFilter === "AVAILABLE"} onClick={() => setStatusFilter("AVAILABLE")} tone="green" />
        <KpiCard icon={CalendarDays} label="En location" value={stats.rented} active={statusFilter === "RENTED"} onClick={() => setStatusFilter("RENTED")} tone="orange" />
        <KpiCard icon={Wrench} label="En maintenance" value={stats.maintenance} active={statusFilter === "MAINTENANCE"} onClick={() => setStatusFilter("MAINTENANCE")} tone="red" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="field ps-10"
              placeholder="Filtrer la liste…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="field w-auto min-w-[160px]" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="all">Toutes les marques</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">
            {filtered.length} véhicule{filtered.length > 1 ? "s" : ""}
          </span>
          <div className="inline-flex rounded-xl border border-[#e5e7eb] bg-white p-1">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                view === "list" ? "bg-[#e10600] text-white" : "text-gray-500",
              )}
              onClick={() => setView("list")}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                view === "grid" ? "bg-[#e10600] text-white" : "text-gray-500",
              )}
              onClick={() => setView("grid")}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <form onSubmit={onCreate} className="card mb-5 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["brand", "Marque", "Dacia"],
            ["model", "Modèle", "Duster"],
            ["registration", "Immatriculation", "12345-F-6"],
            ["category", "Catégorie", "SUV"],
            ["fuel", "Carburant", "Diesel"],
            ["transmission", "Transmission", "Manuelle"],
            ["mileage", "Kilométrage", "10000"],
            ["dailyRate", "Tarif / jour", "250"],
            ["deposit", "Caution", "3000"],
            ["seats", "Places", "5"],
            ["bags", "Bagages", "3"],
            ["slug", "Slug", "dacia-duster"],
            ["imageUrl", "Image URL", "/vehicles/dacia-duster.png"],
            ["features", "Features (|)", "Livraison gratuite|GPS inclus"],
          ].map(([name, label, ph]) => (
            <label key={name} className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {label}
              </span>
              <input
                className="field"
                name={name}
                placeholder={ph}
                required={!["slug", "imageUrl", "features"].includes(name)}
              />
            </label>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  selected={selected?.id === v.id}
                  onSelect={() => {
                    setSelectedId(v.id);
                    setTab("photos");
                  }}
                />
              ))}
              {!filtered.length && (
                <div className="card col-span-full">
                  <EmptyState>{t.vehicles.empty}</EmptyState>
                </div>
              )}
            </div>
          ) : (
            <div className="card divide-y divide-[#e5e7eb] overflow-hidden">
              {filtered.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-3 text-start transition hover:bg-gray-50",
                    selected?.id === v.id && "bg-red-50/70",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicleImageUrl(v.imageUrl)}
                    alt=""
                    className="h-16 w-24 rounded-xl object-cover ring-1 ring-black/5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">
                      {v.brand} {v.model}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {v.category} · {v.fuel} · {v.registration}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-bold text-[#e10600]">{formatMoney(v.dailyRate)}</div>
                    <div className="mt-1">
                      <StatusBadge value={v.status} />
                    </div>
                  </div>
                </button>
              ))}
              {!filtered.length && (
                <div className="px-4 py-10 text-center text-sm text-gray-500">{t.vehicles.empty}</div>
              )}
            </div>
          )}
        </section>

        <aside className="card sticky top-24 self-start overflow-hidden">
          {selected ? (
            <>
              <div className="border-b border-[#e5e7eb] p-4">
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vehicleImageUrl(selected.imageUrl)}
                    alt=""
                    className="h-20 w-28 rounded-xl object-cover ring-1 ring-black/5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-bold">
                      {selected.brand} {selected.model}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-gray-500">
                      {selected.registration} · {selected.category} · {selected.fuel}
                    </div>
                    <div className="mt-2">
                      <StatusBadge value={selected.status} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost text-sm">
                    <Pencil className="h-3.5 w-3.5 text-[#e10600]" />
                    Modifier le véhicule
                  </button>
                  <select
                    className="field w-auto py-2 text-xs"
                    value={selected.status}
                    onChange={async (e) => {
                      try {
                        await api.patchVehicleStatus(selected.id, e.target.value);
                        await load();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : t.error);
                      }
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto border-b border-[#e5e7eb] px-2">
                {(
                  [
                    ["info", "Informations"],
                    ["photos", "Images"],
                    ["rates", "Tarifs"],
                    ["availability", "Disponibilités"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cn(
                      "shrink-0 border-b-2 px-3 py-3 text-sm font-semibold",
                      tab === id
                        ? "border-[#e10600] text-[#e10600]"
                        : "border-transparent text-gray-500 hover:text-gray-800",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {tab === "info" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Carburant" value={selected.fuel} />
                    <Info label="Transmission" value={selected.transmission} />
                    <Info label="Places" value={String(selected.seats)} />
                    <Info label="Bagages" value={String(selected.bags)} />
                    <Info label="Kilométrage" value={`${selected.mileage.toLocaleString("fr-MA")} km`} />
                    <Info label="Climatisation" value={selected.airConditioning ? t.yes : t.no} />
                    {selected.features && (
                      <div className="sm:col-span-2">
                        <Info
                          label="Équipements"
                          value={selected.features.split("|").join(" · ")}
                        />
                      </div>
                    )}
                  </div>
                )}

                {tab === "photos" && (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl border border-[#e5e7eb]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vehicleImageUrl(selected.imageUrl)}
                        alt=""
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#e10600] px-2.5 py-1 text-[11px] font-bold text-white shadow">
                        <Star className="h-3 w-3 fill-white" />
                        Principale
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="aspect-square overflow-hidden rounded-lg border border-[#e5e7eb] bg-gray-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={vehicleImageUrl(selected.imageUrl)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-dashed border-[#e10600]/45 bg-red-50/50 px-4 py-8 text-center">
                      <CloudUpload className="mx-auto h-8 w-8 text-[#e10600]" />
                      <div className="mt-2 text-sm font-bold text-[#1a1d24]">
                        Glissez-déposez vos images ici
                      </div>
                      <div className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP · max 10 Mo</div>
                      <button type="button" className="btn-ghost mt-4 text-sm">
                        Sélectionner des images
                      </button>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700">
                      Conseil : ajoutez 4 à 10 photos de qualité (extérieur, intérieur, coffre).
                    </div>
                  </div>
                )}

                {tab === "rates" && (
                  <div className="space-y-3">
                    <Info label="Tarif journalier" value={formatMoney(selected.dailyRate)} />
                    <Info label="Caution" value={formatMoney(selected.deposit)} />
                  </div>
                )}

                {tab === "availability" && (
                  <div className="rounded-xl border border-[#e5e7eb] bg-gray-50 px-4 py-6 text-sm text-gray-600">
                    Statut actuel : <strong>{statusLabel(selected.status)}</strong>
                    <div className="mt-2 text-xs text-gray-500">
                      Les créneaux réservés apparaîtront ici dès qu’une réservation est liée.
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-500">
              Sélectionnez un véhicule pour voir ses images.
            </div>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-gray-50 px-3 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-[#1a1d24]">{value}</div>
    </div>
  );
}
