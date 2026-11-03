import { RepairItem } from '../types';

export const REPAIR_ITEMS: RepairItem[] = [
  // --- REFRIGERATION & COOLING ---
  {
    id: 'fridge-domestic',
    name: 'Domestic Refrigerator (Single/Double Door)',
    category: 'refrigeration',
    categoryLabel: 'Refrigeration & Cooling',
    description: 'Home fridge cooling issues, gas recharge, thermostat, or compressor replacement.',
    commonIssues: [
      'Not cooling at all / warm inside',
      'Freezer working but bottom compartment warm',
      'Gas leakage (hissing sound / smell)',
      'Compressor clicking every few minutes and stopping',
      'Excessive ice buildup / frost free defrost failure',
      'Water leaking on kitchen floor',
      'Door seal / gasket loose and not sealing'
    ],
    typicalBrands: ['Samsung', 'LG', 'Ramtons', 'Von Hotpoint', 'Mika', 'Armco', 'Whirlpool', 'Beko'],
    baseEstimatedCostKsh: 2400,
    popular: true
  },
  {
    id: 'deep-freezer',
    name: 'Deep Chest Freezer (Commercial & Domestic)',
    category: 'refrigeration',
    categoryLabel: 'Refrigeration & Cooling',
    description: 'High capacity chest freezers for homes, butcheries, shops, and restaurants.',
    commonIssues: [
      'Food thawing / insufficient freezing temperature',
      'Overheating motor / compressor running continuously',
      'Refrigerant gas low (R134a / R600a refilling needed)',
      'Thermostat dial faulty / stuck in defrost mode',
      'Tripping home circuit breaker when plugged in'
    ],
    typicalBrands: ['Ramtons', 'Bruhm', 'Mika', 'Haier', 'Skyworth', 'Von'],
    baseEstimatedCostKsh: 3000,
    popular: true
  },
  {
    id: 'display-chiller',
    name: 'Supermarket / Beverage Display Chiller',
    category: 'refrigeration',
    categoryLabel: 'Refrigeration & Cooling',
    description: 'Glass-door beverage coolers and commercial reach-in chillers.',
    commonIssues: [
      'Drinks not cold enough',
      'Internal evaporator fan motor stopped',
      'Condenser coil clogged or fan seized',
      'Digital temperature controller showing error code',
      'Compressor relay / starting capacitor burnt'
    ],
    typicalBrands: ['Williams', 'Staycold', 'True', 'Ramtons Commercial', 'Mika Commercial'],
    baseEstimatedCostKsh: 4000
  },
  {
    id: 'air-conditioner',
    name: 'Wall-Mounted Split Air Conditioner',
    category: 'refrigeration',
    categoryLabel: 'Refrigeration & Cooling',
    description: 'Residential and office split AC cooling, gas top-up, and chemical cleaning.',
    commonIssues: [
      'Blowing warm air instead of cold',
      'Indoor unit dripping water indoors',
      'Unpleasant odor or dust clogged filters',
      'Remote control sensor unresponsive',
      'Outdoor compressor unit failing to start'
    ],
    typicalBrands: ['LG', 'Samsung', 'Daikin', 'Midea', 'Gree', 'Aux'],
    baseEstimatedCostKsh: 5000,
    popular: true
  },
  {
    id: 'water-dispenser',
    name: 'Water Dispenser (Hot & Cold Compressor)',
    category: 'refrigeration',
    categoryLabel: 'Refrigeration & Cooling',
    description: 'Bottle or plumbed hot and cold water dispenser repair.',
    commonIssues: [
      'Cold water not cooling (compressor silent)',
      'Hot water not heating (thermostat / coil burnt)',
      'Leaking taps / bottom cabinet reservoir overflow',
      'Electrical sparking or tripping power'
    ],
    typicalBrands: ['Ramtons', 'Von', 'Mika', 'Armco', 'Syinix'],
    baseEstimatedCostKsh: 2000
  },
  {
    id: 'cold-room',
    name: 'Commercial Cold Room / Walk-in Freezer',
    category: 'refrigeration',
    categoryLabel: 'Refrigeration & Cooling',
    description: 'Industrial refrigeration cold storage room for meat, dairy, flowers, or pharma.',
    commonIssues: [
      'Temperature failing to hold target negative degrees',
      'Expansion valve freezing over',
      'Condensing unit high pressure switch lockout',
      'Defrost heaters not energizing',
      'Three-phase electrical compressor overload tripping'
    ],
    typicalBrands: ['Bitzer', 'Copeland', 'Danfoss', 'Frascold'],
    baseEstimatedCostKsh: 9000
  },

  // --- ELECTRICAL INSTALLATIONS & POWER ---
  {
    id: 'distribution-board',
    name: 'Main Consumer Unit / Distribution Board (DB)',
    category: 'electrical',
    categoryLabel: 'Electrical Installations & Power',
    description: 'Circuit breakers (MCB), Earth Leakage (RCD/RCCB), surge protectors, and busbars.',
    commonIssues: [
      'Main breaker tripping constantly with loud click',
      'RCD earth leakage tripping when power is on',
      'Burning plastic smell or buzzing from breaker box',
      'Blown fuse or faulty main isolator switch',
      'Voltage surge damaged breakers after power blackout'
    ],
    typicalBrands: ['Schneider Electric', 'ABB', 'Havells', 'Chint', 'Hager'],
    baseEstimatedCostKsh: 3000,
    popular: true
  },
  {
    id: 'sockets-switches',
    name: 'Wall Sockets, Switches & Lighting Circuits',
    category: 'electrical',
    categoryLabel: 'Electrical Installations & Power',
    description: 'Repair of sparking outlets, dead switches, light points, and ceiling fixtures.',
    commonIssues: [
      'Wall socket sparks when plug inserted',
      'Socket dead / no power to appliances',
      'Light switch stuck or smoking',
      'Flickering ceiling lights or recessed spotlights',
      'Burnt wires inside electrical conduit box'
    ],
    typicalBrands: ['Schneider (Clipsal)', 'MK Electric', 'Crabtree', 'Legrand', 'Anchor'],
    baseEstimatedCostKsh: 1600,
    popular: true
  },
  {
    id: 'house-rewiring',
    name: 'House Wiring & Electrical Installation',
    category: 'electrical',
    categoryLabel: 'Electrical Installations & Power',
    description: 'Comprehensive house wiring, new installations, earthing, conduit laying, fault tracing & rewiring.',
    commonIssues: [
      'House wiring installation for new construction / extension',
      'Shock when touching metallic appliances / poor earthing',
      'Phase imbalance or low voltage from Kenya Power (KPLC) intake',
      'Hidden short circuit in walls causing total blackout',
      'Rodents chewed wires in ceiling attic',
      'Circuit breaker tripping / burnt conduit wires'
    ],
    typicalBrands: ['East African Cables', 'Metsec Cables', 'Kenya Cables', 'Top Cable'],
    baseEstimatedCostKsh: 6000,
    popular: true
  },
  {
    id: 'instant-shower',
    name: 'Instant Shower Water Heater',
    category: 'electrical',
    categoryLabel: 'Electrical Installations & Power',
    description: 'Shower heating elements, copper wiring, dual pole switch, and earth protection.',
    commonIssues: [
      'Water not getting hot (heating element burnt)',
      'Tripping circuit breaker immediately upon turning water on',
      'Slight electrical tingle felt in water stream (critical earthing failure)',
      'Water pressure diaphragm damaged / water leaking from unit',
      'Dual-pole 45A isolator switch burnt or stuck'
    ],
    typicalBrands: ['Lorenzetti', 'Enerbras', 'Fame', 'Bosch', 'Ferroli'],
    baseEstimatedCostKsh: 2000,
    popular: true
  },
  {
    id: 'solar-inverter',
    name: 'Inverter & Solar Power Backup System',
    category: 'electrical',
    categoryLabel: 'Electrical Installations & Power',
    description: 'Solar inverters, hybrid changeover switches, lithium/gel battery backup systems.',
    commonIssues: [
      'Inverter not switching on during KPLC power outage',
      'Batteries not charging or draining within minutes',
      'Inverter alarm beeping continuously (error code)',
      'Automatic changeover switch (ATS) failing to transfer load',
      'Solar panels output voltage lower than normal'
    ],
    typicalBrands: ['Must', 'Growatt', 'Victron Energy', 'Felicity Solar', 'Luminous'],
    baseEstimatedCostKsh: 5000
  },
  {
    id: 'security-lighting',
    name: 'Security Floodlights & Daylight Sensors',
    category: 'electrical',
    categoryLabel: 'Electrical Installations & Power',
    description: 'Compound floodlights, motion sensors, day/night photocells, and perimeter lighting.',
    commonIssues: [
      'Photocell sensor failed / lights stay on all day',
      'Floodlight dead after lightning or rain',
      'Motion detector sensor erratic',
      'Blown driver in LED floodlight'
    ],
    typicalBrands: ['Philips', 'Osram', 'Oppie', 'Opple', 'Tridonic'],
    baseEstimatedCostKsh: 1800
  },

  // --- KITCHEN & HOME APPLIANCES ---
  {
    id: 'smart-tv',
    name: 'Smart TV, LED & OLED Television',
    category: 'appliances',
    categoryLabel: 'Electronics & Home Appliances',
    description: 'Motherboard circuit repair, backlight LED strips, power supply board, and audio ports.',
    commonIssues: [
      'Sound working but screen completely black (backlight failure)',
      'TV not turning on / red standby light blinking error code',
      'Lines or distortion on display / double image',
      'HDMI ports dead after lightning or power surge',
      'Wi-Fi / Smart OS stuck in boot loop'
    ],
    typicalBrands: ['Samsung', 'LG', 'Sony Bravia', 'TCL', 'Hisense', 'Vitron', 'Syinix'],
    baseEstimatedCostKsh: 3600,
    popular: true
  },
  {
    id: 'cooker-oven',
    name: 'Electric Cooker, Oven & Hob',
    category: 'appliances',
    categoryLabel: 'Kitchen & Home Appliances',
    description: 'Oven heating elements, thermostat, solid hotplates, induction coils, safety switches.',
    commonIssues: [
      'Oven temperature not regulating / burning baked food',
      'Top hotplate coil not turning red / dead',
      'Digital timer or display not lighting up',
      'Oven fan making loud rattling noise',
      'Trips the heavy appliance breaker when turned to max'
    ],
    typicalBrands: ['Ramtons', 'Von Hotpoint', 'Mika', 'Bosch', 'Ariston', 'Beko'],
    baseEstimatedCostKsh: 3000,
    popular: true
  },
  {
    id: 'washing-machine',
    name: 'Automatic Washing Machine (Front / Top Load)',
    category: 'appliances',
    categoryLabel: 'Kitchen & Home Appliances',
    description: 'Drum motor, water inlet valves, drainage pump, PCB board, belt, door lock.',
    commonIssues: [
      'Drum not spinning / clothes soaking wet',
      'Water not draining out (drain pump clogged or burnt)',
      'Violent shaking / loud banging during spin cycle',
      'Door error lock (E40 / dE) preventing opening',
      'Water leaking from detergent drawer or underneath'
    ],
    typicalBrands: ['LG Inverter Direct Drive', 'Samsung EcoBubble', 'Bosch', 'Ramtons', 'Whirlpool'],
    baseEstimatedCostKsh: 4000,
    popular: true
  },
  {
    id: 'microwave',
    name: 'Microwave Oven',
    category: 'appliances',
    categoryLabel: 'Kitchen & Home Appliances',
    description: 'Magnetron heating tube, high voltage diode, turntable motor, door interlock.',
    commonIssues: [
      'Turns on and spins but food comes out cold',
      'Sparks and crackling sounds inside cavity',
      'Turntable glass plate not rotating',
      'Keypad buttons unresponsive',
      'Smoke or electrical burning smell'
    ],
    typicalBrands: ['Ramtons', 'Samsung', 'LG', 'Von', 'Panasonic'],
    baseEstimatedCostKsh: 2000
  },
  {
    id: 'laptop-repair',
    name: 'Laptops & Notebooks',
    category: 'appliances',
    categoryLabel: 'Electronics & Computers',
    description: 'Hardware diagnostics, screen panel replacement, charging port fix, motherboard repair, and operating system recovery.',
    commonIssues: [
      'Screen cracked / black display / lines on screen',
      'Laptop not charging / loose power DC jack port',
      'Extremely slow / freezing / Windows OS boot loop',
      'Spilled liquid / keyboard keys not responding',
      'Battery swollen or draining in minutes',
      'Overheating / fan spinning loud and shutting down',
      'RAM / SSD storage upgrade and data recovery'
    ],
    typicalBrands: ['HP', 'Dell', 'Lenovo', 'Apple MacBook', 'Asus', 'Acer', 'Toshiba'],
    baseEstimatedCostKsh: 3000,
    popular: true
  },
  {
    id: 'computer-desktop',
    name: 'Computers & Desktop PCs',
    category: 'appliances',
    categoryLabel: 'Electronics & Computers',
    description: 'All-in-One and tower PC diagnostics, power supply unit (PSU) fix, motherboard, CPU cooling, and system re-installation.',
    commonIssues: [
      'PC powers on but no signal output to monitor',
      'Power supply unit (PSU) burnt / zero power',
      'Blue Screen of Death (BSOD) / restarting randomly',
      'Heavy dust buildup / processor overheating',
      'Hard drive clicking / corrupted OS boot failure',
      'Dedicated graphics card (GPU) or RAM fault'
    ],
    typicalBrands: ['HP', 'Dell', 'Lenovo', 'Custom Desktop PC', 'Apple iMac', 'Acer'],
    baseEstimatedCostKsh: 3000,
    popular: true
  },
  {
    id: 'phone-repair',
    name: 'Smartphones & Mobile Phones',
    category: 'appliances',
    categoryLabel: 'Electronics & Mobile Devices',
    description: 'Screen and OLED replacement, charging flex repair, battery replacement, water damage ultrasonic cleaning, and microphone fix.',
    commonIssues: [
      'Cracked glass / touch digitizer unresponsive',
      'Phone not charging / loose Type-C or Lightning port',
      'Battery dying fast / swollen battery casing',
      'Microphone or loudspeaker not working during calls',
      'Water damaged phone dropped in liquid',
      'Stuck on startup logo / phone software bricked'
    ],
    typicalBrands: ['Samsung Galaxy', 'Apple iPhone', 'Tecno', 'Infinix', 'Oppo', 'Xiaomi / Redmi', 'Huawei', 'Vivo'],
    baseEstimatedCostKsh: 2000,
    popular: true
  },

  // --- WATER PUMPS & MOTOR SYSTEMS ---
  {
    id: 'borehole-pump',
    name: 'Borehole Submersible Pump & Control Box',
    category: 'pumps',
    categoryLabel: 'Water Pumps & Motors',
    description: 'Deep well submersible pumps, motor starters, run capacitor, thermal overload.',
    commonIssues: [
      'Control box tripping overload relay button',
      'Pump humming but not lifting water to tank',
      'Start capacitor swollen or blown',
      'Phase failure relay tripped',
      'Low insulation resistance / pump motor winding burnt'
    ],
    typicalBrands: ['Dayliff (Davis & Shirtliff)', 'Pedrollo', 'Grundfos', 'Shimge'],
    baseEstimatedCostKsh: 7000
  },
  {
    id: 'booster-pump',
    name: 'Domestic Booster Pump & Pressure Switch',
    category: 'pumps',
    categoryLabel: 'Water Pumps & Motors',
    description: 'Automatic pressure booster pump for domestic shower and roof tank pressure.',
    commonIssues: [
      'Pump runs continuously without shutting off',
      'Pressure switch clicking on and off rapidly',
      'Pump fails to start when tap is opened',
      'Water leaking from pump mechanical seal',
      'Air trapped in impeller chamber'
    ],
    typicalBrands: ['Dayliff', 'Pedrollo', 'Leo', 'Pentax'],
    baseEstimatedCostKsh: 3600
  },
  {
    id: 'float-switch',
    name: 'Automatic Water Level Controller & Float Switch',
    category: 'pumps',
    categoryLabel: 'Water Pumps & Motors',
    description: 'Overhead and underground tank water level sensors, magnetic contactors.',
    commonIssues: [
      'Tank overflowing onto roof / float switch not cutting power',
      'Water finished in tank but pump fails to turn on',
      'Wiring corroded by water exposure',
      'Contactor coil stuck in closed position'
    ],
    typicalBrands: ['Dayliff Float', 'Mac3', 'Chint Contactor', 'Schneider Contactor'],
    baseEstimatedCostKsh: 2400
  }
];

export const KENYA_ESTATES = [
  'Countrywide - Any Kenya County / Town',
  'Nairobi - Kilimani & Kileleshwa',
  'Nairobi - Westlands & Parklands',
  'Nairobi - Karen & Langata',
  'Nairobi - South B & South C',
  'Nairobi - Kasarani & Roysambu',
  'Nairobi - Ruaka & Kiambu Road',
  'Nairobi - Lavington & Riverside',
  'Nairobi - Buruburu & Donholm',
  'Nairobi - CBD & Ngara',
  'Mombasa - Nyali & Links Road',
  'Mombasa - Bamburi & Shanzu',
  'Mombasa - CBD & Kizingo',
  'Mombasa - Tudor & Buxton',
  'Mombasa - Likoni & Diani Axis',
  'Mombasa - Changamwe & Port Area',
  'Nakuru - Milimani, Section 58 & CBD',
  'Kisumu - Milimani, Riat & CBD',
  'Eldoret - Elgon View, Pioneer & CBD',
  'Kiambu & Thika Town Area',
  'Machakos & Athi River / Kitengela',
  'Naivasha & Gilgil Axis',
  'Nyeri, Karatina & Mt Kenya Region',
  'Kericho & Rift Valley Region',
  'Kakamega & Western Kenya Region',
  'Malindi & Kilifi Coastal Strip',
  'Other Counties / Countrywide Dispatch'
];
