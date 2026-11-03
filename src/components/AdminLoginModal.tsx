import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { SessionPass, BUSINESS_NAME, OFFICE_PHONE_DISPLAY } from '../types';
import { createAdminSession, verifyAdminPassword } from '../utils/session';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLoginSuccess: (session: SessionPass) => void;
  onSwitchToGeneralLogin?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAdminLoginSuccess,
  onSwitchToGeneralLogin
}) => {
  const [adminName, setAdminName] = useState('Operations Manager');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const triggerSuccessfulLogin = () => {
    setIsSuccess(true);
    setIsSubmitting(false);
    setTimeout(() => {
      const session = createAdminSession(adminName);
      onAdminLoginSuccess(session);
      onClose();
      setPassword('');
      setErrorMessage('');
      setIsSuccess(false);
    }, 400);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (errorMessage) setErrorMessage('');

    // Auto-open once the correct admin password is typed
    if (verifyAdminPassword(val)) {
      triggerSuccessfulLogin();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter the administrator password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (verifyAdminPassword(password)) {
        triggerSuccessfulLogin();
      } else {
        setIsSubmitting(false);
        setErrorMessage('Access Denied: Incorrect administrator password.');
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top brand accent ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-500 to-orange-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 mb-3 shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200 mb-1.5">
              Authorized Personnel Only
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Administrator Login
            </h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {BUSINESS_NAME}
            </p>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Credentials Authenticated!
              </h4>
              <p className="text-xs text-slate-600">
                Launching Administrator Operations Center...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="font-medium leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Designation
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Operations Manager / Supervisor"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Completely Hidden &amp; Masked</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••••"
                    autoFocus
                    required
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent tracking-widest transition-all ${
                      errorMessage
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-amber-500'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Portal opens immediately once authorized password is typed.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authenticate &amp; Open Console</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                {onSwitchToGeneralLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToGeneralLogin();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Customer / Technician? <span className="underline font-semibold">User Login</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Footer hotline */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Security: <strong className="font-semibold text-emerald-700">Encrypted Mask</strong></span>
            <span>Helpline: <strong className="font-mono text-slate-700">{OFFICE_PHONE_DISPLAY}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
