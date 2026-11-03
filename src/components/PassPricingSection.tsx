import React from 'react';
import { Clock, ShieldCheck, Check, ArrowRight, Phone, MessageSquare, UserCheck } from 'lucide-react';
import { PASS_PRICE_KSH, DEFAULT_TECHNICIAN_REG_PRICE_KSH } from '../utils/session';
import { BUSINESS_NAME, OFFICE_PHONE, OFFICE_PHONE_DISPLAY, SessionPass, UserRole } from '../types';

interface PassPricingSectionProps {
  session: SessionPass | null;
  onLoginCustomer: () => void;
  onLoginTechnician: () => void;
  onProceedToPortal: (role: UserRole) => void;
  onOpenDirectPass?: () => void;
}

export const PassPricingSection: React.FC<PassPricingSectionProps> = ({
  session,
  onLoginCustomer,
  onLoginTechnician,
  onProceedToPortal,
  onOpenDirectPass
}) => {
  const isLoggedIn = session && session.active;

  return (
    <section id="pass-details" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-semibold text-cyan-800 mb-2">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pesapal &amp; M-Pesa · Instant 24-Hour Pass Activation</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Transparent Pricing &amp; Service Guarantee
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Operating <strong className="text-slate-900">countrywide across all 47 counties of Kenya</strong> with highly qualified, vetted technicians and 30-day workmanship guarantees.
          </p>
        </div>

        {/* If logged in: single prominent active status banner (customers & technicians) */}
        {isLoggedIn && session && (session.role === 'customer' || session.role === 'technician') && (
          <div className="max-w-2xl mx-auto mb-8 bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Active Session ({session.role.toUpperCase()})
                </div>
                <div className="text-sm font-extrabold text-white">
                  Welcome, {session.name} ({session.phone})
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onProceedToPortal(session.role)}
              className="py-2.5 px-5 bg-gradient-to-r from-orange-500 to-sky-600 hover:from-orange-600 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Proceed to {session.role === 'customer' ? 'Customer Dashboard' : 'Technician Workspace'}</span>
            </button>
          </div>
        )}

        {/* Only show pricing sign-up cards if not logged in or reviewing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Customer Pass Card */}
          <div className="bg-gradient-to-br from-orange-50/50 to-white rounded-2xl border-2 border-orange-200 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-1 rounded">
                  Customer Pass
                </span>
                <span className="font-mono text-2xl font-extrabold text-slate-900">
                  Ksh. {PASS_PRICE_KSH}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                12 Hours Active Diagnostic Access
              </h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Pay Ksh. {PASS_PRICE_KSH} via instant M-Pesa PIN prompt. Lead directly to mark broken appliances, match certified standby technicians, and receive 30-day workmanship guarantee.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mark multiple items (fridge, deep freezer, breakers, cooker, smart TV)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant algorithm match with highly qualified certified experts</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Post pending job broadcast if no standby technician is in your area</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Customer payment after job done + 30-day guarantee official receipt</span>
                </li>
              </ul>
            </div>

            {isLoggedIn && session.role === 'customer' ? (
              <button
                type="button"
                onClick={() => onProceedToPortal('customer')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Proceed to Customer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onLoginCustomer}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Get Customer Pass (Ksh. {PASS_PRICE_KSH} · 12h)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Technician Pass Card */}
          <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-2xl border-2 border-purple-200 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2.5 py-1 rounded">
                  Technician Membership
                </span>
                <span className="font-mono text-2xl font-extrabold text-slate-900">
                  Ksh. {DEFAULT_TECHNICIAN_REG_PRICE_KSH} <span className="text-xs text-slate-500 font-normal">/ month</span>
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Certified Membership &amp; Skill Verification
              </h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Log in via the single technician button at the top (Ksh. 50 active for 12 hours). Complete your skill registration form, then activate your Ksh. 150 monthly membership to appear on the technician roster, unlock customer details, and accept incoming jobs.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 mb-6">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Ksh. 50 log in fee keeps your account active for 12 hours</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Interactive registration form to mark appliances you repair best</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Ksh. 150 monthly membership unlocks customer details &amp; incoming job requests</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>No technician disclosed to customers without verified membership</span>
                </li>
              </ul>
            </div>

            {isLoggedIn && session.role === 'technician' ? (
              <button
                type="button"
                onClick={() => onProceedToPortal('technician')}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Proceed to Technician Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2 pt-2">
                {onOpenDirectPass && (
                  <button
                    type="button"
                    onClick={onOpenDirectPass}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 border border-purple-400/40"
                  >
                    <span>TECHNICIAN DIRECT PASS (KSH. 0)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                  <p className="text-[11px] text-purple-900 font-medium">
                    Or log in with your 12-hour pass (Ksh. 50) using the button at the top.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Support Hotline banner */}
        <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-900">Need Assistance or Dispatch Support?</h4>
            <p className="text-xs text-slate-600">
              Central dispatch desk coordinates field dispatches countrywide. Call or WhatsApp our hotline directly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${OFFICE_PHONE}`}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{OFFICE_PHONE_DISPLAY}</span>
            </a>
            <a
              href={`https://wa.me/${OFFICE_PHONE.replace(/[^0-9]/g, '')}?text=Hello%20HOME%20BASED%20ELECTRONICS,%20ELECTRICAL%20AND%20REFRIGERATION%20SERVICES`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PassPricingSection;
