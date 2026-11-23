export type Agency = {
  id: string;
  code: string;
  name: string;
  city: string;
  currency: string;
};

export type VehicleStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "RENTED"
  | "MAINTENANCE"
  | "IMMOBILIZED"
  | "ACCIDENTED"
  | "SOLD";

export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  registration: string;
  category: string;
  fuel: string;
  transmission: string;
  mileage: number;
  dailyRate: number;
  deposit: number;
  seats: number;
  bags: number;
  slug?: string;
  imageUrl?: string;
  features?: string;
  airConditioning: boolean;
  status: VehicleStatus;
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationality: string;
  source: string;
  notes?: string;
  idDocument?: string;
  driverLicense?: string;
  blacklist?: boolean;
};

export type AlertDetail = {
  code: string;
  category: string;
  message: string;
  severity: string;
  resourceType?: string | null;
  resourceId?: string | null;
  dueDate?: string | null;
};

export type FleetCalendar = {
  from: string;
  to: string;
  vehicles: {
    vehicle: {
      id: string;
      brand: string;
      model: string;
      registration: string;
      category: string;
      status: string;
    };
    events: {
      id: string;
      vehicleId: string;
      customerId?: string | null;
      type: string;
      status: string;
      startAt: string;
      endAt: string;
      label?: string | null;
      totalAmount?: number | null;
      paidAmount?: number | null;
      kind?: string | null;
    }[];
  }[];
  conflicts: {
    vehicleId: string;
    leftId: string;
    leftType: string;
    rightId: string;
    rightType: string;
    message: string;
  }[];
};

export type VehiclePnl = {
  vehicleId: string;
  brand: string;
  model: string;
  registration: string;
  status: string;
  category: string;
  purchasePrice: number;
  revenue: number;
  collected: number;
  costs: number;
  expenses: number;
  maintenanceCost: number;
  repairCost: number;
  financeCost: number;
  profit: number;
  marginPct: number;
  rentedDays: number;
  closedRentals: number;
  openRentals: number;
  incidentRemaining: number;
};

export type Customer360 = {
  customer: Customer & { createdAt?: string };
  lifetimeRevenue: number;
  openRentalBalance: number;
  openReservationBalance: number;
  rentalCount: number;
  openIncidents: number;
  riskLevel: string;
  timeline: {
    id: string;
    type: string;
    status: string;
    at: string;
    label: string;
    amount?: number | null;
    secondaryAmount?: number | null;
    vehicleId?: string | null;
  }[];
};

export type TreasuryDay = {
  businessDate: string;
  cashExpected: number;
  cardExpected: number;
  transferExpected: number;
  otherExpected: number;
  totalIn: number;
  expensesTotal: number;
  movements: {
    id: string;
    kind: string;
    method: string;
    amount: number;
    reference?: string;
    paidAt: string;
    notes?: string;
  }[];
  close?: {
    id: string;
    businessDate: string;
    status: string;
    cashExpected: number;
    cardExpected: number;
    transferExpected: number;
    otherExpected: number;
    expensesTotal: number;
    cashCounted?: number | null;
    variance?: number | null;
    notes?: string | null;
    closedBy?: string | null;
    openedAt: string;
    closedAt?: string | null;
  } | null;
};

export type Reservation = {
  id: string;
  customerId: string;
  vehicleId: string;
  requestedCategory: string;
  startAt: string;
  endAt: string;
  dailyRate: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  publicCode?: string;
  pickupLocation?: string;
  returnLocation?: string;
  channel?: string;
  paymentMethod?: string;
  paymentBank?: string;
};

export type Rental = {
  id: string;
  reservationId?: string;
  customerId: string;
  vehicleId: string;
  startAt: string;
  endAt: string;
  actualReturnAt?: string;
  dailyRate: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  depositAmount: number;
  depositStatus: string;
  extraFees: number;
  status: string;
  contractRef?: string;
  startMileage?: number;
  endMileage?: number;
  startFuel?: string;
  endFuel?: string;
  notes?: string;
};

export type Payment = {
  id: string;
  reservationId?: string;
  rentalId?: string;
  customerId?: string;
  kind: string;
  method: string;
  amount: number;
  currency: string;
  reference?: string;
  bankName?: string;
  receiptNumber?: string;
  notes?: string;
  paidAt: string;
  attachmentCount?: number;
};

export type StoredDocument = {
  id: string;
  ownerType: string;
  ownerId: string;
  category: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  label?: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  vehicleId?: string;
  reservationId?: string;
  category: string;
  label: string;
  amount: number;
  currency: string;
  expenseDate: string;
  vendor?: string;
  notes?: string;
};

export type MaintenanceOrder = {
  id: string;
  vehicleId: string;
  kind: string;
  title: string;
  status: string;
  dueDate?: string;
  dueMileage?: number;
  cost: number;
  vendor?: string;
  notes?: string;
  completedAt?: string;
};

export type InsurancePolicy = {
  id: string;
  vehicleId: string;
  insurer: string;
  policyNumber: string;
  coverage?: string;
  deductible: number;
  annualPremium: number;
  startDate: string;
  endDate: string;
  notes?: string;
};

export type Incident = {
  id: string;
  vehicleId: string;
  customerId?: string;
  rentalId?: string;
  occurredAt: string;
  location?: string;
  description: string;
  responsibility?: string;
  repairCost: number;
  reimbursedAmount: number;
  remainingCharge: number;
  status: string;
  photos?: string;
};

export type Dashboard = {
  fleetSize: number;
  available: number;
  reserved: number;
  rented: number;
  unavailable: number;
  pickupsToday: number;
  returnsToday: number;
  collectedThisMonth: number;
  outstanding: number;
  utilizationRate: number;
  expensesThisMonth?: number;
  openRentals?: number;
  alerts: { category: string; message: string; severity: string }[];
};

export type ProjectAssumptions = {
  availableCapital: number;
  minReserve: number;
  vehicleCount: number;
  purchasePricePerVehicle: number;
  downPaymentPerVehicle: number;
  annualInterestRate: number;
  financeMonths: number;
  insurancePerVehicleMonthly: number;
  rentLocal: number;
  advertising: number;
  salaries: number;
  otherFixed: number;
  maintenancePerDay: number;
  otherVariablePerDay: number;
  averageDailyRate: number;
  occupancyRate: number;
  setupCosts: number;
};

export type ProjectResult = {
  vehicleCount: number;
  totalPurchase: number;
  totalDownPayment: number;
  financedAmount: number;
  monthlyInstallment: number;
  fixedMonthlyCosts: number;
  variableMonthlyCosts: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  monthlyProfit: number;
  breakEvenRentalDays: number;
  breakEvenOccupancyPct: number;
  treasuryAfterSetup: number;
  paybackMonths: number;
  roiAnnualPct: number;
  profitPerVehicle: number;
  rentedDaysPerMonth: number;
};

export type ScenarioResult = {
  label: string;
  occupancyPct: number;
  revenue: number;
  costs: number;
  profit: number;
  treasuryProjection: number;
  risk: string;
};

export type FleetCompositionResult = {
  name: string;
  vehicleCount: number;
  totalPurchase: number;
  totalDown: number;
  financed: number;
  monthlyInstallment: number;
  avgDailyRate: number;
  requiredOccupancyPct: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  monthlyProfit: number;
  remainingCash: number;
  risk: string;
};

export type IntelSettings = {
  agencyId: string;
  googlePlaceId?: string | null;
  googleBusinessName?: string | null;
  gmailAddress?: string | null;
  marketCity: string;
  marketNotes?: string | null;
  updatedAt?: string;
};

export type IntelStatus = {
  geminiEnabled: boolean;
  gmailSyncEnabled: boolean;
  googlePlaceConfigured: boolean;
  settings?: IntelSettings | null;
};

export type GoogleReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  text?: string;
  relativeTime?: string;
  sentiment?: string;
  source: string;
  publishedAt?: string;
};

export type GmailSignalItem = {
  id: string;
  fromAddress?: string;
  subject: string;
  snippet?: string;
  category: string;
  importance: string;
  receivedAt?: string;
};

export type MarketCompetitorItem = {
  id: string;
  name: string;
  city: string;
  focus?: string;
  avgDailyRate?: number;
  fleetSizeEstimate?: number;
  strengths?: string;
  weaknesses?: string;
  source: string;
};

export type IntelBrief = {
  city: string;
  marketBrief: string;
  reviewCount: number;
  reviewAvg: number;
  negativeReviews: number;
  hotGmailSignals: number;
  geminiEnabled: boolean;
};

export type AiAdvice = {
  conversationId: string;
  title: string;
  answer: string;
  engine: string;
};

export type AiConversationItem = {
  id: string;
  title: string;
  topic: string;
  updatedAt: string;
};

export type AiMessageItem = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};
