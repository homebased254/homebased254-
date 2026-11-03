import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  CreditCard,
  UserCheck,
  Clock,
  AlertCircle,
  Loader2,
  BadgeCheck,
  KeyRound,
  FileText
} from 'lucide-react';
import { SessionPass, Technician } from '../types';
import {
  findTechnicianByNationalId,
  validatePassWithServer,
  createTechnicianDirectPassSession,
  getStoredTechnicians,
  saveSession
} from '../utils/session';

interface TechnicianDirectPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectPassSuccess: (session: SessionPass) => void;
  onOpenDirectPassRegistration: () => void;
}

export const TechnicianDirectPassModal: React.FC<TechnicianDirectPassModalProps> = ({
  isOpen,
  onClose,
  onDirectPassSuccess,
  onOpenDirectPassRegistration
}) => {
  const [idNumber, setIdNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [savedIdFound, setSavedIdFound] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setStatusMessage('');
      try {
        const rememberedId = localStorage.getItem('saved_technician_id_number');
        if (rememberedId) {
          setSavedIdFound(rememberedId);
          setIdNumber(rememberedId);
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookupAndEnter = async (idToUse?: string) => {
    const targetId = (idToUse || idNumber).trim();
    if (!targetId) {
      setErrorMessage('Please enter your valid National ID or Passport Number to proceed.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setStatusMessage('Checking ID against database records...');

    try {
      // 1. Check local cache first
      let matchedTech: Technician | null = findTechnicianByNationalId(targetId);

      // 2. Validate with central database
      if (!matchedTech) {
        const serverCheck = await validatePassWithServer(targetId, 'technician');
        if (serverCheck && serverCheck.hasActivePass && serverCheck.technician) {
          matchedTech = serverCheck.technician;
        }
      }

      // 3. Fallback: search by phone if they entered a phone number instead
      if (!matchedTech && targetId.replace(/\D/g, '').length >= 9) {
        const cleanDigits = targetId.replace(/\D/g, '').slice(-9);
        const all = getStoredTechnicians();
        matchedTech = all.find(t => t.phone.replace(/\D/g, '').slice(-9) === cleanDigits) || null;
      }

      if (matchedTech) {
        // Remember this ID in local storage for seamless future visits
        if (matchedTech.nationalIdOrPassport) {
          try {
            localStorage.setItem('saved_technician_id_number', matchedTech.nationalIdOrPassport.trim());
          } catch {}
        }

        const isApproved = matchedTech.approval_status === 'approved';
        setStatusMessage(
          isApproved
            ? 'Direct Pass Approved! Logging into technician workspace...'
            : 'Direct Pass verified! (Pending Admin Approval for public directory). Logging in...'
        );

        setTimeout(() => {
          const directSession = createTechnicianDirectPassSession(matchedTech!);
          saveSession(directSession);
          setIsLoading(false);
          onDirectPassSuccess(directSession);
          onClose();
        }, 600);
        return;
      }

      // Not found in database
      setIsLoading(false);
      setStatusMessage('');
      setErrorMessage(`No technician profile found for ID "${targetId}". Please verify your ID number or complete the free direct pass registration below.`);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Error validating direct pass ID. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-purple-500 rounded-3xl shadow-2xl shadow-purple-900/50 overflow-hidden text-white">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center shadow-lg shadow-purple-600/40 text-white font-extrabold border border-purple-400/40">
              <KeyRound className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700/60">
                  Zero Charges · Ksh. 0 Free Entry
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                TECHNICIAN DIRECT PASS
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Key Rule Notice */}
          <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Direct Entry Policy (Free · Admin Approval Required)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Technicians joining through <strong>Direct Pass</strong> are <strong className="text-emerald-300">never charged registration or pass fees (Ksh. 0)</strong>. The system permanently remembers you by your <strong>National ID or Passport Number</strong> to give you free access. To appear on the public customer directory, your profile must be approved by the administrator.
            </p>
          </div>

          {/* Remembered ID Quick Entry Badge (if present) */}
          {savedIdFound && (
            <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Remembered ID on this device:</div>
                  <div className="text-sm font-mono font-bold text-purple-300">{savedIdFound}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleLookupAndEnter(savedIdFound)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                Enter Now
              </button>
            </div>
          )}

          {/* Form: Enter ID Number */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Enter National ID or Passport Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLookupAndEnter();
                }}
                placeholder="e.g. 12345678 or ID/PASSPORT"
                className="w-full px-4 py-3.5 bg-slate-950 border-2 border-purple-500/60 focus:border-purple-400 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Your ID number acts as your permanent direct pass key for all future logins.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="p-3.5 bg-purple-950/60 border border-purple-500/50 rounded-xl text-xs text-purple-200 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Enter Button */}
          <button
            type="button"
            onClick={() => handleLookupAndEnter()}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 active:from-purple-700 active:to-purple-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-400/40 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying ID Number...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5 text-purple-200" />
                <span>ENTER WITH DIRECT PASS (FREE · KSH. 0)</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
              New to Direct Pass?
            </span>
          </div>

          {/* Register Button (Ksh. 0 Direct Pass Registration) */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-center">
            <div className="text-xs text-slate-300">
              Haven't registered your direct pass yet? Fill out our registration form and submit directly to the Admin with <strong className="text-purple-300">zero fees</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDirectPassRegistration();
              }}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-purple-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border border-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>REGISTER FOR FREE DIRECT PASS (KSH. 0)</span>
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-400">
          Home Based Electronics, Electrical &amp; Refrigeration Services · Direct Pass Portal
        </div>

      </div>
    </div>
  );
};

export default TechnicianDirectPassModal;
