import React, { useState } from 'react';
import {
  Server,
  Copy,
  Check,
  X,
  Terminal,
  ShieldCheck,
  Globe,
  HardDrive,
  Cpu,
  ArrowRight,
  ExternalLink,
  Layers,
  FileCode,
  CheckCircle2,
  Sparkles,
  Zap,
  HelpCircle,
  KeyRound,
  Download,
  FolderArchive,
  ArrowDownCircle,
  CreditCard
} from 'lucide-react';
import { BUSINESS_NAME, OFFICE_PHONE_DISPLAY } from '../types';

interface HostAndGoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostAndGoLiveModal: React.FC<HostAndGoLiveModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vercel' | 'zip' | 'one_line' | 'env' | 'docker' | 'pm2'>('vercel');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  // Vercel Environment Variables - Ready to paste directly into Vercel's Environment Variables box
  const vercelEnvSnippet = `NODE_ENV=production
PESAPAL_MODE=live
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_IPN_ID=
DISABLE_HMR=true
BUSINESS_NAME="${BUSINESS_NAME}"
OFFICE_PHONE="+254711408365"

# Optional Cloud Database (Vercel KV / Upstash / Supabase)
# KV_REST_API_URL=
# KV_REST_API_TOKEN=
# SUPABASE_URL=
# SUPABASE_KEY=

# Optional Cloud Media Storage (Cloudinary / Vercel Blob)
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# BLOB_READ_WRITE_TOKEN=`;

  const vercelCliCommand = `npx vercel --prod`;

  const vercelJsonContent = `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}`;

  const oneLineVpsCommand = `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs git && npm install -g pm2 && npm install && npm run build && pm2 start "npm start" --name "homebased-services" && pm2 save && pm2 startup`;

  const localRunCommand = `unzip homebased-services-project.zip -d my-app && cd my-app && npm install && npm run dev`;

  const productionEnvFile = `# HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES
# PRODUCTION ENVIRONMENT CONFIGURATION
NODE_ENV=production
PORT=3000
DISABLE_HMR=true

# PESAPAL API V3.0 PAYMENT GATEWAY CREDENTIALS
# Mode: 'sandbox' for testing or 'live' for real payments
PESAPAL_MODE=live
PESAPAL_CONSUMER_KEY=
PESAPAL_CONSUMER_SECRET=
PESAPAL_IPN_ID=

# APPLICATION SETTINGS
BUSINESS_NAME="${BUSINESS_NAME}"
OFFICE_PHONE="+254711408365"
`;

  const dockerComposeFile = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.fullstack
    container_name: homebased-services-app
    restart: always
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - PESAPAL_MODE=live
      - PESAPAL_CONSUMER_KEY=YOUR_PESAPAL_CONSUMER_KEY
      - PESAPAL_CONSUMER_SECRET=YOUR_PESAPAL_CONSUMER_SECRET
      - PESAPAL_IPN_ID=YOUR_PESAPAL_IPN_ID
`;

  const pm2Config = `module.exports = {
  apps: [{
    name: 'homebased-services',
    script: 'server.ts',
    interpreter: 'tsx',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      PESAPAL_MODE: 'live',
      PESAPAL_CONSUMER_KEY: 'YOUR_PESAPAL_CONSUMER_KEY',
      PESAPAL_CONSUMER_SECRET: 'YOUR_PESAPAL_CONSUMER_SECRET',
      PESAPAL_IPN_ID: 'YOUR_PESAPAL_IPN_ID'
    }
  }]
};`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Host &amp; Go Live Deployment Bundle
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pesapal API v3.0 · M-Pesa &amp; Cards · Vercel Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Integrated exclusively with Pesapal API v3.0 (M-Pesa STK Push, Airtel, Visa/Mastercard). Ready for instant deployment on Vercel, Docker, or Linux VPS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Action Bar: Download ZIP & Copy Vercel Env */}
        <div className="p-5 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Codebase Package &amp; 1-Click Hosting</span>
            </div>
            <p className="text-xs text-slate-200">
              Download the entire project ZIP archive or copy pre-configured Pesapal environment variables for Vercel.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {/* Direct ZIP Download Button */}
            <a
              href="/homebased-services-project.zip"
              download="homebased-services-project.zip"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download Project (.ZIP)</span>
            </a>

            {/* Vercel Copy Button */}
            <button
              onClick={() => copyToClipboard(vercelEnvSnippet, 'master_vercel')}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer shrink-0 transform hover:scale-[1.02]"
            >
              {copiedSection === 'master_vercel' ? (
                <>
                  <Check className="w-4 h-4 text-blue-100" />
                  <span>Copied for Vercel!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy for Vercel (1-Click)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 shrink-0 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vercel'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>▲ Vercel Hosting (Step-by-Step &amp; Keys)</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'zip'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>📦 Download Project ZIP Archive</span>
          </button>

          <button
            onClick={() => setActiveTab('one_line')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'one_line'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>1-Line VPS Terminal Script</span>
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'env'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Production .env File</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'docker'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Docker Compose</span>
          </button>

          <button
            onClick={() => setActiveTab('pm2')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pm2'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>PM2 Daemon Runner</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: VERCEL HOSTING */}
          {activeTab === 'vercel' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>Which one should you copy &amp; paste in Vercel?</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  In Vercel, copy and paste the <strong>Environment Variables block</strong> below. In the Vercel Dashboard, go to your Project &rarr; <strong>Settings &rarr; Environment Variables</strong>, click inside the first input box, and paste the entire block. Vercel automatically maps every key and value.
                </p>
              </div>

              {/* Box 1: The Exact Variables to Paste in Vercel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      <span>1. Paste This in Vercel &rarr; Environment Variables</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Standard Pesapal API v3.0 environment configuration.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(vercelEnvSnippet, 'tab_vercel_env')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    {copiedSection === 'tab_vercel_env' ? <Check className="w-3.5 h-3.5 text-blue-200" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'tab_vercel_env' ? 'Copied!' : 'Copy for Vercel'}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 leading-relaxed overflow-x-auto select-all">
                  {vercelEnvSnippet}
                </pre>
              </div>

              {/* Box 2: CLI Deployment */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      <span>2. Or Deploy via Vercel CLI (1 Single Terminal Command)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      If you have your code locally, run this in your terminal to deploy directly to production.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(vercelCliCommand, 'tab_vercel_cli')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'tab_vercel_cli' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'tab_vercel_cli' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 select-all">
                  {vercelCliCommand}
                </div>
              </div>

              {/* Box 3: vercel.json File */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      <span>3. `vercel.json` Routing Configuration (Included in Root)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Routes both static Vite frontend and `/api/*` Pesapal serverless endpoints.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(vercelJsonContent, 'tab_vercel_json')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'tab_vercel_json' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'tab_vercel_json' ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 leading-relaxed overflow-x-auto select-all">
                  {vercelJsonContent}
                </pre>
              </div>

              {/* 4-Step Roadmap */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-3">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Import to Vercel</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Go to vercel.com &rarr; "Add New Project" and import your repository.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">2</span>
                    <span>Framework: Vite</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Preset: Vite. Build command: <code>npm run build</code>. Output: <code>dist</code>.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Paste Env Block</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Click "Copy for Vercel" above and paste directly into Environment Variables.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">4</span>
                    <span>Click Deploy</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Live in ~45 seconds with automatic HTTPS SSL and Pesapal integration!
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PROJECT ZIP */}
          {activeTab === 'zip' && (
            <div className="space-y-5">
              <div className="p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                      <FolderArchive className="w-5 h-5 text-amber-400" />
                      <span>Complete Project Archive (homebased-services-project.zip)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      A complete, standalone ZIP archive containing all source code (React, TypeScript, Tailwind CSS, Express backend, Pesapal API v3.0 gateway, images, configurations, and Vercel files). Ready to extract and deploy anywhere.
                    </p>
                  </div>

                  <a
                    href="/homebased-services-project.zip"
                    download="homebased-services-project.zip"
                    className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>Download ZIP Now (7.0 MB)</span>
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-400 font-mono">
                  <div>Package: <strong className="text-slate-200">homebased-services-project.zip</strong></div>
                  <div>Format: <strong className="text-slate-200">Standard .ZIP</strong></div>
                  <div>Gateway: <strong className="text-emerald-400">Pesapal Only (M-Pesa, Airtel, Cards)</strong></div>
                  <div>Status: <strong className="text-emerald-400">Pre-bundled &amp; Ready</strong></div>
                </div>
              </div>

              {/* What is inside the ZIP file */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>What's Inside the ZIP File</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Frontend (React 19, TypeScript, Vite)</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Complete client application, Technician Registration Flow, Customer Repair Flow, Admin Portal, and Pesapal Payment Modal.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Backend &amp; Pesapal API v3.0 Gateway</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      <code>server.ts</code> and <code>server/pesapal.ts</code> supporting order creation, IPN registration, status checks, and transaction ledger.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Vercel Serverless Function &amp; Config</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      <code>vercel.json</code> and <code>api/index.ts</code> ready for seamless Vercel deployment without server management.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Docker &amp; VPS Deployment Files</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      <code>Dockerfile</code>, <code>docker-compose.yml</code>, and <code>nginx.conf</code> for VPS or cloud servers.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to run locally after unzipping */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>How to Run Locally (After Extracting)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Run this in terminal to extract, install dependencies, and start the dev server.
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(localRunCommand, 'tab_local_run')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSection === 'tab_local_run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'tab_local_run' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 select-all">
                  {localRunCommand}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 1-LINE VPS COMMAND */}
          {activeTab === 'one_line' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Single-Line Terminal Command (Ubuntu/Debian)</h3>
                  <p className="text-xs text-slate-400">
                    Installs Node.js 20, builds Vite frontend, compiles backend server, and launches with PM2 background daemon on boot.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(oneLineVpsCommand, 'tab_oneline')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSection === 'tab_oneline' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tab_oneline' ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-blue-300 leading-relaxed overflow-x-auto select-all">
                {oneLineVpsCommand}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Auto-Restart on Crash</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    PM2 monitors memory and auto-restarts the app if the server ever encounters an exception.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Boot On Reboot</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Registers systemd startup service so your website comes back online automatically after VPS reboots.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    <span>Port 3000 / 80 Ready</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Serves both the React frontend and the Pesapal payment API endpoints on port 3000.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTION .ENV */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Production `.env` Configuration File</h3>
                  <p className="text-xs text-slate-400">
                    Includes Pesapal API v3.0 environment variables.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(productionEnvFile, 'tab_env')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSection === 'tab_env' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tab_env' ? 'Copied .env' : 'Copy .env File'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto select-all">
                {productionEnvFile}
              </pre>
            </div>
          )}

          {/* TAB 5: DOCKER COMPOSE */}
          {activeTab === 'docker' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">`docker-compose.yml` (Port 80/3000)</h3>
                  <p className="text-xs text-slate-400">
                    Run `docker compose up -d --build` on any Linux server to run isolated in a production Docker container.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(dockerComposeFile, 'tab_docker')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSection === 'tab_docker' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tab_docker' ? 'Copied Compose' : 'Copy docker-compose.yml'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto select-all">
                {dockerComposeFile}
              </pre>
            </div>
          )}

          {/* TAB 6: PM2 CONFIG */}
          {activeTab === 'pm2' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">`ecosystem.config.cjs` (Cluster Mode)</h3>
                  <p className="text-xs text-slate-400">
                    High-performance Node.js clustering across all CPU cores for heavy customer traffic.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(pm2Config, 'tab_pm2')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSection === 'tab_pm2' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tab_pm2' ? 'Copied PM2' : 'Copy PM2 Config'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed overflow-x-auto select-all">
                {pm2Config}
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Pesapal Gateway Active · M-Pesa, Airtel &amp; Cards Exclusive</span>
          </div>
          <div>
            Support Helpline: <strong className="text-slate-200 font-mono">{OFFICE_PHONE_DISPLAY}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HostAndGoLiveModal;
