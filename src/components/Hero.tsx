import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap, ThermometerSnowflake, Clock, Wrench, CheckCircle, Phone, MessageSquare, MapPin, Tv, Flame, Wind, RefreshCw, UserCheck, Sparkles } from 'lucide-react';
import {
  PASS_PRICE_KSH,
  MEMBERSHIP_PRICE_KSH,
  DEFAULT_TECHNICIAN_REG_PRICE_KSH,
  getStoredShowcaseMedia,
  getStoredFeaturedVideo,
  ShowcaseMediaItem,
  FeaturedVideoConfig,
  DEFAULT_SHOWCASE_ITEMS
} from '../utils/session';
import { Play, Video } from 'lucide-react';
import { BUSINESS_NAME, OFFICE_PHONE, OFFICE_PHONE_DISPLAY, SessionPass, UserRole } from '../types';

const HeroApplianceShowcase: React.FC = () => {
  const [items, setItems] = useState<ShowcaseMediaItem[]>(() => getStoredShowcaseMedia());
  const [featuredVideo, setFeaturedVideo] = useState<FeaturedVideoConfig>(() => getStoredFeaturedVideo());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setItems(getStoredShowcaseMedia());
      setFeaturedVideo(getStoredFeaturedVideo());
    };
    window.addEventListener('app_data_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('app_data_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showcaseList = items && items.length > 0 ? items : DEFAULT_SHOWCASE_ITEMS;

  useEffect(() => {
    if (showcaseList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % showcaseList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [showcaseList.length]);

  const current = showcaseList[activeIndex] || showcaseList[0];

  return (
    <div className="space-y-3">
      {/* Main Large Image Card - responsive for mobile & desktop */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 group bg-slate-900 h-[280px] sm:h-[350px] md:h-[400px]">
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover transition-all duration-700"
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (current.fallback && e.currentTarget.src !== current.fallback) {
              e.currentTarget.src = current.fallback;
            }
          }}
        />
        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
          <div className="flex items-center gap-2 mb-1 sm:mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-orange-600 text-white">
              Actively Being Repaired
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300">· Countrywide Service (All Counties)</span>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {current.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 sm:mt-1 line-clamp-2">
            {current.caption}
          </p>
        </div>
      </div>

      {/* 5 Thumbnail Switcher Buttons (Fridges, Washing Machines, Cookers, TV, AC) */}
      {/* Featured Video Button (if configured in Admin) */}
      {featuredVideo.enabled && featuredVideo.videoUrl && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 hover:from-purple-800 hover:to-sky-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            </div>
            <span>{featuredVideo.title || 'Watch Live Workshop & Repair Demonstration'}</span>
          </button>
        </div>
      )}

      {/* 5 Thumbnail Switcher Buttons (Fridges, Washing Machines, Cookers, TV, AC, etc.) */}
      <div className={`grid gap-1.5 sm:gap-2 ${showcaseList.length <= 5 ? `grid-cols-${Math.min(showcaseList.length, 5)}` : 'grid-cols-5'}`}>
        {showcaseList.map((item, idx) => (
          <button
            key={item.id || idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all p-1 text-left cursor-pointer ${
              activeIndex === idx
                ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="h-10 sm:h-12 w-full rounded-lg overflow-hidden bg-slate-100 mb-1">
              <img
                src={item.image}
                alt={item.tag}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (item.fallback && e.currentTarget.src !== item.fallback) {
                    e.currentTarget.src = item.fallback;
                  }
                }}
              />
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-900 truncate leading-tight">
              {item.tag}
            </div>
          </button>
        ))}
      </div>

      {/* Video Player Modal */}
      {isVideoModalOpen && featuredVideo.videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm sm:text-base">{featuredVideo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 pt-0">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                {featuredVideo.videoUrl.includes('youtube.com') || featuredVideo.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={featuredVideo.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    title="Workshop Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={featuredVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              {featuredVideo.description && (
                <p className="text-xs text-slate-300 mt-3">{featuredVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface HeroProps {
  session: SessionPass | null;
  onLoginAsCustomer: () => void;
  onLoginAsTechnician: () => void;
  onProceedToPortal: (role: UserRole) => void;
  onOpenDirectPass?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  session,
  onLoginAsCustomer,
  onLoginAsTechnician,
  onProceedToPortal,
  onOpenDirectPass
}) => {
  const isLoggedIn = session && session.active;

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200">
      {/* Subtle brand color glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/25 rounded-full blur-3xl pointer-events-none translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Single Action based on Login State */}
          <div className="lg:col-span-7 space-y-6">
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              HOME BASED <span className="text-orange-600">ELECTRONICS</span>, <span className="text-amber-600">ELECTRICAL</span> &amp; <span className="text-purple-600">REFRIGERATION</span> SERVICES
            </h1>

            {/* ATTRACTIVE WARM WELCOME NOTE (REPLACED BLUE WITH WARM AMBER/GOLD LUXURY THEME) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-100/40 border-2 border-amber-400/90 shadow-xl shadow-amber-500/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-200/90 px-3 py-1 rounded-md border border-amber-300/80">
                    Doorstep Service · Countrywide Across All 47 Counties of Kenya
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  Verified Active Technicians
                </span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-black text-amber-950 tracking-tight">
                  Welcome to Kenya's Premier On-Demand Home Appliance &amp; Electrical Restoration Desk
                </h2>
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                  We rescue <strong className="text-orange-700">dead fridges &amp; freezers</strong>, restore <strong className="text-amber-800">tripped power &amp; breaker boards</strong>, repair <strong className="text-slate-900">leaking washing machines, cookers &amp; smart TVs</strong> at your doorstep in under 30 minutes. Every completed service comes backed by our stamped 30-day workmanship warranty. Select your service or log in below to unlock instant standby technician dispatch!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold text-amber-950">
                <span className="flex items-center gap-1.5 text-amber-900 bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>20–30 Min Doorstep Arrival</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-900 bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>30-Day Guarantee Stamped Receipt</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-900 bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live Doorstep GPS Radar</span>
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS: CUSTOMER LOGIN & BOLD BRIGHT PURPLE TECHNICIAN DIRECT PASS BUTTON */}
            {!isLoggedIn ? (
              <div className="pt-2 pb-1 max-w-xl space-y-3.5">
                {/* 1. Main Chalk Orange Customer / Diagnostic Log In Button */}
                <button
                  type="button"
                  onClick={onLoginAsCustomer}
                  className="w-full group relative overflow-hidden p-5 sm:p-6 rounded-2xl text-white shadow-2xl transition-all text-left cursor-pointer transform hover:-translate-y-1 active:translate-y-0 border-2 border-orange-200/60 ring-4 ring-orange-500/25"
                  style={{
                    backgroundColor: '#FF6F3C',
                    boxShadow: '0 8px 30px rgba(255, 111, 60, 0.45)'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-950 bg-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-orange-900 fill-orange-900" />
                      <span>Instant 24-Hour Pass · Ksh. 50 ($0.40 USD)</span>
                    </span>
                    <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-xs tracking-wide">
                    LOG IN TO GET STARTED
                  </div>
                  <div className="text-xs sm:text-sm text-orange-50 font-semibold mt-1.5">
                    Pay with Pesapal · M-Pesa, Visa/Mastercard &amp; Airtel · Instant Doorstep Dispatch
                  </div>
                </button>

                {/* 2. USER REQUIREMENT: Bright purple button with bold words TECHNICIAN DIRECT PASS */}
                {onOpenDirectPass && (
                  <button
                    type="button"
                    onClick={onOpenDirectPass}
                    className="w-full group relative overflow-hidden p-4 sm:p-5 rounded-2xl text-white shadow-2xl transition-all text-left cursor-pointer transform hover:-translate-y-1 active:translate-y-0 border-2 border-purple-300/80 ring-4 ring-purple-500/30 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 neon-glow-purple"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-purple-950 bg-fuchsia-200 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-900 fill-purple-900" />
                        <span>Ksh. 0 Free Direct Entry · No Pass or Registration Fees</span>
                      </span>
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-2 transition-transform" />
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-wide drop-shadow-sm">
                      TECHNICIAN DIRECT PASS
                    </div>
                    <div className="text-xs sm:text-sm text-purple-100 font-semibold mt-1">
                      Direct entry via National ID / Passport · Admin approval required to appear on customer list
                    </div>
                  </button>
                )}
              </div>
            ) : (session.role === 'customer' || session.role === 'technician') ? (
              <div className="pt-2 max-w-xl bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Active Pass Verified (12 Hours)
                    </span>
                  </div>
                  <span className="text-xs text-slate-300">
                    Logged in: <strong className="text-white capitalize">{session.name}</strong> ({session.role})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {session.role === 'customer'
                    ? 'Your diagnostic session is active for 12 hours. You are already logged in — click below to mark broken items or track your active jobs.'
                    : 'Your technician session is active for 12 hours. Click below to proceed to your registration or jobs board.'}
                </p>
                <button
                  type="button"
                  onClick={() => onProceedToPortal(session.role)}
                  className="w-full py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 text-white bg-gradient-to-r from-orange-500 via-sky-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-lg cursor-pointer transition-all transform hover:scale-[1.01]"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {session.role === 'customer'
                      ? 'Proceed Directly to Customer Dashboard'
                      : 'Proceed Directly to Technician Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-orange-600 flex items-center gap-1 font-bold">
                <MapPin className="w-3.5 h-3.5" /> Operating Countrywide Across Kenya
              </span>
              <span>·</span>
              <span className="text-sky-600 font-medium">Electronics, Electrical &amp; Refrigeration</span>
              <span>·</span>
              <span className="text-purple-600 font-medium">Highly Qualified &amp; Vetted Technicians</span>
            </div>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Connecting households and commercial establishments across all Kenyan counties with vetted, certified technicians for electronic boards, domestic &amp; commercial refrigeration, cooling, water pumps, and electrical installations.
            </p>

            {/* Pass and Pay notice banner (No 85% / 15% text in public view) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 max-w-xl text-xs text-slate-700">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Active 24-Hour Access Pass (Ksh. {PASS_PRICE_KSH})
                </span>
                <span className="font-bold text-cyan-800 bg-cyan-100/90 px-2.5 py-0.5 rounded flex items-center gap-1">
                  Pay via M-Pesa PIN Prompt
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Every repair completed on-site includes an official digital receipt stamped with an authentic <strong className="text-slate-900 font-semibold">30-day workmanship warranty guarantee</strong>.
              </p>
            </div>

            {/* Direct Office Hotline Links */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="text-slate-500">Office Helpline (Call &amp; WhatsApp):</span>
              <a
                href={`tel:${OFFICE_PHONE}`}
                className="text-emerald-700 hover:text-emerald-800 font-mono flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{OFFICE_PHONE_DISPLAY}</span>
              </a>
              <a
                href={`https://wa.me/${OFFICE_PHONE.replace(/[^0-9]/g, '')}?text=Hello%20HOME%20BASED%20ELECTRONICS,%20ELECTRICAL%20AND%20REFRIGERATION%20SERVICES`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 hover:text-sky-800 flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                <span>WhatsApp Office</span>
              </a>
            </div>

            {/* Trust Markers */}
            <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Highly Qualified Electricians
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
                Certified RAC &amp; Electronics Specialists
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-600" />
                30-Day Guarantee Stamp
              </span>
            </div>

          </div>

          {/* Right Column: High Impact Photo Card of Appliance being repaired with switcher */}
          <div className="lg:col-span-5 space-y-3">
            <HeroApplianceShowcase />
          </div>

        </div>

        {/* 4-Column Quick Capability Strip below Hero */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-orange-600 tracking-wider">Refrigeration</div>
            <div className="text-sm font-semibold text-slate-900">Fridges &amp; Deep Freezers</div>
            <div className="text-xs text-slate-500">Gas top-up, inverter compressor &amp; cold rooms</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-sky-600 tracking-wider">Electronics &amp; PCB</div>
            <div className="text-sm font-semibold text-slate-900">Circuit Boards &amp; Sensors</div>
            <div className="text-xs text-slate-500">Inverter boards, AC sensors &amp; digital displays</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-purple-600 tracking-wider">Power &amp; Wiring</div>
            <div className="text-sm font-semibold text-slate-900">Consumer Units &amp; Breakers</div>
            <div className="text-xs text-slate-500">MCB tripping, phase fault tracing &amp; instant showers</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase font-bold text-emerald-600 tracking-wider">Locations Covered</div>
            <div className="text-sm font-semibold text-slate-900">Countrywide · All 47 Counties</div>
            <div className="text-xs text-slate-500">M-Pesa PIN Pay · Call: {OFFICE_PHONE_DISPLAY}</div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
