import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  ThermometerSnowflake,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowLeft,
  Calendar,
  Radio,
  SlidersHorizontal,
  X,
  Camera,
  Eye,
  Navigation,
  Image as ImageIcon
} from 'lucide-react';
import { RepairItem, SelectedRepairItem, Technician, Booking, SessionPass, RepairCategory, OFFICE_PHONE_DISPLAY } from '../types';
import { REPAIR_ITEMS, KENYA_ESTATES } from '../data/repairItems';
import {
  getStoredTechnicians,
  saveBooking,
  getStoredBookings,
  isTechnicianMemberActive,
  subscribeToSharedSync
} from '../utils/session';
import { CustomerPaymentReceiptModal } from './CustomerPaymentReceiptModal';
import { LiveTechnicianLocationMap } from './LiveTechnicianLocationMap';

interface CustomerRepairFlowProps {
  session: SessionPass;
  initialCategory?: string;
  onBackToHome: () => void;
}

const POPULAR_SEARCH_CHIPS = [
  'Fridge Gas Leak',
  'Washing Machine Motor',
  'Cooker Heating Element',
  'Breaker Tripping',
  'Instant Shower Earth',
  'Air Conditioner Service',
  'Smart TV Backlight'
];

export const CustomerRepairFlow: React.FC<CustomerRepairFlowProps> = ({
  session,
  initialCategory,
  onBackToHome
}) => {
  // Flow steps: 'select_items' | 'matched_technicians' | 'booking_confirmed'
  const [currentStep, setCurrentStep] = useState<'select_items' | 'matched_technicians' | 'booking_confirmed'>('select_items');

  // Search and Category Filter
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // Customer marked repair items manifest
  const [selectedItems, setSelectedItems] = useState<SelectedRepairItem[]>([]);
  const [currentlyEditingItem, setCurrentlyEditingItem] = useState<RepairItem | null>(null);

  // Form fields for configuring an item
  const [itemIssues, setItemIssues] = useState<string[]>([]);
  const [itemBrand, setItemBrand] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUrgency, setItemUrgency] = useState<'normal' | 'emergency' | 'scheduled'>('normal');
  const [itemNotes, setItemNotes] = useState<string>('');

  // Customer location & details
  const [customerEstate, setCustomerEstate] = useState<string>(KENYA_ESTATES[0]);
  const [customerHouseNo, setCustomerHouseNo] = useState<string>('');

  // Active technicians from shared database
  // USER REQUIREMENT: "Let all technician who logs in and registered be configured automatically in the entire system and appear automatically and appear to every customer who logs in."
  const [activeTechnicians, setActiveTechnicians] = useState<Technician[]>(() => {
    return getStoredTechnicians().filter(isTechnicianMemberActive);
  });

  const reloadTechs = () => {
    const list = getStoredTechnicians().filter(isTechnicianMemberActive);
    setActiveTechnicians(list);
  };

  useEffect(() => {
    reloadTechs();
    const unsubscribe = subscribeToSharedSync(() => {
      reloadTechs();
    });
    return () => unsubscribe();
  }, [currentStep]);

  // Selected technician for booking or broadcast
  const [chosenTechnician, setChosenTechnician] = useState<Technician | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(() => {
    // Check if there is an existing active booking for this customer
    const all = getStoredBookings();
    return all.find(b => session.phone && b.customerPhone?.replace(/[^0-9]/g, '') === session.phone.replace(/[^0-9]/g, '')) || null;
  });
  const [callModalTech, setCallModalTech] = useState<Technician | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isBroadcastBooking, setIsBroadcastBooking] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [completedPromptTriggeredFor, setCompletedPromptTriggeredFor] = useState<string | null>(null);

  // Poll for job updates and trigger immediate payment prompt when technician marks job completed
  useEffect(() => {
    const syncJobStatus = () => {
      const all = getStoredBookings();
      const currentCustPhone = session.phone ? session.phone.replace(/[^0-9]/g, '') : '';
      const match = all.find(b => 
        (activeBooking && b.id === activeBooking.id) ||
        (currentCustPhone && b.customerPhone?.replace(/[^0-9]/g, '') === currentCustPhone)
      );

      if (match) {
        if (!activeBooking || activeBooking.status !== match.status || activeBooking.paymentStatus !== match.paymentStatus) {
          setActiveBooking(match);
        }
        // USER REQUIREMENT: "Once job is completed and technician mark it as completed customer must get immediate prompt to pay."
        if (match.status === 'completed' && match.paymentStatus !== 'paid') {
          if (completedPromptTriggeredFor !== match.id) {
            setCompletedPromptTriggeredFor(match.id);
            setIsReceiptModalOpen(true);
          }
        }
      }
    };

    syncJobStatus();
    const unsubscribe = subscribeToSharedSync(syncJobStatus);
    return () => unsubscribe();
  }, [activeBooking, session.phone, completedPromptTriggeredFor]);

  // Filter items in catalog by category & search query
  const filteredCatalogItems = useMemo(() => {
    return REPAIR_ITEMS.filter((item) => {
      const matchesCategory = selectedCategoryTab === 'all' || item.category === selectedCategoryTab;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.commonIssues.some((issue) => issue.toLowerCase().includes(q)) ||
        item.typicalBrands.some((brand) => brand.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategoryTab, searchQuery]);

  // Open modal to configure and mark an item
  const handleStartMarkingItem = (item: RepairItem) => {
    setCurrentlyEditingItem(item);
    setItemIssues(item.commonIssues.slice(0, 1));
    setItemBrand(item.typicalBrands[0] || 'Generic');
    setItemQuantity(1);
    setItemUrgency('normal');
    setItemNotes('');
  };

  // Add configured item to manifest
  const handleSaveItemToManifest = () => {
    if (!currentlyEditingItem) return;

    const newItem: SelectedRepairItem = {
      itemId: currentlyEditingItem.id,
      itemName: currentlyEditingItem.name,
      category: currentlyEditingItem.category,
      selectedIssues: itemIssues.length > 0 ? itemIssues : ['General diagnostic inspection required'],
      brand: itemBrand,
      quantity: itemQuantity,
      urgency: itemUrgency,
      notes: itemNotes
    };

    setSelectedItems((prev) => {
      const filtered = prev.filter((i) => i.itemId !== currentlyEditingItem.id);
      return [...filtered, newItem];
    });

    setCurrentlyEditingItem(null);
  };

  const handleRemoveMarkedItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const toggleIssueCheckbox = (issue: string) => {
    setItemIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  // Compute categories involved in marked items
  const involvedCategories = useMemo(() => {
    const set = new Set<RepairCategory>();
    selectedItems.forEach((i) => set.add(i.category));
    return Array.from(set);
  }, [selectedItems]);

  // Find Available Technicians that Qualify (unblocked only) sorted by Nearest Proximity
  // USER REQUIREMENT: Logged-in customers view the nearest available verified technicians based on proximity.
  const qualifyingTechnicians = useMemo(() => {
    if (activeTechnicians.length === 0) return [];
    if (involvedCategories.length === 0) {
      return [...activeTechnicians].sort((a, b) => {
        const aEstateMatch = a.estate?.toLowerCase() === customerEstate?.toLowerCase() ? 1 : 0;
        const bEstateMatch = b.estate?.toLowerCase() === customerEstate?.toLowerCase() ? 1 : 0;
        if (bEstateMatch !== aEstateMatch) return bEstateMatch - aEstateMatch;
        return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      });
    }

    const matched = activeTechnicians.filter((tech) => {
      return involvedCategories.some((cat) => tech.specialties?.includes(cat)) ||
             tech.specialties?.includes('electrical') ||
             tech.specialties?.includes('appliances');
    });

    const listToUse = matched.length > 0 ? matched : activeTechnicians;

    return [...listToUse].sort((a, b) => {
      // 1. Proximity Match (exact estate match gets highest priority)
      const aEstateMatch = a.estate?.toLowerCase() === customerEstate?.toLowerCase() ? 1 : 0;
      const bEstateMatch = b.estate?.toLowerCase() === customerEstate?.toLowerCase() ? 1 : 0;
      if (bEstateMatch !== aEstateMatch) return bEstateMatch - aEstateMatch;

      // 2. Shortest Distance (Km)
      const aDist = a.distanceKm ?? 99;
      const bDist = b.distanceKm ?? 99;
      if (aDist !== bDist) return aDist - bDist;

      // 3. Category coverage
      const aCoverage = involvedCategories.filter((c) => a.specialties?.includes(c)).length;
      const bCoverage = involvedCategories.filter((c) => b.specialties?.includes(c)).length;
      if (bCoverage !== aCoverage) return bCoverage - aCoverage;

      return (b.rating || 5) - (a.rating || 5);
    });
  }, [involvedCategories, activeTechnicians, customerEstate]);

  // Dispatch specific technician
  const handleConfirmDispatch = (tech: Technician) => {
    if (!tech) return;
    const fee = Number(tech.inspectionFeeKsh) || 1600;
    const totalEstimate = (selectedItems || []).reduce((acc, item) => {
      const catalogItem = REPAIR_ITEMS.find((r) => r.id === item.itemId);
      const base = catalogItem?.baseEstimatedCostKsh || 1000;
      return acc + base * (item.quantity || 1);
    }, fee);

    const newBooking: Booking = {
      id: 'BK-' + Math.floor(100000 + Math.random() * 900000),
      customerName: session.name || 'Customer',
      customerPhone: session.phone || '',
      estate: customerEstate || 'Nairobi',
      addressDetails: customerHouseNo || 'House details provided via direct phone call',
      items: selectedItems || [],
      technicianId: tech.id || ('tech-' + Date.now()),
      technicianName: tech.name || 'Verified Technician',
      technicianPhone: tech.phone || OFFICE_PHONE_DISPLAY,
      status: 'en_route',
      createdAt: Date.now(),
      scheduledTime: 'Immediate Dispatch (ETA ~' + (tech.etaMinutes || 20) + ' mins)',
      notes: (selectedItems || []).map((i) => `${i.itemName} (${i.brand || 'Standard'})`).join(', '),
      estimatedTotalKsh: totalEstimate || fee
    };

    saveBooking(newBooking);
    setActiveBooking(newBooking);
    setChosenTechnician(tech);
    setIsBroadcastBooking(false);
    setCurrentStep('booking_confirmed');
  };

  // User requirement: "After customer log in and incase they don't get standby technician allow them to post job pending for available technician to receive."
  const handlePostPendingJobBroadcast = () => {
    const totalEstimate = selectedItems.reduce((acc, item) => {
      const catalogItem = REPAIR_ITEMS.find((r) => r.id === item.itemId);
      const base = catalogItem?.baseEstimatedCostKsh || 1000;
      return acc + base * item.quantity;
    }, 800);

    const newBooking: Booking = {
      id: 'BK-PENDING-' + Math.floor(100000 + Math.random() * 900000),
      customerName: session.name,
      customerPhone: session.phone,
      estate: customerEstate,
      addressDetails: customerHouseNo || 'Address details provided on technician call',
      items: selectedItems,
      technicianId: 'unassigned',
      technicianName: 'Pending Any Available Technician',
      technicianPhone: OFFICE_PHONE_DISPLAY,
      status: 'requested',
      createdAt: Date.now(),
      scheduledTime: 'Broadcasted to all available nearby technicians',
      notes: selectedItems.map((i) => `${i.itemName} (${i.brand})`).join(', '),
      estimatedTotalKsh: totalEstimate,
      isCustomBroadcast: true
    };

    saveBooking(newBooking);
    setActiveBooking(newBooking);
    setChosenTechnician(null);
    setIsBroadcastBooking(true);
    setCurrentStep('booking_confirmed');
  };

  return (
    <div className="py-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <div className="h-4 w-px bg-slate-300" />
            <div className="text-xs text-slate-600">
              Customer: <span className="font-semibold text-slate-900">{session.name}</span> ({session.phone})
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            <span className={`px-3 py-1 rounded-full ${currentStep === 'select_items' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              1. Mark Items ({selectedItems.length})
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className={`px-3 py-1 rounded-full ${currentStep === 'matched_technicians' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              2. Available Techs ({qualifyingTechnicians.length})
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className={`px-3 py-1 rounded-full ${currentStep === 'booking_confirmed' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              3. Dispatch Tracking
            </span>
          </div>
        </div>

        {/* ACTIVE ACCEPTED JOB LIVE TRACKING PROMPT (USER REQUIREMENT) */}
        {activeBooking && activeBooking.status !== 'completed' && activeBooking.technicianId !== 'unassigned' && currentStep !== 'booking_confirmed' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 text-white border-2 border-sky-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Technician Accepted Job · Live Location Active</span>
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">
                  {activeBooking.technicianName} is en route to {activeBooking.estate} ({activeBooking.id})
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep('booking_confirmed')}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 transform hover:scale-105"
            >
              <Navigation className="w-4 h-4" />
              <span>Track Live Doorstep Location</span>
            </button>
          </div>
        )}

        {/* IMMEDIATE PAYMENT PROMPT WHEN TECHNICIAN MARKS JOB COMPLETED */}
        {activeBooking && activeBooking.status === 'completed' && activeBooking.paymentStatus !== 'paid' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-sky-700 text-white rounded-2xl shadow-xl border-2 border-emerald-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  <span>Immediate Payment Prompt · Repair Marked Completed</span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Technician {activeBooking.technicianName} has completed your repair ({activeBooking.id})
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Total Due: <strong className="text-white font-mono text-sm">Ksh. {activeBooking.estimatedTotalKsh}</strong>. Please complete payment now via Pesapal (M-Pesa) to release technician payment and activate your official 30-Day Workmanship Warranty receipt.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="py-3 px-6 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-lg transition-transform transform hover:scale-105 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Pay Ksh. {activeBooking.estimatedTotalKsh} Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PROMINENT SEARCH BAR (USER REQUIREMENT) */}
        <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appliances, fault symptoms (e.g. 'fridge gas', 'compressor clicking', 'cooker element', 'breaker tripping')..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Keyword Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Popular Searches:
            </span>
            {POPULAR_SEARCH_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSearchQuery(chip)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                  searchQuery === chip
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------- STEP 1: MARK ITEMS THAT NEED REPAIR ---------------- */}
        {currentStep === 'select_items' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs font-bold text-orange-700 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Customer Diagnostic Portal</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Mark Items That Need To Be Repaired
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    Select every faulty electrical appliance, refrigerator, or wiring issue below. You can mark multiple items. Our system will immediately filter only qualified and licensed technicians in your area.
                  </p>
                </div>

                {/* Location & Proceed Button */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[280px]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    <span>Your Location in Kenya</span>
                  </label>
                  <select
                    value={customerEstate}
                    onChange={(e) => setCustomerEstate(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 mb-3"
                  >
                    {KENYA_ESTATES.map((est) => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={selectedItems.length === 0}
                    onClick={() => setCurrentStep('matched_technicians')}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedItems.length > 0
                        ? 'bg-gradient-to-r from-orange-500 to-sky-600 hover:from-orange-600 hover:to-sky-700 text-white shadow-md shadow-sky-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Match Qualified Technicians ({selectedItems.length} Marked)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Items Manifest Banner (if items selected) */}
            {selectedItems.length > 0 && (
              <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-900">
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                    <span>Marked for Repair ({selectedItems.length} items)</span>
                  </div>
                  <span className="text-xs text-orange-700 font-medium">
                    Click an item below to modify or delete
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedItems.map((sel) => (
                    <div
                      key={sel.itemId}
                      className="bg-white p-3.5 rounded-xl border border-orange-200/80 shadow-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{sel.itemName}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Brand: <span className="text-slate-800 font-semibold">{sel.brand}</span> · Qty: {sel.quantity}
                        </div>
                        <div className="text-[11px] text-orange-700 mt-1 line-clamp-1">
                          Issues: {sel.selectedIssues.join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMarkedItem(sel.itemId)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-200/80 rounded-xl overflow-x-auto">
              {[
                { id: 'all', label: 'All Appliances' },
                { id: 'refrigeration', label: 'Refrigeration & Cooling' },
                { id: 'electrical', label: 'Electrical & Power' },
                { id: 'appliances', label: 'Kitchen & Home' },
                { id: 'pumps', label: 'Water Pumps & Motors' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategoryTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCatalogItems.map((item) => {
                const isSelected = selectedItems.some((s) => s.itemId === item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md bg-orange-50/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.categoryLabel}
                        </span>
                        {item.popular && (
                          <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            High Demand
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mb-4">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Common Faults:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {item.commonIssues.slice(0, 3).map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-orange-500 text-xs">•</span>
                              <span className="line-clamp-1">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Typical Diagnostics</span>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          ~Ksh. {item.baseEstimatedCostKsh}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartMarkingItem(item)}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marked (Edit)</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Mark Item</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom floating CTA when items are marked */}
            {selectedItems.length > 0 && (
              <div className="sticky bottom-4 z-30 p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{selectedItems.length} Item(s) Marked for Repair</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Location: <span className="font-semibold text-white">{customerEstate}</span> · Ready to match technicians
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handlePostPendingJobBroadcast}
                    className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 cursor-pointer flex items-center justify-center gap-1.5"
                    title="Broadcast job to all nearby available technicians"
                  >
                    <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400 shrink-0" />
                    <span>Post Pending Broadcast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('matched_technicians')}
                    className="flex-1 sm:flex-initial py-2.5 px-4 sm:px-6 bg-gradient-to-r from-orange-500 via-sky-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-xs font-extrabold rounded-xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>View Qualified Standby Techs</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- STEP 2: AVAILABLE TECHNICIANS & PENDING BROADCAST ---------------- */}
        {currentStep === 'matched_technicians' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <button
                    onClick={() => setCurrentStep('select_items')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Edit Marked Items ({selectedItems.length})</span>
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Available Technicians That Qualify
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    These highly qualified, certified technicians specialize in your marked items:{' '}
                    <span className="font-semibold text-slate-900">
                      {selectedItems.map((i) => i.itemName).join(', ')}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Dispatch Zone</span>
                    <span className="text-xs font-bold text-slate-900">{customerEstate}</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
                    {qualifyingTechnicians.length} Qualified Techs Online
                  </div>
                </div>
              </div>
            </div>

            {/* PENDING JOB BROADCAST BANNER (USER REQUIREMENT) */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-sky-500/10 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Don't See a Standby Technician in Your Area?
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                    Post your repair job as a <strong>Pending Request Broadcast</strong>. It will be pushed immediately to all certified technicians across your county so the first available technician can accept and dispatch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePostPendingJobBroadcast}
                  className="py-3 px-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Post Pending Job for Available Techs</span>
                </button>
              </div>
            </div>

            {/* Technicians Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {qualifyingTechnicians.map((tech) => (
                <div
                  key={tech.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Top Tech Profile Row */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        <img
                          src={tech.photoUrl}
                          alt={tech.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80';
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Online and ready for dispatch" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-slate-900 truncate">
                            {tech.name}
                          </h3>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs font-mono">
                            <span>★</span>
                            <span className="text-slate-900">{tech.rating}</span>
                            <span className="text-slate-400 font-normal">({tech.reviewsCount})</span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-sky-700 mb-1">
                          {tech.roleTitle}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                          <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
                            {tech.licenseType}
                          </span>
                          <span>·</span>
                          <span>{tech.experienceYears} Years Exp</span>
                          <span>·</span>
                          <span className="text-orange-600 font-semibold">{tech.etaMinutes} min ETA</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio & Vetted Badges */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {tech.bio}
                    </p>

                    {/* On-Board Instruments / Tools */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-4">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-sky-600" />
                        <span>Certified Equipment On-Board:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tech.tools.map((t, idx) => (
                          <span key={idx} className="text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recent Field Jobs */}
                    <div className="text-[11px] text-slate-500 space-y-1 mb-5">
                      <div className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                        Recent Verified Jobs in Area:
                      </div>
                      {tech.recentJobs.slice(0, 2).map((job, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{job}</span>
                        </div>
                      ))}
                    </div>

                    {/* Testimony Photos of Past Work (Customer Visibility) */}
                    {tech.portfolioPhotos && tech.portfolioPhotos.length > 0 && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200/90">
                        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-blue-800">
                            <Camera className="w-3.5 h-3.5 text-blue-600" />
                            <span>Work Testimony Photos ({tech.portfolioPhotos.length})</span>
                          </span>
                          <span className="text-[10px] text-blue-700 font-semibold">Click to enlarge</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {tech.portfolioPhotos.slice(0, 3).map((imgUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setPreviewPhoto(imgUrl)}
                              className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs"
                              title="Click to view full photo"
                            >
                              <img src={imgUrl} alt={`${tech.name} work proof`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Standard Inspection Fee
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 font-mono">
                        Ksh. {tech.inspectionFeeKsh}{' '}
                        <span className="text-xs font-normal text-slate-500 font-sans">
                          (Deducted from repair)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${tech.phone}`}
                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        <span>Direct Call</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleConfirmDispatch(tech)}
                        className="py-2.5 px-4 bg-gradient-to-r from-orange-500 to-sky-600 hover:from-orange-600 hover:to-sky-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Dispatch Tech Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- STEP 3: BOOKING CONFIRMED & DISPATCH TRACKING ---------------- */}
        {currentStep === 'booking_confirmed' && activeBooking && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-lg">
              
              {/* Header Title */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {isBroadcastBooking ? 'Job Broadcasted to Available Technicians!' : 'Technician Dispatched!'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Job Reference: <span className="font-mono font-bold text-slate-900">{activeBooking.id}</span>
                </p>
              </div>

              {/* LIVE TECHNICIAN DOORSTEP LOCATION MAP (USER REQUIREMENT) */}
              {activeBooking && activeBooking.technicianId !== 'unassigned' && (
                <div className="mb-6 animate-fadeIn">
                  <LiveTechnicianLocationMap booking={activeBooking} />
                </div>
              )}

              {/* Broadcast or Live Status Box */}
              {isBroadcastBooking ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 mb-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-950">
                        Live Broadcast Active Across {customerEstate}
                      </h4>
                      <p className="text-xs text-amber-800">
                        We have notified all certified standby technicians in your coverage zone. The first available technician will claim this job and call you directly.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-slate-700 flex items-center justify-between">
                    <span>Central Dispatch Hotline:</span>
                    <a href={`tel:${OFFICE_PHONE_DISPLAY}`} className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{OFFICE_PHONE_DISPLAY}</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Live Status Tracker */
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center justify-between">
                    <span>Live Dispatch Timeline</span>
                    <span className="text-emerald-700 font-mono flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      En Route (~{chosenTechnician?.etaMinutes || 20} mins)
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Request Accepted by Technician</div>
                        <div className="text-[11px] text-slate-500">Diagnostic details transmitted to technician's mobile kit</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">
                        2
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">En Route to {customerEstate}</div>
                        <div className="text-[11px] text-slate-500">Vehicle loaded with required manifold gauges, spare parts, and testers</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 opacity-60">
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                        3
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">On-Site Diagnostic &amp; Inspection</div>
                        <div className="text-[11px] text-slate-500">Multimeter and pressure readings taken before opening appliances</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 opacity-60">
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                        4
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">Repair &amp; 30-Day Guarantee Stamp</div>
                        <div className="text-[11px] text-slate-500">Test operation and issue official workmanship warranty</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technician Contact Card (if assigned) */}
              {(chosenTechnician || (activeBooking && activeBooking.technicianId !== 'unassigned')) && (
                <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-4">
                    <img
                      src={chosenTechnician?.photoUrl || '/assets/images/tech_electrical_wiring_1791787974895.jpg'}
                      alt={chosenTechnician?.name || activeBooking?.technicianName || 'Technician'}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                    <div>
                      <div className="text-sm font-bold text-white">
                        {chosenTechnician?.name || activeBooking?.technicianName || 'Verified Field Specialist'}
                      </div>
                      <div className="text-xs text-amber-400 font-mono font-semibold">
                        {chosenTechnician?.licenseType || 'Certified Vetted Master Technician'}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Direct Line: <span className="font-bold text-white font-mono">{chosenTechnician?.phone || activeBooking?.technicianPhone || OFFICE_PHONE_DISPLAY}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${chosenTechnician?.phone || activeBooking?.technicianPhone || OFFICE_PHONE_DISPLAY}`}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Tech</span>
                    </a>
                    <a
                      href={`https://wa.me/${((chosenTechnician?.phone || activeBooking?.technicianPhone || OFFICE_PHONE_DISPLAY) || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(chosenTechnician?.name || activeBooking?.technicianName || 'Technician')},%20I%20have%20booked%20you%20for%20repairs%20via%20Home%20Based%20Services.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Marked Items Summary */}
              <div className="border border-slate-200 rounded-xl p-4 mb-6">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Job Manifest Summary ({selectedItems.length} items)
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900">{item.itemName}</span>
                        <span className="text-slate-500"> ({item.brand}, Qty: {item.quantity})</span>
                        <div className="text-[11px] text-slate-600">{item.selectedIssues.join(', ')}</div>
                      </div>
                      <span className="font-mono text-slate-700 font-semibold">Inspection Included</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Payment & Official Receipt Section */}
              <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-300 rounded-2xl p-5 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Pay via M-Pesa · 30-Day Guarantee Stamp Included
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">
                      {activeBooking.paymentStatus === 'paid' ? 'Repair Payment Completed & Verified' : 'Pay for Completed Repair'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activeBooking.paymentStatus === 'paid'
                        ? `Receipt: ${activeBooking.receiptNumber} · Amount: Ksh ${activeBooking.paidAmountKsh} · 30-Day Workmanship Warranty Active.`
                        : 'Once technician completes work on site, click Pay to enter your M-Pesa PIN and receive your official receipt.'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {activeBooking.paymentStatus === 'paid' ? (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>View / Print Guarantee Receipt</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="py-3 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Pay for Repair (Ksh. {activeBooking.estimatedTotalKsh})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select_items')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 underline cursor-pointer"
                >
                  Mark More Appliances
                </button>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Customer Payment & Receipt Modal */}
      {activeBooking && (
        <CustomerPaymentReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          booking={activeBooking}
          onPaymentCompleted={(updated) => {
            setActiveBooking(updated);
          }}
        />
      )}

      {/* Item Configuration Modal when marking */}
      {currentlyEditingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-sky-500 to-purple-600" />
            
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {currentlyEditingItem.categoryLabel}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {currentlyEditingItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setCurrentlyEditingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Symptom checkboxes */}
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Symptoms / Faults (Check all that apply):
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentlyEditingItem.commonIssues.map((issue, idx) => {
                    const isChecked = itemIssues.includes(issue);
                    return (
                      <label
                        key={idx}
                        onClick={() => toggleIssueCheckbox(issue)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-orange-50/70 border-orange-300 text-slate-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span>{issue}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Brand and Quantity Row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appliance Brand
                  </label>
                  <select
                    value={itemBrand}
                    onChange={(e) => setItemBrand(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500"
                  >
                    {currentlyEditingItem.typicalBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Other / Not listed">Other / Not listed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 border border-slate-300 rounded-l-lg bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      readOnly
                      value={itemQuantity}
                      className="w-12 h-9 border-t border-b border-slate-300 text-center text-xs font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setItemQuantity((q) => q + 1)}
                      className="w-9 h-9 border border-slate-300 rounded-r-lg bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Urgency */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Standard' },
                    { id: 'emergency', label: 'Emergency' },
                    { id: 'scheduled', label: 'Scheduled' }
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setItemUrgency(u.id as any)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        itemUrgency === u.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Fault Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="e.g. Fridge smells like burnt rubber, breaker clicks..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentlyEditingItem(null)}
                  className="py-2 px-4 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemToManifest}
                  className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Item to Manifest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Technician Testimony Photo Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>Verified Technician Work Proof / Testimony</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-black/50 flex items-center justify-center">
              <img
                src={previewPhoto}
                alt="Technician work proof"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRepairFlow;
