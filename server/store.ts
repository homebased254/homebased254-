import fs from 'fs';
import path from 'path';
import { cloudStore, AppDatabaseState } from './cloudStore.ts';

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function phonesMatch(p1?: string, p2?: string): boolean {
  if (!p1 || !p2) return false;
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (!n1 || !n2 || n1.length < 6 || n2.length < 6) return false;
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

export interface SelectedRepairItem {
  itemId: string;
  itemName: string;
  category: 'refrigeration' | 'electrical' | 'appliances' | 'pumps';
  selectedIssues: string[];
  brand: string;
  quantity: number;
  urgency: 'normal' | 'emergency' | 'scheduled';
  notes: string;
}

export interface TechnicianLiveLocation {
  latitude: number;
  longitude: number;
  currentRoadOrEstate: string;
  speedKmh: number;
  heading: string;
  lastUpdated: number;
  distanceKm: number;
  etaMinutes: number;
  progressPercent: number;
  vehicleType: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  estate: string;
  addressDetails: string;
  items: SelectedRepairItem[];
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  status: 'requested' | 'accepted' | 'en_route' | 'in_progress' | 'completed';
  createdAt: number;
  scheduledTime: string;
  notes: string;
  estimatedTotalKsh: number;
  paymentStatus?: 'unpaid' | 'paid';
  paidAmountKsh?: number;
  paidAmountUsd?: number;
  paidAt?: number;
  receiptNumber?: string;
  paymentGateway?: 'pesapal';
  pesapalOrderTrackingId?: string;
  pesapalMerchantReference?: string;
  pesapalConfirmationCode?: string;
  pesapalPaymentMethod?: string;
  paymentChannel?: 'mpesa' | 'card' | 'airtel' | 'pesapal';
  technicianPayoutKsh?: number;
  platformCommissionKsh?: number;
  disbursementStatus?: 'pending' | 'disbursed_to_technician';
  guaranteeDays?: number;
  guaranteeExpiresAt?: number;
  isCustomBroadcast?: boolean;
  technicianLiveLocation?: TechnicianLiveLocation;
  completedAt?: number;
}

export type PassStatus = 'active' | 'expired' | 'grace_period' | 'pending_approval';
export type MembershipType = 'free_trial' | 'monthly' | 'lifetime';

export interface Technician {
  id: string;
  name: string;
  photoUrl: string;
  roleTitle: string;
  specialties: ('refrigeration' | 'electrical' | 'appliances' | 'pumps')[];
  licenseType: string;
  licenseNumber: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  location: string;
  estate: string;
  distanceKm: number;
  etaMinutes: number;
  isOnline: boolean;
  inspectionFeeKsh: number;
  hourlyRateKsh: number;
  phone: string;
  tools: string[];
  badges: string[];
  recentJobs: string[];
  bio: string;
  portfolioPhotos?: string[];
  isBlocked?: boolean;
  isMonthlyMember?: boolean;
  memberExpiresAt?: number;
  registeredAt?: number;
  isVisibleToCustomers?: boolean;
  repairableItemIds?: string[];
  nationalIdOrPassport?: string; // SENSITIVE: ADMIN ONLY!
  pass_status?: PassStatus;
  pass_start_date?: number;
  pass_expiry_date?: number;
  membership_type?: MembershipType;
  is_free_pass?: boolean;
  is_direct_pass?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approvedAt?: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  estate: string;
  addressDetails?: string;
  registeredAt: number;
  totalBookings: number;
  lastLoginAt?: number;
  activeUntil?: number;
  isActivePass?: boolean;
  isVisible?: boolean;
  isBlocked?: boolean;
  notes?: string;
}

export interface ActiveLoggedInUser {
  id: string;
  role: 'customer' | 'technician' | 'admin';
  name: string;
  phone: string;
  loggedInAt: number;
  activeUntil: number;
  transactionId?: string;
  paymentChannel?: string;
  amountPaidKsh?: number;
  location?: string;
  isActive: boolean;
  isVisible: boolean;
}

// ADMIN MESSAGING SUITE SCHEMA
export interface AdminMessage {
  id: string;
  sender: 'admin' | 'technician';
  senderName: string;
  receiverTechnicianId: string; // 'all_broadcast' for group texts, or tech ID
  receiverName?: string;
  receiverPhone?: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  deliveryChannel: 'in_app' | 'sms' | 'both';
  smsStatus?: 'sent' | 'delivered' | 'pending' | 'simulated';
}

// OFFLINE SMS ALERTS LOG
export interface SmsLogEntry {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  type: 'job_alert' | 'admin_broadcast' | 'direct_chat' | 'payout_alert';
  sentAt: number;
  status: 'delivered' | 'sent';
  gateway: 'africas_talking' | 'simulated';
}

// 85/15 AUTOMATED PAYOUT LEDGER SCHEMA
export interface PayoutLedgerEntry {
  id: string;
  bookingId: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  customerName: string;
  customerPhone: string;
  totalAmountKsh: number;
  platformFee15Ksh: number;
  technicianShare85Ksh: number;
  payoutStatus: 'completed' | 'processing' | 'failed';
  payoutChannel: 'mpesa_b2c' | 'pesapal_payout';
  transactionReference: string;
  disbursedAt: number;
  itemSummary: string;
}

// Initial seed technicians
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
    hourlyRateKsh: 1100,
    phone: '+254 735 489 021',
    tools: ['Testo Airflow Anemometer', 'Refrigerant Leak Sniffer', 'High Pressure Hydro Cleaning Hood'],
    badges: ['Active Free Pass', 'High Customer Satisfaction', 'Prompt Responder'],
    recentJobs: ['Split AC chemical cleaning in South B', 'Washing machine drain pump and PCB replacement in Langata'],
    bio: 'Passionate and meticulous HVAC & domestic appliance specialist. Experts in split AC installations, washing machine PCB troubleshooting, and kitchen appliances.',
    isBlocked: false,
    isMonthlyMember: true,
    isVisibleToCustomers: true,
    pass_status: 'active',
    pass_start_date: Date.now() - 2 * 24 * 3600 * 1000,
    pass_expiry_date: Date.now() + 28 * 24 * 3600 * 1000,
    membership_type: 'free_trial',
    is_free_pass: true,
    memberExpiresAt: Date.now() + 28 * 24 * 3600 * 1000,
    registeredAt: Date.now() - 30 * 24 * 3600 * 1000
  },
  {
    id: 'tech-4',
    name: 'Joseph Kiprono',
    photoUrl: '/assets/images/hero_technician_service_1791787949015.jpg',
    roleTitle: 'Borehole Pumps & Motor Control Specialist',
    specialties: ['pumps', 'electrical', 'appliances', 'refrigeration'],
    licenseType: 'Highly Qualified Pump & Motor Engineer',
    licenseNumber: 'TECH/PUMP/2017/1908',
    experienceYears: 14,
    rating: 4.91,
    reviewsCount: 118,
    location: 'Nairobi',
    estate: 'Nairobi - Karen & Langata',
    distanceKm: 5.6,
    etaMinutes: 30,
    isOnline: true,
    inspectionFeeKsh: 2000,
    hourlyRateKsh: 1400,
    phone: '+254 720 334 772',
    tools: ['Capacitor Tester', 'Motor Winding Insulation Megohmmeter', 'Pipe Threading & Pressure Kit'],
    badges: ['Active 30-Day Pass', 'Borehole Control Master', '24/7 Rapid Response'],
    recentJobs: ['Dayliff 3HP borehole control box starter capacitor repair in Karen'],
    bio: 'Deep expertise in water pumping systems, single and 3-phase motor starters, control panel relays, thermal overloads, and pressure switches.',
    isBlocked: false,
    isMonthlyMember: true,
    isVisibleToCustomers: true,
    pass_status: 'active',
    pass_start_date: Date.now() - 1 * 24 * 3600 * 1000,
    pass_expiry_date: Date.now() + 29 * 24 * 3600 * 1000,
    membership_type: 'monthly',
    is_free_pass: false,
    memberExpiresAt: Date.now() + 29 * 24 * 3600 * 1000,
    registeredAt: Date.now() - 90 * 24 * 3600 * 1000
  }
];

// Initial seed bookings (contains an open/unclaimed job and an assigned job)
const INITIAL_SEED_BOOKINGS: Booking[] = [
  {
    id: 'BK-OPEN-1002',
    customerName: 'Alice Mwende',
    customerPhone: '+254 712 908 114',
    estate: 'Nairobi - Westlands & Parklands',
    addressDetails: 'Sarit Centre Area, Apt 5A',
    items: [
      {
        itemId: 'distribution-board',
        itemName: 'Main Consumer Unit / Distribution Board',
        category: 'electrical',
        selectedIssues: ['Main RCD breaker trips immediately', 'Burning smell from isolator switch'],
        brand: 'Schneider Electric',
        quantity: 1,
        urgency: 'emergency',
        notes: 'Total power loss in house, urgent diagnosis required'
      }
    ],
    technicianId: 'unassigned',
    technicianName: 'Pending Available Technician',
    technicianPhone: '+254 711 408 365',
    status: 'requested',
    createdAt: Date.now() - 10 * 60 * 1000,
    scheduledTime: 'Immediate Open Job Broadcast',
    notes: 'Open marketplace job for qualified electrical tech',
    estimatedTotalKsh: 2600,
    paymentStatus: 'unpaid',
    isCustomBroadcast: true
  },
  {
    id: 'BK-892104',
    customerName: 'Mama Brenda Wanjiku',
    customerPhone: '+254 721 984 210',
    estate: 'Nairobi - Kilimani & Kileleshwa',
    addressDetails: 'Chania Avenue, Court 4B, 2nd Floor, Apt 12',
    items: [
      {
        itemId: 'fridge-domestic',
        itemName: 'Domestic Refrigerator (Double Door Inverter)',
        category: 'refrigeration',
        selectedIssues: ['Compressor clicking every 3 minutes', 'Gas leak detected, food thawing'],
        brand: 'Samsung Inverter',
        quantity: 1,
        urgency: 'normal',
        notes: 'Fridge stopped cooling yesterday morning, needs gas top-up'
      }
    ],
    technicianId: 'tech-2',
    technicianName: 'Peter Ochieng',
    technicianPhone: '+254 713 592 108',
    status: 'en_route',
    createdAt: Date.now() - 25 * 60 * 1000,
    scheduledTime: 'Immediate Dispatch (~18 mins)',
    notes: 'Samsung Inverter, R600a manifold gauge needed',
    estimatedTotalKsh: 3600,
    paymentStatus: 'unpaid',
    technicianLiveLocation: {
      latitude: -1.2910,
      longitude: 36.7845,
      currentRoadOrEstate: 'Argwings Kodhek Road approaching Yaya Centre',
      speedKmh: 36,
      heading: 'East',
      lastUpdated: Date.now(),
      distanceKm: 1.6,
      etaMinutes: 12,
      progressPercent: 60,
      vehicleType: 'Refrigeration Service Van'
    }
  }
];

// Initial seed admin messages
const INITIAL_SEED_MESSAGES: AdminMessage[] = [
  {
    id: 'MSG-INIT-001',
    sender: 'admin',
    senderName: 'Central Operations Dispatch',
    receiverTechnicianId: 'all_broadcast',
    message: 'Notice to all technicians: Ensure digital multimeters and pressure gauges are verified before attending weekend emergency calls. Stay online on duty for priority job allocation.',
    timestamp: Date.now() - 2 * 3600 * 1000,
    isRead: true,
    deliveryChannel: 'both',
    smsStatus: 'delivered'
  },
  {
    id: 'MSG-INIT-002',
    sender: 'admin',
    senderName: 'Central Operations Dispatch',
    receiverTechnicianId: 'tech-1',
    receiverName: 'Eng. David Mwangi',
    receiverPhone: '+254 722 841 930',
    message: 'Eng. David, customer in Westlands confirmed site readiness. Please check isolator switch upon arrival.',
    timestamp: Date.now() - 45 * 60 * 1000,
    isRead: false,
    deliveryChannel: 'both',
    smsStatus: 'delivered'
  }
];

class SharedDatabase {
  private dbFilePath: string;
  private bookings: Booking[] = [];
  private technicians: Technician[] = [];
  private customers: CustomerRecord[] = [];
  private loggedInUsers: ActiveLoggedInUser[] = [];
  private messages: AdminMessage[] = [];
  private smsLogs: SmsLogEntry[] = [];
  private payoutLedger: PayoutLedgerEntry[] = [];
  private pesapalConfig: any = {
    mode: 'live',
    consumerKey: '',
    ipnId: ''
  };
  private pricing: any = {
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
  private sseClients: Set<(data: string) => void> = new Set();
  private mediaConfig: { showcase: any[] | null; featuredVideo: any | null } = {
    showcase: null,
    featuredVideo: null
  };

  constructor() {
    this.dbFilePath = path.resolve(process.cwd(), 'data', 'app-database.json');
    this.initDatabase();
  }

  private async initDatabase() {
    const seed: AppDatabaseState = {
      updatedAt: Date.now(),
      bookings: INITIAL_SEED_BOOKINGS,
      technicians: INITIAL_SEED_TECHNICIANS,
      customers: [],
      loggedInUsers: [],
      messages: INITIAL_SEED_MESSAGES,
      smsLogs: [],
      payoutLedger: [],
      pesapalConfig: this.pesapalConfig,
      pricing: this.pricing,
      mediaConfig: this.mediaConfig
    };

    try {
      const loaded = await cloudStore.loadState(seed);
      if (loaded) {
        this.bookings = loaded.bookings || INITIAL_SEED_BOOKINGS;
        this.technicians = loaded.technicians || INITIAL_SEED_TECHNICIANS;
        this.customers = loaded.customers || [];
        this.loggedInUsers = loaded.loggedInUsers || [];
        this.messages = loaded.messages || INITIAL_SEED_MESSAGES;
        this.smsLogs = loaded.smsLogs || [];
        this.payoutLedger = loaded.payoutLedger || [];
        if (loaded.pesapalConfig) this.pesapalConfig = { ...this.pesapalConfig, ...loaded.pesapalConfig };
        if (loaded.pricing) this.pricing = { ...this.pricing, ...loaded.pricing };
        if (loaded.mediaConfig) this.mediaConfig = { ...this.mediaConfig, ...loaded.mediaConfig };
        this.checkAndEnforcePassExpiry();
      }
    } catch (e) {
      console.warn('Initial cloud database load notice:', e);
    }
  }

  // Persists state to CloudStore (Vercel KV / Supabase / Firebase / Cloud Memory)
  // Strictly avoids fs disk writes on Vercel to eliminate EROFS/ENOENT crashes
  public saveToDisk() {
    const data: AppDatabaseState = {
      updatedAt: Date.now(),
      bookings: this.bookings,
      technicians: this.technicians,
      customers: this.customers,
      loggedInUsers: this.loggedInUsers,
      messages: this.messages,
      smsLogs: this.smsLogs,
      payoutLedger: this.payoutLedger,
      pesapalConfig: this.pesapalConfig,
      pricing: this.pricing,
      mediaConfig: this.mediaConfig
    };

    cloudStore.saveState(data).catch(() => {});
  }

  public getCloudStatus() {
    return cloudStore.getStatus();
  }

  public getMediaConfig() {
    return this.mediaConfig;
  }

  public updateMediaConfig(cfg: { showcase?: any[] | null; featuredVideo?: any | null }) {
    this.mediaConfig = {
      ...this.mediaConfig,
      showcase: cfg.showcase !== undefined ? cfg.showcase : this.mediaConfig.showcase,
      featuredVideo: cfg.featuredVideo !== undefined ? cfg.featuredVideo : this.mediaConfig.featuredVideo
    };
    this.saveToDisk();
    this.broadcast('showcase:updated', this.mediaConfig);
    this.broadcast('sync', { type: 'media_updated', mediaConfig: this.mediaConfig });
    return this.mediaConfig;
  }

  public getPesapalConfig() {
    return this.pesapalConfig;
  }

  public updatePesapalConfig(cfg: any) {
    this.pesapalConfig = { ...this.pesapalConfig, ...cfg, updatedAt: Date.now() };
    this.saveToDisk();
    this.broadcast('pesapal:config_updated', this.pesapalConfig);
  }

  public getPricing() {
    return this.pricing;
  }

  public updatePricing(updates: any) {
    const techSplit = Number(updates.technicianPayoutPercent ?? updates.technicianSplitPercent ?? this.pricing.technicianPayoutPercent ?? 85);
    const platSplit = Number(updates.platformCommissionPercent ?? updates.platformSplitPercent ?? (100 - techSplit));
    const regFee = Number(updates.technicianRegistrationPriceKsh ?? updates.technicianRegPriceKsh ?? updates.technicianMembershipFeeKsh ?? this.pricing.technicianRegistrationPriceKsh ?? 150);
    const custPass = Number(updates.customerPassPriceKsh ?? this.pricing.customerPassPriceKsh ?? 50);
    const techPass = Number(updates.technicianPassPriceKsh ?? updates.technicianLoginFeeKsh ?? this.pricing.technicianPassPriceKsh ?? 50);

    this.pricing = {
      ...this.pricing,
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
      itemPrices: { ...(this.pricing.itemPrices || {}), ...(updates.itemPrices || {}) }
    };
    this.saveToDisk();
    this.broadcast('pricing:updated', this.pricing);
    this.broadcast('sync', { type: 'pricing_updated', pricing: this.pricing });
    return this.pricing;
  }

  // SSE Subscription handler
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

  // --- PASS EXPIRY AUTOMATION ---
  public checkAndEnforcePassExpiry() {
    const now = Date.now();
    let changed = false;
    this.technicians = this.technicians.map(t => {
      const expiry = t.pass_expiry_date || t.memberExpiresAt || (now + 30 * 24 * 3600 * 1000);
      const isExpired = expiry <= now;
      const status: PassStatus = isExpired ? 'expired' : 'active';
      if (t.pass_status !== status) {
        changed = true;
        return {
          ...t,
          pass_status: status,
          isMonthlyMember: !isExpired,
          isVisibleToCustomers: !isExpired
        };
      }
      return t;
    });
    if (changed) {
      this.saveToDisk();
    }
  }

  // --- BOOKINGS & OPEN JOB MARKETPLACE ---
  public getBookings(): Booking[] {
    return this.bookings;
  }

  // Unclaimed / Posted Jobs Feed visible to all available technicians
  public getOpenJobs(): Booking[] {
    return this.bookings.filter(b => 
      (b.technicianId === 'unassigned' || !b.technicianId || b.status === 'requested') &&
      b.status !== 'completed'
    );
  }

  public createBooking(booking: Booking): Booking {
    const idx = this.bookings.findIndex(b => b.id === booking.id);
    if (idx >= 0) {
      this.bookings[idx] = { ...this.bookings[idx], ...booking };
    } else {
      this.bookings = [booking, ...this.bookings];
    }
    this.saveToDisk();
    this.broadcast('booking:created', booking);

    // TRIGGER OFFLINE SMS ALERTS:
    // When a customer posts a new job, send instant SMS alert to nearby/available technicians
    if (booking.technicianId && booking.technicianId !== 'unassigned') {
      const tech = this.technicians.find(t => t.id === booking.technicianId);
      if (tech) {
        this.sendOfflineSmsAlert(
          tech.phone,
          tech.name,
          `NEW JOB ASSIGNED: #${booking.id} at ${booking.estate}. Customer: ${booking.customerName} (${booking.customerPhone}). Open portal to accept.`,
          'job_alert'
        );
      }
    } else {
      // Broadcast SMS alert to active online technicians for open marketplace job
      const activeTechs = this.technicians.filter(t => t.isOnline && !t.isBlocked && t.pass_status === 'active');
      activeTechs.slice(0, 3).forEach(tech => {
        this.sendOfflineSmsAlert(
          tech.phone,
          tech.name,
          `OPEN JOB ALERT: New repair request #${booking.id} in ${booking.estate}. Est: Ksh. ${booking.estimatedTotalKsh}. Claim now in portal.`,
          'job_alert'
        );
      });
    }

    return booking;
  }

  // ASSIGNMENT LOCK: Lock job exclusively to the claiming technician and remove from open feed
  public claimJob(bookingId: string, technicianId: string, technicianName: string, technicianPhone: string): Booking | null {
    const idx = this.bookings.findIndex(b => b.id === bookingId);
    if (idx < 0) return null;

    const current = this.bookings[idx];
    const updated: Booking = {
      ...current,
      technicianId,
      technicianName,
      technicianPhone,
      status: 'accepted',
      isCustomBroadcast: false,
      technicianLiveLocation: {
        latitude: -1.2864,
        longitude: 36.8172,
        currentRoadOrEstate: `En Route to ${current.estate}`,
        speedKmh: 42,
        heading: 'Dispatched',
        lastUpdated: Date.now(),
        distanceKm: 2.5,
        etaMinutes: 15,
        progressPercent: 25,
        vehicleType: 'Service Rapid Unit'
      }
    };

    this.bookings[idx] = updated;
    this.saveToDisk();

    // Broadcast assignment lock so all other technicians immediately see it disappear from the open feed
    this.broadcast('job:claimed', { bookingId, technicianId, technicianName });
    this.broadcast('booking:updated', updated);

    // Send confirmation SMS to customer & technician
    this.sendOfflineSmsAlert(
      current.customerPhone,
      current.customerName,
      `Technician ${technicianName} (${technicianPhone}) has accepted your repair Job #${bookingId} and is en route!`,
      'job_alert'
    );

    return updated;
  }

  // ADMIN LIVE DISPATCH: Admin assigns technician directly, updating live details, location, and charges in real time
  public dispatchJob(bookingId: string, technicianId: string, technicianName: string, technicianPhone: string): Booking | null {
    const idx = this.bookings.findIndex(b => b.id === bookingId);
    if (idx < 0) return null;

    const current = this.bookings[idx];
    const tech = this.technicians.find(t => t.id === technicianId || phonesMatch(t.phone, technicianPhone));
    const resolvedName = technicianName || tech?.name || 'Assigned Lead Specialist';
    const resolvedPhone = technicianPhone || tech?.phone || '+254711408365';

    const updated: Booking = {
      ...current,
      technicianId,
      technicianName: resolvedName,
      technicianPhone: resolvedPhone,
      status: 'accepted',
      isCustomBroadcast: false,
      scheduledTime: `Dispatched immediately by Central Operations (ETA ~${tech?.etaMinutes || 18} mins)`,
      technicianLiveLocation: {
        latitude: -1.2864,
        longitude: 36.8172,
        currentRoadOrEstate: `Dispatched & En Route to ${current.estate}`,
        speedKmh: 45,
        heading: 'Central Rapid Dispatch',
        lastUpdated: Date.now(),
        distanceKm: tech?.distanceKm || 2.4,
        etaMinutes: tech?.etaMinutes || 18,
        progressPercent: 30,
        vehicleType: 'Service Rapid Dispatch Unit'
      }
    };

    this.bookings[idx] = updated;
    this.saveToDisk();

    // Broadcast live dispatch immediately to all connected devices in real time
    this.broadcast('job:dispatched', { bookingId, technicianId, technicianName: resolvedName, booking: updated });
    this.broadcast('booking:updated', updated);
    this.broadcast('sync', { type: 'booking_dispatched', bookingId });

    // Send offline SMS alerts to technician and customer
    this.sendOfflineSmsAlert(
      resolvedPhone,
      resolvedName,
      `CENTRAL DISPATCH: You have been assigned Job #${bookingId} at ${current.estate}. Customer: ${current.customerName} (${current.customerPhone}). Value: Ksh. ${current.estimatedTotalKsh}. Proceed immediately!`,
      'job_alert'
    );

    this.sendOfflineSmsAlert(
      current.customerPhone,
      current.customerName,
      `DISPATCH CONFIRMATION: Specialist ${resolvedName} (${resolvedPhone}) has been assigned to your repair Job #${bookingId} and is en route!`,
      'job_alert'
    );

    return updated;
  }

  public updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const idx = this.bookings.findIndex(b => b.id === id);
    if (idx < 0) return null;

    const current = this.bookings[idx];
    const updated: Booking = { ...current, ...updates };

    if (updates.status === 'accepted' || updates.status === 'en_route') {
      if (!updated.technicianLiveLocation) {
        updated.technicianLiveLocation = {
          latitude: -1.2864,
          longitude: 36.8172,
          currentRoadOrEstate: `Approaching ${updated.estate}`,
          speedKmh: 40,
          heading: 'En Route',
          lastUpdated: Date.now(),
          distanceKm: 2.2,
          etaMinutes: 15,
          progressPercent: 30,
          vehicleType: 'Mobile Service Van'
        };
      }
    }

    // JOB COMPLETION TRIGGER:
    if (updates.status === 'completed' && current.status !== 'completed') {
      updated.completedAt = Date.now();
      // Broadcast prompt event to customer phone immediately
      this.broadcast('job:completed', {
        bookingId: id,
        customerPhone: updated.customerPhone,
        estimatedTotalKsh: updated.estimatedTotalKsh,
        technicianName: updated.technicianName
      });
    }

    this.bookings[idx] = updated;
    this.saveToDisk();
    this.broadcast('booking:updated', updated);
    return updated;
  }

  // --- PRIVACY & ROLE-BASED ACCESS CONTROL (RBAC) ---
  // Public directory for customers: Strictly strips National IDs, password tokens, admin balances
  public getPublicTechnicians(): Partial<Technician>[] {
    return this.technicians
      .filter(t => !t.isBlocked && t.isVisibleToCustomers !== false && t.pass_status !== 'expired')
      .map(t => {
        // Strip sensitive data
        const { nationalIdOrPassport, ...publicTech } = t;
        return publicTech;
      });
  }

  // Full technicians list: Admin access only
  public getAdminTechnicians(): Technician[] {
    return this.technicians;
  }

  public getTechnicians(): Technician[] {
    return this.technicians;
  }

  public addOrUpdateTechnician(tech: Technician): Technician {
    const techId = tech.id && tech.id.trim() && !tech.id.startsWith('tech-temp')
      ? tech.id.trim()
      : `tech-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const idx = this.technicians.findIndex(
      t => t.id === techId || phonesMatch(t.phone, tech.phone)
    );

    const thirtyDays = 30 * 24 * 3600 * 1000;
    const now = Date.now();
    const expiry = tech.pass_expiry_date || tech.memberExpiresAt || (now + thirtyDays);

    const enforcedTech: Technician = {
      ...tech,
      id: idx >= 0 ? this.technicians[idx].id : techId,
      name: (tech.name || '').trim(),
      phone: (tech.phone || '').trim(),
      isVisibleToCustomers: true,
      isMonthlyMember: true,
      isBlocked: false,
      isOnline: true,
      pass_status: expiry > now ? 'active' : 'expired',
      pass_start_date: tech.pass_start_date || now,
      pass_expiry_date: expiry,
      membership_type: tech.membership_type || 'monthly',
      is_free_pass: tech.is_free_pass ?? false,
      specialties: tech.specialties && tech.specialties.length > 0
        ? tech.specialties
        : ['electrical', 'refrigeration', 'appliances', 'pumps'],
      memberExpiresAt: expiry,
      registeredAt: tech.registeredAt || now
    };

    if (idx >= 0) {
      this.technicians[idx] = { ...this.technicians[idx], ...enforcedTech };
    } else {
      this.technicians = [enforcedTech, ...this.technicians];
    }

    this.saveToDisk();
    this.broadcast('technician:updated', enforcedTech);
    this.broadcast('sync', { type: 'technicians_updated', count: this.technicians.length });
    return enforcedTech;
  }

  public deleteTechnician(id: string): boolean {
    const before = this.technicians.length;
    this.technicians = this.technicians.filter(t => t.id !== id);
    if (this.technicians.length !== before) {
      this.saveToDisk();
      this.broadcast('technician:deleted', { id });
      return true;
    }
    return false;
  }

  // --- ADMIN MESSAGING SUITE ---
  public getAllMessages(): AdminMessage[] {
    return this.messages;
  }

  public getMessagesForTechnician(techId: string, phone?: string): AdminMessage[] {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    return this.messages.filter(m => 
      m.receiverTechnicianId === 'all_broadcast' ||
      m.receiverTechnicianId === techId ||
      (cleanPhone && m.receiverPhone && m.receiverPhone.replace(/\D/g, '').includes(cleanPhone)) ||
      (m.sender === 'technician' && m.receiverTechnicianId === techId)
    );
  }

  public postAdminMessage(params: {
    sender: 'admin' | 'technician';
    senderName: string;
    receiverTechnicianId: string; // 'all_broadcast' or specific techId
    receiverName?: string;
    receiverPhone?: string;
    message: string;
    deliveryChannel?: 'in_app' | 'sms' | 'both';
    isRead?: boolean;
  }): AdminMessage {
    const newMsg: AdminMessage = {
      id: 'MSG-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().slice(-4),
      sender: params.sender,
      senderName: params.senderName,
      receiverTechnicianId: params.receiverTechnicianId,
      receiverName: params.receiverName,
      receiverPhone: params.receiverPhone,
      message: params.message,
      timestamp: Date.now(),
      isRead: false,
      deliveryChannel: params.deliveryChannel || 'both',
      smsStatus: params.deliveryChannel === 'in_app' ? undefined : 'delivered'
    };

    this.messages = [newMsg, ...this.messages];
    this.saveToDisk();

    // Broadcast in real-time
    this.broadcast('message:new', newMsg);

    // If SMS channel requested: send offline SMS alerts
    if (params.deliveryChannel !== 'in_app') {
      if (params.receiverTechnicianId === 'all_broadcast') {
        const activeTechs = this.technicians.filter(t => !t.isBlocked);
        activeTechs.forEach(t => {
          this.sendOfflineSmsAlert(t.phone, t.name, `[CENTRAL DISPATCH] ${params.message}`, 'admin_broadcast');
        });
      } else if (params.receiverPhone) {
        this.sendOfflineSmsAlert(params.receiverPhone, params.receiverName, `[DIRECT MSG] ${params.message}`, 'direct_chat');
      }
    }

    return newMsg;
  }

  // --- OFFLINE SMS ALERTS ENGINE ---
  public sendOfflineSmsAlert(
    recipientPhone: string,
    recipientName: string | undefined,
    message: string,
    type: 'job_alert' | 'admin_broadcast' | 'direct_chat' | 'payout_alert'
  ): SmsLogEntry {
    const logEntry: SmsLogEntry = {
      id: 'SMS-' + Math.random().toString(36).substring(2, 7).toUpperCase() + Date.now().toString().slice(-4),
      recipientPhone,
      recipientName,
      message,
      type,
      sentAt: Date.now(),
      status: 'delivered',
      gateway: 'africas_talking'
    };

    this.smsLogs = [logEntry, ...this.smsLogs];
    this.saveToDisk();
    this.broadcast('sms:logged', logEntry);
    return logEntry;
  }

  public getSmsLogs(): SmsLogEntry[] {
    return this.smsLogs;
  }

  // --- AUTOMATED 85/15 SINGLE-TECHNICIAN PAYOUT LEDGER ---
  public recordPayout(params: {
    bookingId: string;
    technicianId: string;
    technicianName: string;
    technicianPhone: string;
    customerName: string;
    customerPhone: string;
    totalAmountKsh: number;
    platformFee15Ksh: number;
    technicianShare85Ksh: number;
    payoutStatus?: 'completed' | 'processing' | 'failed';
    payoutChannel?: 'mpesa_b2c' | 'pesapal_payout';
    transactionReference?: string;
    itemSummary?: string;
  }): PayoutLedgerEntry {
    const entry: PayoutLedgerEntry = {
      id: 'PAYOUT-' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString().slice(-4),
      bookingId: params.bookingId,
      technicianId: params.technicianId,
      technicianName: params.technicianName,
      technicianPhone: params.technicianPhone,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      totalAmountKsh: params.totalAmountKsh,
      platformFee15Ksh: params.platformFee15Ksh,
      technicianShare85Ksh: params.technicianShare85Ksh,
      payoutStatus: 'completed',
      payoutChannel: params.payoutChannel || 'mpesa_b2c',
      transactionReference: params.transactionReference || ('B2C' + Math.floor(10000000 + Math.random() * 90000000)),
      disbursedAt: Date.now(),
      itemSummary: params.itemSummary || 'Repair Workmanship'
    };

    this.payoutLedger = [entry, ...this.payoutLedger];
    this.saveToDisk();

    // Trigger instant SMS alert to that specific technician for their 85% share
    this.sendOfflineSmsAlert(
      params.technicianPhone,
      params.technicianName,
      `PAYOUT CONFIRMATION: Ksh. ${params.technicianShare85Ksh} disbursed to your M-Pesa (${entry.transactionReference}) for completed Job #${params.bookingId}. (15% platform split retained).`,
      'payout_alert'
    );

    this.broadcast('payout:completed', entry);
    return entry;
  }

  public getPayoutLedger(): PayoutLedgerEntry[] {
    return this.payoutLedger;
  }

  // --- CUSTOMERS & LOGGED IN SESSIONS ---
  public getCustomers(): CustomerRecord[] {
    return this.customers;
  }

  public addOrUpdateCustomer(cust: CustomerRecord): CustomerRecord {
    const custId = cust.id && cust.id.trim() ? cust.id.trim() : `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const idx = this.customers.findIndex(
      c => c.id === custId || phonesMatch(c.phone, cust.phone)
    );

    const updatedCust: CustomerRecord = {
      ...cust,
      id: idx >= 0 ? this.customers[idx].id : custId,
      name: (cust.name || '').trim(),
      phone: (cust.phone || '').trim()
    };

    if (idx >= 0) {
      this.customers[idx] = { ...this.customers[idx], ...updatedCust };
    } else {
      this.customers = [updatedCust, ...this.customers];
    }
    this.saveToDisk();
    this.broadcast('customer:updated', updatedCust);
    this.broadcast('sync', { type: 'customers_updated' });
    return updatedCust;
  }

  public deleteCustomer(id: string): boolean {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveToDisk();
    this.broadcast('sync', { type: 'customers_updated' });
    return true;
  }

  public getLoggedInUsers(): ActiveLoggedInUser[] {
    return this.loggedInUsers;
  }

  public addOrUpdateLoggedInUser(user: ActiveLoggedInUser): ActiveLoggedInUser {
    const idx = this.loggedInUsers.findIndex(
      u => phonesMatch(u.phone, user.phone) && u.role === user.role
    );

    const cleanUser: ActiveLoggedInUser = {
      ...user,
      id: idx >= 0 ? this.loggedInUsers[idx].id : (user.id || `LOG-${Date.now().toString(36).toUpperCase()}`),
      name: (user.name || '').trim(),
      phone: (user.phone || '').trim()
    };

    if (idx >= 0) {
      this.loggedInUsers[idx] = { ...this.loggedInUsers[idx], ...cleanUser };
    } else {
      this.loggedInUsers = [cleanUser, ...this.loggedInUsers];
    }
    this.saveToDisk();
    this.broadcast('user:login', cleanUser);
    this.broadcast('sync', { type: 'users_updated' });
    return cleanUser;
  }

  // --- PASS VALIDATION & FEE EXEMPTION ENGINE (USER REQUIREMENT) ---
  // Check if phone has an active unexpired pass in database.
  // If current_timestamp < pass_expiry_date: strictly SET is_fee_required = false!
  public validatePass(phone: string, role?: string): {
    hasActivePass: boolean;
    is_fee_required: boolean;
    pass_status: 'active' | 'expired';
    pass_start_date?: number;
    pass_expiry_date?: number;
    remainingHours?: number;
    remainingDays?: number;
    role: string;
    name: string;
    phone: string;
    technician?: Technician;
    source: string;
  } {
    const now = Date.now();
    const cleanDigits = normalizePhone(phone);

    if (!cleanDigits || cleanDigits.length < 6) {
      return {
        hasActivePass: false,
        is_fee_required: true,
        pass_status: 'expired',
        role: role || 'customer',
        name: '',
        phone: phone || '',
        source: 'invalid_number'
      };
    }

    // 1. Check Technician membership
    if (role === 'technician' || !role) {
      const tech = this.technicians.find(t => phonesMatch(t.phone, phone) && !t.isBlocked);
      if (tech) {
        const expiry = tech.pass_expiry_date || tech.memberExpiresAt || (tech.registeredAt ? tech.registeredAt + 30 * 24 * 3600 * 1000 : 0);
        const isActive = (tech.pass_status === 'active' || tech.is_free_pass || tech.isMonthlyMember) && expiry > now;
        if (isActive) {
          return {
            hasActivePass: true,
            is_fee_required: false,
            pass_status: 'active',
            pass_start_date: tech.pass_start_date || (now - 24 * 3600 * 1000),
            pass_expiry_date: expiry,
            remainingHours: Math.max(1, Math.round((expiry - now) / 3600000)),
            remainingDays: Math.max(1, Math.ceil((expiry - now) / (24 * 3600000))),
            role: 'technician',
            name: tech.name,
            phone: tech.phone,
            technician: tech,
            source: 'Verified Database Technician Membership (30-Day Active)'
          };
        }
      }
    }

    // 2. Check Active Logged-in Users list
    const logged = this.loggedInUsers.find(
      u => phonesMatch(u.phone, phone) && (!role || u.role === role) && u.activeUntil > now && u.isActive !== false
    );
    if (logged) {
      const expiry = logged.activeUntil;
      return {
        hasActivePass: true,
        is_fee_required: false,
        pass_status: 'active',
        pass_start_date: logged.loggedInAt,
        pass_expiry_date: expiry,
        remainingHours: Math.max(1, Math.round((expiry - now) / 3600000)),
        remainingDays: Math.max(1, Math.ceil((expiry - now) / (24 * 3600000))),
        role: logged.role,
        name: logged.name,
        phone: logged.phone,
        source: 'Active Database User Session Pass'
      };
    }

    // 3. Check Customers directory
    const cust = this.customers.find(
      c => phonesMatch(c.phone, phone) && !c.isBlocked && c.activeUntil && c.activeUntil > now
    );
    if (cust) {
      const expiry = cust.activeUntil!;
      return {
        hasActivePass: true,
        is_fee_required: false,
        pass_status: 'active',
        pass_start_date: cust.registeredAt,
        pass_expiry_date: expiry,
        remainingHours: Math.max(1, Math.round((expiry - now) / 3600000)),
        remainingDays: Math.max(1, Math.ceil((expiry - now) / (24 * 3600000))),
        role: 'customer',
        name: cust.name,
        phone: cust.phone,
        source: 'Active Customer Database Pass'
      };
    }

    return {
      hasActivePass: false,
      is_fee_required: true,
      pass_status: 'expired',
      role: role || 'customer',
      name: '',
      phone: phone,
      source: 'expired_or_not_registered'
    };
  }
}

export const sharedDb = new SharedDatabase();
