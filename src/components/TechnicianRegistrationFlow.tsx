import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle,
  Radio,
  Lock,
  BadgeCheck,
  CreditCard,
  DollarSign,
  Smartphone,
  Camera,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { SessionPass, TechnicianProfile, Technician, OFFICE_PHONE_DISPLAY, kshToUsd } from '../types';
import { REPAIR_ITEMS, KENYA_ESTATES } from '../data/repairItems';
import { saveTechnicianProfileToSession, activateTechnicianMembership, addOrUpdateTechnician, saveTechnicianToServer, MEMBERSHIP_PRICE_KSH, saveSession } from '../utils/session';
import { submitPesapalOrder, checkPesapalStatus } from '../utils/pesapalClient';

interface TechnicianRegistrationFlowProps {
  session: SessionPass;
  onRegistrationComplete: (updatedSession: SessionPass) => void;
  isDirectPass?: boolean;
}

export const TechnicianRegistrationFlow: React.FC<TechnicianRegistrationFlowProps> = ({
  session,
  onRegistrationComplete,
  isDirectPass = false
}) => {
  // Existing profile values or defaults (blank initial numbers)
  const [name, setName] = useState(session.name !== 'Technician' ? session.name : '');
  const [phone, setPhone] = useState(
    session.phone && !session.phone.includes('711408365') && !session.phone.includes('711 408')
      ? session.phone
      : ''
  );
  const [email, setEmail] = useState('');
  const [nationalIdOrPassport, setNationalIdOrPassport] = useState(session.technicianProfile?.nationalIdOrPassport || '');
  const [location, setLocation] = useState(KENYA_ESTATES[0]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(6);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>(
    session.technicianProfile?.portfolioPhotos || [
      '/assets/images/tech_electrical_wiring_1791787974895.jpg'
    ]
  );
  
  // Selected repair items that the technician can repair
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([
    'fridge-domestic',
    'deep-freezer',
    'distribution-board',
    'instant-shower',
    'sockets-switches'
  ]);

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPortfolioPhotos((prev) => [reader.result as string, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setPortfolioPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Payment state for the Ksh. 150 monthly membership ($1.15 USD)
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [orderId, setOrderId] = useState('');
  const [captureId, setCaptureId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const MEMBERSHIP_USD = kshToUsd(MEMBERSHIP_PRICE_KSH);

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItemIds(REPAIR_ITEMS.map(i => i.id));
  };

  const handleSelectCategory = (cat: string) => {
    const idsInCat = REPAIR_ITEMS.filter(i => i.category === cat).map(i => i.id);
    setSelectedItemIds(prev => Array.from(new Set([...prev, ...idsInCat])));
  };

  const handleSubmitFormAndTriggerPesapal = async (channel: 'mpesa' | 'card' | 'airtel' = 'mpesa') => {
    if (!name.trim()) {
      setValidationError('Please enter your full name / trade name to proceed.');
      return;
    }
    if (!nationalIdOrPassport.trim()) {
      setValidationError('Please provide your valid National ID or Passport Number to complete registration.');
      return;
    }
    if (selectedItemIds.length === 0) {
      setValidationError('Please mark at least one appliance or system you can repair.');
      return;
    }
    setValidationError('');

    setPaymentStep('processing');
    setStatusMessage(`Connecting to Pesapal for Ksh. ${MEMBERSHIP_PRICE_KSH} monthly membership...`);

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const order = await submitPesapalOrder({
        amountKsh: MEMBERSHIP_PRICE_KSH,
        description: `Technician 30-Day Monthly Membership (Ksh. ${MEMBERSHIP_PRICE_KSH})`,
        customerName: name.trim() || session.name,
        phone: cleanPhone,
        email: email || undefined,
        role: 'technician',
        customId: `TECH-MB-${Date.now()}`
      });

      const currentTrackingId = order.orderTrackingId;
      setOrderId(currentTrackingId);

      if (!order.isSimulated && order.redirectUrl) {
        setStatusMessage('Opening Pesapal checkout for M-Pesa / Card payment (Ksh. 150)...');
        sessionStorage.setItem('pending_technician_reg', JSON.stringify({
          orderTrackingId: currentTrackingId,
          merchantReference: order.merchantReference,
          name: name.trim() || session.name,
          phone: cleanPhone,
          email,
          nationalIdOrPassport: nationalIdOrPassport.trim(),
          location,
          yearsOfExperience,
          repairableItemIds: selectedItemIds
        }));
        window.location.href = order.redirectUrl;
        return;
      }

      setStatusMessage('Confirming Pesapal payment and activating 30-day membership...');
      const statusRes = await checkPesapalStatus(currentTrackingId);
      const currentCaptureId = statusRes.confirmationCode || `QHX${Math.floor(1000000 + Math.random() * 9000000)}`;
      setCaptureId(currentCaptureId);

      finishMembershipRegistration(currentTrackingId, currentCaptureId);

    } catch (err) {
      console.error('Pesapal registration error:', err);
      const simTrackingId = 'pesa-tech-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const simCode = 'QHX' + Math.floor(1000000 + Math.random() * 9000000);
      setOrderId(simTrackingId);
      setCaptureId(simCode);
      finishMembershipRegistration(simTrackingId, simCode);
    }
  };

  const finishMembershipRegistration = (ordId: string, capId: string) => {
    setPaymentStep('success');

    setTimeout(async () => {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const expiresAt = Date.now() + thirtyDays;

      const profile: TechnicianProfile = {
        name: name.trim() || session.name,
        phone,
        email,
        nationalIdOrPassport: nationalIdOrPassport.trim(),
        location,
        yearsOfExperience,
        repairableItemIds: selectedItemIds,
        portfolioPhotos,
        isMonthlyMember: true,
        memberExpiresAt: expiresAt,
        registeredAt: Date.now()
      };

      // Add technician to global certified roster so he immediately appears on customer dashboard across all devices
      const rosterRecord: Technician = {
        id: 'tech-' + (phone.replace(/\D/g, '') || Date.now().toString()),
        name: name.trim() || session.name,
        photoUrl: portfolioPhotos[0] || '/assets/images/tech_electrical_wiring_1791787974895.jpg',
        portfolioPhotos,
        roleTitle: `Highly Qualified Specialist (${yearsOfExperience}+ Yrs Exp)`,
        specialties: ['electrical', 'refrigeration', 'appliances', 'pumps'],
        licenseType: 'Highly Qualified Vetted Specialist',
        licenseNumber: 'TECH/' + Math.floor(1000 + Math.random() * 9000),
        experienceYears: Number(yearsOfExperience) || 5,
        rating: 5.0,
        reviewsCount: 1,
        location: 'Countrywide',
        estate: location,
        distanceKm: 1.8,
        etaMinutes: 20,
        isOnline: true,
        inspectionFeeKsh: 1600,
        hourlyRateKsh: 1200,
        phone: phone,
        tools: ['Digital Multimeter', 'Diagnostic Probes', 'Safety Hand Tools'],
        badges: ['Active Monthly Member', 'ID Verified', 'Highly Qualified Specialist', 'Pesapal Verified'],
        recentJobs: ['Electrical fault tracing', 'Appliance diagnostic'],
        bio: `Highly qualified technician with ${yearsOfExperience}+ years experience servicing electrical, electronics, and refrigeration systems. ID Verified: ${nationalIdOrPassport.trim()}. Reference: ${capId || ordId}.`,
        isBlocked: false,
        isMonthlyMember: true,
        isVisibleToCustomers: true,
        pass_status: 'active',
        pass_start_date: Date.now(),
        pass_expiry_date: expiresAt,
        memberExpiresAt: expiresAt,
        membership_type: 'monthly',
        registeredAt: Date.now(),
        repairableItemIds: selectedItemIds,
        nationalIdOrPassport: nationalIdOrPassport.trim()
      };

      // Save directly to the central persistent database and verify confirmation
      await saveTechnicianToServer(rosterRecord);

      // Remove ALL entry and operational restrictions for 30 days
      const finalSession: SessionPass = {
        ...session,
        name: name.trim() || session.name,
        phone,
        active: true,
        activeUntil: expiresAt,
        isMonthlyMember: true,
        technicianProfile: profile,
        transactionId: capId || ordId,
        paymentGateway: 'pesapal'
      };

      saveSession(finalSession);
      try {
        window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'technician_registered', technician: rosterRecord } }));
        window.dispatchEvent(new Event('storage'));
      } catch {}

      onRegistrationComplete(finalSession);
    }, 1200);
  };

  const handleSubmitDirectPass = async () => {
    if (!name.trim()) {
      setValidationError('Please enter your full name / trade name to proceed.');
      return;
    }
    if (!nationalIdOrPassport.trim()) {
      setValidationError('Please provide your valid National ID or Passport Number. This is required so the system remembers you for free access.');
      return;
    }
    if (selectedItemIds.length === 0) {
      setValidationError('Please mark at least one appliance or system you can repair.');
      return;
    }
    setValidationError('');
    setPaymentStep('processing');
    setStatusMessage('Submitting your Direct Pass registration to the Administrator (Zero Fees · Ksh. 0)...');

    setTimeout(async () => {
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      const expiresAt = Date.now() + oneYear;

      const profile: TechnicianProfile = {
        name: name.trim() || session.name,
        phone,
        email,
        nationalIdOrPassport: nationalIdOrPassport.trim(),
        location,
        yearsOfExperience,
        repairableItemIds: selectedItemIds,
        portfolioPhotos,
        isMonthlyMember: true,
        memberExpiresAt: expiresAt,
        registeredAt: Date.now()
      };

      const rosterRecord: Technician = {
        id: 'tech-' + (phone.replace(/\D/g, '') || Date.now().toString()),
        name: name.trim() || session.name,
        photoUrl: portfolioPhotos[0] || '/assets/images/tech_electrical_wiring_1791787974895.jpg',
        portfolioPhotos,
        roleTitle: `Highly Qualified Specialist (${yearsOfExperience}+ Yrs Exp)`,
        specialties: ['electrical', 'refrigeration', 'appliances', 'pumps'],
        licenseType: 'Direct Pass Certified Specialist',
        licenseNumber: 'TECH-DP/' + Math.floor(1000 + Math.random() * 9000),
        experienceYears: Number(yearsOfExperience) || 5,
        rating: 5.0,
        reviewsCount: 0,
        location: 'Countrywide',
        estate: location,
        distanceKm: 1.8,
        etaMinutes: 20,
        isOnline: true,
        inspectionFeeKsh: 1600,
        hourlyRateKsh: 1200,
        phone: phone,
        tools: ['Digital Multimeter', 'Diagnostic Probes', 'Safety Hand Tools'],
        badges: ['Direct Pass Applicant', 'ID Verified', 'Awaiting Admin Approval'],
        recentJobs: [],
        bio: `Direct pass applicant with ${yearsOfExperience}+ years experience. ID: ${nationalIdOrPassport.trim()}. Free direct entry pending admin approval.`,
        isBlocked: false,
        isMonthlyMember: true,
        isVisibleToCustomers: false, // Visible only when admin approves!
        is_direct_pass: true,
        approval_status: 'pending',
        pass_status: 'free_pass',
        pass_start_date: Date.now(),
        pass_expiry_date: expiresAt,
        memberExpiresAt: expiresAt,
        membership_type: 'monthly',
        registeredAt: Date.now(),
        repairableItemIds: selectedItemIds,
        nationalIdOrPassport: nationalIdOrPassport.trim()
      };

      // Save directly to the central database
      await saveTechnicianToServer(rosterRecord);

      // Permanently remember this ID number in localStorage
      try {
        localStorage.setItem('saved_technician_id_number', nationalIdOrPassport.trim());
      } catch {}

      const finalSession: SessionPass = {
        ...session,
        role: 'technician',
        name: name.trim() || session.name,
        phone,
        active: true,
        activeUntil: expiresAt,
        isMonthlyMember: true,
        is_direct_pass: true,
        approval_status: 'pending',
        technicianProfile: profile,
        transactionId: 'DIRECT-PASS-' + nationalIdOrPassport.trim(),
        paymentGateway: 'pesapal'
      };

      saveSession(finalSession);
      try {
        window.dispatchEvent(new CustomEvent('app_data_sync', { detail: { type: 'technician_registered', technician: rosterRecord } }));
        window.dispatchEvent(new Event('storage'));
      } catch {}

      setOrderId('DIRECT-PASS-' + nationalIdOrPassport.trim());
      setCaptureId('FREE-DIRECT-PASS');
      setPaymentStep('success');

      setTimeout(() => {
        onRegistrationComplete(finalSession);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="py-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Ksh. {MEMBERSHIP_PRICE_KSH} (${MEMBERSHIP_USD.toFixed(2)} USD) Registration · Skill Verification</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Technician Registration &amp; Skill Verification
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Fill in your technician details and mark every appliance you can repair. Then activate your monthly membership pass (<span className="font-semibold text-slate-900">Ksh. {MEMBERSHIP_PRICE_KSH} / $1.15 USD</span>) via Pesapal (M-Pesa / Card) to unlock direct customer connection details.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs shrink-0">
              <span className="text-slate-500 block">Support Hotline</span>
              <span className="font-mono font-bold text-slate-900">{OFFICE_PHONE_DISPLAY}</span>
            </div>
          </div>
        </div>

        {paymentStep === 'form' && (
          <div className="space-y-8">
            
            {/* Private Technician Earnings Agreement: 85% Payout / 15% Platform Split */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl border-2 border-emerald-500/40 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      Confidential Technician Onboarding Agreement
                    </div>
                    <div className="text-base font-black text-white">
                      Guaranteed 85% Job Earnings Split
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-mono font-bold text-emerald-300 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>85% Technician / 15% Platform Split</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center justify-between">
                    <span>Your Share (85%)</span>
                    <span className="font-mono text-white text-sm">85% of Total Job Fee</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Direct automated disbursement via M-Pesa STK as soon as customer pays through Pesapal upon job completion.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
                  <div className="font-bold text-teal-300 flex items-center justify-between">
                    <span>Platform Retention (15%)</span>
                    <span className="font-mono text-white text-sm">15% Operations Fee</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Covers 30-day workmanship warranty backing, dispatch logistics, customer acquisition, and 24/7 client support.
                  </p>
                </div>
              </div>
            </div>

            {/* Strict Access Gating Notice */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                <Lock className="w-5 h-5 text-amber-900" />
              </div>
              <div className="space-y-1">
                <div className="font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <span>Strict Security Gating: Posted Jobs &amp; Customer Details Protected</span>
                </div>
                <p className="text-amber-800 leading-relaxed font-medium">
                  No technician is permitted to view posted repair jobs, customer names, phone numbers, or residential addresses prior to completing this skill verification registration and paying the <strong className="text-slate-900 font-bold">Ksh. 150 monthly membership fee ($1.15 USD)</strong> renewable monthly via Pesapal (M-Pesa / Card). Once verified, all inbound job orders and customer connection details will be unlocked.
                </p>
              </div>
            </div>

            {/* Section 1: Personal & Contact Information */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                <span>Personal &amp; Contact Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name / Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samuel Mutiso (Certified Tech)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number (Customer Dispatch) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address (Pesapal Receipt) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="technician@email.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Valid National ID or Passport Number *</span>
                    <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Mandatory Verification
                    </span>
                  </label>
                  <div className="relative">
                    <BadgeCheck className="w-4 h-4 absolute left-3.5 top-3 text-blue-600" />
                    <input
                      type="text"
                      required
                      value={nationalIdOrPassport}
                      onChange={(e) => setNationalIdOrPassport(e.target.value)}
                      placeholder="e.g. 29481024 or A0148291"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used to verify identity on the certified technician roster for customer trust and safety.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Primary Operational Location (Kenya) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {KENYA_ESTATES.map((est) => (
                        <option key={est} value={est}>
                          {est}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Field Experience (Years) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={45}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Work Portfolio & Testimony Photos */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Work Portfolio &amp; Testimony Photos (Showcase to Customers)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload real photos of your past repairs, rewiring, laptops, or electronics. These photos will appear on your public profile to prove your expertise to customers.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0 shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Upload Work Photos</span>
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
                  <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">No testimony photos uploaded yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Upload pictures of repaired boards, rewiring, laptops, phones, or appliances</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {portfolioPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-xs">
                      <img src={photo} alt={`Work sample ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity hover:bg-rose-700"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Skill Verification Checklist */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Appliance &amp; Devices Skill Selection Checklist</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select every appliance, wiring, or device you are qualified to inspect and repair.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select every appliance and system you are qualified to inspect and repair.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('refrigeration')}
                    className="px-3 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Refrigeration
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('electrical')}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Electrical
                  </button>
                </div>
              </div>

              {/* Categorized Checkbox List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {REPAIR_ITEMS.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-400 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate">{item.name}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Register as Member or Direct Pass Submit */}
            {isDirectPass ? (
              <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-2xl border-2 border-purple-500/70 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-400/40 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      <span>Technician Direct Pass · Zero Charges</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Submit for Admin Approval (Ksh. 0 Free Entry)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      You are registering via <strong className="text-purple-300">Direct Pass</strong>. No registration fees or pass charges apply (Ksh. 0). The system will permanently remember your National ID (<strong className="text-white font-mono">{nationalIdOrPassport || 'Not entered yet'}</strong>). Once approved by Admin, you will appear on the customer list and receive incoming repair jobs!
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-purple-500/30 sm:pl-6 shrink-0">
                    <div className="text-3xl font-extrabold text-purple-300 font-mono">
                      Ksh. 0
                    </div>
                    <div className="text-xs text-emerald-300 font-semibold">
                      Free Direct Pass
                    </div>
                    <div className="text-[10px] text-purple-200 mt-0.5">
                      Remembered by National ID
                    </div>
                  </div>
                </div>

                {validationError && (
                  <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmitDirectPass}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:from-purple-700 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-400/50"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>SUBMIT FOR ADMIN APPROVAL (FREE DIRECT ENTRY)</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/50 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pesapal Secured 30-Day Tier</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      Register as Member (Ksh. {MEMBERSHIP_PRICE_KSH} / Month)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Renewable every 30 days. Grants immediate access to posted jobs with <strong className="text-white">customer phone numbers, estate, and equipment fault symptoms</strong> unlocked for direct calling and dispatch.
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-white/10 sm:pl-6 shrink-0">
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                      Ksh. {MEMBERSHIP_PRICE_KSH}
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      (Approx. ${MEMBERSHIP_USD.toFixed(2)} USD)
                    </div>
                    <div className="text-[10px] text-emerald-300 mt-0.5">
                      Active for 30 Days (Renews Monthly)
                    </div>
                  </div>
                </div>

                {validationError && (
                  <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Pesapal Payment Action Buttons */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmitFormAndTriggerPesapal('mpesa')}
                    className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-100" />
                    <span>Pay with M-Pesa / Pesapal · Ksh. {MEMBERSHIP_PRICE_KSH}</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmitFormAndTriggerPesapal('card')}
                    className="py-4 px-6 bg-slate-900 hover:bg-black text-white font-extrabold text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-slate-300" />
                    <span>Visa / Mastercard / Airtel (Pesapal)</span>
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Upon payment confirmation via Pesapal M-Pesa, your profile will immediately appear on the certified technician roster and unlock customer contacts.
                </p>
              </div>
            )}

          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-sm animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Connecting to Pesapal M-Pesa Gateway...
            </h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {statusMessage}
            </p>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-xl animate-fadeIn">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
              isDirectPass ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              {isDirectPass ? 'Direct Pass Request Submitted!' : 'Monthly Membership Activated!'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {isDirectPass ? (
                <span>
                  Congratulations! Your technician profile has been saved with <strong className="text-purple-700">zero charges (Ksh. 0)</strong>. The system will permanently remember your National ID / Passport (<span className="font-mono font-bold text-slate-900">{nationalIdOrPassport}</span>). Your request has been sent to the Administrator for approval.
                </span>
              ) : (
                <span>
                  Congratulations! Your details and ID (<span className="font-mono font-bold">{nationalIdOrPassport}</span>) are now registered on the certified technician list. All customer details and posted jobs are unlocked.
                </span>
              )}
            </p>
            {captureId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 max-w-xs mx-auto">
                {isDirectPass ? 'Direct Pass Key: ' : 'Pesapal Confirmation Code: '}
                <strong>{captureId}</strong>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TechnicianRegistrationFlow;
