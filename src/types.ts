export const BUSINESS_NAME = 'HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES';
export const OFFICE_PHONE = '+254711408365';
export const OFFICE_PHONE_DISPLAY = '+254 711 408 365';
export const OPERATING_LOCATIONS = ['Countrywide (Kenya)', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'];

export type UserRole = 'customer' | 'technician' | 'admin';
export const ADMIN_PASSWORD = 'homebased254.';

export interface TechnicianProfile {
  name: string;
  phone: string;
  email: string;
  nationalIdOrPassport?: string; // Valid National ID or Passport Number
  location: string;
  yearsOfExperience: number;
  repairableItemIds: string[];
  portfolioPhotos?: string[]; // Uploaded testimony photos of past repair work
  isMonthlyMember: boolean;
  memberExpiresAt?: number;
  registeredAt?: number;
}

export interface SessionPass {
  role: UserRole;
  activeUntil: number; // timestamp
  paidAt: number; // timestamp
  transactionId: string;
  phone: string;
  name: string;
  active: boolean;
  technicianProfile?: TechnicianProfile;
  paymentGateway?: 'pesapal';
  pesapalOrderTrackingId?: string;
  pesapalMerchantReference?: string;
  pesapalConfirmationCode?: string;
  pesapalPaymentAccount?: string;
  paymentChannel?: 'mpesa' | 'card' | 'airtel' | 'pesapal';
  amountPaidKsh?: number;
  amountPaidUsd?: number;
  isMonthlyMember?: boolean;
  memberExpiresAt?: number;
  is_direct_pass?: boolean;
  national_id?: string;
  is_approved?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export const PESAPAL_CURRENCY = 'KES';
export const KES_PER_USD = 130;

export function kshToUsd(ksh: number): number {
  return Number((ksh / KES_PER_USD).toFixed(2));
}

export type RepairCategory = 'refrigeration' | 'electrical' | 'appliances' | 'pumps';

export interface RepairItem {
  id: string;
  name: string;
  category: RepairCategory;
  categoryLabel: string;
  description: string;
  commonIssues: string[];
  typicalBrands: string[];
  baseEstimatedCostKsh: number;
  popular?: boolean;
}

export interface SelectedRepairItem {
  itemId: string;
  itemName: string;
  category: RepairCategory;
  selectedIssues: string[];
  brand: string;
  quantity: number;
  urgency: 'normal' | 'emergency' | 'scheduled';
  notes: string;
}

export type PassStatus = 'active' | 'expired' | 'grace_period' | 'free_pass';
export type MembershipType = 'free_trial' | 'monthly' | 'lifetime';

export interface Technician {
  id: string;
  name: string;
  photoUrl: string;
  roleTitle: string;
  specialties: RepairCategory[];
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
  portfolioPhotos?: string[]; // Testimony photos of completed repair projects
  isBlocked?: boolean;
  isMonthlyMember?: boolean; // Verified monthly membership (Ksh. 150)
  memberExpiresAt?: number;
  registeredAt?: number;
  isVisibleToCustomers?: boolean; // Admin can toggle active and visible to all customers
  repairableItemIds?: string[];
  nationalIdOrPassport?: string;
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
  role: UserRole;
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

export interface PricingConfig {
  customerPassPriceKsh: number;
  technicianPassPriceKsh: number;
  technicianRegistrationPriceKsh: number;
  technicianRegPriceKsh: number;
  technicianSplitPercent: number; // e.g. 85
  technicianPayoutPercent: number; // alias e.g. 85
  platformSplitPercent: number; // e.g. 15
  platformCommissionPercent: number; // alias e.g. 15
  itemPrices: Record<string, number>;
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
  technicianPayoutKsh?: number; // 85% allocated to technician
  platformCommissionKsh?: number; // 15% retained by platform
  disbursementStatus?: 'pending' | 'disbursed_to_technician';
  guaranteeDays?: number; // 30 days
  guaranteeExpiresAt?: number;
  isCustomBroadcast?: boolean;
  technicianLiveLocation?: TechnicianLiveLocation;
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
  progressPercent: number; // 0 to 100%
  vehicleType: string;
}

// ADMIN MESSAGING SUITE (Direct Chat & Group Broadcast Text)
export interface AdminMessage {
  id: string;
  sender: 'admin' | 'technician';
  senderName: string;
  receiverTechnicianId: string; // 'all_broadcast' or technician ID
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

// AUTOMATED 85/15 SINGLE-TECHNICIAN PAYOUT LEDGER
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

