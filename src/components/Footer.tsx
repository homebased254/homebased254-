import React from 'react';
import { Wrench, Phone, MapPin, Mail, ShieldCheck, Clock, MessageSquare, Smartphone, Lock, CreditCard, UserCheck, Sparkles, ArrowRight } from 'lucide-react';
import { PASS_PRICE_KSH, DEFAULT_TECHNICIAN_REG_PRICE_KSH } from '../utils/session';
import { BUSINESS_NAME, OFFICE_PHONE, OFFICE_PHONE_DISPLAY, SessionPass, UserRole } from '../types';

interface FooterProps {
  session: SessionPass | null;
  onLoginCustomer: () => void;
  onLoginTechnician: () => void;
  onProceedToPortal: (role: UserRole) => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  session,
  onLoginCustomer,
  onLoginTechnician,
  onProceedToPortal,
  onOpenAdminLogin
}) => {
  const isLoggedIn = session && session.active;

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-sky-500 to-purple-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                HOME BASED <span className="text-orange-500">ELECTRONICS</span>, <span className="text-sky-400">ELECTRICAL</span> AND <span className="text-purple-400">REFRIGERATION</span> SERVICES
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Connecting Kenyan households, hotels, butcheries, hospitals, and businesses countrywide across all counties with highly qualified, vetted technicians for immediate electrical, electronics, and refrigeration diagnostics.
            </p>
            
            {/* Contact details */}
            <div className="pt-2 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-white font-medium">Coverage: Countrywide · All 47 Counties of Kenya</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Office Call: <a href={`tel:${OFFICE_PHONE}`} className="text-white font-mono font-bold hover:underline">{OFFICE_PHONE_DISPLAY}</a></span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp: <a href={`https://wa.me/${OFFICE_PHONE.replace(/[^0-9]/g, '')}?text=Hello%20HOME%20BASED%20ELECTRONICS,%20ELECTRICAL%20AND%20REFRIGERATION%20SERVICES`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-mono font-bold hover:underline">{OFFICE_PHONE_DISPLAY}</a></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Workmanship Guarantee: <strong className="text-white">30 Days 100% Certified</strong></span>
              </div>
            </div>
          </div>

          {/* Refrigeration Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Refrigeration &amp; HVAC
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Domestic Refrigerators</li>
              <li>Deep Chest Freezers</li>
              <li>Display Beverage Chillers</li>
              <li>Split Air Conditioners</li>
              <li>Commercial Cold Rooms</li>
              <li>Compressor Gas Refilling</li>
            </ul>
          </div>

          {/* Electrical & Electronics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Electrical &amp; Electronics
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Inverter &amp; Appliance PCBs</li>
              <li>Main Consumer Unit / DB</li>
              <li>Circuit Breaker Tripping</li>
              <li>House Wiring &amp; Faults</li>
              <li>Instant Shower Heaters</li>
              <li>Borehole Motor Starters</li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Access &amp; Security
            </h4>
            <div className="space-y-2 text-xs">
              {isLoggedIn && (session.role === 'customer' || session.role === 'technician') ? (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Logged in as {session.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onProceedToPortal(session.role)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-sky-600 text-white font-bold rounded-lg text-xs cursor-pointer text-center"
                  >
                    Proceed to {session.role === 'customer' ? 'Repair Manifest' : 'Jobs Board'}
                  </button>
                </div>
              ) : !isLoggedIn ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onLoginCustomer}
                    className="w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-orange-200/50"
                    style={{
                      backgroundColor: '#FF6F3C',
                      boxShadow: '0 4px 15px rgba(255, 111, 60, 0.4)'
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                    <span className="font-black">LOG IN TO GET STARTED</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : null}

              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <div>Customer Access Pass: <strong className="text-white">Ksh. {PASS_PRICE_KSH} (12h)</strong></div>
                <div>Technician Log In: <strong className="text-white">Ksh. {PASS_PRICE_KSH} (12h)</strong> + Ksh. {DEFAULT_TECHNICIAN_REG_PRICE_KSH}/mo Membership</div>
                <div>Workmanship Warranty: <strong className="text-emerald-400">30-Day Official Guarantee</strong></div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Single Admin Button Locked For Password */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES.</span>
            <span className="hidden sm:inline">·</span>
            <span>Operating Countrywide Across Kenya ({OFFICE_PHONE_DISPLAY})</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenAdminLogin && (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs transition-all border border-amber-500/40 hover:border-amber-400 shadow-md hover:shadow-amber-500/10 cursor-pointer group"
                title="Restricted Operations Portal — Locked for Password"
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-300 font-extrabold tracking-wide text-xs">
                    Locked for Password
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono group-hover:text-slate-300">
                    · Admin Portal
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
