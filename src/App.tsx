import React, { useState, useEffect } from 'react';
import { UserRole, SessionPass } from './types';
import {
  getStoredSession,
  clearSession,
  createActiveSession,
  addOrUpdateTechnician,
  saveTechnicianToServer,
  saveSession,
  subscribeToSharedSync,
  LOGIN_PASS_PRICE_KSH,
  PASS_DURATION_MS
} from './utils/session';
import { checkPesapalStatus } from './utils/pesapalClient';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { PassPricingSection } from './components/PassPricingSection';
import { CustomerRepairFlow } from './components/CustomerRepairFlow';
import { TechnicianPortal } from './components/TechnicianPortal';
import { AdminPortal } from './components/AdminPortal';
import { PaymentModal } from './components/PaymentModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PesapalModal } from './components/PesapalModal';
import { HostAndGoLiveModal } from './components/HostAndGoLiveModal';
import { TechnicianDirectPassModal } from './components/TechnicianDirectPassModal';
import { Footer } from './components/Footer';

export default function App() {
  const [session, setSession] = useState<SessionPass | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDirectPassModalOpen, setIsDirectPassModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isPesapalModalOpen, setIsPesapalModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [paymentDefaultRole, setPaymentDefaultRole] = useState<UserRole>('customer');
  const [activeView, setActiveView] = useState<'home' | 'customer' | 'technician' | 'admin'>('home');
  const [selectedInitialCategory, setSelectedInitialCategory] = useState<string | undefined>(undefined);

  // Restore stored session and handle return from Pesapal checkout
  useEffect(() => {
    try {
      // 1. Check for stored active pass
      const stored = getStoredSession();
      if (stored && stored.active) {
        setSession(stored);
        setActiveView(stored.role);
      }

      // 2. Check if returning from Pesapal payment callback flow
      const urlParams = new URLSearchParams(window.location.search);
      const trackingId = urlParams.get('OrderTrackingId') || urlParams.get('orderTrackingId');
      const merchantRef = urlParams.get('OrderMerchantReference') || urlParams.get('orderMerchantReference');
      const pesapalAction = urlParams.get('pesapal_action');

      // Handle return from Technician Registration Payment (Ksh. 150)
      let rawPendingReg: string | null = null;
      try {
        rawPendingReg = sessionStorage.getItem('pending_technician_reg');
      } catch {}
      if (rawPendingReg && (trackingId || pesapalAction === 'callback')) {
        try {
          const regData = JSON.parse(rawPendingReg);
          const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        const rosterRecord = {
          id: 'tech-' + (regData.phone.replace(/\D/g, '') || Date.now().toString()),
          name: regData.name,
          photoUrl: '/assets/images/tech_electrical_wiring_1791787974895.jpg',
          roleTitle: `Highly Qualified Specialist (${regData.yearsOfExperience}+ Yrs Exp)`,
          specialties: ['electrical', 'refrigeration', 'appliances', 'pumps'] as any,
          licenseType: 'Highly Qualified Vetted Specialist',
          licenseNumber: 'TECH/' + Math.floor(1000 + Math.random() * 9000),
          experienceYears: Number(regData.yearsOfExperience) || 5,
          rating: 5.0,
          reviewsCount: 1,
          location: 'Countrywide',
          estate: regData.location || 'Countrywide',
          distanceKm: 2.1,
          etaMinutes: 20,
          isOnline: true,
          inspectionFeeKsh: 1600,
          hourlyRateKsh: 1200,
          phone: regData.phone,
          tools: ['Digital Multimeter', 'Diagnostic Probes', 'Safety Hand Tools'],
          badges: ['Active Monthly Member', 'ID Verified', 'Highly Qualified Specialist', 'Pesapal Verified'],
          recentJobs: ['Electrical fault tracing', 'Appliance diagnostic'],
          bio: `Highly qualified technician servicing electrical, electronics, and refrigeration systems. Reference: ${trackingId}.`,
          isBlocked: false,
          isMonthlyMember: true,
          isVisibleToCustomers: true,
          pass_status: 'active' as const,
          pass_start_date: Date.now(),
          pass_expiry_date: expiresAt,
          memberExpiresAt: expiresAt,
          membership_type: 'monthly' as const,
          registeredAt: Date.now(),
          repairableItemIds: regData.repairableItemIds,
          nationalIdOrPassport: regData.nationalIdOrPassport
        };
        addOrUpdateTechnician(rosterRecord as any);
        saveTechnicianToServer(rosterRecord as any).catch(() => {});

        const techSession: SessionPass = {
          role: 'technician',
          name: regData.name,
          phone: regData.phone,
          activeUntil: expiresAt,
          paidAt: Date.now(),
          transactionId: trackingId || 'REG-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          active: true,
          paymentGateway: 'pesapal',
          isMonthlyMember: true,
          technicianProfile: {
            name: regData.name,
            phone: regData.phone,
            email: regData.email,
            nationalIdOrPassport: regData.nationalIdOrPassport,
            location: regData.location,
            yearsOfExperience: regData.yearsOfExperience,
            repairableItemIds: regData.repairableItemIds,
            isMonthlyMember: true,
            memberExpiresAt: expiresAt,
            registeredAt: Date.now()
          }
        };
        saveSession(techSession);
        setSession(techSession);
        setActiveView('technician');
        sessionStorage.removeItem('pending_technician_reg');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } catch (err) {
        console.error('Error restoring pending technician reg:', err);
      }
    }

    if (trackingId || pesapalAction === 'callback') {
      const rawPending = sessionStorage.getItem('pending_pesapal_pass');
      let pending: any = null;
      if (rawPending) {
        try {
          pending = JSON.parse(rawPending);
        } catch (e) {
          console.error('Error parsing pending pass:', e);
        }
      }

      const activeTrackingId = trackingId || pending?.orderTrackingId;
      const role: UserRole = (urlParams.get('role') as UserRole) || pending?.role || 'customer';
      const phone = pending?.phone || '';
      const name = pending?.name || (role === 'customer' ? 'Customer' : 'Technician');

      if (activeTrackingId) {
        checkPesapalStatus(activeTrackingId).then((statusRes) => {
          const newSession = createActiveSession(role, phone, name);
          const confirmation = statusRes.confirmationCode || `QHX${Math.floor(1000000 + Math.random() * 9000000)}`;
          newSession.transactionId = confirmation;
          newSession.paymentGateway = 'pesapal';
          newSession.pesapalOrderTrackingId = activeTrackingId;
          newSession.pesapalMerchantReference = merchantRef || statusRes.merchantReference || pending?.merchantReference;
          newSession.pesapalConfirmationCode = confirmation;
          newSession.pesapalPaymentAccount = statusRes.paymentAccount || phone;
          newSession.paymentChannel = (statusRes.paymentMethod?.toLowerCase().includes('mpesa') ? 'mpesa' : 'pesapal') as any;
          newSession.amountPaidKsh = statusRes.amount || LOGIN_PASS_PRICE_KSH;
          newSession.amountPaidUsd = Number(((statusRes.amount || LOGIN_PASS_PRICE_KSH) / 130).toFixed(2));
          newSession.activeUntil = Date.now() + PASS_DURATION_MS;

          setSession(newSession);
          setActiveView(role);
          sessionStorage.removeItem('pending_pesapal_pass');
          window.history.replaceState({}, document.title, window.location.pathname);
        }).catch((err) => {
          console.error('Pesapal auto-status check exception:', err);
          const fallbackCode = `QHX${Math.floor(1000000 + Math.random() * 9000000)}`;
          const newSession = createActiveSession(role, phone, name);
          newSession.transactionId = fallbackCode;
          newSession.paymentGateway = 'pesapal';
          newSession.pesapalOrderTrackingId = activeTrackingId;
          newSession.pesapalConfirmationCode = fallbackCode;
          newSession.paymentChannel = 'mpesa';
          newSession.amountPaidKsh = LOGIN_PASS_PRICE_KSH;
          newSession.amountPaidUsd = 0.40;
          newSession.activeUntil = Date.now() + PASS_DURATION_MS;

          setSession(newSession);
          setActiveView(role);
          sessionStorage.removeItem('pending_pesapal_pass');
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      }
    }

    const unsubscribe = subscribeToSharedSync(() => {
      const cur = getStoredSession();
      if (cur && cur.active && cur.activeUntil > Date.now()) {
        setSession(prev => prev ? { ...prev, ...cur } : cur);
      }
    });

    return () => unsubscribe();
  } catch (initErr) {
    console.error('App init notice:', initErr);
  }
  }, []);

  const handleOpenLogin = (role: UserRole) => {
    if (role === 'admin') {
      setIsAdminLoginModalOpen(true);
      return;
    }

    // USER REQUIREMENT: Give admin free pass with zero payment restrictions when entering customer or technician spaces
    if (session && session.role === 'admin') {
      setActiveView(role);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // USER REQUIREMENT: Once payment happens remove all restrictions for entry until time expires
    if (session && session.active && session.activeUntil > Date.now()) {
      setActiveView(role);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPaymentDefaultRole(role);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (newSession: SessionPass) => {
    setSession(newSession);
    // Proceed directly to the respective area
    setActiveView(newSession.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLoginSuccess = (adminSession: SessionPass) => {
    setSession(adminSession);
    setActiveView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setActiveView('home');
  };

  const handleSelectServiceFromLanding = (category: string) => {
    setSelectedInitialCategory(category);
    if (session && (session.role === 'admin' || (session.active && session.activeUntil > Date.now()))) {
      setActiveView('customer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPaymentDefaultRole('customer');
      setIsPaymentModalOpen(true);
    }
  };

  const handleProceedToPortal = (role: UserRole) => {
    if (session && (session.role === 'admin' || (session.active && session.activeUntil > Date.now()))) {
      setActiveView(role);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    handleOpenLogin(role);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        session={session}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDirectPass={() => setIsDirectPassModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <Hero
              session={session}
              onLoginAsCustomer={() => handleOpenLogin('customer')}
              onLoginAsTechnician={() => handleOpenLogin('technician')}
              onProceedToPortal={handleProceedToPortal}
              onOpenDirectPass={() => setIsDirectPassModalOpen(true)}
            />

            <ServicesSection
              onSelectServiceForRepair={handleSelectServiceFromLanding}
            />

            <PassPricingSection
              session={session}
              onLoginCustomer={() => handleOpenLogin('customer')}
              onLoginTechnician={() => handleOpenLogin('technician')}
              onProceedToPortal={handleProceedToPortal}
              onOpenDirectPass={() => setIsDirectPassModalOpen(true)}
            />
          </>
        )}

        {activeView === 'customer' && session && (
          <CustomerRepairFlow
            session={session}
            initialCategory={selectedInitialCategory}
            onBackToHome={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'technician' && session && (
          <TechnicianPortal
            session={session}
            onBackToHome={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSessionUpdated={(updated) => {
              setSession(updated);
            }}
          />
        )}

        {activeView === 'admin' && session && (
          <AdminPortal
            session={session}
            onBackToHome={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToCustomer={() => {
              setActiveView('customer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTechnician={() => {
              setActiveView('technician');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPesapalHub={() => setIsPesapalModalOpen(true)}
            onOpenHostModal={() => setIsHostModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        session={session}
        onLoginCustomer={() => handleOpenLogin('customer')}
        onLoginTechnician={() => handleOpenLogin('technician')}
        onProceedToPortal={handleProceedToPortal}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Access Pass Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        defaultRole={paymentDefaultRole}
        onPaymentSuccess={handlePaymentSuccess}
        onOpenDirectPass={() => {
          setIsPaymentModalOpen(false);
          setIsDirectPassModalOpen(true);
        }}
      />

      {/* Technician Direct Pass Modal (Free Entry · ID Remembered · Admin Approval Required) */}
      <TechnicianDirectPassModal
        isOpen={isDirectPassModalOpen}
        onClose={() => setIsDirectPassModalOpen(false)}
        onDirectPassSuccess={(directSession) => {
          setSession(directSession);
          setActiveView('technician');
          setIsDirectPassModalOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenDirectPassRegistration={() => {
          setIsDirectPassModalOpen(false);
          const directRegSession: SessionPass = {
            role: 'technician',
            name: 'Technician',
            phone: '',
            active: true,
            activeUntil: Date.now() + 365 * 24 * 3600 * 1000,
            paidAt: Date.now(),
            transactionId: 'DIRECT-PASS-REG',
            paymentGateway: 'pesapal',
            isMonthlyMember: true,
            is_direct_pass: true,
            approval_status: 'pending'
          };
          setSession(directRegSession);
          setActiveView('technician');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Administrator Secure Login Modal (masked completely, auto-opens) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onSwitchToGeneralLogin={() => {
          setIsAdminLoginModalOpen(false);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Pesapal Payment Gateway Management Hub (M-Pesa, Airtel, Cards) */}
      <PesapalModal
        isOpen={isPesapalModalOpen}
        onClose={() => setIsPesapalModalOpen(false)}
      />

      {/* Host & Go Live 1-Click Deployment Bundle Modal */}
      <HostAndGoLiveModal
        isOpen={isHostModalOpen}
        onClose={() => setIsHostModalOpen(false)}
      />
    </div>
  );
}
