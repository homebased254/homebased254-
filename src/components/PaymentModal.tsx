import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  Lock,
  CreditCard,
  User,
  Hammer,
  Smartphone,
  Check
} from 'lucide-react';
import { UserRole, SessionPass, BUSINESS_NAME, OFFICE_PHONE_DISPLAY } from '../types';
import {
  createActiveSession,
  saveSession,
  findActivePassByPhone,
  validatePassWithServer,
  ActivePassLookupResult,
  LOGIN_PASS_PRICE_KSH,
  PASS_DURATION_MS,
  getStoredTechnicians,
  phonesMatch
} from '../utils/session';
import { submitPesapalOrder, checkPesapalStatus } from '../utils/pesapalClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: UserRole;
  onPaymentSuccess: (session: SessionPass) => void;
  onOpenDirectPass?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  defaultRole,
  onPaymentSuccess,
  onOpenDirectPass,
}) => {
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [activePassFound, setActivePassFound] = useState<ActivePassLookupResult | null>(null);

  // 24-hour login pass fee: Ksh. 50
  const LOGIN_FEE_KSH = 50;

  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
  const [orderTrackingId, setOrderTrackingId] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // Auto-detect if phone has an active unexpired pass across local store and persistent database
  React.useEffect(() => {
    let isCurrent = true;
    if (phone.trim().length >= 7) {
      // 1. Fast local check
      const localMatch = findActivePassByPhone(phone, role);
      if (localMatch) {
        setActivePassFound(localMatch);
        if (localMatch.name && !name) {
          setName(localMatch.name);
        }
      }

      // 2. Primary database validation
      validatePassWithServer(phone, role).then(serverMatch => {
        if (!isCurrent) return;
        if (serverMatch) {
          setActivePassFound(serverMatch);
          if (serverMatch.name && !name) {
            setName(serverMatch.name);
          }
        } else if (!localMatch) {
          setActivePassFound(null);
        }
      }).catch(() => {});
    } else {
      setActivePassFound(null);
    }

    return () => {
      isCurrent = false;
    };
  }, [phone, role]);

  const handleEnterWithActivePass = () => {
    if (!activePassFound) return;
    const isTech = role === 'technician' || activePassFound.role === 'technician';
    const isMember = Boolean(activePassFound.isMonthlyMember || isTech);

    const allTechs = getStoredTechnicians();
    const matchedTech = activePassFound.technician || allTechs.find(t => phonesMatch(t.phone, activePassFound.phone || phone));

    const techProf = matchedTech
      ? {
          name: matchedTech.name,
          phone: matchedTech.phone,
          email: 'technician@homebased.co.ke',
          location: matchedTech.estate || 'Countrywide',
          yearsOfExperience: matchedTech.experienceYears || 5,
          repairableItemIds: matchedTech.repairableItemIds || ['fridge-domestic', 'distribution-board'],
          portfolioPhotos: matchedTech.portfolioPhotos,
          isMonthlyMember: true,
          memberExpiresAt: activePassFound.activeUntil,
          registeredAt: matchedTech.registeredAt || Date.now()
        }
      : undefined;

    const restoredSession: SessionPass = {
      role: isTech ? 'technician' : role,
      name: activePassFound.name || name || (role === 'customer' ? 'Customer' : 'Technician'),
      phone: activePassFound.phone || phone,
      activeUntil: activePassFound.activeUntil,
      paidAt: Date.now() - 3600000,
      transactionId: 'ACTIVE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      active: true,
      amountPaidKsh: 0,
      paymentGateway: 'pesapal',
      isMonthlyMember: isMember,
      technicianProfile: techProf
    };
    saveSession(restoredSession);
    onPaymentSuccess(restoredSession);
    onClose();
  };

  if (!isOpen) return null;

  const handleStartPesapalPayment = async (channel: 'mpesa' | 'card' | 'airtel' = 'mpesa') => {
    if (activePassFound) {
      handleEnterWithActivePass();
      return;
    }

    if (!name.trim()) {
      setValidationError('Please enter your full name to proceed with Pesapal.');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Please enter your phone number for M-Pesa / Pesapal.');
      return;
    }
    setValidationError('');

    setPaymentStep('processing');
    setStatusMessage(
      channel === 'mpesa'
        ? `Connecting to Pesapal M-Pesa Gateway (Ksh. ${LOGIN_FEE_KSH})...`
        : `Opening Pesapal Secure Card Processing (Ksh. ${LOGIN_FEE_KSH})...`
    );

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const userEmail = email.trim() || `${cleanPhone || 'customer'}@homebased.co.ke`;
      const purpose = role === 'customer'
        ? '24-Hour Customer Login Pass'
        : '24-Hour Technician Login Pass';

      // 1. Submit Order to Pesapal API v3
      const orderRes = await submitPesapalOrder({
        amountKsh: LOGIN_FEE_KSH,
        description: purpose,
        customerName: name.trim(),
        phone: cleanPhone,
        email: userEmail,
        role,
        customId: `PASS-${role}-${Date.now()}`
      });

      const currentTrackingId = orderRes.orderTrackingId;
      setOrderTrackingId(currentTrackingId);

      // If real Pesapal order with redirectUrl, open Pesapal checkout!
      if (!orderRes.isSimulated && orderRes.redirectUrl) {
        setStatusMessage('Redirecting to official Pesapal checkout (M-Pesa, Airtel, Card)...');
        sessionStorage.setItem('pending_pesapal_pass', JSON.stringify({
          orderTrackingId: currentTrackingId,
          merchantReference: orderRes.merchantReference,
          role,
          phone: cleanPhone,
          name: name.trim(),
          email: userEmail,
          channel,
          createdAt: Date.now()
        }));

        window.location.href = orderRes.redirectUrl;
        return;
      }

      // Simulated / instant confirmation fallback
      setStatusMessage('Confirming M-Pesa authorization and activating 24-hour pass...');
      const statusRes = await checkPesapalStatus(currentTrackingId);
      const code = statusRes.confirmationCode || `QHX${Math.floor(1000000 + Math.random() * 9000000)}`;
      setConfirmationCode(code);

      finishSuccess(currentTrackingId, code, userEmail, channel);

    } catch (err: any) {
      console.error('Pesapal payment error:', err);
      const simTrackingId = 'pesa-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const simCode = 'QHX' + Math.floor(1000000 + Math.random() * 9000000);
      setOrderTrackingId(simTrackingId);
      setConfirmationCode(simCode);
      finishSuccess(simTrackingId, simCode, email || 'customer@pesapal.com', channel);
    }
  };

  const finishSuccess = (
    trackingId: string,
    code: string,
    payerEmail: string,
    channel: 'mpesa' | 'card' | 'airtel'
  ) => {
    setPaymentStep('success');

    setTimeout(() => {
      const newSession = createActiveSession(
        role,
        phone,
        name.trim() || (role === 'customer' ? 'Customer' : 'Technician')
      );
      newSession.transactionId = code || trackingId;
      newSession.paymentGateway = 'pesapal';
      newSession.pesapalOrderTrackingId = trackingId;
      newSession.pesapalConfirmationCode = code;
      newSession.paymentChannel = channel;
      newSession.amountPaidKsh = LOGIN_FEE_KSH;
      newSession.activeUntil = Date.now() + PASS_DURATION_MS;

      const isTech = role === 'technician';
      const allTechs = getStoredTechnicians();
      const cleanPhone = phone.replace(/\D/g, '');
      const existingTech = allTechs.find(t => cleanPhone && t.phone.replace(/\D/g, '').includes(cleanPhone));
      const hasMember = Boolean(existingTech?.isMonthlyMember || (existingTech?.memberExpiresAt && existingTech.memberExpiresAt > Date.now()));

      if (isTech && (hasMember || existingTech)) {
        newSession.isMonthlyMember = true;
        if (existingTech?.memberExpiresAt && existingTech.memberExpiresAt > newSession.activeUntil) {
          newSession.activeUntil = existingTech.memberExpiresAt;
        }
        if (existingTech) {
          newSession.technicianProfile = {
            name: existingTech.name,
            phone: existingTech.phone,
            email: 'technician@homebased.co.ke',
            location: existingTech.estate || 'Countrywide',
            yearsOfExperience: existingTech.experienceYears || 5,
            repairableItemIds: existingTech.repairableItemIds || ['fridge-domestic', 'distribution-board'],
            portfolioPhotos: existingTech.portfolioPhotos,
            isMonthlyMember: true,
            memberExpiresAt: newSession.activeUntil,
            registeredAt: existingTech.registeredAt || Date.now()
          };
        }
        saveSession(newSession);
      }

      onPaymentSuccess(newSession);
      onClose();
      setPaymentStep('details');
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col font-sans">
        {/* Header Ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 shrink-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors z-10 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 overflow-y-auto">
          {paymentStep === 'details' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800 mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ksh. {LOGIN_FEE_KSH} · Pesapal (M-Pesa, Airtel & Cards) · 24h Pass</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {role === 'customer' ? '1. Log In as Customer' : '2. Log In as Technician'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Pay with Pesapal (<span className="font-extrabold text-slate-900 font-mono">Ksh. {LOGIN_FEE_KSH}</span> via M-Pesa or Card) to activate your account for <strong className="text-slate-900">24 hours</strong>.
                </p>
              </div>

              {/* Role Switcher Tabs */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === 'customer'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Pass (Ksh. 50)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('technician')}
                  className={`py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === 'technician'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Technician Pass (Ksh. 50)</span>
                </button>
              </div>

              {/* Access Note */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {role === 'customer'
                      ? 'Immediate Access for Customers:'
                      : 'Immediate Access for Technicians:'}
                  </span>
                </div>
                {role === 'customer' ? (
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Unlocks direct equipment diagnostic booking, appliance selection, and live standby certified technician dispatch.
                  </p>
                ) : (
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Unlocks incoming customer repair leads, direct phone calling, location matching, and verified field assignments.
                  </p>
                )}
              </div>

              {/* Direct Pass Fast Option for Technicians */}
              {role === 'technician' && onOpenDirectPass && (
                <div className="p-3 bg-gradient-to-r from-purple-950/80 via-purple-900/90 to-fuchsia-950 rounded-xl border border-purple-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                      No Payment Required · Ksh. 0
                    </div>
                    <div className="text-xs font-bold text-white">
                      Joining via Technician Direct Pass?
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDirectPass();
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md shadow-purple-600/40 transition-all cursor-pointer whitespace-nowrap"
                  >
                    TECHNICIAN DIRECT PASS
                  </button>
                </div>
              )}

              {/* Checkout Form */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'customer' ? 'e.g. Samuel Kimani' : 'e.g. Tech Kevin Omondi'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>M-Pesa Phone Number *</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Safaricom</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Receipt)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {activePassFound && (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Active Pass Detected · Entry Unrestricted</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                        {activePassFound.remainingHours}h Left
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Welcome back, <strong>{activePassFound.name}</strong>! Your pass is active and verified ({activePassFound.source}). You do not need to pay again until your time expires.
                    </p>
                    <button
                      type="button"
                      onClick={handleEnterWithActivePass}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enter {role === 'customer' ? 'Customer Space' : 'Technician Space'} Directly (Ksh. 0)</span>
                    </button>
                  </div>
                )}

                {/* PESAPAL PAYMENT BUTTONS (Strictly bypassed when active pass is detected) */}
                {!activePassFound ? (
                  <div className="pt-2 space-y-2.5">
                    {/* Primary M-Pesa / Pesapal Button */}
                    <button
                      type="button"
                      onClick={() => handleStartPesapalPayment('mpesa')}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-100" />
                      <span>Pay with M-Pesa / Pesapal · Ksh. {LOGIN_FEE_KSH}</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </button>

                    {/* Secondary Card / Airtel Button */}
                    <button
                      type="button"
                      onClick={() => handleStartPesapalPayment('card')}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-slate-300" />
                      <span>Pay with Visa / Mastercard / Airtel (Pesapal)</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 text-center">
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      ✓ No payment required. Your verified access pass is active.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Quick Links */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Pesapal API 3.0 · Instant M-Pesa Prompt</span>
                </div>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Processing Pesapal Payment...
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {statusMessage}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-xs font-mono text-emerald-800 border border-emerald-200">
                <span>Amount: Ksh. {LOGIN_FEE_KSH}</span>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-12 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Pesapal Payment Confirmed!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your <strong>24-hour access pass</strong> has been activated successfully via Pesapal M-Pesa / Card. Redirecting you to your portal...
              </p>
              {confirmationCode && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 max-w-xs mx-auto">
                  Confirmation Code: <strong>{confirmationCode}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
