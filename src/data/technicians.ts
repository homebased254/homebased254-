import { Technician } from '../types';

export const TECHNICIANS_DATA: Technician[] = [
  {
    id: 'tech-1',
    name: 'Eng. David Mwangi',
    photoUrl: '/assets/images/tech_electrical_wiring_1791787974895.jpg',
    roleTitle: 'Senior Electrical & Installation Specialist',
    specialties: ['electrical', 'appliances', 'pumps'],
    licenseType: 'Highly Qualified & Vetted Master Electrician',
    licenseNumber: 'TECH/ELEC/2019/8492',
    experienceYears: 12,
    rating: 4.96,
    reviewsCount: 184,
    location: 'Nairobi',
    estate: 'Nairobi - Westlands & Parklands',
    distanceKm: 2.8,
    etaMinutes: 18,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1200,
    phone: '+254 722 841 930',
    tools: ['Fluke True-RMS Multimeter', 'Megger Insulation Tester', 'Earth Resistance Clamp', 'Hydraulic Crimping Tool'],
    badges: ['Highly Qualified Specialist', 'Safety First Vetted', '120+ 5-Star Reviews'],
    recentJobs: [
      '3-Phase Consumer Unit replacement in Westlands',
      'Instant shower earthing fault fix in Parklands',
      'Automatic changeover inverter wiring in Lavington'
    ],
    bio: 'Over a decade of field experience handling complex domestic and commercial electrical distribution, fault tracing, earthing surveys, and heavy appliances.',
    portfolioPhotos: [
      '/assets/images/tech_electrical_wiring_1791787974895.jpg',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-2',
    name: 'Peter Ochieng',
    photoUrl: '/assets/images/tech_refrigeration_workplace_1791787962609.jpg',
    roleTitle: 'Master HVAC & Commercial Refrigeration Specialist',
    specialties: ['refrigeration', 'appliances'],
    licenseType: 'Highly Qualified Master Refrigeration Engineer',
    licenseNumber: 'TECH/RAC/2018/3120',
    experienceYears: 10,
    rating: 4.94,
    reviewsCount: 156,
    location: 'Nairobi',
    estate: 'Nairobi - Kilimani & Kileleshwa',
    distanceKm: 3.4,
    etaMinutes: 22,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1500,
    phone: '+254 713 592 108',
    tools: ['Dual Manifold Brass Gauges', 'Robinair 2-Stage Vacuum Pump', 'Digital Micron Gauge', 'Nitrogen Pressure Test Rig', 'R134a/R600a Refill Kit'],
    badges: ['Highly Qualified RAC Specialist', 'Inverter PCB Specialist', 'Cold Room Master'],
    recentJobs: [
      'Samsung Inverter Double Door compressor gas recharge in Kilimani',
      'Display chiller expansion valve replacement in Kileleshwa',
      'Ramtons deep freezer thermostat calibration'
    ],
    bio: 'Specialist in inverter refrigerators, R600a hydrocarbon refrigerants, cold storage rooms, and supermarket chillers. Guaranteed leak-free brazing.',
    portfolioPhotos: [
      '/assets/images/tech_refrigeration_workplace_1791787962609.jpg',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-3',
    name: 'Grace Wambui',
    photoUrl: '/assets/images/tech_air_conditioning_1791787986483.jpg',
    roleTitle: 'Dual HVAC & Precision Domestic Tech',
    specialties: ['refrigeration', 'appliances', 'electrical'],
    licenseType: 'Highly Qualified HVAC & Electrical Specialist',
    licenseNumber: 'TECH/HVAC/2020/5541',
    experienceYears: 8,
    rating: 4.98,
    reviewsCount: 142,
    location: 'Nairobi',
    estate: 'Nairobi - South B & South C',
    distanceKm: 4.1,
    etaMinutes: 25,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1100,
    phone: '+254 735 489 021',
    tools: ['Testo Airflow Anemometer', 'Refrigerant Leak Sniffer', 'High Pressure Hydro Cleaning Hood', 'Digital Multimeter'],
    badges: ['Highly Qualified Specialist', 'High Customer Satisfaction', 'Prompt Responder'],
    recentJobs: [
      'Split AC chemical cleaning & R410A gas top-up in South B',
      'Washing machine drain pump and PCB replacement in Langata',
      'Water dispenser cooling thermostat renewal in South C'
    ],
    bio: 'Passionate and meticulous HVAC & domestic appliance specialist. Experts in split AC installations, washing machine PCB troubleshooting, and kitchen appliances.',
    portfolioPhotos: [
      '/assets/images/tech_air_conditioning_1791787986483.jpg',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-4',
    name: 'Joseph Kiprono',
    photoUrl: '/assets/images/hero_technician_service_1791787949015.jpg',
    roleTitle: 'Borehole Pumps & Motor Control Specialist',
    specialties: ['pumps', 'electrical'],
    licenseType: 'Highly Qualified Pump & Motor Engineer',
    licenseNumber: 'TECH/PUMP/2017/1908',
    experienceYears: 14,
    rating: 4.91,
    reviewsCount: 118,
    location: 'Nairobi',
    estate: 'Nairobi - Karen & Langata',
    distanceKm: 5.6,
    etaMinutes: 30,
    isOnline: true,
    inspectionFeeKsh: 2000,
    hourlyRateKsh: 1400,
    phone: '+254 720 334 772',
    tools: ['Capacitor Tester', 'Motor Winding Insulation Megohmmeter', 'Pipe Threading & Pressure Kit', 'Float Switch Diagnostic Probe'],
    badges: ['Highly Qualified Lead Tech', 'Borehole Control Master', '24/7 Rapid Response'],
    recentJobs: [
      'Dayliff 3HP borehole control box starter capacitor repair in Karen',
      'Domestic booster pump pressure switch overhaul in Ngong Road',
      'Overhead tank automatic float switch rewiring in Langata'
    ],
    bio: 'Deep expertise in water pumping systems, single and 3-phase motor starters, control panel relays, thermal overloads, and pressure switches.',
    portfolioPhotos: [
      '/assets/images/hero_technician_service_1791787949015.jpg',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-5',
    name: 'Brian Mutua',
    photoUrl: '/assets/images/tech_refrigeration_workplace_1791787962609.jpg',
    roleTitle: 'Commercial Chiller & Heavy Cold Storage Engineer',
    specialties: ['refrigeration', 'appliances'],
    licenseType: 'Highly Qualified Refrigeration & Mechanical Engineer',
    licenseNumber: 'TECH/REF/2016/9821',
    experienceYears: 11,
    rating: 4.93,
    reviewsCount: 130,
    location: 'Nairobi',
    estate: 'Nairobi - Kasarani & Roysambu',
    distanceKm: 6.2,
    etaMinutes: 35,
    isOnline: true,
    inspectionFeeKsh: 1800,
    hourlyRateKsh: 1300,
    phone: '+254 701 992 415',
    tools: ['Oxy-Acetylene Brazing Torch', 'Rothenberger Flaring Tool', 'Digital Thermocouple', 'Deep Vacuum Pump'],
    badges: ['Butchery / Cold Room Pro', 'Certified Gas Handler', 'Heavy Compressor Specialist'],
    recentJobs: [
      'Commercial walk-in freezer condensing unit overhaul in Kasarani',
      'Display butchery chiller copper coil leak brazing in Roysambu',
      'LG double door compressor capacitor renewal'
    ],
    bio: 'Dedicated refrigeration technician with proven track record across domestic and commercial units. Fast turnaround on gas leaks and motor replacements.',
    portfolioPhotos: [
      '/assets/images/tech_refrigeration_workplace_1791787962609.jpg',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-6',
    name: 'Emanuel Otieno',
    photoUrl: '/assets/images/tech_electrical_wiring_1791787974895.jpg',
    roleTitle: 'Domestic Wiring & Circuit Breaker Specialist',
    specialties: ['electrical', 'appliances'],
    licenseType: 'Highly Qualified Installation Electrician',
    licenseNumber: 'TECH/ELEC/2021/7702',
    experienceYears: 7,
    rating: 4.89,
    reviewsCount: 94,
    location: 'Nairobi',
    estate: 'Nairobi - Ruaka & Kiambu Road',
    distanceKm: 4.8,
    etaMinutes: 24,
    isOnline: true,
    inspectionFeeKsh: 1400,
    hourlyRateKsh: 1000,
    phone: '+254 718 209 634',
    tools: ['Non-contact Voltage Tester', 'Wall Wire Tracer & Cable Scanner', 'RCD Trip Speed Meter', 'Precision Screwdriver Set'],
    badges: ['Breaker Tripping Specialist', 'Emergency Dispatch', 'Instant Shower Safe'],
    recentJobs: [
      'RCD nuisance tripping fault tracing in Ruaka apartment',
      'Lorenzetti instant shower dedicated 4mm cable run in Kiambu Road',
      'Electric oven heating element replacement'
    ],
    bio: 'Fast and reliable electrician specializing in residential circuit diagnostics, breaker replacements, and kitchen appliances.',
    portfolioPhotos: [
      '/assets/images/tech_electrical_wiring_1791787974895.jpg',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-7',
    name: 'Capt. Rashid Juma',
    photoUrl: '/assets/images/tech_air_conditioning_1791787986483.jpg',
    roleTitle: 'Coastal HVAC & Marine Chiller Technician',
    specialties: ['refrigeration', 'appliances'],
    licenseType: 'Highly Qualified Marine & Coastal HVAC Specialist',
    licenseNumber: 'TECH/MOM/2019/4412',
    experienceYears: 10,
    rating: 4.95,
    reviewsCount: 128,
    location: 'Mombasa',
    estate: 'Mombasa - Nyali & Links Road',
    distanceKm: 3.2,
    etaMinutes: 20,
    isOnline: true,
    inspectionFeeKsh: 1600,
    hourlyRateKsh: 1300,
    phone: '+254 711 902 381',
    tools: ['Testo Digital Manifold', 'Anti-Corrosion Marine Coil Spray', 'Deep Vacuum Pump', 'R410A Manifold'],
    badges: ['Coastal Region Lead', 'Highly Qualified Specialist', 'Anti-Corrosion Specialist'],
    recentJobs: [
      'Split AC copper anti-rust treatment in Nyali',
      'Walk-in freezer sensor replacement in Bamburi',
      'Chiller compressor overhaul in Kizingo'
    ],
    bio: 'Premier coastal refrigeration and air conditioning engineer servicing coastal homes, hotels, and business premises.',
    portfolioPhotos: [
      '/assets/images/tech_air_conditioning_1791787986483.jpg',
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'tech-8',
    name: 'Wilson Kipchumba',
    photoUrl: '/assets/images/hero_technician_service_1791787949015.jpg',
    roleTitle: 'Rift & Countrywide Motor / Pump Specialist',
    specialties: ['pumps', 'electrical', 'appliances'],
    licenseType: 'Highly Qualified Electro-Mechanical Specialist',
    licenseNumber: 'TECH/RIFT/2020/6109',
    experienceYears: 11,
    rating: 4.92,
    reviewsCount: 112,
    location: 'Countrywide',
    estate: 'Nakuru - Milimani, Section 58 & CBD',
    distanceKm: 4.5,
    etaMinutes: 25,
    isOnline: true,
    inspectionFeeKsh: 1700,
    hourlyRateKsh: 1200,
    phone: '+254 723 605 918',
    tools: ['Megger Insulation Tester', 'Submersible Pump Rig', 'Fluke True-RMS Clamp Meter', 'Float Switch Tester'],
    badges: ['Countrywide Dispatch', 'Highly Qualified Tech', 'Submersible & Booster Lead'],
    recentJobs: [
      'Submersible booster pump control box rewiring in Nakuru Milimani',
      'Commercial dough mixer motor capacitor renewal in Section 58',
      'Automatic changeover panel installation'
    ],
    bio: 'Specialist in deep-well submersible borehole pumps, booster sets, phase failure protectors, and agricultural/commercial appliances.',
    portfolioPhotos: [
      '/assets/images/hero_technician_service_1791787949015.jpg',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80'
    ]
  }
];
