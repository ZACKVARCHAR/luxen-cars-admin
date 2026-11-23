"use client";

import { clearAuth, getAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import {
  Bell,
  Bot,
  CalendarClock,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  ExternalLink,
  Lock,
  LogOut,
  Menu,
  MessageSquareQuote,
  Search,
  Shield,
  Sparkles,
  TriangleAlert,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/alerts", label: "Alertes", icon: Bell },
      { href: "/fleet-pnl", label: "P&L flotte", icon: LineChart },
      { href: "/finance", label: "Simulateur", icon: CircleDollarSign },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/advisor", label: "Conseiller IA", icon: Bot },
      { href: "/reviews", label: "Avis & Gmail", icon: MessageSquareQuote },
      { href: "/market", label: "Marché Maroc", icon: Sparkles },
    ],
  },
  {
    title: "Opérations",
    items: [
      { href: "/calendar", label: "Calendrier", icon: CalendarClock },
      { href: "/vehicles", label: "Véhicules", icon: CarFront },
      { href: "/reservations", label: "Réservations", icon: CalendarDays },
      { href: "/rentals", label: "Locations", icon: ClipboardList },
      { href: "/customers", label: "Clients", icon: Users },
    ],
  },
  {
    title: "Trésorerie",
    items: [
      { href: "/treasury", label: "Caisse", icon: Lock },
      { href: "/payments", label: "Paiements", icon: Wallet },
      { href: "/expenses", label: "Dépenses", icon: CircleDollarSign },
    ],
  },
  {
    title: "Risques",
    items: [
      { href: "/maintenance", label: "Maintenance", icon: Wrench },
      { href: "/insurance", label: "Assurances", icon: Shield },
      { href: "/incidents", label: "Incidents", icon: TriangleAlert },
    ],
  },
];

export function AdminShell({
  children,
  searchPlaceholder = "Rechercher...",
  onSearch,
}: {
  children: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState("Admin");
  const [q, setQ] = useState("");

  useEffect(() => {
    setMounted(true);
    const auth = getAuth();
    if (!auth) {
      router.replace("/login");
      return;
    }
    setUser(auth.username);
    setAuthed(true);
    try {
      if (localStorage.getItem("luxen.admin.sidebar") === "collapsed") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  const displayName = useMemo(() => user.split("@")[0] || "Admin", [user]);
  const pageLabel =
    GROUPS.flatMap((g) => g.items).find((i) => pathname.startsWith(i.href))?.label || "Back-office";

  // Apply collapse only after mount to keep SSR HTML identical to first client paint
  const isCollapsed = mounted && collapsed;

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("luxen.admin.sidebar", next ? "collapsed" : "expanded");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-[#f4f5f7] text-[#17191f]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer"
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex flex-col bg-[#16181f] text-white lg:static lg:translate-x-0",
          isCollapsed ? "w-[84px]" : "w-[268px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className={cn("flex items-center gap-3 px-4 py-4", isCollapsed && "justify-center px-2")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e10600]">
            <CarFront className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-display truncate text-[17px] font-bold leading-none">Luxen Cars</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Agence · Back-office
              </div>
            </div>
          )}
          <button type="button" className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fermer menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-3">
          {GROUPS.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold",
                        isCollapsed && "justify-center px-2",
                        active
                          ? "bg-[#e10600] text-white"
                          : "text-white/65 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2">
          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            title="Site public"
            className={cn(
              "mb-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-white/50 hover:bg-white/10 hover:text-white",
              isCollapsed && "justify-center px-2",
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Site public</span>}
          </a>
          <button
            type="button"
            onClick={toggleCollapse}
            className="mb-1 hidden w-full items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-xs font-semibold text-white/45 hover:bg-white/10 hover:text-white lg:flex"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span>Reduire</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              router.replace("/login");
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-white/50 hover:bg-white/10 hover:text-white",
              isCollapsed && "justify-center px-2",
            )}
            title="Deconnexion"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Deconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#e8eaee] bg-white">
          <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e8eaee] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 md:block">
              <div className="truncate text-sm font-bold">{pageLabel}</div>
              <div className="text-[11px] text-gray-400">Luxen Cars · Fes</div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="field ps-10"
                placeholder={searchPlaceholder}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  onSearch?.(e.target.value);
                }}
              />
            </div>

            <div className="ms-auto flex shrink-0 items-center gap-2">
              <Link
                href="/alerts"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e8eaee] bg-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-gray-600" />
                <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-[#e10600]" />
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-[#e8eaee] bg-white py-1 pe-2.5 ps-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e10600] text-xs font-bold text-white">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:block pe-1">
                  <div className="text-xs font-bold capitalize leading-tight" suppressHydrationWarning>
                    {mounted && authed ? displayName : "Admin"}
                  </div>
                  <div className="text-[10px] text-gray-500">Administrateur</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] flex-1 p-3 sm:p-5 lg:p-6">
          {!mounted || !authed ? (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
              Chargement...
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
