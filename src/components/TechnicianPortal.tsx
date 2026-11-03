import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Power,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  UserCheck,
  Calendar,
  Lock,
  Unlock,
  Radio,
  Camera,
  Upload,
  X,
  Trash2,
  Image as ImageIcon,
  Send,
  Bell,
  Briefcase,
  Inbox,
  Navigation
} from 'lucide-react';
import {
  SessionPass,
  Booking,
  Technician,
  AdminMessage,
  BUSINESS_NAME,
  OFFICE_PHONE,
  OFFICE_PHONE_DISPLAY
} from '../types';
import { TECHNICIANS_DATA } from '../data/technicians';
import {
  getStoredBookings,
  updateBookingStatus,
  formatTimeRemaining,
  saveBooking,
  isTechnicianBlocked,
  DEFAULT_TECHNICIAN_REG_PRICE_KSH,
  addTechnicianPortfolioPhoto,
  removeTechnicianPortfolioPhoto,
  getStoredTechnicians,
  subscribeToSharedSync,
  fetchOpenJobs,
  claimMarketplaceJob,
  completeMarketplaceJob,
  fetchTechnicianMessages,
  sendAdminMessage,
  phonesMatch,
  validatePassWithServer
} from '../utils/session';
import { TechnicianRegistrationFlow } from './TechnicianRegistrationFlow';
import { LiveTechnicianLocationMap } from './LiveTechnicianLocationMap';

interface TechnicianPortalProps {
  session: SessionPass;
  onBackToHome: () => void;
  onSessionUpdated: (session: SessionPass) => void;
}

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({
  session,
  onBackToHome,
  onSessionUpdated
}) => {
  const isAdmin = session.role === 'admin';

  // Check if technician has active monthly membership across session, local roster, or pass expiry
  const [serverPassActive, setServerPassActive] = useState<boolean>(false);

  const isTechMemberActive = Boolean(
    isAdmin ||
    serverPassActive ||
    session.isMonthlyMember ||
    session.technicianProfile?.isMonthlyMember ||
    (session.technicianProfile?.memberExpiresAt && session.technicianProfile.memberExpiresAt > Date.now()) ||
    (session.phone && getStoredTechnicians().some(t => {
      const match = phonesMatch(t.phone, session.phone);
      const isMember = (t.pass_status === 'active' || t.pass_status === 'free_pass' || t.isMonthlyMember || (t.memberExpiresAt && t.memberExpiresAt > Date.now()));
      const notExpired = !t.pass_expiry_date || t.pass_expiry_date > Date.now();
      return match && isMember && notExpired && !t.isBlocked;
    }))
  );

  // If technician hasn't completed the monthly member registration (Ksh. 150), show registration form (bypass if admin or already registered member)
  const [showRegistrationForm, setShowRegistrationForm] = useState(isAdmin || isTechMemberActive ? false : !session.isMonthlyMember);

  useEffect(() => {
    if (session.phone) {
      validatePassWithServer(session.phone, 'technician').then(res => {
        if (res && res.hasActivePass) {
          setServerPassActive(true);
          setShowRegistrationForm(false);
        }
      }).catch(() => {});
    }
  }, [session.phone]);

  useEffect(() => {
    if (isAdmin || isTechMemberActive) {
      setShowRegistrationForm(false);
    }
  }, [isAdmin, isTechMemberActive]);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [technicianProfile] = useState<Technician>(TECHNICIANS_DATA[0]);
  const isBlocked = isTechnicianBlocked(session.phone);

  // Tab State: 'assigned_jobs' | 'open_jobs' | 'messages' | 'portfolio'
  const [techTab, setTechTab] = useState<'assigned_jobs' | 'open_jobs' | 'messages' | 'portfolio'>('assigned_jobs');

  // Open marketplace jobs and messages
  const [openMarketplaceJobs, setOpenMarketplaceJobs] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState('');

  // Portfolio testimony photos for technician
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(() => {
    const all = getStoredTechnicians();
    const match = all.find(t => t.phone === session.phone || t.name === session.name);
    return match?.portfolioPhotos || session.technicianProfile?.portfolioPhotos || [
      '/assets/images/tech_electrical_wiring_1791787974895.jpg'
    ];
  });

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const photoUrl = reader.result as string;
          setPortfolioPhotos(prev => [photoUrl, ...prev]);
          const all = getStoredTechnicians();
          const match = all.find(t => t.phone === session.phone || t.name === session.name);
          if (match) {
            addTechnicianPortfolioPhoto(match.id, photoUrl);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setPortfolioPhotos(prev => prev.filter((_, i) => i !== idx));
    const all = getStoredTechnicians();
    const match = all.find(t => t.phone === session.phone || t.name === session.name);
    if (match) {
      removeTechnicianPortfolioPhoto(match.id, idx);
    }
  };

  const [bookings, setBookings] = useState<Booking[]>(() => getStoredBookings());

  const syncTechnicianData = async () => {
    const all = getStoredBookings();
    setBookings(all);
    const open = await fetchOpenJobs();
    setOpenMarketplaceJobs(open);
    const techMsgs = await fetchTechnicianMessages(session.phone || 'tech-1', session.phone);
    setMessages(techMsgs);
  };

  // Live cross-device real-time sync with SSE and 2.5-second polling fallback
  useEffect(() => {
    syncTechnicianData();
    const unsubscribe = subscribeToSharedSync(() => {
      syncTechnicianData();
    });
    return () => unsubscribe();
  }, [session.phone]);

  const handleUpdateStatus = (bookingId: string, newStatus: Booking['status']) => {
    const updated = updateBookingStatus(bookingId, newStatus);
    setBookings(updated.length > 0 ? updated : bookings.map((b) => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  // Assignment Lock: Claim job from open marketplace
  const handleClaimJob = async (bookingId: string) => {
    setClaimSuccessMsg('Locking job exclusively to your profile...');
    const claimed = await claimMarketplaceJob(
      bookingId,
      session.phone || 'tech-claimed',
      session.name,
      session.phone
    );
    if (claimed) {
      setClaimSuccessMsg(`Job #${bookingId} locked exclusively to you! Switched to Assigned Jobs.`);
      setTimeout(() => setClaimSuccessMsg(''), 4000);
      await syncTechnicianData();
      setTechTab('assigned_jobs');
    }
  };

  // Job Completion Trigger: Immediately alerts customer's phone to enter M-Pesa PIN
  const handleCompleteJob = async (bookingId: string) => {
    await completeMarketplaceJob(bookingId);
    handleUpdateStatus(bookingId, 'completed');
    await syncTechnicianData();
  };

  // Send reply message to admin / central dispatch
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    await sendAdminMessage({
      sender: 'technician',
      senderName: session.name,
      receiverTechnicianId: session.phone || 'tech-1',
      receiverName: 'Central Operations Dispatch',
      receiverPhone: OFFICE_PHONE,
      message: replyText.trim(),
      deliveryChannel: 'both'
    });
    setReplyText('');
    setIsSendingReply(false);
    const updatedMsgs = await fetchTechnicianMessages(session.phone || 'tech-1', session.phone);
    setMessages(updatedMsgs);
  };

  // ROLE-BASED ACCESS CONTROL (RBAC) & PRIVACY:
  // Technicians see:
  // 1. Their own assigned jobs
  // 2. The open job marketplace feed
  const allStoredTechs = getStoredTechnicians();
  const myRosterProfile = allStoredTechs.find(t => phonesMatch(t.phone, session.phone) || (t.name && session.name && t.name.toLowerCase() === session.name.toLowerCase()));
  const myTechId = myRosterProfile?.id;

  const myAssignedJobs = bookings.filter(b => {
    const isAssignedToMe = (b.technicianId === session.phone) ||
      (Boolean(myTechId) && b.technicianId === myTechId) ||
      phonesMatch(b.technicianPhone, session.phone) ||
      (b.technicianName && session.name && b.technicianName.toLowerCase() === session.name.toLowerCase());
    return isAssignedToMe && b.status !== 'completed';
  });

  // Open marketplace jobs: unclaimed jobs
  const availableOpenJobs = openMarketplaceJobs.filter(b => 
    (b.technicianId === 'unassigned' || !b.technicianId || b.status === 'requested') &&
    b.status !== 'completed'
  );

  // Check if technician is blocked by admin
  if (isBlocked) {
    return (
      <div className="py-16 bg-slate-50 min-h-screen">
        <div className="max-w-xl mx-auto px-4 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Technician Account Suspended
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your technician account has been placed on administrative hold by the Operations Manager. Please contact central office dispatch directly to review compliance or certification.
          </p>
          <div className="p-4 bg-white rounded-xl border border-slate-200 font-mono text-sm font-bold text-slate-800">
            Helpline: {OFFICE_PHONE_DISPLAY}
          </div>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // USER REQUIREMENT: Give admin free pass with zero payment restrictions
  // USER REQUIREMENT: REMOVE TECHNICIANS RESTRICTIONS COMPLETELY AFTER PAYMENT OF REGISTER UNTIL IT EXPIRES
  const isPassExpired = !isAdmin && !isTechMemberActive && (!session.active || session.activeUntil <= Date.now());
  if (isPassExpired) {
    return (
      <div className="py-16 bg-slate-50 min-h-screen font-sans flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Technician Pass Expired
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your platform access pass has expired. Renew your verified <strong>Ksh. 150 monthly membership (30-day Free Pass)</strong> to unlock open jobs and customer dispatches.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md"
            >
              Renew Membership Pass (30 Days)
            </button>
            <button
              onClick={onBackToHome}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If technician needs to fill registration and pay Ksh. 150 monthly membership (admin & registered members have free unrestricted access)
  if (!isAdmin && !isTechMemberActive && (showRegistrationForm || !session.isMonthlyMember)) {
    return (
      <TechnicianRegistrationFlow
        session={session}
        onRegistrationComplete={(updated) => {
          onSessionUpdated(updated);
          setShowRegistrationForm(false);
        }}
        isDirectPass={Boolean(session.is_direct_pass)}
      />
    );
  }

  return (
    <div className="py-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <div className="h-4 w-px bg-slate-300" />
            <div className="text-xs text-slate-600">
              Technician Workspace: <span className="font-semibold text-slate-900">{session.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Pass: Active (30-Day Protected)</span>
            </div>

            <button
              onClick={() => setShowRegistrationForm(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Update Profile Checklist
            </button>
          </div>
        </div>

        {/* DIRECT PASS STATUS & NATIONAL ID RECOGNITION BANNER */}
        {(() => {
          const allTechs = getStoredTechnicians();
          const match = allTechs.find(t => phonesMatch(t.phone, session.phone) || (t.nationalIdOrPassport && session.technicianProfile?.nationalIdOrPassport && t.nationalIdOrPassport === session.technicianProfile.nationalIdOrPassport));
          const isDirectPass = Boolean(session.is_direct_pass || match?.is_direct_pass);
          const isPending = match?.approval_status === 'pending' || (isDirectPass && match?.approval_status !== 'approved');
          const idNum = session.technicianProfile?.nationalIdOrPassport || match?.nationalIdOrPassport || (typeof window !== 'undefined' ? localStorage.getItem('saved_technician_id_number') : null);

          if (!isDirectPass && !idNum) return null;

          return (
            <div className={`mb-6 p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md ${
              isPending
                ? 'bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/70 border-purple-500/70 text-white'
                : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                  isPending ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black uppercase tracking-wider text-[11px] text-purple-300">
                      TECHNICIAN DIRECT PASS (KSH. 0 FREE ACCESS)
                    </span>
                    {idNum && (
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-900 text-purple-200 border border-purple-500/50 text-[10px]">
                        ID / Passport: {idNum}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {isPending ? (
                      <span>
                        Your registration has been forwarded to the <strong className="text-amber-300">Administrator for approval</strong>. You enjoy free access to your workspace and tools. Once approved by Admin, your profile will immediately appear on the public customer directory.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-emerald-400">Approved by Administrator!</strong> Your direct pass is fully active. Your profile is live on the public directory and eligible to accept customer leads.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isPending
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {isPending ? 'Pending Admin Approval' : 'Approved & Live'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Claim Notification Banner */}
        {claimSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold animate-fadeIn">
            <CheckCircle2 className="w-5 h-5" />
            <span>{claimSuccessMsg}</span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={technicianProfile.photoUrl}
                  alt={session.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    isOnDuty ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={isOnDuty ? 'On Duty' : 'Off Duty'}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900">{session.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-800">
                    {session.technicianProfile?.location || 'Countrywide (Kenya)'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    85% Automated Direct M-Pesa Payout
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Highly Qualified &amp; Vetted Electronics, Electrical &amp; Refrigeration Specialist · {session.technicianProfile?.yearsOfExperience || 6} Years Experience
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    ★ 4.96 Rating (Verified Field Technicians)
                  </span>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">Customer Contacts Disclosed</span>
                  <span>·</span>
                  <span className="font-mono text-slate-600 font-bold">Payout Phone: {session.phone || 'Not Set'}</span>
                </div>
              </div>
            </div>

            {/* Duty Status Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOnDuty(!isOnDuty)}
                className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isOnDuty
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isOnDuty ? 'On Duty (Accepting Leads)' : 'Off Duty (Paused)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTechTab('assigned_jobs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              techTab === 'assigned_jobs'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>My Assigned Jobs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {myAssignedJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTechTab('open_jobs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              techTab === 'open_jobs'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Open Job Marketplace</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-mono font-bold">
              {availableOpenJobs.length} Available
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTechTab('messages')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              techTab === 'messages'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Dispatch Messages</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-900 font-mono font-bold">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTechTab('portfolio')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
              techTab === 'portfolio'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Testimony Photos ({portfolioPhotos.length})</span>
          </button>
        </div>

        {/* TAB 1: MY ASSIGNED JOBS */}
        {techTab === 'assigned_jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>My Active Assigned Jobs</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                    {myAssignedJobs.length} Locked
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Jobs assigned exclusively to you. Mark completed to immediately prompt customer's phone for M-Pesa PIN payment.
                </p>
              </div>
            </div>

            {myAssignedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  No Active Assigned Jobs
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You currently have no assigned jobs in progress. Check the <strong>Open Job Marketplace</strong> tab to accept and claim newly posted customer repairs.
                </p>
                <button
                  type="button"
                  onClick={() => setTechTab('open_jobs')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Browse Open Job Marketplace ({availableOpenJobs.length})
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {myAssignedJobs.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Top Bar with Reference & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                          {booking.id}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{booking.customerName}</span>
                        <span className="text-xs text-slate-500">· {booking.estate}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* DISCLOSED CUSTOMER DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Customer Details Unlocked</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">
                          {booking.customerName}
                        </div>
                        <div className="font-mono text-sm font-black text-emerald-950 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{booking.customerPhone}</span>
                        </div>
                        <div className="text-xs text-slate-700 flex items-start gap-1.5 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                          <span className="font-semibold">{booking.addressDetails} ({booking.estate})</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Pricing &amp; Payout (85% Technician Direct)
                        </div>
                        <div className="font-mono text-emerald-800 font-extrabold text-sm">
                          Total Quote: Ksh. {booking.estimatedTotalKsh}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold">
                          Your 85% M-Pesa Payout: Ksh. {Math.round((booking.estimatedTotalKsh || 0) * 0.85).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Timing: <span className="font-semibold text-slate-800">{booking.scheduledTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* LIVE DOORSTEP LOCATION RADAR */}
                    <div className="mb-4">
                      <div className="text-[11px] font-black text-sky-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Live GPS Radar Active · Transmitting Live Arrival Location</span>
                      </div>
                      <LiveTechnicianLocationMap booking={booking} isTechnicianView={true} />
                    </div>

                    {/* Appliance details */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-4">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Marked Equipment &amp; Symptoms:
                      </div>
                      <div className="space-y-2">
                        {booking.items.map((it, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="text-orange-500">•</span>
                              <span>{it.itemName}</span>
                              <span className="text-slate-500 font-normal">({it.brand})</span>
                            </div>
                            <div className="text-[11px] text-orange-800 pl-3">
                              Symptoms: {it.selectedIssues.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${booking.customerPhone}`}
                          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Customer</span>
                        </a>
                        <a
                          href={`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(booking.customerName)},%20this%20is%20${encodeURIComponent(session.name)}%20from%20HOME%20BASED%20SERVICES.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        {booking.status !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                            className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            <span>On Site / Repairing</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCompleteJob(booking.id)}
                          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                          title="Marks job completed and triggers instant M-Pesa PIN prompt modal on customer's phone"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Job Completed (Prompt Customer PIN)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPEN JOB MARKETPLACE (UNCLAIMED FEED) */}
        {techTab === 'open_jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-600 animate-pulse" />
                  <span>Open Job Marketplace Feed</span>
                  <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                    {availableOpenJobs.length} Unclaimed
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Newly posted customer jobs visible to all available technicians. Accepting a job triggers Assignment Lock, securing it exclusively to you.
                </p>
              </div>
            </div>

            {availableOpenJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  No Unclaimed Jobs Currently Available
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  New customer repair broadcasts reflect here in real-time as soon as customers submit them. Offline SMS alerts will also notify your phone.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {availableOpenJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                          {job.id}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 font-mono">
                          Est. Payout (85%): Ksh. {Math.round(job.estimatedTotalKsh * 0.85).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          <span>{job.estate}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Customer: <span className="font-semibold text-slate-800">{job.customerName}</span> ({job.customerPhone})
                        </div>
                        <div className="text-xs text-slate-500">
                          Scheduled: {job.scheduledTime}
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                          <div className="text-[11px] font-bold text-slate-700 uppercase mb-1">Items to Repair:</div>
                          <ul className="text-xs text-slate-800 space-y-1">
                            {job.items.map((it, i) => (
                              <li key={i} className="flex justify-between">
                                <span>• {it.itemName} ({it.brand})</span>
                                <span className="text-slate-500">{it.selectedIssues.join(', ')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaimJob(job.id)}
                      className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.01]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept &amp; Lock Job to My Schedule</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADMIN MESSAGING SUITE */}
        {techTab === 'messages' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <span>Central Operations Dispatch &amp; Admin Messages</span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct chats, system notifications, and group broadcast texts sent by Central Operations via in-app &amp; offline SMS.
              </p>
            </div>

            {/* Messages Feed */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 max-h-96 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No messages from central dispatch yet.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      m.sender === 'technician'
                        ? 'bg-emerald-50 border-emerald-200 ml-8'
                        : m.receiverTechnicianId === 'all_broadcast'
                        ? 'bg-purple-50 border-purple-200 mr-8'
                        : 'bg-white border-slate-200 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {m.sender === 'admin' ? (
                          <span className="text-purple-700 font-extrabold">★ Central Operations Dispatch</span>
                        ) : (
                          <span className="text-emerald-700 font-extrabold">You ({m.senderName})</span>
                        )}
                        {m.receiverTechnicianId === 'all_broadcast' && (
                          <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded text-[9px] uppercase font-bold">
                            Group Broadcast
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-sans">{m.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span>Channel: {m.deliveryChannel}</span>
                      {m.smsStatus && (
                        <span className="text-emerald-600 font-semibold">• SMS {m.smsStatus}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type direct reply to Central Operations Dispatch..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={isSendingReply || !replyText.trim()}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingReply ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: WORK TESTIMONY PORTFOLIO */}
        {techTab === 'portfolio' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>My Work Testimony Photos (Visible to Customers)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
                    {portfolioPhotos.length} Photos
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload real photos of your past repairs (refrigerators, house wiring, laptops, desktop computers, phones) as testimony to prove your skill to customers.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs shrink-0">
                <Upload className="w-4 h-4" />
                <span>Upload Work Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {portfolioPhotos.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No testimony photos uploaded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Upload Work Photo" to add images of your recent jobs</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {portfolioPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-xs">
                    <img src={photo} alt={`Testimony ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TechnicianPortal;
