import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Play,
  Lock,
  Globe,
  Layers,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  HelpCircle,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import {
  fetchPesapalStatus,
  testPesapalConnection,
  savePesapalKeys,
  submitPesapalOrder,
  checkPesapalStatus,
  fetchPesapalTransactions,
  registerPesapalIPNClient,
  PesapalTransaction,
  PesapalStatusResponse
} from '../utils/pesapalClient';
import { BUSINESS_NAME, OFFICE_PHONE_DISPLAY } from '../types';

interface PesapalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_LIVE_KEY = '';
const DEFAULT_LIVE_IPN = '';

export const PesapalModal: React.FC<PesapalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'guide' | 'tester' | 'ledger'>('credentials');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<PesapalStatusResponse | null>(null);

  // Form state
  const [consumerKey, setConsumerKey] = useState(DEFAULT_LIVE_KEY);
  const [consumerSecret, setConsumerSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [ipnId, setIpnId] = useState(DEFAULT_LIVE_IPN);
  const [mode, setMode] = useState<'sandbox' | 'live'>('live');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Connectivity test state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    isLive: boolean;
  } | null>(null);

  // Test Order state
  const [simAmountKsh, setSimAmountKsh] = useState(50);
  const [simName, setSimName] = useState('Customer Test');
  const [simPhone, setSimPhone] = useState('');
  const [simEmail, setSimEmail] = useState('payer@example.com');
  const [simResult, setSimResult] = useState<any>(null);
  const [simProcessing, setSimProcessing] = useState(false);

  // Ledger state
  const [transactions, setTransactions] = useState<PesapalTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [registeringIpn, setRegisteringIpn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      loadTransactions();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      // 1. Check local storage fallback first
      let localCreds: any = null;
      try {
        const raw = localStorage.getItem('homebased_pesapal_credentials_v1');
        if (raw) localCreds = JSON.parse(raw);
      } catch {}

      const data = await fetchPesapalStatus();
      setStatusData(data);
      setMode(data.config.mode === 'sandbox' ? 'sandbox' : 'live');

      const resolvedKey = data.config.consumerKey || localCreds?.consumerKey || DEFAULT_LIVE_KEY;
      const resolvedSecret = data.config.consumerSecret || localCreds?.consumerSecret || '';
      const resolvedIpn = data.config.ipnId || localCreds?.ipnId || DEFAULT_LIVE_IPN;

      setConsumerKey(resolvedKey);
      if (resolvedSecret && !/^[\.\*\•\-\_]+$/.test(resolvedSecret)) {
        setConsumerSecret(resolvedSecret);
      }
      setIpnId(resolvedIpn);

      if (data.connection) {
        setConnectionResult({
          tested: true,
          success: data.connection.success,
          message: data.connection.message,
          isLive: data.connection.isLive
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRegisterIpn = async () => {
    setRegisteringIpn(true);
    try {
      const res = await registerPesapalIPNClient();
      if (res.success && res.ipn_id) {
        setIpnId(res.ipn_id);
        setSaveMessage({ type: 'success', text: `IPN Notification URL registered! ID: ${res.ipn_id}` });
        try {
          const raw = localStorage.getItem('homebased_pesapal_credentials_v1');
          const existing = raw ? JSON.parse(raw) : {};
          localStorage.setItem('homebased_pesapal_credentials_v1', JSON.stringify({ ...existing, ipnId: res.ipn_id }));
        } catch {}
      } else {
        setSaveMessage({ type: 'error', text: res.message || 'Could not register IPN. Check Consumer Keys first.' });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to auto-register IPN' });
    } finally {
      setRegisteringIpn(false);
    }
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const list = await fetchPesapalTransactions();
      setTransactions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await testPesapalConnection();
      setConnectionResult({
        tested: true,
        success: res.success,
        message: res.message,
        isLive: res.isLive
      });
      loadStatus();
    } catch (e: any) {
      setConnectionResult({
        tested: true,
        success: false,
        message: e.message || 'Connection test ping completed with notice.',
        isLive: mode === 'live'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    // FIX 2: Guard against submitting masked dots ("...") or bullets
    const rawSecret = consumerSecret.trim();
    const isMaskedDots = /^[\.\*\•\-\_]+$/.test(rawSecret) || rawSecret === '...';
    const cleanSecret = isMaskedDots ? '' : rawSecret;

    const finalKey = consumerKey.trim() || DEFAULT_LIVE_KEY;
    const finalIpn = ipnId.trim() || DEFAULT_LIVE_IPN;

    try {
      const res = await savePesapalKeys({
        consumerKey: finalKey,
        consumerSecret: cleanSecret,
        mode,
        ipnId: finalIpn
      });

      setSaveMessage({
        type: 'success',
        text: res.message || `✓ Pesapal ${mode.toUpperCase()} credentials saved and active!`
      });

      // Reload config state
      await loadStatus();

      // FIX 3: Run connection test non-blockingly so timeouts NEVER overwrite success message
      handleTestConnection().catch((err) => {
        console.warn('Background ping notice:', err);
      });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save credentials' });
    }
  };

  const handleRunTestOrder = async () => {
    setSimProcessing(true);
    setSimResult(null);

    try {
      const order = await submitPesapalOrder({
        amountKsh: Number(simAmountKsh) || 50,
        description: `Test M-Pesa Pass Payment (Ksh. ${simAmountKsh})`,
        customerName: simName,
        phone: simPhone,
        email: simEmail,
        role: 'customer'
      });

      if (order && order.orderTrackingId) {
        const status = await checkPesapalStatus(order.orderTrackingId);
        setSimResult({ order, status });
        loadTransactions();
      }
    } catch (e: any) {
      setSimResult({ error: e.message || 'Test order failed' });
    } finally {
      setSimProcessing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 p-5 sm:p-6 text-white shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Smartphone className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                    Exclusive Payment Gateway
                  </span>
                  <span className="text-xs text-emerald-200">API 3.0 Standard</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
                  Pesapal Payment Gateway Hub
                </h2>
                <p className="text-xs text-emerald-100">
                  Accept M-Pesa STK Push, Airtel Money, Visa, and Mastercard countrywide in Kenya.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/15 pt-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Consumer Keys</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Setup Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('tester')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tester'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>M-Pesa Test</span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ledger ({transactions.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    connectionResult?.success ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {connectionResult?.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Gateway Mode:</span>
                      <span className="uppercase px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                        {statusData?.config?.mode || mode}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">Currency: KES (Kenyan Shillings)</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {connectionResult?.message || 'Pesapal M-Pesa & Card Gateway Ready.'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleSaveKeys} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pesapal Gateway Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                      mode === 'live' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'live'}
                        onChange={() => setMode('live')}
                        className="text-emerald-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Live (Real Payments)</div>
                        <div className="text-[10px] text-slate-500">https://pay.pesapal.com/v3</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                      mode === 'sandbox' ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === 'sandbox'}
                        onChange={() => setMode('sandbox')}
                        className="text-emerald-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Sandbox (Developer Test)</div>
                        <div className="text-[10px] text-slate-500">cybqa.pesapal.com/pesapalv3</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pesapal Consumer Key
                  </label>
                  <input
                    type="text"
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    placeholder="e.g. qkio1BZrZ9Nx5Z5Nf6m9r4+5s="
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Pesapal Consumer Secret
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                      title={showSecret ? "Hide Consumer Secret" : "Reveal Consumer Secret"}
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
                      <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={consumerSecret}
                      onChange={(e) => setConsumerSecret(e.target.value)}
                      placeholder={statusData?.config?.hasConsumerSecret ? "•••••••••••••••• (Leave blank to keep existing active secret)" : "Enter live Consumer Secret"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {statusData?.config?.hasConsumerSecret && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active secret securely preserved in database &amp; runtime. Submitting will not erase it.</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Pesapal IPN Notification ID (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoRegisterIpn}
                      disabled={registeringIpn || !consumerKey || !consumerSecret}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{registeringIpn ? 'Registering...' : 'Auto-Generate IPN ID'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ipnId}
                    onChange={(e) => setIpnId(e.target.value)}
                    placeholder="e.g. e4d3b6f1-7c9a-4c2d-9b1e-0a8f7e6d5c4b"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Webhook listener endpoint: <code className="text-slate-600 font-mono">/api/pesapal/ipn</code>
                  </p>
                </div>

                {saveMessage && (
                  <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {saveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{saveMessage.text}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Keys are securely stored in runtime and synced to server routes.
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Pesapal Credentials</span>
                  </button>
                </div>
              </form>

              {/* Vercel Environment Variables Helper */}
              <div className="p-4 bg-slate-900 rounded-xl text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Vercel Environment Variables
                  </span>
                  <button
                    onClick={() => copyToClipboard(`PESAPAL_MODE=${mode}\nPESAPAL_CONSUMER_KEY=${consumerKey}\nPESAPAL_CONSUMER_SECRET=${consumerSecret}`, 'env')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-sans"
                  >
                    {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'env' ? 'Copied' : 'Copy for Vercel'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2.5 bg-slate-950 rounded-lg">
                  {`PESAPAL_MODE=${mode}\nPESAPAL_CONSUMER_KEY=${consumerKey || 'your_consumer_key'}\nPESAPAL_CONSUMER_SECRET=${consumerSecret || 'your_consumer_secret'}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="font-extrabold text-emerald-950 text-sm mb-1">
                  How to Get Live Pesapal Credentials in Kenya
                </h4>
                <p className="text-emerald-800 leading-relaxed">
                  Pesapal allows your business to receive M-Pesa, Airtel Money, and Card payments directly into your Kenya bank account or M-Pesa Till.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-slate-900">Sign up or Log In to Pesapal</h5>
                    <p className="text-slate-600 mt-0.5">
                      Visit <a href="https://www.pesapal.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">pesapal.com</a> (or <a href="https://dashboard.pesapal.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">dashboard.pesapal.com</a>) and log in to your business merchant account.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-slate-900">Generate API 3.0 Consumer Key & Secret</h5>
                    <p className="text-slate-600 mt-0.5">
                      Go to <strong>Settings</strong> &rarr; <strong>API 3.0 Keys</strong>. Click <em>Generate Keys</em> to retrieve your <strong>Consumer Key</strong> and <strong>Consumer Secret</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-slate-900">Paste Credentials into Admin & Vercel</h5>
                    <p className="text-slate-600 mt-0.5">
                      Paste the keys in the <strong>Consumer Keys</strong> tab above or add them to your Vercel Project Settings &rarr; Environment Variables as <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">PESAPAL_CONSUMER_KEY</code> and <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">PESAPAL_CONSUMER_SECRET</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Run a Test Ksh. 50 M-Pesa / Card Order
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Payer Name</label>
                    <input
                      type="text"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">M-Pesa Phone Number</label>
                    <input
                      type="text"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount (KES)</label>
                    <input
                      type="number"
                      value={simAmountKsh}
                      onChange={(e) => setSimAmountKsh(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunTestOrder}
                  disabled={simProcessing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${simProcessing ? 'animate-spin' : ''}`} />
                  <span>{simProcessing ? 'Creating Pesapal Order...' : `Simulate Ksh. ${simAmountKsh} M-Pesa Checkout`}</span>
                </button>
              </div>

              {simResult && (
                <div className="p-4 bg-slate-900 rounded-xl text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono">Test Order Result</span>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Total Recorded Payments: {transactions.length}
                </span>
                <button
                  onClick={loadTransactions}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                  No Pesapal transactions recorded yet. Completed M-Pesa and Card payments will appear here.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.orderTrackingId} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{tx.customerName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold uppercase">
                            {tx.paymentMethod || 'MPESA'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Tracking: {tx.orderTrackingId} · Code: {tx.confirmationCode || 'PENDING'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">Ksh. {tx.amountKsh}</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase">{tx.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PesapalModal;
