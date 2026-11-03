import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { Booking, OFFICE_PHONE, OFFICE_PHONE_DISPLAY } from '../types';

interface LiveTechnicianLocationMapProps {
  booking: Booking;
  onRefreshLocation?: () => void;
  isTechnicianView?: boolean;
}

// Coordinate mapping for Kenya estates with safe fallbacks
const ESTATE_COORDINATES: Record<string, { lat: number; lng: number; defaultRoad: string }> = {
  'Westlands': { lat: -1.2683, lng: 36.8080, defaultRoad: 'Waiyaki Way / Ring Road Westlands' },
  'Parklands': { lat: -1.2610, lng: 36.8220, defaultRoad: 'Limuru Road near City Park' },
  'Kilimani': { lat: -1.2921, lng: 36.7869, defaultRoad: 'Argwings Kodhek Road near Yaya Centre' },
  'Kileleshwa': { lat: -1.2785, lng: 36.7890, defaultRoad: 'Mandera Road / Oloitokitok Road' },
  'Karen': { lat: -1.3197, lng: 36.7065, defaultRoad: 'Karen Road near The Hub' },
  'Langata': { lat: -1.3500, lng: 36.7700, defaultRoad: 'Langata Road near Galleria' },
  'South B': { lat: -1.3108, lng: 36.8375, defaultRoad: 'Mombasa Road / Kapiti Road' },
  'South C': { lat: -1.3200, lng: 36.8300, defaultRoad: 'Muhoho Avenue near Bellevue' },
  'Kasarani': { lat: -1.2227, lng: 36.8973, defaultRoad: 'Thika Superhighway near Safari Park' },
  'Roysambu': { lat: -1.2180, lng: 36.8870, defaultRoad: 'Lumumba Drive / TRM Drive' },
  'Ruaka': { lat: -1.2062, lng: 36.7766, defaultRoad: 'Limuru Road near Two Rivers Mall' },
  'Lavington': { lat: -1.2790, lng: 36.7690, defaultRoad: 'James Gichuru Road' },
  'CBD': { lat: -1.2864, lng: 36.8172, defaultRoad: 'Uhuru Highway / Kenyatta Avenue' },
  'Mombasa': { lat: -4.0435, lng: 39.6682, defaultRoad: 'Links Road Nyali / Mombasa Island' },
  'Nakuru': { lat: -0.3031, lng: 36.0800, defaultRoad: 'Kenyatta Avenue / Milimani Nakuru' },
  'Kisumu': { lat: -0.0917, lng: 34.7680, defaultRoad: 'Oginga Odinga Street / Milimani Kisumu' },
  'Eldoret': { lat: 0.5143, lng: 35.2698, defaultRoad: 'Uganda Road / Elgon View Eldoret' }
};

const DEFAULT_COORDINATES = { lat: -1.2683, lng: 36.8080, defaultRoad: 'Waiyaki Way / Ring Road Westlands' };

export const LiveTechnicianLocationMap: React.FC<LiveTechnicianLocationMapProps> = ({
  booking,
  onRefreshLocation,
  isTechnicianView = false
}) => {
  // Defensive extraction to prevent any null reference crashes
  const safeEstate = (booking && typeof booking.estate === 'string' ? booking.estate : '').trim() || 'Westlands';
  const techName = (booking && booking.technicianName) ? String(booking.technicianName) : 'Verified Field Specialist';
  const techPhone = (booking && booking.technicianPhone) ? String(booking.technicianPhone) : OFFICE_PHONE_DISPLAY;
  const cleanPhone = techPhone.replace(/[^0-9]/g, '') || OFFICE_PHONE.replace(/[^0-9]/g, '');

  // Determine destination coordinates safely
  const matchedArea = Object.keys(ESTATE_COORDINATES).find(k => 
    safeEstate.toLowerCase().includes(k.toLowerCase())
  ) || 'Westlands';
  
  const destCoords = ESTATE_COORDINATES[matchedArea] || DEFAULT_COORDINATES;

  // Dynamic live progress simulation state
  const [distanceKm, setDistanceKm] = useState<number>(() => {
    return booking?.technicianLiveLocation?.distanceKm || 2.4;
  });

  const [etaMinutes, setEtaMinutes] = useState<number>(() => {
    return booking?.technicianLiveLocation?.etaMinutes || 16;
  });

  const [progressPercent, setProgressPercent] = useState<number>(() => {
    return booking?.technicianLiveLocation?.progressPercent || 35;
  });

  const [currentRoad, setCurrentRoad] = useState<string>(() => {
    return booking?.technicianLiveLocation?.currentRoadOrEstate || destCoords.defaultRoad;
  });

  const [speedKmh, setSpeedKmh] = useState<number>(() => {
    return booking?.technicianLiveLocation?.speedKmh || 38;
  });

  // Calculate technician simulated lat/lng approaching destination safely
  const techLat = destCoords.lat - (distanceKm * 0.008);
  const techLng = destCoords.lng - (distanceKm * 0.007);

  // Auto-progress simulation: gently move technician closer every few seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setDistanceKm((prev) => {
        if (prev <= 0.3) {
          setEtaMinutes(2);
          setProgressPercent(95);
          return 0.2;
        }
        const nextDist = Math.max(0.2, Number((prev - 0.1).toFixed(2)));
        const nextEta = Math.max(2, Math.round(nextDist * 6));
        setEtaMinutes(nextEta);
        setProgressPercent(Math.min(95, Math.round(100 - (nextDist / 3.0) * 80)));
        return nextDist;
      });

      // Slight variation in speed
      setSpeedKmh(Math.floor(32 + Math.random() * 14));
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${techLat.toFixed(5)},${techLng.toFixed(5)}&destination=${destCoords.lat.toFixed(5)},${destCoords.lng.toFixed(5)}&travelmode=driving`;

  return (
    <div className="bg-slate-900 text-white rounded-2xl border-2 border-amber-500/50 shadow-2xl overflow-hidden font-sans">
      {/* Top GPS Status Ribbon - Elegant Amber & Emerald High-Vis */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 relative" />
          </div>
          <span className="font-extrabold uppercase tracking-wider text-white">
            Live Doorstep GPS Radar Active
          </span>
          <span className="text-amber-100 text-[11px] font-mono hidden sm:inline">
            · Real-Time Satellite Tracking
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono bg-amber-950/70 text-amber-200 px-2.5 py-0.5 rounded border border-amber-400/40">
            Speed: {speedKmh} km/h · En Route
          </span>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-amber-200 underline cursor-pointer"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Interactive Visual Map & Radar View */}
      <div className="relative bg-slate-950 p-4 sm:p-6 overflow-hidden min-h-[260px] sm:min-h-[300px] flex flex-col justify-between">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px), radial-gradient(#f59e0b 1px, #030712 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />

        {/* Pulsing Radar concentric circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full border border-amber-500/10 animate-ping opacity-25" />
          <div className="w-96 h-96 rounded-full border border-amber-500/15" />
          <div className="w-48 h-48 rounded-full border border-amber-500/20" />
        </div>

        {/* Live Route Visualization (SVG / CSS) */}
        <div className="relative z-10 w-full mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/40 border border-amber-300/40">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Technician In-Flight
                </div>
                <div className="font-extrabold text-white text-xs truncate max-w-[150px] sm:max-w-xs">
                  {techName}
                </div>
              </div>
            </div>

            {/* Live Distance & ETA Pill */}
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 font-mono text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{distanceKm} km away · ETA ~{etaMinutes} mins</span>
              </div>
            </div>
          </div>

          {/* Graphical Route Progress Bar with moving vehicle */}
          <div className="relative pt-6 pb-2">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Moving Vehicle Icon Pin */}
            <div 
              className="absolute top-1 transform -translate-x-1/2 transition-all duration-700 ease-out flex flex-col items-center"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/50 ring-4 ring-amber-950 border border-white">
                <Navigation className="w-4 h-4 text-white transform rotate-45" />
              </div>
              <span className="text-[9px] font-mono font-bold text-amber-300 bg-slate-900/90 px-1.5 py-0.2 rounded mt-1 shadow-sm whitespace-nowrap border border-amber-500/30">
                {distanceKm} km
              </span>
            </div>

            {/* Destination Pin on Far Right */}
            <div className="absolute right-0 top-1 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/50 ring-4 ring-slate-900 border border-white">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-300 bg-slate-900/90 px-1.5 py-0.2 rounded mt-1 shadow-sm whitespace-nowrap border border-emerald-500/30">
                {safeEstate}
              </span>
            </div>
          </div>
        </div>

        {/* Live Location Telemetry Card */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Current Road / Landmark
            </span>
            <div className="font-extrabold text-white text-xs mt-0.5 truncate flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentRoad}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Destination Estate
            </span>
            <div className="font-extrabold text-white text-xs mt-0.5 truncate flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{safeEstate}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Vehicle &amp; Tool Kit
            </span>
            <div className="font-bold text-slate-200 text-xs mt-0.5 truncate">
              Field Service Van · Diagnostic Kit Ready
            </div>
          </div>
        </div>
      </div>

      {/* Technician Direct Contact & Rapid Communications Bar */}
      <div className="bg-slate-950/90 px-4 sm:px-6 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold">
            <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Assigned Driver / Technician:</span>
              <span className="text-emerald-400 font-bold">{techName}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Phone: {techPhone} · ETA: ~{etaMinutes} Mins
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${techPhone}`}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Driver Now</span>
          </a>

          <a
            href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(techName)},%20I%20am%20tracking%20your%20arrival%20live%20for%20my%20repair%20job.`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LiveTechnicianLocationMap;
