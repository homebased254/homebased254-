import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, UserCheck, Wrench, LogOut, Phone, MessageSquare, Lock, CreditCard, MapPin, Sparkles, User, Hammer, ArrowRight } from 'lucide-react';
import { SessionPass, BUSINESS_NAME, OFFICE_PHONE, OFFICE_PHONE_DISPLAY } from '../types';
import { formatTimeRemaining } from '../utils/session';

interface HeaderProps {
  session: SessionPass | null;
  onOpenLogin: (role: 'customer' | 'technician') => void;
  onLogout: () => void;
  activeView: 'home' | 'customer' | 'technician' | 'admin';
  onNavigate: (view: 'home' | 'customer' | 'technician' | 'admin') => void;
  onOpenDirectPass?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenLogin,
  onLogout,
  activeView,
  onNavigate,
  onOpenDirectPass
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!session || !session.active) return;

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(session.activeUntil));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[5rem] py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Brand Wordmark + Upper Left Red Log Out Button */}
        <div className="flex flex-col items-start gap-1.5 shrink-0 max-w-full">
          <button
            onClick={() => onNavigate('home')}
            className="text-left flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 via-sky-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">
                HOME BASED <span className="text-orange-600">ELECTRONICS</span>, <span className="text-sky-600">ELECTRICAL</span> &amp; <span className="text-purple-600">REFRIGERATION</span>
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-700 tracking-tight leading-snug drop-shadow-xs flex items-center gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                <span>On-demand doorstep appliance repair &amp; electrical restoration across Kenya with 30-day warranty. Select your service or log in to dispatch your nearby standby specialist!</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
                Countrywide Kenya · Verified Field Technicians
              </span>
            </div>
          </button>

          {/* VISIBLE RED LOG OUT BUTTON UPPER LEFT JUST BELOW BUSINESS NAME */}
          {session && session.active && (
            <div className="pl-11 sm:pl-12.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-md shadow-red-600/35 border border-red-500 ring-2 ring-red-400/40 transition-all transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                title="Log out and end active session"
              >
                <LogOut className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                <span>LOG OUT</span>
                <span className="text-red-100 font-semibold normal-case text-[10px] font-mono">
                  ({session.name ? session.name.split(' ')[0] : session.role})
                </span>
              </button>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden xs:inline-block">
                Active 12h Pass
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-slate-900 cursor-pointer ${
              activeView === 'home' ? 'text-slate-950 font-bold' : ''
            }`}
          >
            Home Overview
          </button>
          <a
            href="#services"
            onClick={(e) => {
              if (activeView !== 'home') {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="hover:text-slate-900 transition-colors"
          >
            Services List
          </a>
          <a
            href="#pass-details"
            onClick={(e) => {
              if (activeView !== 'home') {
                e.preventDefault();
                onNavigate('home');
                setTimeout(() => {
                  document.getElementById('pass-details')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="hover:text-slate-900 transition-colors"
          >
            Ksh. 50 (12h Pass)
          </a>
        </nav>

        {/* Zone 3: BOLD LOG IN BUTTONS AT THE TOP */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
          {session && session.active ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span className="font-mono font-bold text-slate-900 tabular-nums">{timeRemaining}</span>
                <span className="text-slate-300">|</span>
                <span className="font-bold text-purple-700 capitalize">
                  {session.role}
                </span>
              </div>

              {session.role === 'customer' ? (
                <button
                  onClick={() => onNavigate('customer')}
                  className="px-3.5 sm:px-4 py-2 text-xs font-black text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-500/20 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Dashboard</span>
                </button>
              ) : session.role === 'technician' ? (
                <button
                  onClick={() => onNavigate('technician')}
                  className="px-3.5 sm:px-4 py-2 text-xs font-black text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-700/20 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Technician Jobs Dashboard</span>
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* USER REQUIREMENT: Bright purple button with bold words TECHNICIAN DIRECT PASS */}
              {onOpenDirectPass && (
                <button
                  type="button"
                  onClick={onOpenDirectPass}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-black uppercase tracking-wider text-white rounded-xl shadow-lg transition-all transform hover:scale-[1.05] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-1.5 border-2 border-purple-300/80 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 neon-glow-purple neon-pulse-purple"
                  title="Technician Free Direct Entry (Ksh. 0) - Admin Approval Required"
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-200 fill-fuchsia-200 animate-pulse" />
                  <span className="drop-shadow font-black tracking-wider text-white">TECHNICIAN DIRECT PASS</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenLogin('customer')}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white rounded-xl shadow-xl transition-all transform hover:scale-[1.05] active:scale-[0.98] cursor-pointer whitespace-nowrap flex items-center gap-2 border-2 border-orange-200/60 ring-2 ring-orange-500/25"
                style={{
                  backgroundColor: '#FF6F3C',
                  boxShadow: '0 8px 25px rgba(255, 111, 60, 0.45)'
                }}
              >
                <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200 animate-pulse" />
                <span className="drop-shadow font-black tracking-wider text-white">LOG IN TO GET STARTED</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
