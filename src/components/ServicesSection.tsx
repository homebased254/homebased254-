import React from 'react';
import { ThermometerSnowflake, Tv, Flame, RefreshCw, Wind, Check, ArrowRight, Shield, Zap } from 'lucide-react';
import { OFFICE_PHONE_DISPLAY } from '../types';

interface ServicesSectionProps {
  onSelectServiceForRepair: (category: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onSelectServiceForRepair
}) => {
  const repairCategories = [
    {
      id: 'refrigeration',
      title: 'Fridges Being Repaired',
      subtitle: 'Domestic & Commercial Refrigerators',
      image: '/assets/images/repair_fridge_domestic_1791789872285.jpg',
      alt: 'Technician repairing refrigerator compressor and brazing copper tubing with manifold gauges',
      badge: 'Refrigeration Diagnostics',
      badgeColor: 'bg-orange-600',
      description: 'On-site diagnostics for double-door, single-door, and frost-free fridges. Comprehensive copper line leak detection, brazing, and gas charging.',
      features: [
        'R134a & R600a hydrocarbon refrigerant gas recharge',
        'Compressor replacement, relay switch & capacitor calibration',
        'Defrost timer, bimetal sensor & thermostat replacement'
      ]
    },
    {
      id: 'washing-machine',
      title: 'Washing Machines Being Repaired',
      subtitle: 'Automatic Front & Top Load Washers',
      image: '/assets/images/repair_washing_machine_1791789835454.jpg',
      alt: 'Appliance technician testing motor and pump on open washing machine with digital multimeter',
      badge: 'Appliance Mechanics',
      badgeColor: 'bg-sky-600',
      description: 'Precision mechanical and electrical troubleshooting for automatic washers from LG Inverter, Samsung, Bosch, and Ramtons.',
      features: [
        'Drum motor repair, drive belt replacement & spin balance',
        'Drain pump unclogging, water inlet solenoid valve fixes',
        'Door interlock lock switch & motherboard PCB testing'
      ]
    },
    {
      id: 'cooker',
      title: 'Cookers & Ovens Being Repaired',
      subtitle: 'Electric Cookers, Ovens & Induction Hobs',
      image: '/assets/images/repair_electric_cooker_1791789850294.jpg',
      alt: 'Technician measuring electrical resistance on cooker heating element with multimeter',
      badge: 'Thermal Electronics',
      badgeColor: 'bg-purple-600',
      description: 'Safe high-amperage electrical repairs for kitchen cookers, solid hotplates, oven bake elements, and dual-pole isolators.',
      features: [
        'Oven bottom & top grill heating element replacement',
        'Solid hotplate coils, infinite heat switches & thermostats',
        'Breaker tripping fault tracing & heat-resistant ceramic wiring'
      ]
    },
    {
      id: 'tv',
      title: 'Smart TVs Being Repaired',
      subtitle: 'LED, OLED & 4K Smart Televisions',
      image: '/assets/images/repair_smart_tv_1791789861582.jpg',
      alt: 'Electronics technician testing flat screen smart TV circuit board on workbench',
      badge: 'Electronics & Circuit Boards',
      badgeColor: 'bg-indigo-600',
      description: 'Clean workbench precision repair for flat screen smart TVs. Micro-soldering, backlight strip replacements, and power boards.',
      features: [
        'Backlight LED strip replacement (fixes sound with black screen)',
        'Power supply board repair after power surge or lightning',
        'Motherboard microprocessor testing & HDMI port replacement'
      ]
    },
    {
      id: 'ac',
      title: 'Air Conditioners (AC) Being Repaired',
      subtitle: 'High-Wall Split AC & Office HVAC Units',
      image: '/assets/images/tech_air_conditioning_1791787986483.jpg',
      alt: 'HVAC technician servicing wall split AC unit with pressure tools',
      badge: 'HVAC & Air Flow',
      badgeColor: 'bg-teal-600',
      description: 'Complete split AC servicing for homes and corporate spaces countrywide across Kenya. Deep hydro-cleaning, airflow tuning, and gas top-up.',
      features: [
        'Deep chemical coil cleaning & indoor drainage clearing',
        'R410A & R32 refrigerant top-up with vacuum dehydration',
        'Outdoor fan motor, PCB sensor & contactor overhaul'
      ]
    }
  ];

  return (
    <section id="services" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase text-sky-600 mb-2">
            <span>Specialized Repair Capabilities</span>
            <span className="text-slate-400">·</span>
            <span>Countrywide Operations Across Kenya</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Appliances &amp; Electronics Actively Repaired by Our Technicians
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Real field photos of our technicians diagnosing fridges, washing machines, cookers, Smart TVs, and air conditioning units.
          </p>
        </div>

        {/* 5 Prominent Cards showcasing each appliance being repaired */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {repairCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
            >
              {/* Actual photo of appliance being repaired */}
              <div className="relative h-60 overflow-hidden bg-slate-900">
                <img
                  src={cat.image}
                  alt={cat.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const fallbacks: Record<string, string> = {
                      refrigeration: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
                      'washing-machine': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
                      cooker: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
                      tv: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
                      ac: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
                    };
                    if (fallbacks[cat.id] && e.currentTarget.src !== fallbacks[cat.id]) {
                      e.currentTarget.src = fallbacks[cat.id];
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-max mb-1 text-white ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                  <span className="text-sm font-bold text-white leading-snug">
                    {cat.title}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {cat.subtitle}
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    {cat.description}
                  </p>

                  <ul className="space-y-2 text-xs text-slate-700 mb-6">
                    {cat.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectServiceForRepair(cat.id === 'tv' || cat.id === 'cooker' || cat.id === 'washing-machine' ? 'appliances' : 'refrigeration')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer group-hover:bg-orange-600 group-hover:text-white"
                >
                  <span>Mark {cat.title.split(' ')[0]} for Repair</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* 6th Card: Power Distribution & Electrical Boards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
            <div className="relative h-60 overflow-hidden bg-slate-900">
              <img
                src="/assets/images/tech_electrical_wiring_1791787974895.jpg"
                alt="Electrician testing circuit breaker panel and wiring"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-max mb-1 text-white bg-purple-600">
                  Power &amp; Wiring
                </span>
                <span className="text-sm font-bold text-white leading-snug">
                  Consumer Units &amp; Circuit Breakers
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Main Distribution Boards
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Highly qualified domestic &amp; commercial wiring, fixing nuisance breaker tripping, burnt isolator switches, house wiring installations, and dedicated appliance cables.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Distribution Board (DB) &amp; tripping MCB/RCD breaker diagnostics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant shower 4mm cable run, earth rod survey &amp; safety isolator</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Phase balancing, borehole pump control box &amp; inverter changeover</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectServiceForRepair('electrical')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer group-hover:bg-purple-600 group-hover:text-white"
              >
                <span>Mark Electrical Wiring for Repair</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Workplace Standards Banner */}
        <div id="technicians" className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-600 text-white">
                Vetting &amp; Safety Standard
              </span>
              <h3 className="text-2xl font-bold tracking-tight">
                Highly Qualified Vetted Technicians Operating Countrywide Across Kenya
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                All field engineers on our platform are highly qualified, rigorously vetted specialists with verified professional credentials. They carry calibrated multimeters, manifold brass gauges, soldering rework stations, and vacuum pumps.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>Highly Qualified Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span>Master Technician Vetted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>30-Day Guarantee</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 text-center space-y-2">
              <div className="text-3xl font-extrabold text-blue-400 font-mono">Pay Ksh. 50 ($0.40)</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">Pesapal (M-Pesa &amp; Cards) Instant Pay</div>
              <p className="text-xs text-slate-300">
                Transparent access model. Pay Ksh. 50 ($0.40 USD) login pass (active 24 hours) or settle repair invoice with 30-day warranty via Pesapal (M-Pesa, Airtel Money, Visa / Mastercard).
              </p>
              <div className="text-[11px] text-emerald-400 font-mono pt-1">
                Office: {OFFICE_PHONE_DISPLAY}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
