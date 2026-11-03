import {
  SessionPass,
  Booking,
  UserRole,
  TechnicianProfile,
  Technician,
  CustomerRecord,
  ActiveLoggedInUser,
  PricingConfig,
  RepairCategory,
  AdminMessage,
  SmsLogEntry,
  PayoutLedgerEntry,
  ADMIN_PASSWORD,
  OFFICE_PHONE_DISPLAY
} from '../types';
import { TECHNICIANS_DATA } from '../data/technicians';

const SESSION_STORAGE_KEY = 'homebased_session_pass_v1';
const BOOKINGS_STORAGE_KEY = 'homebased_bookings_v1';
const PRICING_STORAGE_KEY = 'homebased_pricing_v1';
const TECHNICIANS_STORAGE_KEY = 'homebased_technicians_v1';
const CUSTOMERS_STORAGE_KEY = 'homebased_customers_v1';
const LOGGED_IN_USERS_STORAGE_KEY = 'homebased_logged_in_users_v1';

export const DEFAULT_CUSTOMER_PASS_PRICE_KSH = 50;
export const DEFAULT_TECHNICIAN_LOGIN_FEE_KSH = 50;
export const DEFAULT_TECHNICIAN_REG_PRICE_KSH = 150;
export const DEFAULT_TECHNICIAN_MEMBERSHIP_FEE_KSH = 150;
export const DEFAULT_PLATFORM_COMMISSION_PERCENT = 15;
export const DEFAULT_TECHNICIAN_PAYOUT_PERCENT = 85;

export const PASS_PRICE_KSH = 50;
export const LOGIN_PASS_PRICE_KSH = 50;
export const PASS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours active account per user requirement
export const MEMBERSHIP_PRICE_KSH = 150; // Ksh. 150 renewable monthly membership
export const MEMBERSHIP_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ==========================================
// KENYAN PHONE NUMBER NORMALIZATION & COMPARISON
// Matches local (07...), international (+2547...), and raw 9-digit formats
// ==========================================
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits;
}

export function phonesMatch(p1: string | undefined, p2: string | undefined): boolean {
  if (!p1 || !p2) return false;
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (!n1 || !n2 || n1.length < 7 || n2.length < 7) return false;
  return n1 === n2 || n1.endsWith(n2) || n2.endsWith(n1);
}

// ==========================================
// PRICING MANAGEMENT
// ==========================================
export function getStoredPricing(): PricingConfig {
  const fallback: PricingConfig = {
    customerPassPriceKsh: DEFAULT_CUSTOMER_PASS_PRICE_KSH,
    technicianPassPriceKsh: DEFAULT_CUSTOMER_PASS_PRICE_KSH,
    technicianRegistrationPriceKsh: DEFAULT_TECHNICIAN_REG_PRICE_KSH,
    technicianRegPriceKsh: DEFAULT_TECHNICIAN_REG_PRICE_KSH,
    platformCommissionPercent: DEFAULT_PLATFORM_COMMISSION_PERCENT,
    platformSplitPercent: DEFAULT_PLATFORM_COMMISSION_PERCENT,
    technicianPayoutPercent: DEFAULT_TECHNICIAN_PAYOUT_PERCENT,
    technicianSplitPercent: DEFAULT_TECHNICIAN_PAYOUT_PERCENT,
    itemPrices: {}
  };
  try {
    const raw = localStorage.getItem(PRICING_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function normalizePricingConfig(config: Partial<PricingConfig>): PricingConfig {
  const fallback = getStoredPricing();
  const techSplit = Number(config.technicianSplitPercent ?? config.technicianPayoutPercent ?? fallback.technicianSplitPercent ?? 85);
  const platSplit = Number(config.platformSplitPercent ?? config.platformCommissionPercent ?? (100 - techSplit));
  const techReg = Number(config.technicianRegPriceKsh ?? config.technicianRegistrationPriceKsh ?? fallback.technicianRegPriceKsh ?? 150);
  const custPass = Number(config.customerPassPriceKsh ?? fallback.customerPassPriceKsh ?? 50);
  const techPass = Number(config.technicianPassPriceKsh ?? fallback.technicianPassPriceKsh ?? 50);

  return {
    customerPassPriceKsh: custPass,
    technicianPassPriceKsh: techPass,
    technicianRegistrationPriceKsh: techReg,
    technicianRegPriceKsh: techReg,
    technicianSplitPercent: techSplit,
    technicianPayoutPercent: techSplit,
    platformSplitPercent: platSplit,
    platformCommissionPercent: platSplit,
    itemPrices: config.itemPrices || fallback.itemPrices || {}
  };
}

export async function fetchPricingFromServer(): Promise<PricingConfig | null> {
  try {
    const res = await fetch('/api/pricing');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.pricing) {
      const normalized = normalizePricingConfig(json.pricing);
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (err) {
    console.warn('fetchPricingFromServer network error:', err);
  }
  return null;
}

/**
 * Saves pricing directly to the central database and verifies confirmation from database.
 * Does NOT report success if the database write fails or is rejected.
 */
export async function savePricingToServer(config: PricingConfig): Promise<{
  success: boolean;
  pricing?: PricingConfig;
  error?: string;
}> {
  const normalized = normalizePricingConfig(config);

  try {
    const res = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { success: false, error: `Database write failed (HTTP ${res.status}): ${errText}` };
    }

    const json = await res.json();
    if (!json.success) {
      return { success: false, error: json.error || 'Database rejected pricing update' };
    }

    // Verify by retrieving again from the database to guarantee it persisted
    const verified = await fetchPricingFromServer();
    const finalPricing = verified || normalizePricingConfig(json.pricing || normalized);

    // Save confirmed state to localStorage
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(finalPricing));

    try {
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'pricing_updated', config: finalPricing } }));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    return { success: true, pricing: finalPricing };
  } catch (err: any) {
    console.error('savePricingToServer error:', err);
    return { success: false, error: err.message || 'Network error while contacting database' };
  }
}

export function savePricing(config: PricingConfig): void {
  const normalized = normalizePricingConfig(config);
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.error('Failed to save pricing config:', err);
  }

  // Push to persistent shared database in background with server verification
  savePricingToServer(normalized).catch(err => {
    console.warn('savePricing background sync error:', err);
  });
}

// ==========================================
// TECHNICIANS MANAGEMENT (ADD / REMOVE / BLOCK)
// ==========================================
export function isTechnicianMemberActive(t: Technician): boolean {
  if (t.isBlocked) return false;
  if (t.isVisibleToCustomers === false) return false;
  if (t.pass_status === 'expired') return false;
  const now = Date.now();
  if (t.pass_expiry_date && t.pass_expiry_date < now) return false;
  if (t.memberExpiresAt && t.memberExpiresAt < now) return false;
  return true;
}

export function getStoredTechnicians(): Technician[] {
  try {
    const raw = localStorage.getItem(TECHNICIANS_STORAGE_KEY);
    if (!raw) {
      // Initialize with default verified technicians with active membership and visible status
      const seeded: Technician[] = TECHNICIANS_DATA.map(t => ({
        ...t,
        isMonthlyMember: true,
        isVisibleToCustomers: true,
        pass_status: 'active' as const,
        pass_expiry_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
        memberExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      }));
      localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: Technician[] = JSON.parse(raw);
    return parsed.map(t => ({
      ...t,
      isMonthlyMember: t.isMonthlyMember ?? true,
      isVisibleToCustomers: t.isVisibleToCustomers !== false,
      pass_status: t.pass_status || 'active',
      pass_expiry_date: t.pass_expiry_date || (Date.now() + 30 * 24 * 60 * 60 * 1000),
      memberExpiresAt: t.memberExpiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)
    }));
  } catch {
    return TECHNICIANS_DATA.map(t => ({
      ...t,
      isMonthlyMember: true,
      isVisibleToCustomers: true,
      pass_status: 'active' as const,
      pass_expiry_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
      memberExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    }));
  }
}

export function saveTechnicians(technicians: Technician[]): void {
  try {
    localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(technicians));
  } catch (err) {
    console.error('Failed to save technicians list:', err);
  }
}

export async function fetchTechniciansFromServer(forAdmin: boolean = false): Promise<Technician[]> {
  try {
    const url = forAdmin ? '/api/admin/technicians' : '/api/technicians';
    const res = await fetch(url);
    if (!res.ok) return getStoredTechnicians();
    const data = await res.json();
    if (data.success && Array.isArray(data.technicians)) {
      saveTechnicians(data.technicians);
      return data.technicians;
    }
  } catch (err) {
    console.warn('fetchTechniciansFromServer network warn:', err);
  }
  return getStoredTechnicians();
}

/**
 * Saves a technician directly to the central database, awaits confirmation,
 * updates localStorage, and broadcasts the event across the window and connected SSE clients.
 */
export async function saveTechnicianToServer(technician: Technician): Promise<{
  success: boolean;
  technician?: Technician;
  error?: string;
}> {
  const thirtyDays = 30 * 24 * 3600 * 1000;
  const now = Date.now();
  const expiry = technician.pass_expiry_date || technician.memberExpiresAt || (now + thirtyDays);

  const normalized: Technician = {
    ...technician,
    name: (technician.name || '').trim(),
    phone: (technician.phone || '').trim(),
    isOnline: technician.isOnline ?? true,
    isVisibleToCustomers: true,
    isBlocked: false,
    isMonthlyMember: true,
    pass_status: expiry > now ? 'active' : 'expired',
    pass_start_date: technician.pass_start_date || now,
    pass_expiry_date: expiry,
    memberExpiresAt: expiry,
    membership_type: technician.membership_type || 'monthly'
  };

  try {
    const res = await fetch('/api/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized)
    });

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      return { success: false, error: `Database write failed (HTTP ${res.status}): ${errTxt}` };
    }

    const data = await res.json();
    if (!data.success || !data.technician) {
      return { success: false, error: data.error || 'Database rejected technician registration' };
    }

    const savedTech: Technician = data.technician;
    const current = getStoredTechnicians();
    const cleanDigits = (p?: string) => (p || '').replace(/\D/g, '').slice(-9);
    const techDigits = cleanDigits(savedTech.phone);
    const idx = current.findIndex(t => t.id === savedTech.id || (techDigits && cleanDigits(t.phone) === techDigits));
    const updated = idx >= 0
      ? current.map((t, i) => i === idx ? savedTech : t)
      : [savedTech, ...current];
    saveTechnicians(updated);

    try {
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'technicians_updated', technician: savedTech } }));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    return { success: true, technician: savedTech };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving technician' };
  }
}

export function addOrUpdateTechnician(technician: Technician): Technician[] {
  const thirtyDays = 30 * 24 * 3600 * 1000;
  const now = Date.now();
  const expiry = technician.pass_expiry_date || technician.memberExpiresAt || (now + thirtyDays);

  const normalized: Technician = {
    ...technician,
    name: (technician.name || '').trim(),
    phone: (technician.phone || '').trim(),
    isOnline: technician.isOnline ?? true,
    isVisibleToCustomers: true,
    isBlocked: false,
    isMonthlyMember: true,
    pass_status: expiry > now ? 'active' : 'expired',
    pass_start_date: technician.pass_start_date || now,
    pass_expiry_date: expiry,
    memberExpiresAt: expiry,
    membership_type: technician.membership_type || 'monthly'
  };

  const current = getStoredTechnicians();
  const cleanDigits = (p?: string) => (p || '').replace(/\D/g, '').slice(-9);
  const techDigits = cleanDigits(normalized.phone);
  const idx = current.findIndex(t => t.id === normalized.id || (techDigits && cleanDigits(t.phone) === techDigits));
  const updated = idx >= 0
    ? current.map((t, i) => i === idx ? { ...t, ...normalized } : t)
    : [normalized, ...current];
  saveTechnicians(updated);

  // Sync to backend asynchronously
  saveTechnicianToServer(normalized).catch(err => {
    console.warn('saveTechnicianToServer sync notice:', err);
  });

  try {
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'technicians_updated', technician: normalized } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}

  return updated;
}

export function deleteTechnician(technicianId: string): Technician[] {
  const current = getStoredTechnicians();
  const updated = current.filter(t => t.id !== technicianId);
  saveTechnicians(updated);

  try {
    fetch(`/api/technicians/${encodeURIComponent(technicianId)}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Technician delete warn:', err));
  } catch (e) {}

  return updated;
}

export function toggleBlockTechnician(technicianId: string): Technician[] {
  const current = getStoredTechnicians();
  const updated = current.map(t => {
    if (t.id === technicianId) {
      const nextBlocked = !t.isBlocked;
      const mod = { ...t, isBlocked: nextBlocked };
      try {
        fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mod)
        }).catch(() => {});
      } catch {}
      return mod;
    }
    return t;
  });
  saveTechnicians(updated);
  return updated;
}

export function toggleTechnicianVisibility(technicianId: string): Technician[] {
  const current = getStoredTechnicians();
  const updated = current.map(t => {
    if (t.id === technicianId) {
      const nextVisible = t.isVisibleToCustomers === false;
      const mod = { ...t, isVisibleToCustomers: nextVisible };
      try {
        fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mod)
        }).catch(() => {});
      } catch {}
      return mod;
    }
    return t;
  });
  saveTechnicians(updated);
  return updated;
}

export function activateTechnicianMembershipPass(technicianId: string, durationDays: number = 30): Technician[] {
  const current = getStoredTechnicians();
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  const updated = current.map(t => {
    if (t.id === technicianId) {
      const mod = {
        ...t,
        isMonthlyMember: true,
        memberExpiresAt: expiresAt,
        isVisibleToCustomers: true,
        isBlocked: false,
        isOnline: true
      };
      try {
        fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mod)
        }).catch(() => {});
      } catch {}
      return mod;
    }
    return t;
  });
  saveTechnicians(updated);
  return updated;
}

export function addTechnicianPortfolioPhoto(technicianId: string, photoDataUrl: string): Technician[] {
  const current = getStoredTechnicians();
  const updated = current.map(t => {
    if (t.id === technicianId) {
      const existing = t.portfolioPhotos || [];
      return { ...t, portfolioPhotos: [photoDataUrl, ...existing] };
    }
    return t;
  });
  saveTechnicians(updated);
  return updated;
}

export function removeTechnicianPortfolioPhoto(technicianId: string, photoIndex: number): Technician[] {
  const current = getStoredTechnicians();
  const updated = current.map(t => {
    if (t.id === technicianId) {
      const existing = [...(t.portfolioPhotos || [])];
      existing.splice(photoIndex, 1);
      return { ...t, portfolioPhotos: existing };
    }
    return t;
  });
  saveTechnicians(updated);
  return updated;
}

export function isTechnicianBlocked(phoneOrId: string): boolean {
  const current = getStoredTechnicians();
  const found = current.find(t => t.id === phoneOrId || t.phone === phoneOrId);
  return !!found?.isBlocked;
}

// ==========================================
// CUSTOMERS MANAGEMENT (ADD / REMOVE / BLOCK)
// ==========================================
const DEFAULT_INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'CUST-001',
    name: 'Samuel Kimani',
    phone: '+254 712 345 678',
    estate: 'Nairobi - Kilimani & Kileleshwa',
    addressDetails: 'Chania Court Apt 4B',
    registeredAt: Date.now() - 3 * 24 * 3600 * 1000,
    totalBookings: 2,
    isBlocked: false
  },
  {
    id: 'CUST-002',
    name: 'Brenda Wanjiku',
    phone: '+254 721 984 210',
    estate: 'Nairobi - Westlands & Parklands',
    addressDetails: 'Raphta Road, Villa 12',
    registeredAt: Date.now() - 7 * 24 * 3600 * 1000,
    totalBookings: 1,
    isBlocked: false
  },
  {
    id: 'CUST-003',
    name: 'Dr. Joseph Mutiso',
    phone: '+254 733 112 459',
    estate: 'Mombasa - Nyali & Links Road',
    addressDetails: 'Links Road Court 2',
    registeredAt: Date.now() - 14 * 24 * 3600 * 1000,
    totalBookings: 3,
    isBlocked: false
  }
];

export function getStoredCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_CUSTOMERS));
      return DEFAULT_INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: CustomerRecord[]): void {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.error('Failed to save customers:', err);
  }
}

export async function fetchCustomersFromServer(): Promise<CustomerRecord[]> {
  try {
    const res = await fetch('/api/customers');
    if (!res.ok) return getStoredCustomers();
    const data = await res.json();
    if (data.success && Array.isArray(data.customers)) {
      saveCustomers(data.customers);
      return data.customers;
    }
  } catch (err) {
    console.warn('fetchCustomersFromServer network warn:', err);
  }
  return getStoredCustomers();
}

export async function saveCustomerToServer(customer: CustomerRecord): Promise<{
  success: boolean;
  customers?: CustomerRecord[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });

    if (!res.ok) {
      return { success: false, error: `Server error saving customer: HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!data.success) {
      return { success: false, error: data.error || 'Database rejected customer save' };
    }

    // Update local cache
    const current = getStoredCustomers();
    const updated = current.some(c => c.id === customer.id || c.phone === customer.phone)
      ? current.map(c => (c.id === customer.id || c.phone === customer.phone ? (data.customer || customer) : c))
      : [data.customer || customer, ...current];
    saveCustomers(updated);

    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'customer_updated', customer } }));
    return { success: true, customers: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving customer' };
  }
}

export async function deleteCustomerFromServer(customerId: string): Promise<{
  success: boolean;
  customers?: CustomerRecord[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      return { success: false, error: `Failed to delete customer: HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!data.success) {
      return { success: false, error: data.error || 'Server rejected customer deletion' };
    }

    const current = getStoredCustomers();
    const updated = current.filter(c => c.id !== customerId);
    saveCustomers(updated);

    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'customer_deleted', customerId } }));
    return { success: true, customers: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error deleting customer' };
  }
}

export function addOrUpdateCustomer(customer: CustomerRecord): CustomerRecord[] {
  const current = getStoredCustomers();
  const exists = current.some(c => c.id === customer.id || c.phone === customer.phone);
  const updated = exists
    ? current.map(c => (c.id === customer.id || c.phone === customer.phone ? customer : c))
    : [customer, ...current];
  saveCustomers(updated);

  // Sync to database
  saveCustomerToServer(customer).catch(err => console.warn('Customer auto-sync error:', err));
  return updated;
}

export function deleteCustomer(customerId: string): CustomerRecord[] {
  const current = getStoredCustomers();
  const updated = current.filter(c => c.id !== customerId);
  saveCustomers(updated);

  deleteCustomerFromServer(customerId).catch(err => console.warn('Customer delete auto-sync error:', err));
  return updated;
}

export function toggleBlockCustomer(customerId: string): CustomerRecord[] {
  const current = getStoredCustomers();
  let targetCust: CustomerRecord | null = null;
  const updated = current.map(c => {
    if (c.id === customerId) {
      targetCust = { ...c, isBlocked: !c.isBlocked };
      return targetCust;
    }
    return c;
  });
  saveCustomers(updated);

  if (targetCust) {
    saveCustomerToServer(targetCust).catch(() => {});
  }
  return updated;
}

export function toggleCustomerVisibility(customerId: string): CustomerRecord[] {
  const current = getStoredCustomers();
  let targetCust: CustomerRecord | null = null;
  const updated = current.map(c => {
    if (c.id === customerId) {
      const nextVisible = c.isVisible === false;
      targetCust = { ...c, isVisible: nextVisible };
      return targetCust;
    }
    return c;
  });
  saveCustomers(updated);

  if (targetCust) {
    saveCustomerToServer(targetCust).catch(() => {});
  }
  return updated;
}

export function activateCustomerPass(customerId: string, durationDays: number = 30): CustomerRecord[] {
  const current = getStoredCustomers();
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  let targetCust: CustomerRecord | null = null;
  const updated = current.map(c => {
    if (c.id === customerId) {
      targetCust = {
        ...c,
        isActivePass: true,
        activeUntil: expiresAt,
        isVisible: true,
        isBlocked: false,
        lastLoginAt: Date.now()
      };
      return targetCust;
    }
    return c;
  });
  saveCustomers(updated);

  if (targetCust) {
    saveCustomerToServer(targetCust).catch(() => {});
  }
  return updated;
}

// ==========================================
// ACTIVE LOGGED-IN SESSIONS TRACKER
// (All logged in customers and technicians visible to Admin)
// ==========================================
const DEFAULT_LOGGED_IN_USERS: ActiveLoggedInUser[] = [
  {
    id: 'LOG-CUST-101',
    role: 'customer',
    name: 'Samuel Kimani',
    phone: '+254 712 345 678',
    loggedInAt: Date.now() - 2 * 3600 * 1000,
    activeUntil: Date.now() + 22 * 3600 * 1000,
    transactionId: 'PESAPAL-KIMANI78',
    paymentChannel: 'mpesa',
    amountPaidKsh: 50,
    location: 'Nairobi - Kilimani',
    isActive: true,
    isVisible: true
  },
  {
    id: 'LOG-TECH-201',
    role: 'technician',
    name: 'Eng. David Mwangi',
    phone: '+254 722 841 930',
    loggedInAt: Date.now() - 4 * 3600 * 1000,
    activeUntil: Date.now() + 20 * 3600 * 1000,
    transactionId: 'PESAPAL-MWANGI93',
    paymentChannel: 'mpesa',
    amountPaidKsh: 50,
    location: 'Nairobi - Westlands',
    isActive: true,
    isVisible: true
  },
  {
    id: 'LOG-TECH-202',
    role: 'technician',
    name: 'Peter Ochieng',
    phone: '+254 713 592 108',
    loggedInAt: Date.now() - 1 * 3600 * 1000,
    activeUntil: Date.now() + 23 * 3600 * 1000,
    transactionId: 'PESAPAL-OCHIENG08',
    paymentChannel: 'mpesa',
    amountPaidKsh: 50,
    location: 'Nairobi - Kilimani',
    isActive: true,
    isVisible: true
  }
];

export function getStoredLoggedInUsers(): ActiveLoggedInUser[] {
  try {
    const raw = localStorage.getItem(LOGGED_IN_USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOGGED_IN_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_LOGGED_IN_USERS));
      return DEFAULT_LOGGED_IN_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOGGED_IN_USERS;
  }
}

export function saveLoggedInUsers(users: ActiveLoggedInUser[]): void {
  try {
    localStorage.setItem(LOGGED_IN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save logged-in users:', err);
  }
}

export function recordLoggedInUser(session: SessionPass): ActiveLoggedInUser[] {
  const current = getStoredLoggedInUsers();
  const cleanPhone = session.phone.replace(/[^0-9]/g, '');
  const existingIndex = current.findIndex(
    u => u.phone.replace(/[^0-9]/g, '') === cleanPhone && u.role === session.role
  );

  const record: ActiveLoggedInUser = {
    id: 'LOG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    role: session.role,
    name: session.name,
    phone: session.phone,
    loggedInAt: session.paidAt || Date.now(),
    activeUntil: session.activeUntil || Date.now() + PASS_DURATION_MS,
    transactionId: session.transactionId,
    paymentChannel: session.paymentChannel || 'mpesa',
    amountPaidKsh: session.amountPaidKsh || 50,
    location: session.technicianProfile?.location || 'Kenya (Countrywide)',
    isActive: true,
    isVisible: true
  };

  let updated: ActiveLoggedInUser[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = { ...record, id: current[existingIndex].id };
  } else {
    updated = [record, ...current];
  }
  saveLoggedInUsers(updated);

  // Broadcast presence to shared backend server so user presence is globally visible across all devices
  try {
    fetch('/api/logged-in-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    }).catch(err => console.warn('Logged in user backend broadcast warn:', err));
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'logged_in_users_updated' } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}

  return updated;
}

export function toggleLoggedInUserVisibility(id: string): ActiveLoggedInUser[] {
  const current = getStoredLoggedInUsers();
  const updated = current.map(u => (u.id === id ? { ...u, isVisible: !u.isVisible } : u));
  saveLoggedInUsers(updated);
  return updated;
}

export function activateLoggedInUserPass(id: string, durationDays: number = 30): ActiveLoggedInUser[] {
  const current = getStoredLoggedInUsers();
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  const updated = current.map(u => (u.id === id ? { ...u, activeUntil: expiresAt, isActive: true, isVisible: true } : u));
  saveLoggedInUsers(updated);
  return updated;
}

// ==========================================
// SESSION PASS MANAGEMENT
// ==========================================
export function getStoredSession(): SessionPass | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: SessionPass = JSON.parse(raw);
    const now = Date.now();
    if (session.activeUntil > now) {
      return { ...session, active: true };
    } else {
      return { ...session, active: false };
    }
  } catch {
    return null;
  }
}

export interface ActivePassLookupResult {
  hasActivePass: boolean;
  role: UserRole;
  name: string;
  phone: string;
  nationalIdOrPassport?: string;
  activeUntil: number;
  remainingHours: number;
  source: string;
  isMonthlyMember?: boolean;
  is_direct_pass?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  technician?: Technician;
}

export async function validatePassWithServer(phoneOrId: string, role?: string): Promise<ActivePassLookupResult | null> {
  if (!phoneOrId || !phoneOrId.trim()) return null;
  try {
    const res = await fetch(`/api/auth/validate-pass?id_number=${encodeURIComponent(phoneOrId.trim())}&phone=${encodeURIComponent(phoneOrId.trim())}${role ? `&role=${encodeURIComponent(role)}` : ''}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.hasActivePass) {
      return {
        hasActivePass: true,
        role: (data.role as UserRole) || 'technician',
        name: data.name || '',
        phone: data.phone || phoneOrId,
        nationalIdOrPassport: data.nationalIdOrPassport,
        activeUntil: data.pass_expiry_date || (Date.now() + 365 * 24 * 3600 * 1000),
        remainingHours: data.remainingHours || 8760,
        source: data.source || (data.is_direct_pass ? 'Technician Direct Pass (ID Verified)' : 'Server Verified Pass'),
        isMonthlyMember: Boolean(data.role === 'technician' || data.technician?.isMonthlyMember),
        is_direct_pass: Boolean(data.is_direct_pass),
        approval_status: data.approval_status || (data.is_direct_pass ? 'pending' : 'approved'),
        technician: data.technician
      };
    }
  } catch (e) {
    // offline or network error
  }
  return null;
}

export function findTechnicianByNationalId(idNumber: string): Technician | null {
  if (!idNumber || !idNumber.trim()) return null;
  const clean = idNumber.trim().toLowerCase();
  const techs = getStoredTechnicians();
  return techs.find(t => t.nationalIdOrPassport && t.nationalIdOrPassport.trim().toLowerCase() === clean) || null;
}

export async function approveTechnicianOnServer(techId: string): Promise<{ success: boolean; technician?: Technician; error?: string }> {
  try {
    const res = await fetch(`/api/technicians/${encodeURIComponent(techId)}/approve`, {
      method: 'POST'
    });
    if (!res.ok) {
      return { success: false, error: `Failed to approve technician (HTTP ${res.status})` };
    }
    const data = await res.json();
    if (data.success && data.technician) {
      const current = getStoredTechnicians();
      const updated = current.map(t => t.id === techId ? data.technician : t);
      saveTechnicians(updated);
      try {
        window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'technician_approved', technician: data.technician } }));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return { success: true, technician: data.technician };
    }
    return { success: false, error: data.error || 'Server rejected approval' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error approving technician' };
  }
}

export function createTechnicianDirectPassSession(tech: Technician): SessionPass {
  const now = Date.now();
  const activeUntil = now + (365 * 24 * 3600 * 1000); // 1-year free entry
  const session: SessionPass = {
    role: 'technician',
    activeUntil,
    paidAt: now,
    transactionId: 'DIRECT-PASS-' + ((tech.nationalIdOrPassport || tech.id || '').replace(/\W/g, '').toUpperCase()),
    phone: tech.phone,
    name: tech.name,
    active: true,
    isMonthlyMember: true,
    technicianProfile: {
      name: tech.name,
      phone: tech.phone,
      email: 'technician@homebased.co.ke',
      nationalIdOrPassport: tech.nationalIdOrPassport,
      location: tech.estate || tech.location || 'Countrywide',
      yearsOfExperience: tech.experienceYears || 5,
      repairableItemIds: tech.repairableItemIds || [],
      portfolioPhotos: tech.portfolioPhotos || [],
      isMonthlyMember: true,
      memberExpiresAt: activeUntil,
      registeredAt: tech.registeredAt || now
    }
  };
  saveSession(session);
  recordLoggedInUser(session);
  return session;
}

/**
 * Check if a phone number holds an unexpired, active login pass or membership.
 * USER REQUIREMENT: Once payment happens, remove all restrictions for entry until time expires.
 * A user must NOT be required to pay every time they log in if their time is still active.
 */
export function findActivePassByPhone(phone: string, preferredRole?: UserRole): ActivePassLookupResult | null {
  if (!phone || !phone.trim()) return null;
  const digits = normalizePhone(phone);
  if (digits.length < 6) return null;

  const now = Date.now();

  // 1. Current stored session
  const current = getStoredSession();
  if (current && current.activeUntil > now) {
    if (phonesMatch(current.phone, phone)) {
      return {
        hasActivePass: true,
        role: current.role,
        name: current.name,
        phone: current.phone,
        activeUntil: current.activeUntil,
        remainingHours: Math.max(1, Math.round((current.activeUntil - now) / 3600000)),
        source: 'Active Session Pass'
      };
    }
  }

  // 2. Active Logged-in Users list
  const loggedUsers = getStoredLoggedInUsers();
  const matchedLogged = loggedUsers.find(u => {
    return phonesMatch(u.phone, phone) && u.activeUntil > now && u.isActive !== false;
  });
  if (matchedLogged) {
    return {
      hasActivePass: true,
      role: matchedLogged.role,
      name: matchedLogged.name,
      phone: matchedLogged.phone,
      activeUntil: matchedLogged.activeUntil,
      remainingHours: Math.max(1, Math.round((matchedLogged.activeUntil - now) / 3600000)),
      source: 'Logged-In Pass Record'
    };
  }

  // 3. Customers directory
  const customers = getStoredCustomers();
  const matchedCustomer = customers.find(c => {
    return phonesMatch(c.phone, phone) && !c.isBlocked && c.activeUntil && c.activeUntil > now;
  });
  if (matchedCustomer) {
    return {
      hasActivePass: true,
      role: 'customer',
      name: matchedCustomer.name,
      phone: matchedCustomer.phone,
      activeUntil: matchedCustomer.activeUntil!,
      remainingHours: Math.max(1, Math.round((matchedCustomer.activeUntil! - now) / 3600000)),
      source: 'Verified Customer Pass'
    };
  }

  // 4. Technicians directory
  const techs = getStoredTechnicians();
  const matchedTech = techs.find(t => {
    const isMemberActive = (t.pass_status === 'active' || t.pass_status === 'free_pass' || t.isMonthlyMember || (t.memberExpiresAt && t.memberExpiresAt > now));
    const notExpired = !t.pass_expiry_date || t.pass_expiry_date > now;
    return phonesMatch(t.phone, phone) && !t.isBlocked && isMemberActive && notExpired;
  });
  if (matchedTech) {
    const activeUntil = matchedTech.pass_expiry_date || (matchedTech.memberExpiresAt && matchedTech.memberExpiresAt > now
      ? matchedTech.memberExpiresAt
      : now + MEMBERSHIP_DURATION_MS);
    return {
      hasActivePass: true,
      role: 'technician',
      name: matchedTech.name,
      phone: matchedTech.phone,
      activeUntil,
      remainingHours: Math.max(1, Math.round((activeUntil - now) / 3600000)),
      source: 'Verified Technician Membership (30-Day)',
      isMonthlyMember: true,
      technician: matchedTech
    };
  }

  return null;
}

export function saveSession(session: SessionPass): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

export function createActiveSession(role: UserRole, phone: string, name: string): SessionPass {
  const now = Date.now();
  const activeUntil = now + PASS_DURATION_MS;
  const transactionId = 'PESAPAL-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Math.floor(100 + Math.random() * 900);

  const session: SessionPass = {
    role,
    activeUntil,
    paidAt: now,
    transactionId,
    phone,
    name: name.trim() || (role === 'customer' ? 'Customer' : 'Technician'),
    active: true,
    paymentGateway: 'pesapal',
    amountPaidKsh: PASS_PRICE_KSH
  };

  saveSession(session);
  recordLoggedInUser(session);

  // Sync with customers directory if customer
  if (role === 'customer') {
    const currentCustomers = getStoredCustomers();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const exists = currentCustomers.some(c => c.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (!exists) {
      const newRecord: CustomerRecord = {
        id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
        name: session.name,
        phone: session.phone,
        estate: 'Nairobi / Countrywide',
        registeredAt: now,
        totalBookings: 1,
        lastLoginAt: now,
        activeUntil: session.activeUntil,
        isActivePass: true,
        isVisible: true,
        isBlocked: false
      };
      saveCustomers([newRecord, ...currentCustomers]);
    } else {
      const updatedCusts = currentCustomers.map(c =>
        c.phone.replace(/[^0-9]/g, '') === cleanPhone
          ? { ...c, lastLoginAt: now, activeUntil: session.activeUntil, isActivePass: true, isVisible: true }
          : c
      );
      saveCustomers(updatedCusts);
    }
  }

  // Sync with technicians directory if technician
  if (role === 'technician') {
    const currentTechs = getStoredTechnicians();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const found = currentTechs.find(t => t.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (!found) {
      const newTech: Technician = {
        id: 'tech-' + Date.now(),
        name: session.name,
        photoUrl: '/assets/images/tech_electrical_wiring_1791787974895.jpg',
        roleTitle: 'Highly Qualified & Vetted Specialist',
        specialties: ['electrical', 'refrigeration', 'appliances', 'pumps'],
        licenseType: 'Highly Qualified Certified Specialist',
        licenseNumber: 'TECH/' + Math.floor(1000 + Math.random() * 9000),
        experienceYears: 6,
        rating: 4.95,
        reviewsCount: 18,
        location: 'Countrywide',
        estate: 'Nairobi - Westlands & Countrywide',
        distanceKm: 3.2,
        etaMinutes: 20,
        isOnline: true,
        inspectionFeeKsh: 1600,
        hourlyRateKsh: 1200,
        phone: session.phone,
        tools: ['Digital Multimeter', 'Manifold Brass Gauges', 'Test Equipment'],
        badges: ['Highly Qualified Specialist', 'Verified Account'],
        recentJobs: ['Electrical fault tracing', 'Appliance diagnostic'],
        bio: 'Highly qualified specialist vetted for domestic and commercial electronics, electrical and refrigeration systems.',
        isBlocked: false,
        isMonthlyMember: true,
        isVisibleToCustomers: true,
        memberExpiresAt: now + MEMBERSHIP_DURATION_MS,
        registeredAt: now
      };
      saveTechnicians([newTech, ...currentTechs]);
    } else {
      const updatedTechs = currentTechs.map(t =>
        t.id === found.id
          ? {
              ...t,
              isOnline: true,
              isVisibleToCustomers: true,
              isMonthlyMember: true,
              specialties: ['electrical', 'refrigeration', 'appliances', 'pumps'] as RepairCategory[],
              memberExpiresAt: Math.max(t.memberExpiresAt || 0, now + MEMBERSHIP_DURATION_MS)
            }
          : t
      );
      saveTechnicians(updatedTechs);
    }
    try {
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }

  return session;
}

export function verifyAdminPassword(inputPassword: string): boolean {
  return inputPassword === ADMIN_PASSWORD;
}

export function createAdminSession(adminName: string = 'Super Administrator'): SessionPass {
  const now = Date.now();
  const activeUntil = now + (24 * 60 * 60 * 1000); // 24 hours administrative access
  const session: SessionPass = {
    role: 'admin',
    activeUntil,
    paidAt: now,
    transactionId: 'ADM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    phone: OFFICE_PHONE_DISPLAY,
    name: adminName.trim() || 'Super Administrator',
    active: true
  };
  saveSession(session);
  return session;
}

export function saveTechnicianProfileToSession(profile: TechnicianProfile): SessionPass | null {
  const current = getStoredSession();
  if (!current) return null;
  const updated: SessionPass = {
    ...current,
    technicianProfile: profile,
    isMonthlyMember: profile.isMonthlyMember
  };
  saveSession(updated);
  return updated;
}

export function activateTechnicianMembership(): SessionPass | null {
  const current = getStoredSession();
  if (!current) return null;
  const now = Date.now();
  const expires = now + MEMBERSHIP_DURATION_MS;
  const updatedProfile: TechnicianProfile = current.technicianProfile
    ? {
        ...current.technicianProfile,
        isMonthlyMember: true,
        memberExpiresAt: expires
      }
    : {
        name: current.name,
        phone: current.phone,
        email: 'technician@homebased.co.ke',
        location: 'Nairobi',
        yearsOfExperience: 5,
        repairableItemIds: ['fridge-domestic', 'distribution-board'],
        isMonthlyMember: true,
        memberExpiresAt: expires,
        registeredAt: now
      };

  const updated: SessionPass = {
    ...current,
    active: true,
    isMonthlyMember: true,
    activeUntil: Math.max(current.activeUntil || 0, expires),
    technicianProfile: updatedProfile
  };
  saveSession(updated);
  return updated;
}

// ==========================================
// BOOKINGS MANAGEMENT & 85/15 AUTOMATIC SPLIT
// ==========================================
export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveBooking(booking: Booking): void {
  try {
    const existing = getStoredBookings();
    const filtered = existing.filter(b => b.id !== booking.id);
    const updated = [booking, ...filtered];
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save booking:', err);
  }

  // Push to persistent shared database so other devices immediately receive this booking
  try {
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    }).catch(err => console.warn('Booking backend sync warn:', err));
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'booking_created', booking } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export function updateBookingStatus(bookingId: string, status: Booking['status']): Booking[] {
  let updated: Booking[] = [];
  try {
    const existing = getStoredBookings();
    updated = existing.map(b => (b.id === bookingId ? { ...b, status } : b));
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    updated = [];
  }

  // Send PUT to backend
  try {
    fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(err => console.warn('Update booking status warn:', err));
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'booking_updated', bookingId, status } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}

  return updated;
}

/**
 * Marks booking as paid.
 * Crucial Business Rule:
 * "Once customer pays via Pesapal (M-Pesa/Card), 85% is allocated to technician payout directly and 15% retained for platform commission. Produce receipt for customer with guarantee stamp of 30 days."
 */
export function markBookingPaid(
  bookingId: string,
  amountKsh: number,
  gateway: 'pesapal' = 'pesapal',
  ref?: string,
  payerEmail?: string
): { updatedBookings: Booking[]; receiptCode: string; technicianPayoutKsh: number; platformCommissionKsh: number } {
  const pricing = getStoredPricing();
  const techRatio = (pricing.technicianPayoutPercent || 85) / 100;
  const platRatio = (pricing.platformCommissionPercent || 15) / 100;

  const technicianPayoutKsh = Math.round(amountKsh * techRatio);
  const platformCommissionKsh = Math.round(amountKsh * platRatio);

  const receiptCode = ref || ('PESAPAL-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const existing = getStoredBookings();
  const now = Date.now();
  const guaranteeExpiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 Days Workmanship Guarantee

  const updated = existing.map(b => {
    if (b.id === bookingId) {
      return {
        ...b,
        status: 'completed' as const,
        paymentStatus: 'paid' as const,
        paidAmountKsh: amountKsh,
        paidAt: now,
        technicianPayoutKsh,
        platformCommissionKsh,
        disbursementStatus: 'disbursed_to_technician' as const,
        guaranteeDays: 30,
        guaranteeExpiresAt,
        receiptNumber: receiptCode,
        paymentGateway: 'pesapal' as const,
        pesapalConfirmationCode: ref,
        payerEmail,
      };
    }
    return b;
  });

  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save booking payment:', err);
  }

  try {
    const changed = updated.find(b => b.id === bookingId);
    if (changed) {
      fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed)
      }).catch(() => {});
    }
  } catch (e) {}

  try {
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'booking_paid', bookingId } }));
    window.dispatchEvent(new Event('storage'));
  } catch {}

  return { updatedBookings: updated, receiptCode, technicianPayoutKsh, platformCommissionKsh };
}

export function formatTimeRemaining(activeUntil: number): string {
  const diff = activeUntil - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

// ==========================================
// REAL-TIME SHARED DATABASE & CROSS-DEVICE SYNC
// (Server-Sent Events / SSE with 2.5-second polling fallback)
// ==========================================
export async function fetchServerSync(): Promise<{
  bookings: Booking[];
  technicians: Technician[];
  allTechnicians?: Technician[];
  customers: CustomerRecord[];
  loggedInUsers: ActiveLoggedInUser[];
  pricing?: PricingConfig;
} | null> {
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      if (Array.isArray(data.bookings)) {
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(data.bookings));
      }
      const techsToSave = Array.isArray(data.allTechnicians)
        ? data.allTechnicians
        : (Array.isArray(data.technicians) ? data.technicians : null);
      if (techsToSave) {
        localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(techsToSave));
      }
      if (Array.isArray(data.customers)) {
        localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(data.customers));
      }
      if (Array.isArray(data.loggedInUsers)) {
        localStorage.setItem(LOGGED_IN_USERS_STORAGE_KEY, JSON.stringify(data.loggedInUsers));
      }
      if (data.pricing) {
        const normalized = normalizePricingConfig(data.pricing);
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(normalized));
      }
      if (data.mediaConfig) {
        if (data.mediaConfig.showcase) {
          localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(data.mediaConfig.showcase));
        }
        if (data.mediaConfig.featuredVideo) {
          localStorage.setItem(FEATURED_VIDEO_STORAGE_KEY, JSON.stringify(data.mediaConfig.featuredVideo));
        }
      }
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'server_synced', timestamp: data.timestamp } }));
      return data;
    }
  } catch (err) {
    // network or offline
  }
  return null;
}

// Shared multiplexer to ensure a single lightweight SSE stream across all components
class SharedSyncHub {
  private subscribers = new Set<() => void>();
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private isStarted = false;
  private sseRetryTimeout: any = null;

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    this.start();

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  private notify() {
    this.subscribers.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Sync subscriber callback error:', err);
      }
    });
  }

  private connectSSE() {
    if (!this.isStarted || typeof window === 'undefined' || !('EventSource' in window)) return;
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'sync' && payload.data) {
            if (payload.data.bookings) localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(payload.data.bookings));
            if (payload.data.technicians) localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(payload.data.technicians));
            if (payload.data.pricing) localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(normalizePricingConfig(payload.data.pricing)));
          }
        } catch {}
        this.notify();
      };

      const handleSyncEvent = () => {
        fetchServerSync().then(() => this.notify());
      };

      const sseEventNames = [
        'booking:created', 'booking:updated', 'job:claimed', 'job:dispatched',
        'job:completed', 'technician:updated', 'technician:deleted',
        'message:new', 'sms:logged', 'payout:completed', 'customer:updated',
        'user:login', 'pricing:updated', 'pricing_updated', 'showcase:updated',
        'sync', 'booking_created', 'booking_updated', 'technician_registered', 'technicians_updated'
      ];

      sseEventNames.forEach(evt => {
        this.eventSource?.addEventListener(evt, handleSyncEvent);
      });

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          try { this.eventSource.close(); } catch {}
          this.eventSource = null;
        }
        // Retry gently after 10s without thrashing
        if (this.isStarted && !this.sseRetryTimeout) {
          this.sseRetryTimeout = setTimeout(() => {
            this.sseRetryTimeout = null;
            this.connectSSE();
          }, 10000);
        }
      };
    } catch (err) {
      console.warn('SSE stream init notice:', err);
    }
  }

  private start() {
    if (this.isStarted) return;
    this.isStarted = true;

    // 1. Initial immediate background sync
    fetchServerSync().then(() => this.notify());

    // 2. Defer SSE connection slightly so initial DOM mount and paint complete immediately
    setTimeout(() => {
      if (this.isStarted) {
        this.connectSSE();
      }
    }, 200);

    // 3. Fallback polling every 5 seconds
    this.pollInterval = setInterval(() => {
      if (!this.isStarted) return;
      fetchServerSync().then(result => {
        if (result && this.isStarted) this.notify();
      });
    }, 5000);

    // 4. Tab and window events
    const handleLocal = () => this.notify();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && this.isStarted) {
        fetchServerSync().then(() => this.notify());
      }
    };

    window.addEventListener('storage', handleLocal);
    window.addEventListener('app_data_sync', handleLocal);
    window.addEventListener('focus', handleLocal);
    window.addEventListener('online', handleLocal);
    document.addEventListener('visibilitychange', handleVisibility);
  }

  private stop() {
    this.isStarted = false;
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
      this.eventSource = null;
    }
    if (this.sseRetryTimeout) {
      clearTimeout(this.sseRetryTimeout);
      this.sseRetryTimeout = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

const syncHub = new SharedSyncHub();

export function subscribeToSharedSync(onUpdate: () => void): () => void {
  return syncHub.subscribe(onUpdate);
}

export async function fetchCloudStatus(): Promise<{
  provider: string;
  isCloudConnected: boolean;
  providerName: string;
  details: string;
  lastSyncedAt?: number;
} | null> {
  try {
    const res = await fetch('/api/cloud/status');
    if (!res.ok) return null;
    const json = await res.json();
    return json.status || null;
  } catch {
    return null;
  }
}

// ==========================================
// OPEN JOB MARKETPLACE & DISPATCH HELPERS
// ==========================================
export async function dispatchJobToServer(
  bookingId: string,
  technicianId: string,
  technicianName: string,
  technicianPhone: string
): Promise<Booking | null> {
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(bookingId)}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, technicianName, technicianPhone })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.booking) {
      const existing = getStoredBookings();
      const updated = existing.map(b => (b.id === bookingId ? data.booking : b));
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'job:dispatched', bookingId, booking: data.booking } }));
      return data.booking;
    }
  } catch (e) {
    console.warn('Error dispatching job:', e);
  }
  return null;
}
export async function fetchOpenJobs(): Promise<Booking[]> {
  try {
    const res = await fetch('/api/jobs/open');
    if (!res.ok) return [];
    const data = await res.json();
    return data.openJobs || [];
  } catch {
    return [];
  }
}

export async function claimMarketplaceJob(
  bookingId: string,
  technicianId: string,
  technicianName: string,
  technicianPhone: string
): Promise<Booking | null> {
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(bookingId)}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technicianId, technicianName, technicianPhone })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.booking) {
      // Update local storage
      const existing = getStoredBookings();
      const updated = existing.map(b => (b.id === bookingId ? data.booking : b));
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'job:claimed', bookingId } }));
      return data.booking;
    }
  } catch (e) {
    console.warn('Error claiming job:', e);
  }
  return null;
}

export async function completeMarketplaceJob(bookingId: string): Promise<Booking | null> {
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(bookingId)}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.booking) {
      const existing = getStoredBookings();
      const updated = existing.map(b => (b.id === bookingId ? data.booking : b));
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'job:completed', bookingId } }));
      return data.booking;
    }
  } catch (e) {
    console.warn('Error completing job:', e);
  }
  return null;
}

// ==========================================
// ADMIN MESSAGING SUITE HELPERS
// ==========================================
export async function fetchAdminMessages(): Promise<AdminMessage[]> {
  try {
    const res = await fetch('/api/admin/messages');
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

export async function sendAdminMessage(payload: {
  receiverTechnicianId: string;
  receiverName?: string;
  receiverPhone?: string;
  message: string;
  deliveryChannel?: 'in_app' | 'sms' | 'both';
  sender?: 'admin' | 'technician';
  senderName?: string;
}): Promise<AdminMessage | null> {
  try {
    const res = await fetch('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.message) {
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'message:new', message: data.message } }));
      return data.message;
    }
  } catch (e) {
    console.warn('Error sending message:', e);
  }
  return null;
}

export async function fetchTechnicianMessages(technicianId: string, phone?: string): Promise<AdminMessage[]> {
  try {
    const url = `/api/technicians/${encodeURIComponent(technicianId)}/messages${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  } catch {
    return [];
  }
}

// ==========================================
// 85/15 AUTOMATED SINGLE-TECHNICIAN PAYOUT HELPERS
// ==========================================
export async function fetchPayoutLedger(): Promise<PayoutLedgerEntry[]> {
  try {
    const res = await fetch('/api/admin/payouts');
    if (!res.ok) return [];
    const data = await res.json();
    return data.payouts || [];
  } catch {
    return [];
  }
}

export async function disburseSingleTechnicianPayout(payload: {
  bookingId: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  customerName: string;
  customerPhone: string;
  totalAmountKsh: number;
  itemSummary?: string;
}): Promise<PayoutLedgerEntry | null> {
  try {
    const res = await fetch('/api/payouts/disburse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.payout) {
      window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'payout:completed', payout: data.payout } }));
      return data.payout;
    }
  } catch (e) {
    console.warn('Error disbursing payout:', e);
  }
  return null;
}

// ==========================================
// OFFLINE SMS ALERTS HELPERS
// ==========================================
export async function fetchSmsLogs(): Promise<SmsLogEntry[]> {
  try {
    const res = await fetch('/api/sms/logs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

export async function sendOfflineSmsAlert(
  recipientPhone: string,
  recipientName: string | undefined,
  message: string,
  type: 'job_alert' | 'admin_broadcast' | 'direct_chat' | 'payout_alert' = 'job_alert'
): Promise<SmsLogEntry | null> {
  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientPhone, recipientName, message, type })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.smsLog || null;
  } catch {
    return null;
  }
}

// ==========================================
// TECHNICIAN MEMBERSHIP & PASS RENEWAL
// ==========================================
export function renewTechnicianPass(technicianId: string, durationDays: number = 30): Technician[] {
  const current = getStoredTechnicians();
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  const updated = current.map(t => {
    if (t.id === technicianId) {
      const renewed: Technician = {
        ...t,
        pass_status: 'active',
        pass_start_date: Date.now(),
        pass_expiry_date: expiresAt,
        memberExpiresAt: expiresAt,
        isMonthlyMember: true,
        isVisibleToCustomers: true,
        isBlocked: false,
        isOnline: true
      };
      try {
        fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(renewed)
        }).catch(() => {});
      } catch {}
      return renewed;
    }
    return t;
  });
  saveTechnicians(updated);
  return updated;
}

// ==========================================
// MEDIA & VIDEO STUDIO (HOMEPAGE & SHOWCASE)
// ==========================================
export const SHOWCASE_STORAGE_KEY = 'homebased_showcase_media_v1';
export const FEATURED_VIDEO_STORAGE_KEY = 'homebased_featured_video_v1';

export interface ShowcaseMediaItem {
  id: string;
  title: string;
  category: string;
  image: string;
  fallback?: string;
  caption: string;
  tag: string;
  isVideo?: boolean;
  videoUrl?: string;
}

export interface FeaturedVideoConfig {
  enabled: boolean;
  title: string;
  description: string;
  videoUrl: string; // YouTube, MP4, or Vimeo link
  thumbnailUrl?: string;
}

export const DEFAULT_SHOWCASE_ITEMS: ShowcaseMediaItem[] = [
  {
    id: 'showcase-fridges',
    title: 'Fridges Being Repaired',
    category: 'Refrigeration',
    image: '/assets/images/repair_fridge_domestic_1791789872285.jpg',
    fallback: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1200&q=80',
    caption: 'Double door fridge compressor brazing & manifold gas charging',
    tag: 'Fridges & Freezers'
  },
  {
    id: 'showcase-washers',
    title: 'Washing Machines Being Repaired',
    category: 'Washers',
    image: '/assets/images/repair_washing_machine_1791789835454.jpg',
    fallback: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80',
    caption: 'Automatic front load washing machine motor & drain pump testing',
    tag: 'Washing Machines'
  },
  {
    id: 'showcase-cookers',
    title: 'Cookers & Ovens Being Repaired',
    category: 'Cookers',
    image: '/assets/images/repair_electric_cooker_1791789850294.jpg',
    fallback: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Oven heating element and solid plate electrical resistance check',
    tag: 'Cookers & Hobs'
  },
  {
    id: 'showcase-tvs',
    title: 'Smart TVs Being Repaired',
    category: 'Electronics',
    image: '/assets/images/repair_smart_tv_1791789861582.jpg',
    fallback: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=80',
    caption: 'Flat screen LED/OLED TV motherboard and backlight strip repair',
    tag: 'Smart TVs'
  },
  {
    id: 'showcase-ac',
    title: 'Air Conditioners (AC) Being Repaired',
    category: 'HVAC',
    image: '/assets/images/tech_air_conditioning_1791787986483.jpg',
    fallback: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Wall split AC deep chemical servicing & refrigerant gas top-up',
    tag: 'Air Conditioners'
  }
];

export const DEFAULT_FEATURED_VIDEO: FeaturedVideoConfig = {
  enabled: false,
  title: 'Home Based Services · Live Repair & Workshop Demonstration',
  description: 'Certified master technicians diagnosing refrigeration systems, electrical panels, and appliance circuits.',
  videoUrl: '',
  thumbnailUrl: '/assets/images/hero_technician_service_1791787949015.jpg'
};

export function getStoredShowcaseMedia(): ShowcaseMediaItem[] {
  try {
    const raw = localStorage.getItem(SHOWCASE_STORAGE_KEY);
    if (!raw) return DEFAULT_SHOWCASE_ITEMS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SHOWCASE_ITEMS;
  }
}

export function saveStoredShowcaseMedia(items: ShowcaseMediaItem[]): void {
  try {
    localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'showcase_updated' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Failed to save showcase media:', err);
  }
}

export function getStoredFeaturedVideo(): FeaturedVideoConfig {
  try {
    const raw = localStorage.getItem(FEATURED_VIDEO_STORAGE_KEY);
    if (!raw) return DEFAULT_FEATURED_VIDEO;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FEATURED_VIDEO;
  }
}

export function saveStoredFeaturedVideo(cfg: FeaturedVideoConfig): void {
  try {
    localStorage.setItem(FEATURED_VIDEO_STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'video_updated' } }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Failed to save featured video:', err);
  }
}

export async function uploadMediaFileToServer(dataUrl: string, filename?: string, category?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename, category })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch (err) {
    console.warn('Upload error:', err);
    return null;
  }
}

export async function fetchServerMediaConfig(): Promise<{ showcase: ShowcaseMediaItem[] | null; featuredVideo: FeaturedVideoConfig | null } | null> {
  try {
    const res = await fetch('/api/media/config');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      if (data.showcase) {
        localStorage.setItem(SHOWCASE_STORAGE_KEY, JSON.stringify(data.showcase));
      }
      if (data.featuredVideo) {
        localStorage.setItem(FEATURED_VIDEO_STORAGE_KEY, JSON.stringify(data.featuredVideo));
      }
      return data;
    }
  } catch {}
  return null;
}

export async function saveServerMediaConfig(showcase?: ShowcaseMediaItem[], featuredVideo?: FeaturedVideoConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/media/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showcase, featuredVideo })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function triggerRebuildZipArchive(): Promise<{ downloadUrl: string; sizeBytes: number } | null> {
  try {
    const res = await fetch('/api/media/rebuild-zip', { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


