import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Wrench,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  Radio,
  Check,
  Star,
  MapPin,
  Lock,
  Unlock,
  SlidersHorizontal,
  DollarSign,
  UserCheck,
  UserX,
  Calendar,
  X,
  FileText,
  BadgeCheck,
  Server,
  Eye,
  EyeOff,
  Camera,
  ExternalLink,
  Send,
  Smartphone,
  Receipt,
  Inbox,
  BellRing,
  Sparkles
} from 'lucide-react';
import {
  Booking,
  SessionPass,
  Technician,
  CustomerRecord,
  PricingConfig,
  RepairItem,
  ActiveLoggedInUser,
  AdminMessage,
  SmsLogEntry,
  PayoutLedgerEntry,
  BUSINESS_NAME,
  OFFICE_PHONE,
  OFFICE_PHONE_DISPLAY,
  OPERATING_LOCATIONS,
  ADMIN_PASSWORD
} from '../types';
import {
  getStoredBookings,
  saveBooking,
  updateBookingStatus,
  markBookingPaid,
  getStoredPricing,
  savePricing,
  savePricingToServer,
  fetchPricingFromServer,
  getStoredTechnicians,
  saveTechnicians,
  addOrUpdateTechnician,
  saveTechnicianToServer,
  deleteTechnician,
  toggleBlockTechnician,
  toggleTechnicianVisibility,
  activateTechnicianMembershipPass,
  getStoredCustomers,
  saveCustomers,
  addOrUpdateCustomer,
  deleteCustomer,
  saveCustomerToServer,
  deleteCustomerFromServer,
  fetchCustomersFromServer,
  toggleBlockCustomer,
  toggleCustomerVisibility,
  activateCustomerPass,
  getStoredLoggedInUsers,
  toggleLoggedInUserVisibility,
  activateLoggedInUserPass,
  formatTimeRemaining,
  fetchAdminMessages,
  sendAdminMessage,
  fetchPayoutLedger,
  fetchSmsLogs,
  renewTechnicianPass,
  dispatchJobToServer,
  fetchCloudStatus,
  approveTechnicianOnServer
} from '../utils/session';
import { REPAIR_ITEMS } from '../data/repairItems';
import { AdminMediaStudio } from './AdminMediaStudio';

interface AdminPortalProps {
  session: SessionPass;
  onBackToHome: () => void;
  onNavigateToCustomer?: () => void;
  onNavigateToTechnician?: () => void;
  onOpenPesapalHub?: () => void;
  onOpenHostModal?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  session,
  onBackToHome,
  onNavigateToCustomer,
  onNavigateToTechnician,
  onOpenPesapalHub,
  onOpenHostModal
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'sessions' | 'technicians' | 'customers' | 'pricing' | 'completed_archive' | 'messages' | 'payouts' | 'media'>('bookings');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  // Logged in users state
  const [loggedInUsers, setLoggedInUsers] = useState<ActiveLoggedInUser[]>([]);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');

  // Technicians state
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [techSearch, setTechSearch] = useState<string>('');
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechRole, setNewTechRole] = useState('Highly Qualified Electrical & Refrigeration Specialist');
  const [newTechLicense, setNewTechLicense] = useState('Highly Qualified Certified Specialist');
  const [newTechEstate, setNewTechEstate] = useState('Nairobi - Westlands & Parklands');
  const [newTechExp, setNewTechExp] = useState(8);
  const [newTechFee, setNewTechFee] = useState(1600);

  // Customers state
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEstate, setNewCustEstate] = useState('Nairobi - Kilimani & Kileleshwa');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Pricing config state
  const [pricing, setPricing] = useState<PricingConfig>(getStoredPricing());
  const [savePricingSuccess, setSavePricingSuccess] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSaveError, setPricingSaveError] = useState<string | null>(null);

  // Admin Messaging Suite state
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLogEntry[]>([]);
  const [msgTargetType, setMsgTargetType] = useState<'broadcast' | 'direct'>('broadcast');
  const [msgSelectedTechId, setMsgSelectedTechId] = useState<string>('');
  const [msgText, setMsgText] = useState<string>('');
  const [msgDeliveryChannel, setMsgDeliveryChannel] = useState<'in_app' | 'sms' | 'both'>('both');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const [msgSendStatus, setMsgSendStatus] = useState<string | null>(null);
  const [messageViewSubtab, setMessageViewSubtab] = useState<'feed' | 'sms_logs'>('feed');

  // 85/15 Payout Ledger state
  const [payoutLedger, setPayoutLedger] = useState<PayoutLedgerEntry[]>([]);
  const [payoutSearch, setPayoutSearch] = useState<string>('');
  const [cloudStatus, setCloudStatus] = useState<any>(null);

  const loadAllData = async (forcePricing: boolean = false) => {
    setBookings(getStoredBookings());
    setTechnicians(getStoredTechnicians());
    setCustomers(getStoredCustomers());
    if (forcePricing || activeTab !== 'pricing') {
      setPricing(getStoredPricing());
    }
    setLoggedInUsers(getStoredLoggedInUsers());
    
    // Fetch directly from admin backend endpoints to ensure zero data drop across devices
    try {
      const res = await fetch('/api/admin/technicians');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.technicians) && data.technicians.length > 0) {
          setTechnicians(data.technicians);
          saveTechnicians(data.technicians);
        }
      }
    } catch {}

    try {
      const custRes = await fetch('/api/customers');
      if (custRes.ok) {
        const cData = await custRes.json();
        if (Array.isArray(cData.customers)) {
          setCustomers(cData.customers);
          saveCustomers(cData.customers);
        }
      }
    } catch {}

    if (forcePricing || activeTab !== 'pricing') {
      try {
        const pRes = await fetch('/api/pricing');
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && pData.pricing) {
            setPricing(pData.pricing);
          }
        }
      } catch {}
    }

    fetchAdminMessages().then(msgs => setAdminMessages(msgs)).catch(() => {});
    fetchSmsLogs().then(logs => setSmsLogs(logs)).catch(() => {});
    fetchPayoutLedger().then(p => setPayoutLedger(p)).catch(() => {});
    fetchCloudStatus().then(st => { if (st) setCloudStatus(st); }).catch(() => {});
  };

  useEffect(() => {
    loadAllData(true);
    const interval = setInterval(() => {
      loadAllData(false);
    }, 3000);

    const handleSync = () => {
      loadAllData(false);
    };
    window.addEventListener('app_data_sync', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app_data_sync', handleSync);
    };
  }, [activeTab]);

  // Update booking status
  const handleUpdateStatus = (id: string, newStatus: Booking['status']) => {
    const updated = updateBookingStatus(id, newStatus);
    setBookings(updated);
  };

  // Mark booking paid (with 85% to tech / 15% to platform)
  const handleMarkBookingPaid = (id: string, amount: number) => {
    const res = markBookingPaid(id, amount);
    setBookings(res.updatedBookings);
  };

  // Dispatch job directly from admin dashboard
  const handleDispatchJob = async (bookingId: string, techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;
    await dispatchJobToServer(bookingId, tech.id, tech.name, tech.phone);
    loadAllData();
  };

  // Add Technician with guaranteed database persistence and active 30-day pass
  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim() || !newTechPhone.trim()) return;

    const thirtyDays = 30 * 24 * 3600 * 1000;
    const expiresAt = Date.now() + thirtyDays;

    const newTech: Technician = {
      id: 'tech-' + Date.now(),
      name: newTechName.trim(),
      photoUrl: '/assets/images/tech_electrical_wiring_1791787974895.jpg',
      roleTitle: newTechRole,
      specialties: ['electrical', 'refrigeration', 'appliances', 'pumps'],
      licenseType: newTechLicense,
      licenseNumber: 'CERT/' + Math.floor(1000 + Math.random() * 9000),
      experienceYears: Number(newTechExp) || 5,
      rating: 4.95,
      reviewsCount: 12,
      location: 'Nairobi',
      estate: newTechEstate,
      distanceKm: 3.0,
      etaMinutes: 20,
      isOnline: true,
      inspectionFeeKsh: Number(newTechFee) || 1600,
      hourlyRateKsh: 1200,
      phone: newTechPhone.trim(),
      tools: ['Digital Multimeter', 'Manifold Gauges', 'Insulation Megger'],
      badges: ['Verified License', 'Security Checked', 'Active 30-Day Pass'],
      recentJobs: ['Electrical fault tracing', 'Fridge compressor repair'],
      bio: 'Highly qualified vetted specialist with calibrated diagnostic tools and test equipment.',
      isBlocked: false,
      isVisibleToCustomers: true,
      isMonthlyMember: true,
      pass_status: 'active',
      pass_start_date: Date.now(),
      pass_expiry_date: expiresAt,
      membership_type: 'monthly',
      is_free_pass: false,
      memberExpiresAt: expiresAt,
      registeredAt: Date.now()
    };

    // 1. Save directly to primary database and await confirmation
    await saveTechnicianToServer(newTech);

    await loadAllData();
    setIsAddTechModalOpen(false);
    setNewTechName('');
    setNewTechPhone('');
  };

  // Delete Technician
  const handleDeleteTechnician = async (techId: string) => {
    if (confirm('Are you sure you want to remove this technician from the roster?')) {
      const updated = deleteTechnician(techId);
      setTechnicians(updated);
      try {
        await fetch(`/api/technicians/${encodeURIComponent(techId)}`, { method: 'DELETE' });
      } catch {}
      await loadAllData();
    }
  };

  // Toggle Block Technician
  const handleToggleBlockTech = (techId: string) => {
    const updated = toggleBlockTechnician(techId);
    setTechnicians(updated);
  };

  // Approve Direct Pass Technician (make visible to customers and active)
  const [approvingTechId, setApprovingTechId] = useState<string | null>(null);
  const handleApproveDirectPass = async (techId: string) => {
    setApprovingTechId(techId);
    try {
      const res = await approveTechnicianOnServer(techId);
      if (res.success) {
        await loadAllData();
      }
    } finally {
      setApprovingTechId(null);
    }
  };

  // Add Customer (Confirmed by central database)
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newCust: CustomerRecord = {
      id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      estate: newCustEstate,
      addressDetails: newCustAddress || 'Standard Estate House',
      registeredAt: Date.now(),
      totalBookings: 0,
      isBlocked: false,
      isVisible: true,
      isActivePass: true
    };

    const res = await saveCustomerToServer(newCust);
    if (res.success && res.customers) {
      setCustomers(res.customers);
    } else {
      const updated = addOrUpdateCustomer(newCust);
      setCustomers(updated);
    }
    await loadAllData();
    setIsAddCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Delete Customer (Confirmed by central database)
  const handleDeleteCustomer = async (custId: string) => {
    if (confirm('Are you sure you want to delete this customer record?')) {
      const res = await deleteCustomerFromServer(custId);
      if (res.success && res.customers) {
        setCustomers(res.customers);
      } else {
        const updated = deleteCustomer(custId);
        setCustomers(updated);
      }
      await loadAllData();
    }
  };

  // Toggle Block Customer
  const handleToggleBlockCustomer = async (custId: string) => {
    const updated = toggleBlockCustomer(custId);
    setCustomers(updated);
    await loadAllData();
  };

  // Save Pricing Changes with explicit database confirmation
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    setPricingSaveError(null);
    setSavePricingSuccess(false);

    try {
      const result = await savePricingToServer(pricing);
      if (result.success && result.pricing) {
        setPricing(result.pricing);
        setSavePricingSuccess(true);
        setTimeout(() => setSavePricingSuccess(false), 4000);
      } else {
        setPricingSaveError(result.error || 'The central database could not confirm this change. Please verify network and server connectivity.');
      }
    } catch (err: any) {
      setPricingSaveError('Failed to save to database: ' + (err.message || 'Network connection failed'));
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Send Admin Message / Broadcast
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setIsSendingMsg(true);
    setMsgSendStatus(null);

    try {
      let recName = 'All Active Technicians (Broadcast)';
      let recPhone = '';
      if (msgTargetType === 'direct') {
        const found = technicians.find(t => t.id === msgSelectedTechId);
        if (found) {
          recName = found.name;
          recPhone = found.phone;
        }
      }

      const created = await sendAdminMessage({
        receiverTechnicianId: msgTargetType === 'broadcast' ? 'broadcast' : (msgSelectedTechId || 'broadcast'),
        receiverName: recName,
        receiverPhone: recPhone,
        message: msgText.trim(),
        deliveryChannel: msgDeliveryChannel,
        sender: 'admin',
        senderName: 'Central Operations Dispatch'
      });

      if (created) {
        setMsgText('');
        setMsgSendStatus('Message dispatched successfully via in-app sync and offline SMS alert gateway.');
        loadAllData();
        setTimeout(() => setMsgSendStatus(null), 4000);
      } else {
        setMsgSendStatus('Failed to deliver message. Please retry.');
      }
    } catch {
      setMsgSendStatus('Network error while dispatching message.');
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = bookingFilterStatus === 'all' || b.status === bookingFilterStatus;
    const matchesSearch =
      b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customerPhone.includes(bookingSearch) ||
      b.estate.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(bookingSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Completed jobs archive (disappeared from technician board, only visible to administrator)
  const completedJobs = bookings.filter(b => b.status === 'completed');

  // Metrics
  const totalRevenuePaidKsh = bookings.reduce((sum, b) => sum + (b.paidAmountKsh || 0), 0);
  const totalTechDisbursedKsh = completedJobs.reduce((sum, b) => sum + (b.technicianPayoutKsh || Math.round((b.paidAmountKsh || 0) * 0.85)), 0);
  const totalPlatformRetainedKsh = completedJobs.reduce((sum, b) => sum + (b.platformCommissionKsh || Math.round((b.paidAmountKsh || 0) * 0.15)), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Sub-bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Operations Control Center
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Super Admin
                </span>
                <span
                  title={cloudStatus?.details || 'Real-time multi-device database synchronization'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{cloudStatus?.providerName || 'Cloud Database Sync'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {BUSINESS_NAME}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* ADMIN CLOSET MEDIA REPLACEMENT BUTTON (NOT IN PUBLIC) */}
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 via-amber-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-orange-950/40 border border-amber-300/40 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              title="Admin Closet: Replace or Change Display Images & Videos Live at Any Time"
            >
              <Camera className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Change Display Images / Videos</span>
              <span className="px-1.5 py-0.2 bg-black/30 rounded text-[9px] font-mono uppercase tracking-wider text-amber-200">
                Closet Hub
              </span>
            </button>

            {onNavigateToCustomer && (
              <button
                type="button"
                onClick={onNavigateToCustomer}
                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-950/30 transition-all cursor-pointer"
                title="Enter Public Customer Chamber"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Customer Space</span>
              </button>
            )}
            {onNavigateToTechnician && (
              <button
                type="button"
                onClick={onNavigateToTechnician}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-950/30 transition-all cursor-pointer"
                title="Enter Public Technician Chamber"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Technician Space</span>
              </button>
            )}
            {onOpenPesapalHub && (
              <button
                onClick={onOpenPesapalHub}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/30 transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pesapal Gateway</span>
              </button>
            )}
            {onOpenHostModal && (
              <button
                onClick={onOpenHostModal}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-900/30 transition-all cursor-pointer"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Host &amp; Go Live</span>
              </button>
            )}
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              Public Website
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Total Bookings</span>
              <Wrench className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white">{bookings.length}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{completedJobs.length} completed</span>
              <span>·</span>
              <span>{bookings.filter(b => b.status !== 'completed').length} active</span>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Tech 85% Disbursed</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              Ksh. {totalTechDisbursedKsh.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Sent directly to tech M-Pesa
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Platform 15% Share</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              Ksh. {totalPlatformRetainedKsh.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Escrow &amp; 30d guarantee fund
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Technicians</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">
              {technicians.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {technicians.filter(t => t.isBlocked).length} blocked · {technicians.filter(t => !t.isBlocked).length} active
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-950/60 to-slate-800 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium mb-1">
              <span>Customer Base</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {customers.length} Accounts
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {customers.filter(c => c.isBlocked).length} blocked
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 border-b border-slate-800">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Active &amp; All Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Logged-In Customers &amp; Techs ({loggedInUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed_archive')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'completed_archive'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span>Completed Jobs &amp; Guarantee Archive ({completedJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('technicians')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'technicians'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Technicians ({technicians.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'customers'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Manage Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'messages'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Admin Messaging &amp; SMS Broadcast ({adminMessages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payouts'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>85/15 Payout Ledger ({payoutLedger.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Edit Prices &amp; Revenue Splits</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Media &amp; Video Studio</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        {/* ========================================================= */}
        {/* TAB 1: BOOKINGS & JOBS */}
        {/* ========================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-[260px]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search by customer, phone, estate, or ID..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs overflow-x-auto">
                  {['all', 'requested', 'accepted', 'en_route', 'in_progress', 'completed'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBookingFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer whitespace-nowrap ${
                        bookingFilterStatus === st
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-5 hover:border-slate-600 transition-all shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-700/60">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          {b.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(b.createdAt).toLocaleDateString()} at {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {b.customerName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <a href={`tel:${b.customerPhone}`} className="hover:underline font-mono">
                            {b.customerPhone}
                          </a>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-sky-400" />
                          <span>{b.estate} ({b.addressDetails})</span>
                        </span>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          b.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : b.status === 'in_progress'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : b.status === 'en_route'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : b.status === 'accepted'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        Status: {b.status.replace('_', ' ')}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.paymentStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {b.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                  </div>

                  {/* Marked Appliances details */}
                  <div className="py-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                        Appliances Marked ({b.items?.length || 0})
                      </div>
                      <div className="space-y-2">
                        {b.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-xs"
                          >
                            <div className="flex items-center justify-between font-semibold text-white">
                              <span>{item.itemName}</span>
                              <span className="text-amber-400 font-mono text-[11px]">{item.brand || 'Standard'}</span>
                            </div>
                            <div className="text-slate-400 text-[11px] mt-1">
                              Issues: {item.selectedIssues?.join(', ') || 'General repair required'}
                            </div>
                            {item.notes && (
                              <div className="text-amber-300/80 text-[11px] mt-1 italic">
                                Notes: "{item.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                        Assigned Technician &amp; 85/15 Revenue Split
                      </div>
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Technician:</span>
                          <span className="font-bold text-white">{b.technicianName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Technician Phone:</span>
                          <a href={`tel:${b.technicianPhone}`} className="font-mono text-sky-400 hover:underline">
                            {b.technicianPhone}
                          </a>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Estimated Total:</span>
                          <span className="font-mono font-bold text-white text-sm">
                            Ksh. {(b.estimatedTotalKsh || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                          <div className="flex justify-between text-emerald-400">
                            <span>85% Technician M-Pesa:</span>
                            <span className="font-mono font-bold">
                              Ksh. {Math.round((b.estimatedTotalKsh || 0) * 0.85).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>15% Platform Commission:</span>
                            <span className="font-mono">
                              Ksh. {Math.round((b.estimatedTotalKsh || 0) * 0.15).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 mr-1 text-[11px] uppercase font-bold">Update Status:</span>
                      {(['requested', 'accepted', 'en_route', 'in_progress', 'completed'] as Booking['status'][]).map((statusOption) => (
                        <button
                          key={statusOption}
                          onClick={() => handleUpdateStatus(b.id, statusOption)}
                          disabled={b.status === statusOption}
                          className={`px-2.5 py-1 rounded-lg capitalize text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                            b.status === statusOption
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700'
                          }`}
                        >
                          {statusOption.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Live Dispatch Technician Selector */}
                      {b.status !== 'completed' && (
                        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 text-xs">
                          <span className="text-[11px] text-slate-400 pl-1 font-semibold">Dispatch:</span>
                          <select
                            className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-600 focus:outline-none"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleDispatchJob(b.id, e.target.value);
                              }
                            }}
                          >
                            <option value="" disabled>Select Technician to Dispatch...</option>
                            {technicians.filter(t => !t.isBlocked).map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.estate || t.location})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {b.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => handleMarkBookingPaid(b.id, b.estimatedTotalKsh || 1500)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Mark Paid (Trigger 85% Split)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: LOGGED-IN CUSTOMERS & TECHNICIANS LIVE ACTIVITY */}
        {/* ========================================================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-sky-950/80 via-slate-800 to-slate-800 border border-sky-500/30 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Logged-In Customers &amp; Technicians Chamber
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      Live registry of every customer and technician who logs in. Displays full phone numbers, roles, remaining pass duration, transaction references, and admin profile visibility controls.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">Total Logged-In</span>
                  <span className="text-lg font-black text-sky-400 font-mono">{loggedInUsers.length} Users</span>
                </div>
              </div>
            </div>

            {loggedInUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700 p-6">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">No Active Logged-In Sessions Recorded Yet</h4>
                <p className="text-xs text-slate-400 mt-1">
                  When customers or technicians log in through the portal, their full details and pass status will automatically display here in real time.
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">User / Name</th>
                        <th className="py-3 px-4">Phone (M-Pesa)</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Pass Status &amp; Time Left</th>
                        <th className="py-3 px-4">Transaction Ref</th>
                        <th className="py-3 px-4">Logged-In At</th>
                        <th className="py-3 px-4">Public Visibility</th>
                        <th className="py-3 px-4 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {loggedInUsers.map((u, idx) => {
                        const isExpired = u.activeUntil <= Date.now();
                        const timeLeft = formatTimeRemaining(u.activeUntil);
                        const isVisible = u.isVisible !== false;

                        return (
                          <tr key={idx} className="hover:bg-slate-750/50">
                            <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
                              <span>{u.name}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                              <a href={`tel:${u.phone}`} className="hover:underline">
                                {u.phone || 'Blank Phone'}
                              </a>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                u.role === 'technician'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isExpired ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Expired
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Active Pass
                                  </span>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{timeLeft}</div>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                              {u.transactionId}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {new Date(u.loggedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              <div className="text-[10px] text-slate-500">
                                {new Date(u.loggedInAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isVisible
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-700 text-slate-400 border border-slate-600'
                              }`}>
                                {isVisible ? 'Visible to Public' : 'Hidden'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = activateLoggedInUserPass(u.phone, 30);
                                  setLoggedInUsers(updated);
                                  loadAllData();
                                }}
                                className="px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 transition-colors cursor-pointer"
                                title="Activate or extend pass for 30 days to keep visible"
                              >
                                Activate Pass (+30d)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = toggleLoggedInUserVisibility(u.phone);
                                  setLoggedInUsers(updated);
                                  loadAllData();
                                }}
                                className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
                                  isVisible
                                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600/50'
                                    : 'bg-blue-600/30 text-blue-300 border-blue-500/40 hover:bg-blue-600/50'
                                }`}
                              >
                                {isVisible ? 'Hide' : 'Make Visible'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: COMPLETED JOBS & 30-DAY GUARANTEE ARCHIVE */}
        {/* (Only Administrator Can See This After Job is Marked Complete) */}
        {/* ========================================================= */}
        {activeTab === 'completed_archive' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-800 to-slate-800 border border-emerald-500/30 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <BadgeCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Completed Jobs &amp; 30-Day Guarantee Archive
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Per policy, once a job is marked completed on site by the technician, it disappears from the public jobs board and is archived exclusively in this administrative ledger.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-right">
                  <span className="text-[11px] text-slate-400 block">Total Completed</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{completedJobs.length} Jobs</span>
                </div>
              </div>
            </div>

            {completedJobs.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700 p-6">
                <BadgeCheck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">No Completed Jobs Archived Yet</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Once technicians mark work complete, they will appear here with full 85/15 disbursement audits and 30-day warranty tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedJobs.map((b) => {
                  const techPayout = b.technicianPayoutKsh || Math.round((b.paidAmountKsh || b.estimatedTotalKsh || 0) * 0.85);
                  const platFee = b.platformCommissionKsh || Math.round((b.paidAmountKsh || b.estimatedTotalKsh || 0) * 0.15);

                  return (
                    <div
                      key={b.id}
                      className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                            {b.id}
                          </span>
                          <span className="font-bold text-white text-sm">{b.customerName}</span>
                          <span className="text-xs text-slate-400">· {b.estate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Completed &amp; Archived
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            30-Day Guarantee Active
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Repaired Items</span>
                          <div className="font-semibold text-white mt-1">
                            {b.items.map(i => `${i.itemName} (${i.brand})`).join(', ')}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Receipt: <span className="font-mono text-emerald-400">{b.receiptNumber || 'HBR-OFFICIAL'}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Lead Technician</span>
                          <div className="font-bold text-white mt-1">{b.technicianName}</div>
                          <div className="text-sky-400 font-mono">{b.technicianPhone}</div>
                        </div>

                        <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                          <span className="text-emerald-400 block text-[10px] uppercase font-bold">M-Pesa 85/15 Disbursement</span>
                          <div className="flex justify-between items-center text-white font-bold mt-1">
                            <span>Total Paid:</span>
                            <span className="font-mono">Ksh. {(b.paidAmountKsh || b.estimatedTotalKsh || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 text-[11px] mt-0.5">
                            <span>85% Technician Transfer:</span>
                            <span className="font-mono font-bold">Ksh. {techPayout.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400 text-[11px]">
                            <span>15% Platform Retained:</span>
                            <span className="font-mono">Ksh. {platFee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TECHNICIANS MANAGEMENT (ADD, REMOVE, BLOCK) */}
        {/* ========================================================= */}
        {activeTab === 'technicians' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  placeholder="Search technician by name, phone, or license..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddTechModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Technician</span>
              </button>
            </div>

            {/* Direct Pass Pending Approvals Alert Banner */}
            {(() => {
              const pendingDirect = technicians.filter(t => t.approval_status === 'pending' || (t.is_direct_pass && t.approval_status !== 'approved'));
              if (pendingDirect.length === 0) return null;
              return (
                <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-xl animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center font-bold text-purple-300 shrink-0">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-purple-200">
                        {pendingDirect.length} Technician Direct Pass Request{pendingDirect.length > 1 ? 's' : ''} Awaiting Approval
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        These technicians submitted their free registration and National ID. They remain hidden from customers until you approve them below.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {technicians
                .filter(t => t.name.toLowerCase().includes(techSearch.toLowerCase()) || t.phone.includes(techSearch) || t.estate.toLowerCase().includes(techSearch.toLowerCase()))
                .map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-md ${
                      t.isBlocked
                        ? 'bg-rose-950/30 border-rose-600/50'
                        : 'bg-slate-800/90 border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.photoUrl}
                            alt={t.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div>
                            <h4 className="font-bold text-white text-sm">{t.name}</h4>
                            <div className="text-xs font-mono text-sky-400">{t.phone}</div>
                          </div>
                        </div>

                        {t.isBlocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                            BLOCKED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-400">License:</span>
                          <span className="font-medium text-slate-200">{t.licenseType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Location:</span>
                          <span>{t.estate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Experience:</span>
                          <span>{t.experienceYears} Years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Inspection Fee:</span>
                          <span className="font-mono text-amber-300">Ksh. {t.inspectionFeeKsh}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Customer Visibility:</span>
                          <span className={`font-semibold ${t.isVisibleToCustomers !== false ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {t.isVisibleToCustomers !== false ? 'Visible to Customers' : 'Hidden from Customers'}
                          </span>
                        </div>

                        {/* Membership & Free Pass Status */}
                        <div className="pt-2 mt-2 border-t border-slate-700/60 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 font-medium">Pass Status:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              t.pass_status === 'free_pass'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : t.pass_status === 'active' || t.isMonthlyMember
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {t.pass_status === 'free_pass' ? '30d Free Pass' : t.pass_status === 'expired' ? 'Expired (Restricted)' : 'Active Membership'}
                            </span>
                          </div>
                          {t.pass_expiry_date && (
                            <div className="flex justify-between items-center text-[11px] text-slate-400">
                              <span>Valid Until:</span>
                              <span className="font-mono text-slate-200">
                                {new Date(t.pass_expiry_date).toLocaleDateString()} ({Math.max(0, Math.ceil((t.pass_expiry_date - Date.now()) / (24 * 3600 * 1000)))}d left)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Direct Pass Approval & National ID Status */}
                        {(t.is_direct_pass || t.nationalIdOrPassport) && (
                          <div className={`p-3 rounded-xl border mt-2 space-y-2 ${
                            t.approval_status === 'pending'
                              ? 'bg-purple-950/70 border-purple-500/70 text-white'
                              : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          }`}>
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="uppercase text-purple-300 flex items-center gap-1 font-mono">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                <span>Technician Direct Pass</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                t.approval_status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                {t.approval_status === 'pending' ? 'Pending Approval' : 'Approved'}
                              </span>
                            </div>

                            {t.nationalIdOrPassport && (
                              <div className="text-[11px] font-mono text-slate-300 flex justify-between bg-slate-900/60 p-1.5 rounded">
                                <span className="text-slate-400">National ID / Passport:</span>
                                <span className="font-bold text-white">{t.nationalIdOrPassport}</span>
                              </div>
                            )}

                            {t.approval_status === 'pending' && (
                              <button
                                type="button"
                                disabled={approvingTechId === t.id}
                                onClick={() => handleApproveDirectPass(t.id)}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:from-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-purple-600/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-purple-400/50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{approvingTechId === t.id ? 'Approving...' : 'APPROVE DIRECT PASS'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Work Testimony Photos (Showcase to Customers) */}
                      {t.portfolioPhotos && t.portfolioPhotos.length > 0 && (
                        <div className="pt-2.5 mt-2.5 border-t border-slate-700/60">
                          <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-blue-400" />
                            <span>Work Testimony Photos ({t.portfolioPhotos.length})</span>
                          </div>
                          <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
                            {t.portfolioPhotos.map((photo, pIdx) => (
                              <img
                                key={pIdx}
                                src={photo}
                                alt={`Testimony ${pIdx + 1}`}
                                className="w-14 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-700/80 space-y-2 mt-3">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = renewTechnicianPass(t.id, 30);
                            setTechnicians(updated);
                            loadAllData();
                          }}
                          className="py-1.5 px-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Grant or Renew 30-Day Free Pass / Membership"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Renew Pass (+30d)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('messages');
                            setMsgTargetType('direct');
                            setMsgSelectedTechId(t.id);
                          }}
                          className="py-1.5 px-2 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Open Direct Chat with this technician"
                        >
                          <MessageSquare className="w-3 h-3 text-sky-400" />
                          <span>Direct Chat</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = toggleTechnicianVisibility(t.id);
                            setTechnicians(updated);
                            loadAllData();
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                            t.isVisibleToCustomers !== false
                              ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600/50'
                              : 'bg-blue-600/30 text-blue-300 border-blue-500/40 hover:bg-blue-600/50'
                          }`}
                        >
                          {t.isVisibleToCustomers !== false ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Make Visible</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBlockTech(t.id)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            t.isBlocked
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                          }`}
                        >
                          {t.isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Block Tech</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTechnician(t.id)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                          title="Delete technician"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: CUSTOMERS MANAGEMENT (ADD, REMOVE, BLOCK) */}
        {/* ========================================================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name, phone, or estate..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>

            <div className="bg-slate-800/90 rounded-2xl border border-slate-700 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Pass / Visibility</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {customers
                      .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch) || c.estate.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-750/50">
                          <td className="py-3.5 px-4 font-bold text-white">
                            {c.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-sky-400">
                            <a href={`tel:${c.phone}`} className="hover:underline">
                              {c.phone}
                            </a>
                          </td>
                          <td className="py-3.5 px-4">
                            {c.estate}
                          </td>
                          <td className="py-3.5 px-4">
                            {c.isBlocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                                BLOCKED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 space-y-1">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.isVisible !== false
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-700 text-slate-400'
                              }`}>
                                {c.isVisible !== false ? 'Profile Visible' : 'Hidden'}
                              </span>
                            </div>
                            {c.activeUntil && c.activeUntil > Date.now() ? (
                              <div className="text-[10px] text-emerald-400 font-mono">
                                Pass active ({formatTimeRemaining(c.activeUntil)})
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Pass inactive
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = activateCustomerPass(c.id, 30);
                                setCustomers(updated);
                                loadAllData();
                              }}
                              className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Activate or extend pass for 30 days"
                            >
                              +30d Pass
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = toggleCustomerVisibility(c.id);
                                setCustomers(updated);
                                loadAllData();
                              }}
                              className={`px-2 py-1 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
                                c.isVisible !== false
                                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600/50'
                                  : 'bg-blue-600/30 text-blue-300 border-blue-500/40 hover:bg-blue-600/50'
                              }`}
                            >
                              {c.isVisible !== false ? 'Hide' : 'Show'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlockCustomer(c.id)}
                              className={`px-2 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                                c.isBlocked
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                              }`}
                            >
                              {c.isBlocked ? 'Unblock' : 'Block'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Delete customer"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PRICING & REVENUE SPLIT CONTROL CENTER */}
        {/* ========================================================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <form onSubmit={handleSavePricing} className="space-y-6">
              
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-400" />
                      <span>Access Passes &amp; Revenue Commission Settings</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust pass fees and the platform commission ratio. Changes take effect across the website instantly.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPricing}
                    className={`py-2.5 px-6 rounded-xl font-black text-xs text-white shadow-md cursor-pointer flex items-center gap-2 transition-all ${
                      isSavingPricing
                        ? 'bg-slate-700 opacity-70 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                    }`}
                  >
                    {isSavingPricing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Verifying with Database...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Pricing Settings</span>
                      </>
                    )}
                  </button>
                </div>

                {savePricingSuccess && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="font-semibold">
                      Confirmed by database: Pricing configurations successfully persisted across all devices!
                    </span>
                  </div>
                )}

                {pricingSaveError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{pricingSaveError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Customer Pass Fee (Ksh)
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={pricing.customerPassPriceKsh ?? 50}
                      onChange={(e) => setPricing({ ...pricing, customerPassPriceKsh: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Valid for 12 hours</span>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      Technician Registration (Ksh)
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={pricing.technicianRegPriceKsh ?? pricing.technicianRegistrationPriceKsh ?? 150}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPricing({
                          ...pricing,
                          technicianRegPriceKsh: val,
                          technicianRegistrationPriceKsh: val
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Monthly technician fee</span>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">
                      Technician M-Pesa Share (%)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={pricing.technicianPayoutPercent ?? pricing.technicianSplitPercent ?? 85}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPricing({
                          ...pricing,
                          technicianPayoutPercent: val,
                          technicianSplitPercent: val,
                          platformCommissionPercent: 100 - val,
                          platformSplitPercent: 100 - val
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-emerald-600/50 rounded-lg text-base font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Default: 85%</span>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs font-bold text-amber-400 uppercase mb-1">
                      Platform Retained (%)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={pricing.platformCommissionPercent ?? pricing.platformSplitPercent ?? 15}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-base font-mono font-bold text-amber-300 opacity-90 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Default: 15% (Guarantee fund)</span>
                  </div>
                </div>
              </div>

              {/* Appliance Base Repair Cost Overrides */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Appliance Base Labor &amp; Diagnostic Estimates
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {REPAIR_ITEMS.length} Catalog Items
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {REPAIR_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 text-xs space-y-1.5"
                    >
                      <div className="font-bold text-white flex justify-between">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-slate-400 text-xs">Estimate Ksh:</span>
                        <input
                          type="number"
                          step={50}
                          value={pricing.itemPrices?.[item.id] ?? item.baseEstimatedCostKsh}
                          onChange={(e) => {
                            setPricing({
                              ...pricing,
                              itemPrices: {
                                ...(pricing.itemPrices || {}),
                                [item.id]: Number(e.target.value)
                              }
                            });
                          }}
                          className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-amber-300 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: ADMIN MESSAGING SUITE (DIRECT & BROADCAST SMS)     */}
        {/* ========================================================= */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>Admin Messaging Suite &amp; SMS Broadcast</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Live Sync + Offline Gateway
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Direct individual technician dispatch chat or instant group SMS broadcast to all active technicians.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="px-3 py-2 bg-slate-800/90 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Active Techs Reached</span>
                    <span className="font-bold text-sky-400 text-sm font-mono">{technicians.filter(t => !t.isBlocked).length} Available</span>
                  </div>
                  <div className="px-3 py-2 bg-slate-800/90 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">SMS Gateway Provider</span>
                    <span className="font-bold text-emerald-400 text-sm flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" /> Africa's Talking Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* Message Composer (Left) */}
              <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>Compose Dispatch Message</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Central Dispatch</span>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
                  {/* Mode Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Dispatch Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setMsgTargetType('broadcast');
                          setMsgSelectedTechId('');
                        }}
                        className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          msgTargetType === 'broadcast'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Group Broadcast (All)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMsgTargetType('direct');
                          if (!msgSelectedTechId && technicians.length > 0) {
                            setMsgSelectedTechId(technicians[0].id);
                          }
                        }}
                        className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          msgTargetType === 'direct'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Direct Chat (Single)</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual Technician Select (if direct) */}
                  {msgTargetType === 'direct' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Select Recipient Technician *
                      </label>
                      <select
                        value={msgSelectedTechId}
                        onChange={(e) => setMsgSelectedTechId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                      >
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} — {t.phone} ({t.estate})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Delivery Channel */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Delivery Channel
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMsgDeliveryChannel('both')}
                        className={`py-2 px-2 rounded-lg font-semibold text-[11px] border transition-all cursor-pointer text-center ${
                          msgDeliveryChannel === 'both'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        In-App + SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setMsgDeliveryChannel('sms')}
                        className={`py-2 px-2 rounded-lg font-semibold text-[11px] border transition-all cursor-pointer text-center ${
                          msgDeliveryChannel === 'sms'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        Offline SMS Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setMsgDeliveryChannel('in_app')}
                        className={`py-2 px-2 rounded-lg font-semibold text-[11px] border transition-all cursor-pointer text-center ${
                          msgDeliveryChannel === 'in_app'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        In-App Push Only
                      </button>
                    </div>
                  </div>

                  {/* Quick message template pills */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">
                      Quick Dispatch Templates
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'High-priority repair booking alert posted in your area.',
                        'Customer payment received! 85% share disbursed to your registered M-Pesa.',
                        'Monthly Membership Pass reminder: please verify your active credentials.',
                        'Central Dispatch notice: ensure safety test equipment is calibrated.'
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMsgText(tmpl)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 hover:text-sky-300 hover:border-sky-500/50 transition-colors text-left"
                        >
                          "{tmpl.slice(0, 36)}..."
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Message Content *
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {msgText.length} chars (approx. {Math.ceil(msgText.length / 160) || 1} SMS)
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder={
                        msgTargetType === 'broadcast'
                          ? 'Write an announcement or alert to broadcast to all registered technicians...'
                          : 'Write a direct message to this technician...'
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 resize-none"
                    />
                  </div>

                  {msgSendStatus && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      msgSendStatus.includes('success')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{msgSendStatus}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingMsg || !msgText.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSendingMsg ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {msgTargetType === 'broadcast'
                            ? `Broadcast Group Message (${technicians.filter(t => !t.isBlocked).length} Techs)`
                            : 'Send Direct Message'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Message Feed & SMS Logs (Right) */}
              <div className="lg:col-span-7 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-md space-y-4">
                {/* Subtab Switch */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMessageViewSubtab('feed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        messageViewSubtab === 'feed'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Dispatched Messages Feed ({adminMessages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageViewSubtab('sms_logs')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        messageViewSubtab === 'sms_logs'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Offline SMS Gateway Logs ({smsLogs.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      fetchAdminMessages().then(m => setAdminMessages(m));
                      fetchSmsLogs().then(l => setSmsLogs(l));
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="Refresh Feed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtab 1: Dispatched Feed */}
                {messageViewSubtab === 'feed' && (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {adminMessages.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No messages sent yet. Use the composer to broadcast or direct message.</p>
                      </div>
                    ) : (
                      adminMessages.map(msg => (
                        <div
                          key={msg.id}
                          className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 hover:border-slate-600 transition-all space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                msg.receiverTechnicianId === 'broadcast'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                {msg.receiverTechnicianId === 'broadcast' ? 'Broadcast (Group)' : 'Direct Message'}
                              </span>

                              <span className="text-slate-400 text-[11px]">
                                To: <strong className="text-white">{msg.receiverName || msg.receiverTechnicianId}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {msg.deliveryChannel === 'both' ? 'In-App + SMS' : msg.deliveryChannel === 'sms' ? 'SMS' : 'In-App'}
                              </span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-200 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 font-sans leading-relaxed">
                            {msg.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>From: <strong>{msg.senderName || 'Central Operations'}</strong></span>
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Dispatched
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Subtab 2: SMS Gateway Logs */}
                {messageViewSubtab === 'sms_logs' && (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {smsLogs.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No offline SMS records yet. Dispatches will be logged here in real time.</p>
                      </div>
                    ) : (
                      smsLogs.map(log => (
                        <div
                          key={log.id}
                          className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sky-400">{log.recipientPhone}</span>
                              {log.recipientName && (
                                <span className="text-slate-300">({log.recipientName})</span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {log.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                            {log.message}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>Provider: <strong className="text-slate-300">{log.gateway === 'africas_talking' ? "Africa's Talking" : "Safaricom B2C SMS"}</strong></span>
                            <span>{new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: 85/15 SINGLE-TECHNICIAN AUTOMATED PAYOUT LEDGER    */}
        {/* ========================================================= */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {/* Header / Compliance Banner */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>85/15 Single-Technician Automated Payout Ledger</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Strict Single-Tech Payout
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Audited Safaricom M-Pesa B2C / Pesapal disbursements. Funds are routed exclusively to the one assigned technician.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      fetchPayoutLedger().then(p => setPayoutLedger(p));
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Ledger</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split Rule Box */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 max-w-2xl">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="font-bold text-white">Automated Split Rule: 85% Technician / 15% Platform Commission</h5>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Upon customer M-Pesa PIN authorization, 85% is disbursed immediately to the specific technician's registered M-Pesa account via B2C. 15% is retained for the 30-day workmanship warranty escrow.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Technician Split</span>
                  <span className="text-base font-black text-emerald-400 font-mono">85% Direct</span>
                </div>
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Platform Fee</span>
                  <span className="text-base font-black text-amber-400 font-mono">15% Escrow</span>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={payoutSearch}
                  onChange={(e) => setPayoutSearch(e.target.value)}
                  placeholder="Filter by Booking ID, Technician Name, Customer, or Phone..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                Total Ledger Entries: <strong className="text-white font-mono">{payoutLedger.length}</strong>
              </div>
            </div>

            {/* Payout Records */}
            <div className="space-y-3">
              {payoutLedger
                .filter(p => {
                  const q = payoutSearch.toLowerCase();
                  return (
                    p.bookingId.toLowerCase().includes(q) ||
                    p.technicianName.toLowerCase().includes(q) ||
                    p.technicianPhone.includes(q) ||
                    p.customerName.toLowerCase().includes(q) ||
                    p.customerPhone.includes(q) ||
                    p.id.toLowerCase().includes(q)
                  );
                })
                .map(p => (
                  <div
                    key={p.id}
                    className="bg-slate-800/90 border border-slate-700/90 rounded-2xl p-5 hover:border-slate-600 transition-all shadow-md space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-slate-700/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            Booking: {p.bookingId}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(p.disbursedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {p.itemSummary || 'Appliance Repair & Workmanship'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{p.payoutStatus}</span>
                        </span>
                        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          {p.transactionReference}
                        </span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      {/* Assigned Single Technician */}
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Disbursed To (Single Tech)
                        </span>
                        <div className="font-bold text-white text-sm">{p.technicianName}</div>
                        <div className="font-mono text-sky-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {p.technicianPhone}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                          ✓ Assigned &amp; Verified Only
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Paid By (Customer)
                        </span>
                        <div className="font-bold text-white text-sm">{p.customerName}</div>
                        <div className="font-mono text-slate-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {p.customerPhone}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          M-Pesa STK Push Authenticated
                        </div>
                      </div>

                      {/* Technician 85% Share */}
                      <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40 space-y-1">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                          Tech 85% Disbursed
                        </span>
                        <div className="text-lg font-black text-emerald-400 font-mono">
                          Ksh. {p.technicianShare85Ksh.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-300">
                          Direct to M-Pesa B2C
                        </div>
                      </div>

                      {/* Platform 15% Fee */}
                      <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/40 space-y-1">
                        <span className="text-[10px] text-amber-400 uppercase font-bold block">
                          Platform 15% Share
                        </span>
                        <div className="text-lg font-black text-amber-300 font-mono">
                          Ksh. {p.platformFee15Ksh.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-amber-300">
                          Total Paid: Ksh. {p.totalAmountKsh.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {payoutLedger.length === 0 && (
                <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50 text-emerald-400" />
                  <p className="text-sm font-bold text-white">No Payout Records Yet</p>
                  <p className="mt-1">
                    When customer completes M-Pesa authorization for a finished job, the 85/15 single-technician payout will log automatically here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: MEDIA & VIDEO STUDIO */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <AdminMediaStudio />
        )}

      </div>

      {/* Add Technician Modal */}
      {isAddTechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-orange-600" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Add New Technician</h3>
                <button onClick={() => setIsAddTechModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleAddTechnician} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    placeholder="e.g. Eng. Peter Kimani"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Phone Number (M-Pesa) *</label>
                  <input
                    type="tel"
                    required
                    value={newTechPhone}
                    onChange={(e) => setNewTechPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Certification / License *</label>
                  <input
                    type="text"
                    required
                    value={newTechLicense}
                    onChange={(e) => setNewTechLicense(e.target.value)}
                    placeholder="Highly Qualified Certified Specialist"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Operational Estate *</label>
                  <input
                    type="text"
                    required
                    value={newTechEstate}
                    onChange={(e) => setNewTechEstate(e.target.value)}
                    placeholder="Nairobi - Kilimani"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={newTechExp}
                      onChange={(e) => setNewTechExp(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Inspection Fee (Ksh)</label>
                    <input
                      type="number"
                      value={newTechFee}
                      onChange={(e) => setNewTechFee(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTechModalOpen(false)}
                    className="px-4 py-2 border rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                  >
                    Add Technician
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Add Customer Account</h3>
                <button onClick={() => setIsAddCustomerModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="e.g. Brenda Wanjiku"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Estate / Town *</label>
                  <input
                    type="text"
                    required
                    value={newCustEstate}
                    onChange={(e) => setNewCustEstate(e.target.value)}
                    placeholder="Nairobi - Kilimani"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">House / Apt Details</label>
                  <input
                    type="text"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Court 4B, Apt 10"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerModalOpen(false)}
                    className="px-4 py-2 border rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Closet Dedicated Media & Video Studio Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 p-4 sm:p-6 text-slate-100">
            <AdminMediaStudio isModal={true} onClose={() => setIsMediaModalOpen(false)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;
