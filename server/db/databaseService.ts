/**
 * CENTRAL DATABASE SERVICE FOR HB ELECTRONICS (hbelectronics.co.ke)
 * Operates purely on Local State & Vercel KV with real-time SSE synchronization,
 * secure role-based access control (RBAC), and persistent cloud storage.
 * Completely free of Supabase and Firebase.
 */

import {
  Booking,
  Technician,
  CustomerRecord,
  ActiveLoggedInUser,
  AdminMessage,
  SmsLogEntry,
  PayoutLedgerEntry,
  PassStatus
} from '../store.ts';
import { cloudStore, AppDatabaseState } from '../cloudStore.ts';

// Initial seed technicians for initial bootstrapping
const INITIAL_SEED_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Eng. David Mwangi',
    photoUrl: '/assets/images/tech_electrical_wiring_1791787974895.jpg',
    roleTitle: 'Senior Electrical & Installation Specialist',
    specialties: ['electrical', 'appliances', 'pumps', 'refrigeration'],
    licenseType: 'Highly Qualified & Vetted Master Electrician',
    licenseNumber: 'TECH/ELEC/2019/8492',
    experienceYears: 12,
    rating: 4.96,
    reviewsCount: 184,
    location: 'Nairobi',
    estate: 'Nairobi - Westlands & Parklands',
    distanceKm: 2.8,
    etaMinutes: 18,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1200,
    phone: '+254 722 841 930',
    tools: ['Fluke True-RMS Multimeter', 'Megger Insulation Tester', 'Earth Resistance Clamp', 'Hydraulic Crimping Tool'],
    badges: ['Active 30-Day Pass', 'Verified Specialist', '120+ 5-Star Reviews'],
    recentJobs: ['3-Phase Consumer Unit replacement in Westlands', 'Instant shower earthing fault fix in Parklands'],
    bio: 'Over a decade of field experience handling complex domestic and commercial electrical distribution, fault tracing, earthing surveys, and heavy appliances.',
    isBlocked: false,
    isMonthlyMember: true,
    isVisibleToCustomers: true,
    pass_status: 'active',
    pass_start_date: Date.now() - 5 * 24 * 3600 * 1000,
    pass_expiry_date: Date.now() + 25 * 24 * 3600 * 1000,
    membership_type: 'monthly',
    is_free_pass: false,
    memberExpiresAt: Date.now() + 25 * 24 * 3600 * 1000,
    registeredAt: Date.now() - 60 * 24 * 3600 * 1000
  },
  {
    id: 'tech-2',
    name: 'Peter Ochieng',
    photoUrl: '/assets/images/tech_refrigeration_workplace_1791787962609.jpg',
    roleTitle: 'Master HVAC & Commercial Refrigeration Specialist',
    specialties: ['refrigeration', 'appliances', 'electrical', 'pumps'],
    licenseType: 'Highly Qualified Master Refrigeration Engineer',
    licenseNumber: 'TECH/RAC/2018/3120',
    experienceYears: 10,
    rating: 4.94,
    reviewsCount: 156,
    location: 'Nairobi',
    estate: 'Nairobi - Kilimani & Kileleshwa',
    distanceKm: 3.4,
    etaMinutes: 22,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1500,
    phone: '+254 713 592 108',
    tools: ['Dual Manifold Brass Gauges', 'Robinair 2-Stage Vacuum Pump', 'Digital Micron Gauge', 'Nitrogen Pressure Test Rig'],
    badges: ['Active 30-Day Pass', 'Inverter PCB Specialist', 'Cold Room Master'],
    recentJobs: ['Samsung Inverter Double Door compressor gas recharge in Kilimani', 'Display chiller expansion valve replacement in Kileleshwa'],
    bio: 'Specialist in inverter refrigerators, R600a hydrocarbon refrigerants, cold storage rooms, and supermarket chillers.',
    isBlocked: false,
    isMonthlyMember: true,
    isVisibleToCustomers: true,
    pass_status: 'active',
    pass_start_date: Date.now() - 3 * 24 * 3600 * 1000,
    pass_expiry_date: Date.now() + 27 * 24 * 3600 * 1000,
    membership_type: 'monthly',
    is_free_pass: false,
    memberExpiresAt: Date.now() + 27 * 24 * 3600 * 1000,
    registeredAt: Date.now() - 45 * 24 * 3600 * 1000
  },
  {
    id: 'tech-3',
    name: 'Grace Wambui',
    photoUrl: '/assets/images/tech_air_conditioning_1791787986483.jpg',
    roleTitle: 'Dual HVAC & Precision Domestic Tech',
    specialties: ['refrigeration', 'appliances', 'electrical', 'pumps'],
    licenseType: 'Highly Qualified HVAC & Electrical Specialist',
    licenseNumber: 'TECH/HVAC/2020/5541',
    experienceYears: 8,
    rating: 4.98,
    reviewsCount: 142,
    location: 'Nairobi',
    estate: 'Nairobi - South B & South C',
    distanceKm: 4.1,
    etaMinutes: 25,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1300,
    phone: '+254 734 812 405',
    tools: ['Electronic Refrigerant Leak Detector', 'Anemometer Air Velocity Meter', 'Clamp-On Power Meter'],
    badges: ['Active 30-Day Pass', 'Top Rated Female Specialist', 'Energy Audit Certified'],
    recentJobs: ['Split AC deep chemical coil cleaning in South B', 'Washing machine direct drive motor sensor fix in South C'],
    bio: 'Certified in high-efficiency heat pumps, air conditioning overhaul, VRF systems, and modern washing machine electronics.',
    isBlocked: false,
    isMonthlyMember: true,
    isVisibleToCustomers: true,
    pass_status: 'active',
    pass_start_date: Date.now() - 7 * 24 * 3600 * 1000,
    pass_expiry_date: Date.now() + 23 * 24 * 3600 * 1000,
    membership_type: 'monthly',
    is_free_pass: false,
    memberExpiresAt: Date.now() + 23 * 24 * 3600 * 1000,
    registeredAt: Date.now() - 30 * 24 * 3600 * 1000
  }
];

export class CentralDatabaseService {
  private sseClients: Set<(data: string) => void> = new Set();

  constructor() {}

  public getDatabaseStatus() {
    return cloudStore.getStatus();
  }

  // SSE client broadcast registration
  public addSseClient(callback: (data: string) => void) {
    this.sseClients.add(callback);
    return () => {
      this.sseClients.delete(callback);
    };
  }

  public broadcast(event: string, payload: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const send of this.sseClients) {
      try {
        send(message);
      } catch (e) {
        this.sseClients.delete(send);
      }
    }
  }

  // Ensure database state is loaded from local state / Vercel KV
  public async ensureLoaded(): Promise<AppDatabaseState> {
    const seed: AppDatabaseState = {
      updatedAt: Date.now(),
      bookings: [],
      technicians: INITIAL_SEED_TECHNICIANS,
      customers: [],
      loggedInUsers: [],
      messages: [],
      smsLogs: [],
      payoutLedger: [],
      pesapalConfig: { mode: 'live', consumerKey: '', ipnId: '' },
      pricing: {
        inspectionFeeKsh: 1500,
        baseHourlyRateKsh: 1000,
        emergencyMultiplier: 1.5,
        technicianPayoutPercent: 85,
        technicianSplitPercent: 85,
        platformCommissionPercent: 15,
        platformSplitPercent: 15,
        customerPassPriceKsh: 50,
        technicianPassPriceKsh: 50,
        technicianRegistrationPriceKsh: 150,
        technicianRegPriceKsh: 150,
        technicianLoginFeeKsh: 50,
        technicianMembershipFeeKsh: 150,
        refrigerationGasRefillKsh: 3500,
        commercialMultiplier: 1.8,
        itemPrices: {}
      },
      mediaConfig: { showcase: null, featuredVideo: null }
    };

    return await cloudStore.loadState(seed);
  }

  // ==========================================
  // TECHNICIANS ROSTER (PERMANENT STORAGE & RBAC)
  // ==========================================
  public async getTechnicians(options: { forAdmin?: boolean } = {}): Promise<Technician[]> {
    const state = await this.ensureLoaded();
    const now = Date.now();
    const list = (state.technicians && state.technicians.length > 0) ? state.technicians : INITIAL_SEED_TECHNICIANS;

    // Check pass expiration
    const normalizedList = list.map(t => {
      const expiry = t.pass_expiry_date || t.memberExpiresAt || (now + 30 * 24 * 3600 * 1000);
      const isExpired = expiry <= now;
      const isPendingDirectPass = t.is_direct_pass && t.approval_status === 'pending';
      return {
        ...t,
        pass_status: (isExpired ? 'expired' : (isPendingDirectPass ? 'pending_approval' : (t.pass_status || 'active'))) as PassStatus,
        pass_expiry_date: expiry,
        memberExpiresAt: expiry,
        isMonthlyMember: !isExpired && (t.isMonthlyMember ?? true),
        isVisibleToCustomers: !isExpired && !isPendingDirectPass && (t.isVisibleToCustomers !== false)
      };
    });

    if (options.forAdmin) {
      return normalizedList;
    }

    // RBAC: Strictly exclude blocked and hidden technicians, pending direct pass technicians, and strip sensitive fields (National ID)
    return normalizedList
      .filter(t => !t.isBlocked && t.isVisibleToCustomers !== false && t.pass_status !== 'expired' && t.approval_status !== 'pending')
      .map(t => {
        const { nationalIdOrPassport, ...publicData } = t;
        return publicData as Technician;
      });
  }

  public async addOrUpdateTechnician(tech: Technician): Promise<Technician> {
    const state = await this.ensureLoaded();
    const now = Date.now();
    const thirtyDays = 30 * 24 * 3600 * 1000;
    const expiry = tech.pass_expiry_date || tech.memberExpiresAt || (now + (tech.is_direct_pass ? 365 * 24 * 3600 * 1000 : thirtyDays));

    const cleanDigits = (p?: string) => (p || '').replace(/\D/g, '').slice(-9);
    const techDigits = cleanDigits(tech.phone);
    const cleanIdNum = (tech.nationalIdOrPassport || '').trim().toLowerCase();

    const existingIndex = (state.technicians || []).findIndex(t => {
      if (tech.id && t.id === tech.id) return true;
      if (cleanIdNum && t.nationalIdOrPassport && t.nationalIdOrPassport.trim().toLowerCase() === cleanIdNum) return true;
      if (techDigits && techDigits.length >= 6) {
        const d = cleanDigits(t.phone);
        return d === techDigits || d.endsWith(techDigits) || techDigits.endsWith(d);
      }
      return false;
    });

    const isDirect = tech.is_direct_pass ?? (existingIndex >= 0 ? state.technicians[existingIndex].is_direct_pass : false);
    const approval = tech.approval_status || (existingIndex >= 0 ? state.technicians[existingIndex].approval_status : (isDirect ? 'pending' : 'approved'));
    // Direct pass technicians must be approved by admin before appearing on customer list
    const isVisible = isDirect ? (approval === 'approved') : (tech.isVisibleToCustomers ?? true);

    const cleanId = existingIndex >= 0
      ? state.technicians[existingIndex].id
      : (tech.id || `tech-${cleanIdNum || techDigits || Date.now().toString()}`);

    const normalized: Technician = {
      ...(existingIndex >= 0 ? state.technicians[existingIndex] : {}),
      ...tech,
      id: cleanId,
      name: (tech.name || '').trim(),
      phone: (tech.phone || '').trim(),
      nationalIdOrPassport: (tech.nationalIdOrPassport || (existingIndex >= 0 ? state.technicians[existingIndex].nationalIdOrPassport : '') || '').trim(),
      isOnline: tech.isOnline ?? true,
      isVisibleToCustomers: isVisible,
      isBlocked: false,
      isMonthlyMember: true,
      is_direct_pass: isDirect,
      approval_status: approval,
      approvedAt: tech.approvedAt || (existingIndex >= 0 ? state.technicians[existingIndex].approvedAt : undefined),
      pass_status: expiry > now ? (isDirect && approval === 'pending' ? 'pending_approval' : 'active') : 'expired',
      pass_start_date: tech.pass_start_date || now,
      pass_expiry_date: expiry,
      memberExpiresAt: expiry,
      membership_type: tech.membership_type || 'monthly',
      registeredAt: tech.registeredAt || (existingIndex >= 0 ? state.technicians[existingIndex].registeredAt : now) || now
    };

    if (existingIndex >= 0) {
      state.technicians[existingIndex] = normalized;
    } else {
      state.technicians = [normalized, ...(state.technicians || [])];
    }

    await cloudStore.saveState(state);
    this.broadcast('technician:updated', normalized);
    this.broadcast('sync', { type: 'technicians_updated', technicians: state.technicians });

    return normalized;
  }

  public async approveTechnician(techId: string): Promise<Technician | null> {
    const state = await this.ensureLoaded();
    const idx = (state.technicians || []).findIndex(t => t.id === techId);
    if (idx < 0) return null;

    const current = state.technicians[idx];
    const updated: Technician = {
      ...current,
      approval_status: 'approved',
      isVisibleToCustomers: true,
      pass_status: 'active',
      isMonthlyMember: true,
      isBlocked: false,
      approvedAt: Date.now(),
      memberExpiresAt: Math.max(current.memberExpiresAt || 0, Date.now() + 365 * 24 * 3600 * 1000),
      pass_expiry_date: Math.max(current.pass_expiry_date || 0, Date.now() + 365 * 24 * 3600 * 1000)
    };

    state.technicians[idx] = updated;
    await cloudStore.saveState(state);

    this.broadcast('technician:approved', updated);
    this.broadcast('technician:updated', updated);
    this.broadcast('sync', { type: 'technicians_updated', technicians: state.technicians });

    if (updated.phone) {
      await this.sendOfflineSmsAlert(
        updated.phone,
        updated.name,
        `APPROVAL CONFIRMATION: Your Technician Direct Pass has been APPROVED by Central Admin! Your profile is now live to customers and you can accept incoming repair jobs.`,
        'admin_broadcast'
      );
    }

    return updated;
  }

  public async deleteTechnician(techId: string): Promise<boolean> {
    const state = await this.ensureLoaded();
    state.technicians = (state.technicians || []).filter(t => t.id !== techId);
    await cloudStore.saveState(state);

    this.broadcast('technician:deleted', { id: techId });
    this.broadcast('sync', { type: 'technicians_updated', technicians: state.technicians });
    return true;
  }

  // ==========================================
  // CUSTOMERS MANAGEMENT (CENTRAL PERSISTENCE)
  // ==========================================
  public async getCustomers(): Promise<CustomerRecord[]> {
    const state = await this.ensureLoaded();
    return state.customers || [];
  }

  public async addOrUpdateCustomer(customer: CustomerRecord): Promise<CustomerRecord> {
    const cleanId = customer.id || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const normalized: CustomerRecord = {
      ...customer,
      id: cleanId,
      registeredAt: customer.registeredAt || Date.now(),
      totalBookings: customer.totalBookings || 0,
      isBlocked: Boolean(customer.isBlocked),
      isVisible: customer.isVisible !== false,
      isActivePass: customer.isActivePass !== false,
      activeUntil: customer.activeUntil || (Date.now() + 12 * 3600 * 1000)
    };

    const state = await this.ensureLoaded();
    const existingIdx = (state.customers || []).findIndex(c => c.id === cleanId || c.phone === normalized.phone);

    if (existingIdx >= 0) {
      state.customers[existingIdx] = { ...state.customers[existingIdx], ...normalized };
    } else {
      state.customers = [normalized, ...(state.customers || [])];
    }

    await cloudStore.saveState(state);
    this.broadcast('customer:updated', normalized);
    this.broadcast('sync', { type: 'customer_updated', customer: normalized });

    return normalized;
  }

  public async deleteCustomer(custId: string): Promise<boolean> {
    const state = await this.ensureLoaded();
    state.customers = (state.customers || []).filter(c => c.id !== custId);
    await cloudStore.saveState(state);

    this.broadcast('customer:deleted', { id: custId });
    this.broadcast('sync', { type: 'customer_deleted', customerId: custId });
    return true;
  }

  // ==========================================
  // LOGGED IN SESSIONS (GLOBAL VISIBILITY)
  // ==========================================
  public async getLoggedInUsers(): Promise<ActiveLoggedInUser[]> {
    const state = await this.ensureLoaded();
    return state.loggedInUsers || [];
  }

  public async addOrUpdateLoggedInUser(user: ActiveLoggedInUser): Promise<ActiveLoggedInUser> {
    const cleanId = user.id || `LOG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const normalized: ActiveLoggedInUser = {
      ...user,
      id: cleanId,
      loggedInAt: user.loggedInAt || Date.now(),
      activeUntil: user.activeUntil || (Date.now() + 12 * 3600 * 1000),
      isActive: user.isActive !== false,
      isVisible: user.isVisible !== false
    };

    const state = await this.ensureLoaded();
    const existingIndex = (state.loggedInUsers || []).findIndex(u => u.phone === normalized.phone && u.role === normalized.role);

    if (existingIndex >= 0) {
      state.loggedInUsers[existingIndex] = { ...state.loggedInUsers[existingIndex], ...normalized };
    } else {
      state.loggedInUsers = [normalized, ...(state.loggedInUsers || [])];
    }

    await cloudStore.saveState(state);
    this.broadcast('user:login', normalized);
    this.broadcast('sync', { type: 'logged_in_users_updated', loggedInUsers: state.loggedInUsers });

    return normalized;
  }

  // PASS VALIDATION & ENTRY FEE EXEMPTION ENGINE (Supports Phone OR National ID Number)
  public async validatePass(phoneOrId: string, role?: string): Promise<{
    hasActivePass: boolean;
    is_fee_required: boolean;
    role?: string;
    name?: string;
    phone?: string;
    nationalIdOrPassport?: string;
    pass_status?: PassStatus;
    pass_expiry_date?: number;
    remainingHours?: number;
    source?: string;
    is_direct_pass?: boolean;
    approval_status?: 'pending' | 'approved' | 'rejected';
    technician?: Technician;
  }> {
    if (!phoneOrId || !phoneOrId.trim()) {
      return { hasActivePass: false, is_fee_required: true };
    }

    const trimmed = phoneOrId.trim();
    const cleanId = trimmed.toLowerCase();
    const cleanDigits = trimmed.replace(/\D/g, '');
    const now = Date.now();

    // Check Technicians by National ID / Passport Number OR by Phone
    const techs = await this.getTechnicians({ forAdmin: true });
    const tech = techs.find(t => {
      if (t.nationalIdOrPassport && t.nationalIdOrPassport.trim().toLowerCase() === cleanId) return true;
      if (cleanDigits.length >= 6) {
        const tDigits = t.phone.replace(/\D/g, '');
        if (tDigits.endsWith(cleanDigits) || cleanDigits.endsWith(tDigits)) return true;
      }
      return false;
    });

    if (tech && !tech.isBlocked) {
      const isMember = tech.isMonthlyMember || tech.pass_status === 'active' || (tech.memberExpiresAt && tech.memberExpiresAt > now) || tech.is_direct_pass;
      const notExpired = !tech.pass_expiry_date || tech.pass_expiry_date > now;

      if (isMember && notExpired) {
        const expiry = tech.pass_expiry_date || tech.memberExpiresAt || (now + 365 * 24 * 3600 * 1000);
        return {
          hasActivePass: true,
          is_fee_required: false,
          role: 'technician',
          name: tech.name,
          phone: tech.phone,
          nationalIdOrPassport: tech.nationalIdOrPassport,
          pass_status: tech.approval_status === 'pending' ? 'pending_approval' : 'active',
          approval_status: tech.approval_status || (tech.is_direct_pass ? 'pending' : 'approved'),
          is_direct_pass: Boolean(tech.is_direct_pass),
          pass_expiry_date: expiry,
          remainingHours: Math.max(1, Math.round((expiry - now) / 3600000)),
          source: tech.is_direct_pass ? 'Technician Direct Pass (ID Verified)' : 'Verified Technician Membership',
          technician: tech
        };
      }
    }

    // Check Sessions & Customers
    const sessions = await this.getLoggedInUsers();
    const sess = sessions.find(s => cleanDigits.length >= 6 && (s.phone.replace(/\D/g, '').endsWith(cleanDigits) || cleanDigits.endsWith(s.phone.replace(/\D/g, ''))));
    if (sess && sess.activeUntil > now && sess.isActive) {
      return {
        hasActivePass: true,
        is_fee_required: false,
        role: sess.role,
        name: sess.name,
        phone: sess.phone,
        pass_status: 'active',
        pass_expiry_date: sess.activeUntil,
        remainingHours: Math.max(1, Math.round((sess.activeUntil - now) / 3600000)),
        source: 'Active Authenticated Pass'
      };
    }

    return { hasActivePass: false, is_fee_required: true };
  }

  // ==========================================
  // PRICING MANAGEMENT (CENTRAL PERSISTENCE)
  // ==========================================
  public async getPricing(): Promise<any> {
    const fallback = {
      inspectionFeeKsh: 1500,
      baseHourlyRateKsh: 1000,
      emergencyMultiplier: 1.5,
      technicianPayoutPercent: 85,
      technicianSplitPercent: 85,
      platformCommissionPercent: 15,
      platformSplitPercent: 15,
      customerPassPriceKsh: 50,
      technicianPassPriceKsh: 50,
      technicianRegistrationPriceKsh: 150,
      technicianRegPriceKsh: 150,
      technicianLoginFeeKsh: 50,
      technicianMembershipFeeKsh: 150,
      refrigerationGasRefillKsh: 3500,
      commercialMultiplier: 1.8,
      itemPrices: {}
    };

    const state = await this.ensureLoaded();
    return { ...fallback, ...(state.pricing || {}) };
  }

  public async updatePricing(updates: any): Promise<any> {
    const current = await this.getPricing();
    const techSplit = Number(updates.technicianPayoutPercent ?? updates.technicianSplitPercent ?? current.technicianPayoutPercent ?? 85);
    const platSplit = Number(updates.platformCommissionPercent ?? updates.platformSplitPercent ?? (100 - techSplit));
    const regFee = Number(updates.technicianRegistrationPriceKsh ?? updates.technicianRegPriceKsh ?? updates.technicianMembershipFeeKsh ?? current.technicianRegistrationPriceKsh ?? 150);
    const custPass = Number(updates.customerPassPriceKsh ?? current.customerPassPriceKsh ?? 50);
    const techPass = Number(updates.technicianPassPriceKsh ?? updates.technicianLoginFeeKsh ?? current.technicianPassPriceKsh ?? 50);

    const merged = {
      ...current,
      ...updates,
      technicianPayoutPercent: techSplit,
      technicianSplitPercent: techSplit,
      platformCommissionPercent: platSplit,
      platformSplitPercent: platSplit,
      technicianRegistrationPriceKsh: regFee,
      technicianRegPriceKsh: regFee,
      technicianMembershipFeeKsh: regFee,
      customerPassPriceKsh: custPass,
      technicianPassPriceKsh: techPass,
      itemPrices: { ...(current.itemPrices || {}), ...(updates.itemPrices || {}) }
    };

    const state = await this.ensureLoaded();
    state.pricing = merged;
    await cloudStore.saveState(state);

    this.broadcast('pricing:updated', merged);
    this.broadcast('sync', { type: 'pricing_updated', pricing: merged });

    return merged;
  }

  // ==========================================
  // BOOKINGS & OPEN JOB MARKETPLACE
  // ==========================================
  public async getBookings(): Promise<Booking[]> {
    const state = await this.ensureLoaded();
    return state.bookings || [];
  }

  public async getOpenJobs(): Promise<Booking[]> {
    const bookings = await this.getBookings();
    return bookings.filter(b => b.status === 'requested' || !b.technicianId || b.technicianId === 'unassigned');
  }

  public async addBooking(booking: Booking): Promise<Booking> {
    const state = await this.ensureLoaded();
    const list = state.bookings || [];
    const filtered = list.filter(b => b.id !== booking.id);
    state.bookings = [booking, ...filtered];
    await cloudStore.saveState(state);

    this.broadcast('booking:created', booking);
    this.broadcast('sync', { type: 'booking_created', booking });

    return booking;
  }

  public async createBooking(booking: Booking): Promise<Booking> {
    return await this.addBooking(booking);
  }

  public async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking | null> {
    const state = await this.ensureLoaded();
    let updatedBooking: Booking | null = null;

    state.bookings = (state.bookings || []).map(b => {
      if (b.id === bookingId) {
        updatedBooking = { ...b, ...updates };
        return updatedBooking;
      }
      return b;
    });

    if (updatedBooking) {
      await cloudStore.saveState(state);
      this.broadcast('booking:updated', updatedBooking);
      this.broadcast('sync', { type: 'booking_updated', booking: updatedBooking });
    }

    return updatedBooking;
  }

  public async claimJob(
    bookingId: string,
    technicianId: string,
    technicianName: string,
    technicianPhone: string
  ): Promise<Booking | null> {
    return await this.updateBooking(bookingId, {
      technicianId,
      technicianName,
      technicianPhone,
      status: 'accepted'
    });
  }

  public async dispatchJob(
    bookingId: string,
    technicianId: string,
    technicianName: string,
    technicianPhone: string
  ): Promise<Booking | null> {
    return await this.updateBooking(bookingId, {
      technicianId,
      technicianName,
      technicianPhone,
      status: 'accepted'
    });
  }

  // ==========================================
  // 85/15 AUTOMATED PAYOUT LEDGER
  // ==========================================
  public async getPayoutLedger(): Promise<PayoutLedgerEntry[]> {
    const state = await this.ensureLoaded();
    return state.payoutLedger || [];
  }

  public async recordPayout(entry: Omit<PayoutLedgerEntry, 'id'>): Promise<PayoutLedgerEntry> {
    const newEntry: PayoutLedgerEntry = {
      ...entry,
      id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      disbursedAt: entry.disbursedAt || Date.now()
    };

    const state = await this.ensureLoaded();
    state.payoutLedger = [newEntry, ...(state.payoutLedger || [])];
    await cloudStore.saveState(state);

    this.broadcast('payout:completed', newEntry);
    this.broadcast('sync', { type: 'payout_completed', payout: newEntry });

    return newEntry;
  }

  // ==========================================
  // ADMIN MESSAGING SUITE
  // ==========================================
  public async getAllMessages(): Promise<AdminMessage[]> {
    const state = await this.ensureLoaded();
    return state.messages || [];
  }

  public async postAdminMessage(msg: Omit<AdminMessage, 'id' | 'timestamp'> & { isRead?: boolean }): Promise<AdminMessage> {
    const newMsg: AdminMessage = {
      ...msg,
      id: `MSG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: Date.now(),
      isRead: msg.isRead ?? false
    };

    const state = await this.ensureLoaded();
    state.messages = [newMsg, ...(state.messages || [])];
    await cloudStore.saveState(state);

    this.broadcast('message:new', newMsg);
    this.broadcast('sync', { type: 'message_new', message: newMsg });

    // If channel includes SMS, log and trigger offline SMS alert
    if (newMsg.deliveryChannel === 'sms' || newMsg.deliveryChannel === 'both') {
      const recipientPhone = newMsg.receiverPhone || '+254711408365';
      const recipientName = newMsg.receiverName || 'Active Technician';
      await this.sendOfflineSmsAlert(recipientPhone, recipientName, newMsg.message, 'admin_broadcast');
    }

    return newMsg;
  }

  public async getMessagesForTechnician(techId: string, phone?: string): Promise<AdminMessage[]> {
    const all = await this.getAllMessages();
    return all.filter(m => {
      if (m.receiverTechnicianId === 'all_broadcast' || m.receiverTechnicianId === 'broadcast') return true;
      if (m.receiverTechnicianId === techId) return true;
      if (phone && m.receiverPhone && (m.receiverPhone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '')) || phone.replace(/\D/g, '').endsWith(m.receiverPhone.replace(/\D/g, '')))) return true;
      return false;
    });
  }

  // ==========================================
  // OFFLINE SMS ALERTS
  // ==========================================
  public async getSmsLogs(): Promise<SmsLogEntry[]> {
    const state = await this.ensureLoaded();
    return state.smsLogs || [];
  }

  public async logSmsAlert(entry: Omit<SmsLogEntry, 'id' | 'sentAt' | 'gateway'> & Partial<Pick<SmsLogEntry, 'sentAt' | 'gateway'>>): Promise<SmsLogEntry> {
    const log: SmsLogEntry = {
      ...entry,
      id: `SMS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      sentAt: entry.sentAt || Date.now(),
      gateway: entry.gateway || 'simulated'
    };

    const state = await this.ensureLoaded();
    state.smsLogs = [log, ...(state.smsLogs || [])];
    await cloudStore.saveState(state);

    this.broadcast('sms:logged', log);
    this.broadcast('sync', { type: 'sms_logged', smsLog: log });

    return log;
  }

  public async sendOfflineSmsAlert(
    recipientPhone: string,
    recipientName: string,
    message: string,
    type: SmsLogEntry['type'] = 'job_alert'
  ): Promise<SmsLogEntry> {
    return await this.logSmsAlert({
      recipientPhone,
      recipientName,
      message,
      type,
      status: 'delivered'
    });
  }

  // ==========================================
  // MEDIA STUDIO ASSETS
  // ==========================================
  public async getMediaConfig(): Promise<any> {
    const state = await this.ensureLoaded();
    return state.mediaConfig || { showcase: null, featuredVideo: null };
  }

  public async updateMediaConfig(config: any): Promise<any> {
    const state = await this.ensureLoaded();
    state.mediaConfig = { ...state.mediaConfig, ...config };
    await cloudStore.saveState(state);

    this.broadcast('showcase:updated', state.mediaConfig);
    this.broadcast('sync', { type: 'media_updated', mediaConfig: state.mediaConfig });

    return state.mediaConfig;
  }
}

export const centralDb = new CentralDatabaseService();
