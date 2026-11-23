import { getAgencyId, getAuth } from "@/lib/auth";
import type {
  Agency,
  AlertDetail,
  Customer,
  Customer360,
  Dashboard,
  Expense,
  FleetCalendar,
  FleetCompositionResult,
  Incident,
  InsurancePolicy,
  MaintenanceOrder,
  Payment,
  ProjectAssumptions,
  ProjectResult,
  Rental,
  Reservation,
  ScenarioResult,
  StoredDocument,
  TreasuryDay,
  Vehicle,
  VehiclePnl,
  AiAdvice,
  AiConversationItem,
  AiMessageItem,
  GmailSignalItem,
  GoogleReviewItem,
  IntelBrief,
  IntelSettings,
  IntelStatus,
  MarketCompetitorItem,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function request<T>(path: string, init: RequestInit = {}, agency = true): Promise<T> {
  const auth = getAuth();
  if (!auth) throw new Error("Non authentifié");
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Basic ${auth.basicToken}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (agency) {
    const agencyId = getAgencyId();
    if (!agencyId) throw new Error("Agence non sélectionnée");
    headers.set("X-Agency-Id", agencyId);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      `Connexion API impossible (${API_BASE}). Vérifiez que le backend tourne sur le port 8080.`,
    );
  }
  if (!res.ok) {
    let detail = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || body.title || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  base: API_BASE,
  getAgencies: () => request<Agency[]>("/api/v1/agencies", {}, false),
  getDashboard: () => request<Dashboard>("/api/v1/dashboard"),
  getVehicles: () => request<Vehicle[]>("/api/v1/vehicles"),
  createVehicle: (body: Record<string, unknown>) =>
    request<Vehicle>("/api/v1/vehicles", { method: "POST", body: JSON.stringify(body) }),
  updateVehicle: (id: string, body: Record<string, unknown>) =>
    request<Vehicle>(`/api/v1/vehicles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  patchVehicleStatus: (id: string, status: string) =>
    request<Vehicle>(`/api/v1/vehicles/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  getCustomers: () => request<Customer[]>("/api/v1/customers"),
  createCustomer: (body: Record<string, unknown>) =>
    request<Customer>("/api/v1/customers", { method: "POST", body: JSON.stringify(body) }),
  getReservations: () => request<Reservation[]>("/api/v1/reservations"),
  createReservation: (body: Record<string, unknown>) =>
    request<Reservation>("/api/v1/reservations", { method: "POST", body: JSON.stringify(body) }),
  patchReservationStatus: (id: string, status: string) =>
    request<Reservation>(`/api/v1/reservations/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  getRentals: () => request<Rental[]>("/api/v1/rentals"),
  openRentalFromReservation: (reservationId: string, body: Record<string, unknown>) =>
    request<Rental>(`/api/v1/rentals/from-reservation/${reservationId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  closeRental: (id: string, body: Record<string, unknown>) =>
    request<Rental>(`/api/v1/rentals/${id}/close`, { method: "POST", body: JSON.stringify(body) }),
  getPayments: () => request<Payment[]>("/api/v1/payments"),
  createPayment: (body: Record<string, unknown>) =>
    request<Payment>("/api/v1/payments", { method: "POST", body: JSON.stringify(body) }),
  getExpenses: () => request<Expense[]>("/api/v1/expenses"),
  createExpense: (body: Record<string, unknown>) =>
    request<Expense>("/api/v1/expenses", { method: "POST", body: JSON.stringify(body) }),
  getMaintenance: () => request<MaintenanceOrder[]>("/api/v1/maintenance"),
  createMaintenance: (body: Record<string, unknown>) =>
    request<MaintenanceOrder>("/api/v1/maintenance", { method: "POST", body: JSON.stringify(body) }),
  completeMaintenance: (id: string, body?: Record<string, unknown>) =>
    request<MaintenanceOrder>(`/api/v1/maintenance/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),
  getInsurance: () => request<InsurancePolicy[]>("/api/v1/insurance"),
  createInsurance: (body: Record<string, unknown>) =>
    request<InsurancePolicy>("/api/v1/insurance", { method: "POST", body: JSON.stringify(body) }),
  getIncidents: () => request<Incident[]>("/api/v1/incidents"),
  createIncident: (body: Record<string, unknown>) =>
    request<Incident>("/api/v1/incidents", { method: "POST", body: JSON.stringify(body) }),
  closeIncident: (id: string) =>
    request<Incident>(`/api/v1/incidents/${id}/close`, { method: "POST", body: "{}" }),
  simulateFinance: (body: ProjectAssumptions) =>
    request<ProjectResult>("/api/v1/finance/simulate", { method: "POST", body: JSON.stringify(body) }),
  simulateScenarios: (assumptions: ProjectAssumptions, occupancyRates?: number[]) =>
    request<ScenarioResult[]>("/api/v1/finance/scenarios", {
      method: "POST",
      body: JSON.stringify({ assumptions, occupancyRates }),
    }),
  compareFleetCompositions: (body: Record<string, unknown>) =>
    request<FleetCompositionResult[]>("/api/v1/finance/fleet-compositions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listDocuments: (ownerType: string, ownerId: string) =>
    request<StoredDocument[]>(
      `/api/v1/documents?ownerType=${encodeURIComponent(ownerType)}&ownerId=${encodeURIComponent(ownerId)}`,
    ),
  uploadDocument: async (
    ownerType: string,
    ownerId: string,
    file: File,
    opts?: { category?: string; label?: string },
  ) => {
    const auth = getAuth();
    if (!auth) throw new Error("Non authentifié");
    const agencyId = getAgencyId();
    if (!agencyId) throw new Error("Agence non sélectionnée");
    const body = new FormData();
    body.append("file", file);
    body.append("ownerType", ownerType);
    body.append("ownerId", ownerId);
    if (opts?.category) body.append("category", opts.category);
    if (opts?.label) body.append("label", opts.label);
    const res = await fetch(`${API_BASE}/api/v1/documents`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth.basicToken}`,
        Accept: "application/json",
        "X-Agency-Id": agencyId,
      },
      body,
    });
    if (!res.ok) {
      let detail = `Erreur ${res.status}`;
      try {
        const json = await res.json();
        detail = json.detail || json.title || detail;
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }
    return res.json() as Promise<StoredDocument>;
  },
  deleteDocument: (id: string) =>
    request<void>(`/api/v1/documents/${id}`, { method: "DELETE" }),
  getFleetCalendar: (from: string, to: string) =>
    request<FleetCalendar>(`/api/v1/fleet-calendar?from=${from}&to=${to}`),
  createVehicleBlock: (body: Record<string, unknown>) =>
    request("/api/v1/fleet-calendar/blocks", { method: "POST", body: JSON.stringify(body) }),
  deleteVehicleBlock: (id: string) =>
    request<void>(`/api/v1/fleet-calendar/blocks/${id}`, { method: "DELETE" }),
  getVehiclePnl: (from: string, to: string) =>
    request<VehiclePnl[]>(`/api/v1/vehicle-pnl?from=${from}&to=${to}`),
  getCustomer360: (id: string) => request<Customer360>(`/api/v1/customers/${id}/360`),
  getDashboardAlerts: () => request<AlertDetail[]>("/api/v1/dashboard/alerts"),
  getTreasuryDay: (date: string) => request<TreasuryDay>(`/api/v1/treasury/day?date=${date}`),
  openTreasuryClose: (businessDate: string) =>
    request(`/api/v1/treasury/closes`, {
      method: "POST",
      body: JSON.stringify({ businessDate }),
    }),
  closeTreasuryDay: (id: string, body: Record<string, unknown>) =>
    request(`/api/v1/treasury/closes/${id}/close`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getIntelStatus: () => request<IntelStatus>("/api/v1/intelligence/status"),
  getIntelSettings: () => request<IntelSettings>("/api/v1/intelligence/settings"),
  saveIntelSettings: (body: Record<string, unknown>) =>
    request<IntelSettings>("/api/v1/intelligence/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getIntelBrief: () => request<IntelBrief>("/api/v1/intelligence/brief"),
  getGoogleReviews: () => request<GoogleReviewItem[]>("/api/v1/intelligence/reviews"),
  syncGoogleReviews: () =>
    request<{ imported: number; skippedOrUpdated: number; message: string }>(
      "/api/v1/intelligence/reviews/sync",
      { method: "POST", body: "{}" },
    ),
  importGoogleReview: (body: Record<string, unknown>) =>
    request<GoogleReviewItem>("/api/v1/intelligence/reviews/import", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getGmailSignals: () => request<GmailSignalItem[]>("/api/v1/intelligence/gmail"),
  syncGmailSignals: () =>
    request<{ imported: number; seeded: number; message: string }>("/api/v1/intelligence/gmail/sync", {
      method: "POST",
      body: "{}",
    }),
  importGmailSignal: (body: Record<string, unknown>) =>
    request<GmailSignalItem>("/api/v1/intelligence/gmail/import", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getCompetitors: () => request<MarketCompetitorItem[]>("/api/v1/intelligence/competitors"),
  createCompetitor: (body: Record<string, unknown>) =>
    request<MarketCompetitorItem>("/api/v1/intelligence/competitors", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  askAdvisor: (body: { conversationId?: string | null; topic?: string; question: string }) =>
    request<AiAdvice>("/api/v1/intelligence/ask", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getAiConversations: () => request<AiConversationItem[]>("/api/v1/intelligence/conversations"),
  getAiMessages: (id: string) =>
    request<AiMessageItem[]>(`/api/v1/intelligence/conversations/${id}/messages`),
  downloadDocument: async (id: string, filename?: string) => {
    const auth = getAuth();
    if (!auth) throw new Error("Non authentifié");
    const agencyId = getAgencyId();
    if (!agencyId) throw new Error("Agence non sélectionnée");
    const res = await fetch(`${API_BASE}/api/v1/documents/${id}/download`, {
      headers: {
        Authorization: `Basic ${auth.basicToken}`,
        "X-Agency-Id": agencyId,
      },
    });
    if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "piece-jointe";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
