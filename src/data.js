// VendGrid — marketplace configuration (Sharetribe-style) + demo inventory.
// Everything the UI renders for listing types, fields, filters and the
// inquiry "transaction process" comes from TYPES below. Add a listing type
// here and it gets search, cards, detail, posting and inquiries for free.

export const FMT = (n) => '$' + Number(n).toLocaleString('en-US');

export const CITIES = [
  { city: 'Evansville', st: 'IN', lat: 37.9716, lng: -87.5711, zips: ['47708', '47710', '47711', '47714'] },
  { city: 'Indianapolis', st: 'IN', lat: 39.7684, lng: -86.1581, zips: ['46204', '46220', '46250'] },
  { city: 'Bloomington', st: 'IN', lat: 39.1653, lng: -86.5264, zips: ['47401', '47404'] },
  { city: 'Fort Wayne', st: 'IN', lat: 41.0793, lng: -85.1394, zips: ['46802', '46804'] },
  { city: 'Louisville', st: 'KY', lat: 38.2527, lng: -85.7585, zips: ['40202', '40207', '40218'] },
  { city: 'Owensboro', st: 'KY', lat: 37.7742, lng: -87.1133, zips: ['42301', '42303'] },
  { city: 'Lexington', st: 'KY', lat: 38.0406, lng: -84.5037, zips: ['40502', '40507'] },
  { city: 'Cincinnati', st: 'OH', lat: 39.1031, lng: -84.512, zips: ['45202', '45209'] },
  { city: 'Columbus', st: 'OH', lat: 39.9612, lng: -82.9988, zips: ['43215', '43229'] },
  { city: 'Nashville', st: 'TN', lat: 36.1627, lng: -86.7816, zips: ['37203', '37211'] },
  { city: 'St. Louis', st: 'MO', lat: 38.627, lng: -90.1994, zips: ['63101', '63110'] },
  { city: 'Chicago', st: 'IL', lat: 41.8781, lng: -87.6298, zips: ['60601', '60654'] },
  { city: 'Atlanta', st: 'GA', lat: 33.749, lng: -84.388, zips: ['30303', '30309'] },
  { city: 'Dallas', st: 'TX', lat: 32.7767, lng: -96.797, zips: ['75201', '75204'] },
];

const EVV = CITIES[0];
export const REGIONS = [
  { name: 'Southern Indiana', test: (g) => g.st === 'IN' && g.lat < 39.2 },
  { name: 'Evansville Tri-State', test: (g) => dist(g, EVV) <= 80 },
  { name: 'Midwest', test: (g) => ['IN', 'KY', 'IL', 'OH', 'MO'].includes(g.st) },
  { name: 'Indiana', test: (g) => g.st === 'IN' },
  { name: 'Kentucky', test: (g) => g.st === 'KY' },
  { name: 'Ohio', test: (g) => g.st === 'OH' },
  { name: 'Illinois', test: (g) => g.st === 'IL' },
  { name: 'Tennessee', test: (g) => g.st === 'TN' },
];

export function dist(a, b) {
  const R = 3958.8, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Resolve free text -> {kind:'city'|'region', label, ...} or null.
export function resolveLocation(text) {
  const t = (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!t) return null;
  const zip = t.match(/^\d{5}$/);
  if (zip) {
    const c = CITIES.find((c) => c.zips.includes(t));
    return c ? { kind: 'city', label: `${c.city}, ${c.st}`, ...c } : null;
  }
  const noState = t.replace(/,?\s*(in|ky|oh|tn|mo|il|ga|tx)\.?$/i, '').trim();
  const c = CITIES.find((c) => c.city.toLowerCase() === noState || `${c.city}, ${c.st}`.toLowerCase() === t);
  if (c) return { kind: 'city', label: `${c.city}, ${c.st}`, ...c };
  const r = REGIONS.find((r) => r.name.toLowerCase() === t);
  if (r) return { kind: 'region', label: r.name, name: r.name };
  return null;
}

export function suggestLocations(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return [];
  const out = [];
  CITIES.forEach((c) => {
    if (c.city.toLowerCase().startsWith(t) || c.zips.some((z) => z.startsWith(t))) out.push(`${c.city}, ${c.st}`);
  });
  REGIONS.forEach((r) => r.name.toLowerCase().includes(t) && out.push(r.name));
  return out.slice(0, 6);
}

const MANUFACTURERS = ['AMS', 'Crane', 'Dixie-Narco', 'Seaga', 'Vendo', 'Royal', 'USI', 'Rowe', 'Azkoyen', 'Other'];
const range = (a) => a.map((x) => ({ value: x, label: x }));

export const TYPES = {
  machines: {
    label: 'Machines', singular: 'Machine', action: 'Contact seller', actionDone: 'Message sent',
    hasPrice: true, noPriceText: 'Price undisclosed', glyph: 'M',
    inquiry: {
      title: 'Contact seller',
      fields: [
        { key: 'intent', label: 'What are you looking to do?', kind: 'select', required: true, def: 'Ask a question first', options: ['Buy this machine', 'Ask a question first', 'Make an offer'] },
        { key: 'qty', label: 'Quantity', kind: 'number', min: 1, hint: 'Optional' },
        { key: 'note', label: 'Delivery question or note', kind: 'textarea', hint: 'Optional' },
      ],
    },
    fields: [
      { key: 'machineType', label: 'Machine type', kind: 'select', required: true, essential: true, options: ['Snack', 'Cold drink', 'Combo', 'Coffee', 'Frozen / ice cream', 'Fresh food', 'Locker', 'Micro market', 'AI cooler'] },
      { key: 'sellerType', label: 'Who’s selling', kind: 'select', required: true, essential: true, options: ['Manufacturer / authorized dealer', 'Refurbisher', 'Operator', 'Individual'] },
      { key: 'manufacturer', label: 'Manufacturer', kind: 'select', required: true, essential: true, options: MANUFACTURERS, allowOther: true },
      { key: 'model', label: 'Model', kind: 'text', required: true, essential: true },
      { key: 'condition', label: 'Condition', kind: 'select', required: true, essential: true, options: ['New', 'Refurbished', 'Used', 'For parts'] },
      { key: 'payment', label: 'Payment system', kind: 'select', essential: true, options: ['Cash only', 'Card reader included', 'Cashless compatible', 'Needs retrofit'] },
      { key: 'delivery', label: 'Delivery', kind: 'select', essential: true, options: ['Pickup only', 'Local delivery', 'Shipping available'] },
      { key: 'year', label: 'Year', kind: 'number' },
      { key: 'selections', label: 'Selections', kind: 'number', min: 1 },
      { key: 'capacity', label: 'Capacity', kind: 'text', hint: 'e.g. about 280 12 oz cans' },
      { key: 'dims', label: 'Size (H × W × D)', kind: 'text', essential: true, hint: 'e.g. 72 × 33 × 33 in. Buyers check doorways.' },
      { key: 'weight', label: 'Weight (lb)', kind: 'number', min: 1, essential: true },
      { key: 'cardReader', label: 'Card reader', kind: 'select', options: ['Included', 'Ready, not included', 'Not supported'] },
      { key: 'coinMech', label: 'Coin changer', kind: 'text', hint: 'e.g. 5-tube MDB' },
      { key: 'billValidator', label: 'Bill validator', kind: 'text', hint: 'e.g. $1/$5, MDB' },
      { key: 'telemetry', label: 'Interfaces', kind: 'multi', options: ['MDB', 'DEX', 'Telemetry ready', 'Multi-price'] },
      { key: 'qty', label: 'Quantity available', kind: 'number', min: 1 },
      { key: 'shipsIn', label: 'Ready to ship', kind: 'select', options: ['Ready now', 'Within a week', 'Within 30 days'] },
      { key: 'power', label: 'Power requirements', kind: 'text' },
      { key: 'status', label: 'Operational status', kind: 'select', options: ['Operational', 'Needs minor repair', 'Not working'] },
      { key: 'warranty', label: 'Warranty terms', kind: 'text', essential: true, hint: 'Leave blank if sold as-is' },
      { key: 'service', label: 'Repair & service history', kind: 'textarea', essential: true, hint: 'What was fixed or replaced, and when' },
      { key: 'returns', label: 'Returns', kind: 'select', options: ['No returns (as-is)', 'Returns if not as described', '7-day returns', '30-day returns'] },
      { key: 'shipCost', label: 'Delivery or shipping cost', kind: 'text', hint: 'e.g. Free within 25 mi, or quoted by freight' },
      { key: 'inventory', label: 'Inventory included', kind: 'text' },
      { key: 'defects', label: 'Known defects', kind: 'textarea' },
    ],
    filters: [
      { key: 'machineType', label: 'Machine type', kind: 'select' },
      { key: 'manufacturer', label: 'Manufacturer', kind: 'select' },
      { key: 'condition', label: 'Condition', kind: 'select' },
      { key: 'payment', label: 'Payment system', kind: 'select' },
      { key: 'delivery', label: 'Delivery', kind: 'select' },
      { key: 'sellerType', label: 'Who’s selling', kind: 'select' },
      { key: 'hasWarranty', label: 'Warranty', kind: 'select', options: ['Includes a warranty'], test: (l) => !!(l.f.warranty && String(l.f.warranty).trim()) },
      { key: 'price', label: 'Price', kind: 'price' },
    ],
    meta: (l) => [l.f.condition, l.f.payment === 'Cash only' ? 'Cash only' : l.f.payment].filter(Boolean).slice(0, 2),
  },
  parts: {
    label: 'Parts', singular: 'Part', action: 'Contact seller', actionDone: 'Message sent',
    hasPrice: true, noPriceText: 'Price on request', glyph: 'P',
    inquiry: {
      title: 'Contact seller',
      fields: [
        { key: 'intent', label: 'What are you looking to do?', kind: 'select', required: true, def: 'Check it fits', options: ['Buy this part', 'Check it fits', 'Make an offer'] },
        { key: 'qty', label: 'Quantity', kind: 'number', min: 1, hint: 'Optional' },
        { key: 'note', label: 'Your machine make and model', kind: 'textarea', hint: 'Helps the seller confirm fit' },
      ],
    },
    fields: [
      { key: 'partType', label: 'Part type', kind: 'select', required: true, essential: true, options: ['Coin mech', 'Bill validator', 'Card reader', 'Control board', 'Spirals / coils', 'Motor', 'Compressor / cooling', 'Keypad / display', 'Lock & keys', 'Glass / door', 'Other'] },
      { key: 'brands', label: 'Fits brands', kind: 'multi', required: true, essential: true, options: MANUFACTURERS.filter((m) => m !== 'Other').concat('Universal') },
      { key: 'fits', label: 'Fits models', kind: 'text', essential: true, hint: 'e.g. AMS 35, AMS 39' },
      { key: 'condition', label: 'Condition', kind: 'select', required: true, essential: true, options: ['New', 'Refurbished', 'Used', 'Untested'] },
      { key: 'qty', label: 'Quantity available', kind: 'number', essential: true, min: 1 },
      { key: 'delivery', label: 'Delivery', kind: 'select', essential: true, options: ['Pickup only', 'Local delivery', 'Shipping available'] },
      { key: 'partNumber', label: 'Part number', kind: 'text' },
      { key: 'warranty', label: 'Warranty or returns', kind: 'text' },
      { key: 'tested', label: 'How it was tested', kind: 'textarea' },
    ],
    filters: [
      { key: 'partType', label: 'Part type', kind: 'select' },
      { key: 'brands', label: 'Fits brand', kind: 'select', test: (l, v) => (l.f.brands || []).includes(v) || (l.f.brands || []).includes('Universal') },
      { key: 'condition', label: 'Condition', kind: 'select' },
      { key: 'delivery', label: 'Delivery', kind: 'select' },
      { key: 'price', label: 'Price', kind: 'price' },
    ],
    meta: (l) => [l.f.condition, l.f.partType].filter(Boolean),
  },
  locations: {
    label: 'Locations', singular: 'Placement', action: 'Send proposal', actionDone: 'Proposal sent',
    hasPrice: false, noPriceText: 'Accepting proposals', glyph: 'L',
    inquiry: {
      title: 'Send your proposal',
      fields: [
        { key: 'business', label: 'Your operator business', kind: 'text', required: true, prefill: 'org' },
        { key: 'machines', label: 'Machine type you would place', kind: 'text', required: true },
        { key: 'note', label: 'Short proposal', kind: 'textarea', required: true },
        { key: 'when', label: 'When could you start?', kind: 'select', def: 'Within 30 days', options: ['Immediately', 'Within 30 days', 'Within 90 days'] },
      ],
    },
    fields: [
      { key: 'propertyType', label: 'Property type', kind: 'select', required: true, essential: true, options: ['Office', 'Warehouse', 'Manufacturing', 'Hospital', 'School', 'Apartment', 'Gym', 'Hotel', 'Retail'] },
      { key: 'setting', label: 'Placement', kind: 'select', required: true, essential: true, options: ['Indoor', 'Outdoor'] },
      { key: 'space', label: 'Available space', kind: 'select', required: true, essential: true, options: ['1 machine', '2–3 machines', '4+ machines'] },
      { key: 'terms', label: 'Proposed terms', kind: 'select', required: true, essential: true, options: ['Open to proposals', 'Commission offered', 'Rent requested', 'Free placement'] },
      { key: 'availability', label: 'Availability', kind: 'select', required: true, essential: true, options: ['Immediately', 'Within 30 days', 'Within 90 days'] },
      { key: 'requirements', label: 'Operator requirements', kind: 'multi', essential: true, options: ['Licensed & insured', 'Cashless required', 'Healthy options', 'Background check'] },
      { key: 'rent', label: 'Monthly rent asked ($)', kind: 'number', min: 1, essential: true, hint: 'Only if you chose Rent requested' },
      { key: 'commission', label: 'Commission offered (% of sales)', kind: 'number', min: 1, essential: true, hint: 'Only if you chose Commission offered' },
      { key: 'traffic', label: 'Daily foot traffic', kind: 'number', essential: true, hostReported: true },
      { key: 'electric', label: 'Electrical available', kind: 'select', options: ['Yes', 'No', 'To be confirmed'] },
      { key: 'hours', label: 'Access hours', kind: 'text' },
      { key: 'length', label: 'Proposed agreement length', kind: 'text' },
      { key: 'address', label: 'Street address (private)', kind: 'text', private: true },
    ],
    filters: [
      { key: 'propertyType', label: 'Property type', kind: 'select' },
      { key: 'space', label: 'Available space', kind: 'select' },
      { key: 'terms', label: 'Proposed terms', kind: 'select' },
      { key: 'requirements', label: 'Operator requirements', kind: 'multi' },
    ],
    meta: (l) => [l.f.propertyType, l.f.setting].filter(Boolean),
  },
  routes: {
    label: 'Routes', singular: 'Route', action: 'Request details', actionDone: 'Request sent',
    hasPrice: true, noPriceText: 'Price on request', glyph: 'R',
    inquiry: {
      title: 'Request details',
      fields: [
        { key: 'interest', label: 'Buying interest', kind: 'select', required: true, def: 'Buying for myself', options: ['Buying for myself', 'Expanding my route', 'Investor / partner'] },
        { key: 'docs', label: 'Request financial information', kind: 'select', def: 'Not yet', options: ['Yes, I will sign a confidentiality agreement', 'Not yet'] },
        { key: 'note', label: 'Questions', kind: 'textarea', hint: 'Optional' },
      ],
    },
    fields: [
      { key: 'businessType', label: 'Business type', kind: 'select', required: true, essential: true, options: ['Snack & drink', 'Combo machines', 'Coffee / micro market', 'Specialty'] },
      { key: 'machineCount', label: 'Number of machines', kind: 'number', required: true, essential: true, min: 1 },
      { key: 'locationCount', label: 'Number of locations', kind: 'number', essential: true, min: 1, hint: 'One location or many?' },
      { key: 'locationTypes', label: 'Location types', kind: 'multi', essential: true, options: ['Office', 'Industrial', 'Residential', 'Hospitality', 'Educational', 'Healthcare', 'Retail'] },
      { key: 'equipment', label: 'Equipment included', kind: 'multi', essential: true, options: ['Snack machines', 'Beverage machines', 'Combo machines', 'Coffee', 'Micro market', 'AI cooler'] },
      { key: 'scope', label: 'Sale scope', kind: 'select', required: true, essential: true, options: ['Machines only', 'Machines + location contracts', 'Full business + training'] },
      { key: 'revenueBand', label: 'Annual gross revenue', kind: 'select', essential: true, hostReported: true, options: ['Not disclosed', 'Under $50k', '$50k–$100k', '$100k–$250k', '$250k+'] },
      { key: 'period', label: 'Revenue reporting period', kind: 'text', hostReported: true },
      { key: 'cashFlow', label: 'Annual cash flow (owner earnings)', kind: 'select', hostReported: true, options: ['Not disclosed', 'Under $25k', '$25k–$50k', '$50k–$100k', '$100k+'] },
      { key: 'grossExact', label: 'Gross revenue, last 12 months ($)', kind: 'number', min: 1, hostReported: true },
      { key: 'cashExact', label: 'Cash flow, last 12 months ($)', kind: 'number', min: 1, hostReported: true },
      { key: 'ffe', label: 'Equipment value, FF&E ($)', kind: 'number', min: 1, hostReported: true },
      { key: 'invValue', label: 'Inventory value ($)', kind: 'number', min: 1, hostReported: true },
      { key: 'established', label: 'Year established', kind: 'number', min: 1950 },
      { key: 'employees', label: 'Employees', kind: 'number', min: 0 },
      { key: 'financing', label: 'Seller financing', kind: 'select', options: ['Available', 'Not available', 'Negotiable'] },
      { key: 'vehicle', label: 'Vehicle or storage included', kind: 'text' },
      { key: 'growth', label: 'Growth opportunities', kind: 'textarea' },
      { key: 'contracts', label: 'Location agreements', kind: 'select', options: ['Written agreements, transferable', 'Written agreements', 'Verbal / handshake', 'Mixed'] },
      { key: 'reason', label: 'Reason for selling', kind: 'text' },
      { key: 'ownership', label: 'Machine ownership', kind: 'select', options: ['Owned', 'Leased', 'Mixed'] },
      { key: 'travel', label: 'Route travel requirements', kind: 'text' },
      { key: 'inventory', label: 'Inventory included', kind: 'text' },
      { key: 'transition', label: 'Training / support transition', kind: 'text' },
    ],
    filters: [
      { key: 'price', label: 'Asking price', kind: 'price' },
      { key: 'machineBand', label: 'Machine count', kind: 'select', options: ['1–10', '11–25', '26+'], test: (l, v) => { const n = +l.f.machineCount; return v === '1–10' ? n <= 10 : v === '11–25' ? n >= 11 && n <= 25 : n >= 26; } },
      { key: 'revenueBand', label: 'Disclosed revenue', kind: 'select' },
      { key: 'businessType', label: 'Business type', kind: 'select' },
      { key: 'locationTypes', label: 'Location type', kind: 'multi', options: ['Office', 'Industrial', 'Residential', 'Hospitality', 'Educational', 'Healthcare', 'Retail'] },
      { key: 'equipment', label: 'Equipment', kind: 'multi', options: ['Snack machines', 'Beverage machines', 'Combo machines', 'Coffee', 'Micro market', 'AI cooler'] },
      { key: 'financing', label: 'Seller financing', kind: 'select', options: ['Available', 'Negotiable'] },
    ],
    meta: (l) => [`${l.f.machineCount} machines${l.f.locationCount ? ` · ${l.f.locationCount} ${+l.f.locationCount === 1 ? 'location' : 'locations'}` : ''}`, l.f.revenueBand && l.f.revenueBand !== 'Not disclosed' ? 'Revenue disclosed' : 'Revenue not disclosed'],
  },
  services: {
    label: 'Services', singular: 'Service', action: 'Get a quote', actionDone: 'Quote requested',
    hasPrice: false, noPriceText: 'Request quote', glyph: 'S',
    inquiry: {
      title: 'Get a quote',
      fields: [
        { key: 'need', label: 'Service needed', kind: 'text', required: true },
        { key: 'where', label: 'Approximate location', kind: 'text', required: true, prefill: 'city' },
        { key: 'note', label: 'Description', kind: 'textarea', required: true },
        { key: 'contact', label: 'Best time to reach you', kind: 'select', def: 'Anytime', options: ['Mornings', 'Afternoons', 'Evenings', 'Anytime'] },
      ],
    },
    fields: [
      { key: 'serviceType', label: 'Service type', kind: 'select', required: true, essential: true, options: ['Repair', 'Installation', 'Delivery / hauling', 'Supply / restock', 'Cashless retrofit', 'Refurbishing'] },
      { key: 'coverage', label: 'Coverage radius (miles)', kind: 'number', required: true, essential: true, min: 5 },
      { key: 'availability', label: 'Availability', kind: 'select', required: true, essential: true, options: ['Within 48 hours', 'Same week', 'Scheduled'] },
      { key: 'rate', label: 'Starting rate', kind: 'text', essential: true },
      { key: 'response', label: 'Typical response window', kind: 'text' },
      { key: 'specialties', label: 'Manufacturer specialties', kind: 'text' },
      { key: 'exclusions', label: 'Service exclusions', kind: 'text' },
      { key: 'credentials', label: 'Licensing / insurance (self-reported)', kind: 'text' },
    ],
    filters: [
      { key: 'serviceType', label: 'Service type', kind: 'select' },
      { key: 'availability', label: 'Availability', kind: 'select' },
    ],
    meta: (l) => [l.f.serviceType, l.f.availability].filter(Boolean),
  },
  wanted: {
    label: 'Wanted', singular: 'Wanted post', action: 'I have this', actionDone: 'Offer sent',
    hasPrice: true, noPriceText: 'Budget open', glyph: 'W', priceLabel: 'Budget',
    inquiry: {
      title: 'Offer what you have',
      fields: [
        { key: 'have', label: 'What you have', kind: 'text', required: true, hint: 'Make, model or part number' },
        { key: 'condition', label: 'Condition', kind: 'select', required: true, def: 'Used', options: ['New', 'Refurbished', 'Used', 'For parts'] },
        { key: 'ask', label: 'Your price (USD)', kind: 'number', min: 1, hint: 'Optional' },
        { key: 'note', label: 'Message', kind: 'textarea', required: true },
      ],
    },
    fields: [
      { key: 'lookingFor', label: 'Looking for', kind: 'select', required: true, essential: true, options: ['Machine', 'Part', 'Location', 'Route', 'Service'] },
      { key: 'brand', label: 'Preferred brand', kind: 'select', essential: true, options: MANUFACTURERS.filter((m) => m !== 'Other').concat('Any brand') },
      { key: 'condition', label: 'Acceptable condition', kind: 'multi', essential: true, options: ['New', 'Refurbished', 'Used', 'For parts'] },
      { key: 'when', label: 'Needed by', kind: 'select', essential: true, options: ['ASAP', 'Within 30 days', 'Flexible'] },
      { key: 'pickup', label: 'Pickup or delivery', kind: 'select', options: ['I can pick up', 'Needs delivery', 'Either'] },
    ],
    filters: [
      { key: 'lookingFor', label: 'Looking for', kind: 'select' },
      { key: 'when', label: 'Needed by', kind: 'select' },
      { key: 'price', label: 'Budget', kind: 'price' },
    ],
    meta: (l) => [l.f.lookingFor, l.f.when].filter(Boolean),
  },
};
export const TYPE_KEYS = Object.keys(TYPES);

export const optionsFor = (type, key) => {
  const f = TYPES[type].fields.find((x) => x.key === key) || TYPES[type].filters.find((x) => x.key === key);
  return f && f.options ? f.options : [];
};

// Lifecycle — transitions enforced in one place (server-side in production).
export const TRANSITIONS = {
  draft: ['pending_review'],
  pending_review: ['published', 'withdrawn'],
  published: ['paused', 'sold', 'filled', 'expired', 'withdrawn'],
  paused: ['published', 'withdrawn'],
  sold: [], filled: [], expired: ['published'], withdrawn: [],
};
export const STATUS_LABEL = {
  draft: 'Draft', pending_review: 'In review', published: 'Published', paused: 'Paused',
  sold: 'Sold', filled: 'Filled', expired: 'Expired', withdrawn: 'Withdrawn',
};

export const ORGS = {
  hoosier: { id: 'hoosier', name: 'Hoosier Vend Supply', slug: 'hoosier-vend-supply', verified: true, city: 'Indianapolis, IN', about: 'Refurbished machines and parts sold from our Indianapolis warehouse.' },
  ovv: { id: 'ovv', name: 'Ohio Valley Vending', slug: 'ohio-valley-vending', verified: false, city: 'Evansville, IN', about: 'Family-run route operator serving the tri-state.' },
  bluegrass: { id: 'bluegrass', name: 'Bluegrass Route Brokers', slug: 'bluegrass-route-brokers', verified: true, city: 'Louisville, KY', about: 'Brokering vending routes and placements in Kentucky.' },
  mme: { id: 'mme', name: 'Midwest Machine Exchange', slug: 'midwest-machine-exchange', verified: true, city: 'Chicago, IL', about: 'Used machine dealer with a certified refurbishing shop.' },
  apex: { id: 'apex', name: 'Apex Vending Repair', slug: 'apex-vending-repair', verified: true, city: 'Evansville, IN', about: 'Mobile technicians for snack, drink and coffee equipment.' },
  lakeshore: { id: 'lakeshore', name: 'Lakeshore Coin-Op', slug: 'lakeshore-coin-op', verified: false, city: 'Chicago, IL', about: 'Small independent operator.' },
  northpoint: { id: 'northpoint', name: 'Northpoint Logistics Park', slug: 'northpoint-logistics-park', verified: false, city: 'Indianapolis, IN', about: 'Property manager, 3 warehouse buildings.' },
  riverside: { id: 'riverside', name: 'Riverside Medical Group', slug: 'riverside-medical-group', verified: false, city: 'Evansville, IN', about: 'Outpatient clinics.' },
  dm: { id: 'dm', name: 'Demo Vending LLC', slug: 'demo-vending-llc', verified: false, city: 'Evansville, IN', about: 'Your demo business — sign in to manage these listings.', mine: true },
  coldchain: { id: 'coldchain', name: 'Cold Chain Haulers', slug: 'cold-chain-haulers', verified: false, city: 'Nashville, TN', about: 'Liftgate delivery for heavy equipment.' },
  buckeye: { id: 'buckeye', name: 'Buckeye Snack Co.', slug: 'buckeye-snack-co', verified: false, city: 'Columbus, OH', about: 'Operator retiring after 14 years.' },
};

const geoOf = (cityLabel) => {
  const [c, s] = cityLabel.split(', ');
  const x = CITIES.find((k) => k.city === c && k.st === s);
  return { city: x.city, st: x.st, lat: x.lat, lng: x.lng };
};
const D = 864e5;
const NOW = Date.now();
const L = (id, type, org, title, loc, daysAgo, price, f, desc, extra = {}) => ({
  id, type, org, title, geo: geoOf(loc), createdAt: NOW - daysAgo * D - id * 61000, updatedAt: NOW - daysAgo * D,
  price, priceType: price == null ? (TYPES[type].hasPrice ? 'undisclosed' : 'none') : 'fixed', f, desc, status: 'published',
  photos: [], sponsored: false, history: [{ at: NOW - daysAgo * D, to: 'published' }], ...extra,
});

export const SEED = [
  L(101, 'machines', 'hoosier', 'AMS 39 Snack Vending Machine', 'Evansville, IN', 1, 3200, { machineType: 'Snack', manufacturer: 'AMS', model: '39', condition: 'Used', payment: 'Cashless compatible', delivery: 'Local delivery', year: 2016, capacity: '36 selections', power: '120V / 15A', status: 'Operational', warranty: '30-day parts', inventory: 'None' }, 'Single-owner machine pulled from an office route. Fully tested, new coin mech installed last spring. Cashless reader mounting kit included but reader not included.', { sponsored: true }),
  L(102, 'machines', 'mme', 'Dixie-Narco 501E Cold Drink Machine', 'Chicago, IL', 2, 1850, { machineType: 'Cold drink', manufacturer: 'Dixie-Narco', model: '501E', condition: 'Refurbished', payment: 'Cash only', delivery: 'Shipping available', year: 2012, capacity: '8 selections', power: '120V / 20A', status: 'Operational', warranty: '90-day compressor' }, 'Refurbished in our shop: new gaskets, cleaned evaporator, recalibrated cooling. Freight shipping quoted per destination.'),
  L(103, 'machines', 'ovv', 'Crane Merchant 4 Combo Machine', 'Owensboro, KY', 3, 2400, { machineType: 'Combo', manufacturer: 'Crane', model: 'Merchant 4', condition: 'Used', payment: 'Card reader included', delivery: 'Pickup only', year: 2018, capacity: 'Snack + 20 can capacity', power: '120V', status: 'Operational', inventory: 'Partial inventory' }, 'Card reader included and active on our current processor account (reader will be unlinked at sale). Pickup in Owensboro.'),
  L(104, 'machines', 'dm', 'Vendo 721 Soda Machine — works, needs gasket', 'Evansville, IN', 5, 650, { machineType: 'Cold drink', manufacturer: 'Vendo', model: '721', condition: 'Used', payment: 'Cash only', delivery: 'Pickup only', year: 2009, status: 'Needs minor repair', defects: 'Door gasket worn on hinge side.' }, 'Cools well. Selling as-is; good first machine or parts donor.', { mine: true }),
  L(105, 'machines', 'hoosier', 'Seaga Infinity Combo — Cashless Ready', 'Indianapolis, IN', 4, 4100, { machineType: 'Combo', manufacturer: 'Seaga', model: 'Infinity', condition: 'Refurbished', payment: 'Card reader included', delivery: 'Local delivery', year: 2019, capacity: '40 selections', power: '120V / 15A', status: 'Operational', warranty: '6 months' }, 'Late-model refurbished unit with cashless reader and telemetry mount.'),
  L(106, 'machines', 'lakeshore', 'Rowe 5900 Coffee Machine', 'Chicago, IL', 8, null, { machineType: 'Coffee', manufacturer: 'Rowe', model: '5900', condition: 'Used', payment: 'Needs retrofit', delivery: 'Pickup only', status: 'Operational' }, 'Price on request — open to reasonable offers. Located in a Chicago storage unit; viewing by appointment.'),
  L(107, 'machines', 'buckeye', 'USI 3015 Snack Machine, 2 units available', 'Columbus, OH', 6, 1400, { machineType: 'Snack', manufacturer: 'USI', model: '3015', condition: 'Used', payment: 'Cash only', delivery: 'Pickup only', year: 2011, capacity: '30 selections', status: 'Operational' }, 'Two matching units from a route I am winding down. Price is per machine.'),
  L(108, 'machines', 'mme', 'Azkoyen Fresh Food Locker — Open Box', 'St. Louis, MO', 9, 5200, { machineType: 'Locker', manufacturer: 'Azkoyen', model: 'Fresh 24', condition: 'New', payment: 'Card reader included', delivery: 'Shipping available', year: 2025, power: '120V', status: 'Operational', warranty: 'Manufacturer 12-month' }, 'Open box, never placed. Includes original packing and manual.'),
  L(109, 'machines', 'hoosier', 'Royal 650 Frozen Treat Machine — for parts', 'Indianapolis, IN', 12, 300, { machineType: 'Frozen / ice cream', manufacturer: 'Royal', model: '650', condition: 'For parts', delivery: 'Pickup only', status: 'Not working', defects: 'Compressor failed. Cabinet and control board intact.' }, 'Parts unit. Control board tested good.'),
  L(110, 'machines', 'ovv', 'AMS 35 Snack Machine, 2014', 'Evansville, IN', 14, 2100, { machineType: 'Snack', manufacturer: 'AMS', model: '35', condition: 'Used', payment: 'Cashless compatible', delivery: 'Local delivery', year: 2014, status: 'Operational' }, 'Reliable workhorse. Local delivery within 40 miles.'),
  L(111, 'machines', 'mme', 'Seaga HY900 Combo (sold)', 'Chicago, IL', 20, 3000, { machineType: 'Combo', manufacturer: 'Seaga', model: 'HY900', condition: 'Used', payment: 'Cash only', delivery: 'Pickup only' }, 'Sold. Kept for reference.', { status: 'sold' }),

  L(201, 'locations', 'northpoint', 'Warehouse break room — 120 employees, no vending', 'Indianapolis, IN', 1, null, { propertyType: 'Warehouse', setting: 'Indoor', space: '2–3 machines', terms: 'Commission offered', availability: 'Within 30 days', requirements: ['Licensed & insured', 'Cashless required'], traffic: 120, electric: 'Yes', hours: '24/7 with badge', length: '3 years' }, 'Three shifts, one break room and no current vending. Looking for an operator who can keep machines stocked for all shifts.', { sponsored: true }),
  L(202, 'locations', 'riverside', 'Distribution center break room — 2 shifts, 160 staff', 'Evansville, IN', 2, null, { propertyType: 'Warehouse', setting: 'Indoor', space: '2–3 machines', terms: 'Open to proposals', availability: 'Immediately', requirements: ['Healthy options', 'Background check'], traffic: 160, electric: 'Yes', hours: 'Two shifts, Mon–Sat' }, 'Break room with kitchenette, TV and lockers. We want a snack and a cold drink machine plus a few healthy options. Operators must pass a background check to enter the floor.'),
  L(203, 'locations', 'northpoint', 'Office & warehouse building — staff lounge', 'Indianapolis, IN', 4, null, { propertyType: 'Office', setting: 'Indoor', space: '2–3 machines', terms: 'Rent requested', availability: 'Within 30 days', requirements: ['Licensed & insured'], traffic: 300, electric: 'Yes', length: '2 years' }, 'Bright staff lounge between the offices and the warehouse floor, shared by both teams. Rent is a flat monthly amount; details in proposal.'),
  L(204, 'locations', 'lakeshore', 'Cold storage facility — employee lounge', 'Chicago, IL', 5, null, { propertyType: 'Warehouse', setting: 'Indoor', space: '1 machine', terms: 'Free placement', availability: 'Immediately', requirements: [], traffic: 90, electric: 'To be confirmed' }, 'Employee lounge with lockers next to the loading dock. No fees; we just want drinks and snacks for our crews.'),
  L(205, 'locations', 'ovv', 'Manufacturing plant, two break rooms', 'Owensboro, KY', 7, null, { propertyType: 'Manufacturing', setting: 'Indoor', space: '4+ machines', terms: 'Commission offered', availability: 'Within 90 days', requirements: ['Licensed & insured', 'Cashless required'], traffic: 220, electric: 'Yes', hours: 'Shifts 24/5' }, 'Existing vendor contract ends in Q1. Taking proposals now.'),
  L(206, 'locations', 'riverside', 'Fulfillment center break area — peak-season staffing', 'Bloomington, IN', 10, null, { propertyType: 'Warehouse', setting: 'Indoor', space: '2–3 machines', terms: 'Open to proposals', availability: 'Within 30 days', requirements: ['Healthy options', 'Cashless required'], traffic: 250, electric: 'Yes' }, 'Open break area beside the racking with seating for 60. Headcount roughly doubles from October to January. Hydration-focused products preferred.'),

  L(301, 'routes', 'bluegrass', 'Established vending route — 18 machines', 'Louisville, KY', 2, 85000, { businessType: 'Snack & drink', machineCount: 18, scope: 'Full business + training', revenueBand: '$100k–$250k', period: 'Trailing 12 months', ownership: 'Owned', travel: '~25 hrs/week', inventory: 'About $3,000 of stock', transition: '4 weeks of ride-alongs' }, 'Offices and light industrial in east Louisville. Revenue shown is seller-reported for the period stated; financial statements are available on request.', { sponsored: true }),
  L(302, 'routes', 'buckeye', 'Retiring operator — 9-machine snack route', 'Columbus, OH', 3, 38000, { businessType: 'Snack & drink', machineCount: 9, scope: 'Machines + location contracts', revenueBand: 'Under $50k', period: '2025 calendar year', ownership: 'Owned', travel: '~12 hrs/week' }, 'Nine placements, all with written agreements. Owner retiring.'),
  L(303, 'routes', 'ovv', 'Coffee micro-market route — 6 sites', 'Evansville, IN', 6, 120000, { businessType: 'Coffee / micro market', machineCount: 6, scope: 'Full business + training', revenueBand: '$100k–$250k', period: 'Trailing 12 months', ownership: 'Mixed', transition: '60 days of support' }, 'Six micro-market and coffee sites with recurring revenue. Leased equipment transfers with lessor approval.'),
  L(304, 'routes', 'lakeshore', 'Chicago route — 31 machines', 'Chicago, IL', 11, null, { businessType: 'Combo machines', machineCount: 31, scope: 'Machines only', revenueBand: 'Not disclosed', ownership: 'Owned' }, 'Price on request. Machines only; seller will help assign contracts where landlords allow.'),
  L(305, 'routes', 'bluegrass', 'Starter route — 5 machines, Lexington', 'Lexington, KY', 15, 22000, { businessType: 'Snack & drink', machineCount: 5, scope: 'Machines + location contracts', revenueBand: 'Under $50k', period: 'Last 12 months', ownership: 'Owned' }, 'Good entry route for a part-time operator.'),

  L(401, 'services', 'apex', 'Vending machine repair — snack, drink & coffee', 'Evansville, IN', 1, null, { serviceType: 'Repair', coverage: 75, availability: 'Within 48 hours', rate: 'Call-out from $95', response: 'Same business day', specialties: 'AMS, Crane, Dixie-Narco', credentials: 'Insured (self-reported)' }, 'Mobile diagnostics and repair. Parts for common models on the truck.', { sponsored: true }),
  L(402, 'services', 'coldchain', 'Liftgate delivery for vending equipment', 'Nashville, TN', 3, null, { serviceType: 'Delivery / hauling', coverage: 200, availability: 'Same week', rate: 'From $120 local', exclusions: 'No stairs without notice' }, 'Padded truck with liftgate and straps. We handle machines up to 800 lb.'),
  L(403, 'services', 'hoosier', 'Cashless reader retrofit installs', 'Indianapolis, IN', 5, null, { serviceType: 'Cashless retrofit', coverage: 120, availability: 'Scheduled', rate: 'Install from $60', specialties: 'Nayax, Cantaloupe' }, 'We install and activate card readers on most machines made after 2005.'),
  L(404, 'services', 'apex', 'Installation and relocation', 'Louisville, KY', 9, null, { serviceType: 'Installation', coverage: 60, availability: 'Within 48 hours', rate: 'From $150' }, 'Level, plumb, load and test. Relocations within a building or across town.'),
  L(405, 'services', 'mme', 'Wholesale snack & drink supply — operators only', 'St. Louis, MO', 13, null, { serviceType: 'Supply / restock', coverage: 150, availability: 'Scheduled', rate: 'Case pricing on request' }, 'Weekly delivery days across the metro. Minimum order applies.'),

  L(501, 'parts', 'hoosier', 'Coinco 9302 coin mech — refurbished, tested', 'Indianapolis, IN', 1, 85, { partType: 'Coin mech', brands: ['AMS', 'Crane', 'Dixie-Narco', 'USI'], fits: 'Most MDB snack and drink machines', condition: 'Refurbished', qty: 6, delivery: 'Shipping available', warranty: '30-day returns' }, 'Bench-tested coin mechs pulled from route machines. Cleaned, new tube springs, MDB. Six available; volume pricing on 4+.'),
  L(502, 'parts', 'mme', 'MEI bill validator, 5-bill stacker', 'Chicago, IL', 4, 140, { partType: 'Bill validator', brands: ['Universal'], fits: 'MDB machines', condition: 'Used', qty: 3, delivery: 'Shipping available' }, 'Accepts $1–$20. Working when removed; belts look good. Sold as-is with a 7-day DOA return.'),
  L(503, 'parts', 'ovv', 'AMS spiral set — 15-count, 1 tray', 'Owensboro, KY', 6, 60, { partType: 'Spirals / coils', brands: ['AMS'], fits: 'AMS 35, AMS 39', condition: 'Used', qty: 2, delivery: 'Local delivery' }, 'Mixed pitch spirals for chips and candy. Straight, no cracks. Local delivery within 30 miles.'),
  L(504, 'parts', 'apex', 'Dixie-Narco 501E control board', 'Evansville, IN', 9, 220, { partType: 'Control board', brands: ['Dixie-Narco'], fits: '501E, 600E', condition: 'Refurbished', qty: 1, delivery: 'Shipping available', warranty: '90-day warranty' }, 'Refurbished and tested on our bench machine. Firmware updated. Includes harness clip.'),
  L(505, 'parts', 'buckeye', 'Vendo 721 door cam lock with 2 keys', 'Columbus, OH', 12, null, { partType: 'Lock & keys', brands: ['Vendo'], fits: 'Vendo 721, 821', condition: 'New', qty: 4, delivery: 'Shipping available' }, 'New chrome cam locks with two keys each, mounting nut and hardware included. Round and square bezel styles available. Ask for bulk pricing.'),
  L(506, 'parts', 'ovv', 'Combo machine relay control board — used, bench-tested', 'Owensboro, KY', 15, 95, { partType: 'Control board', brands: ['Seaga'], fits: 'Seaga Infinity series (confirm board number)', condition: 'Used', qty: 1, delivery: 'Shipping available', tested: 'Powered up on a bench harness; all relays click. Battery replaced.' }, 'Pulled from a working Seaga combo during a board upgrade. Ships in an anti-static bag. Send your board number to confirm fit before buying.'),
  L(601, 'wanted', 'buckeye', 'Wanted: AMS 39 snack machine, cashless ready', 'Columbus, OH', 1, 2500, { lookingFor: 'Machine', brand: 'AMS', condition: ['Refurbished', 'Used'], when: 'Within 30 days', pickup: 'I can pick up' }, 'Adding a location in Columbus. Looking for a working AMS 39 or 35 with a card reader or ready for one. Can pick up within 150 miles.'),
  L(602, 'wanted', 'dm', 'Wanted: Coinco or MEI coin mech, MDB', 'Evansville, IN', 2, 90, { lookingFor: 'Part', brand: 'Any brand', condition: ['Refurbished', 'Used'], when: 'ASAP', pickup: 'Either' }, 'One of my snack machines is down. Need a working MDB coin mech this week. Shipping is fine.'),
  L(603, 'wanted', 'lakeshore', 'Wanted: placement in a Chicago office or warehouse', 'Chicago, IL', 4, null, { lookingFor: 'Location', brand: 'Any brand', when: 'Flexible', pickup: 'Either' }, 'Licensed operator with two refurbished combo machines ready to place. Commission-friendly. 50+ staff preferred.'),
  L(604, 'wanted', 'ovv', 'Wanted: small snack route, 5–10 machines', 'Louisville, KY', 6, 30000, { lookingFor: 'Route', brand: 'Any brand', when: 'Flexible' }, 'Looking to buy a small established route around Louisville. Will sign an NDA to review numbers.'),
  L(901, 'machines', 'dm', 'Seaga HY900 Combo — sold last month', 'Evansville, IN', 30, 3300, { machineType: 'Combo', manufacturer: 'Seaga', model: 'HY900', condition: 'Used', payment: 'Cash only', delivery: 'Pickup only' }, 'Sold.', { status: 'sold' }),
  L(902, 'services', 'dm', 'Weekend restocking help', 'Evansville, IN', 17, null, { serviceType: 'Supply / restock', coverage: 40, availability: 'Scheduled', rate: '$25/hr' }, 'Reliable weekend route restocking for small operators.', { status: 'paused' }),
];
/* Extra detail on the sample listings (seller type, service history, route specifics) */
const EXTRA = {
  101: { selections: 36, dims: '72 × 39 × 35 in', weight: 650, cardReader: 'Ready, not included', coinMech: 'MDB coin changer', billValidator: '$1/$5, MDB', telemetry: ['MDB', 'DEX', 'Multi-price'], qty: 1, shipsIn: 'Ready now', sellerType: 'Refurbisher', service: 'New coin mech spring 2026. Spirals checked and straightened.', returns: 'Returns if not as described', shipCost: 'Free within 25 mi of Evansville' },
  102: { dims: '72 × 35 × 31 in', weight: 600, cardReader: 'Not supported', coinMech: '5-tube changer', billValidator: '$1/$5', qty: 1, shipsIn: 'Within a week', sellerType: 'Refurbisher', service: 'Shop refurbished: new door gaskets, evaporator cleaned, cooling recalibrated.', returns: '7-day returns', shipCost: 'Freight quoted per destination' },
  103: { sellerType: 'Operator', service: 'Serviced monthly on our route. Card reader active until sale.', returns: 'No returns (as-is)', shipCost: 'Pickup only' },
  105: { selections: 40, dims: '72 × 41 × 36 in', weight: 700, cardReader: 'Included', coinMech: 'MDB coin changer', billValidator: '$1/$5/$10/$20, MDB', telemetry: ['MDB', 'DEX', 'Telemetry ready', 'Multi-price'], qty: 1, shipsIn: 'Ready now', sellerType: 'Refurbisher', service: 'Refurbished with cashless reader and telemetry mount installed.', returns: '30-day returns', shipCost: 'Free within 40 mi of Indianapolis' },
  106: { sellerType: 'Operator', returns: 'No returns (as-is)', shipCost: 'Pickup only' },
  107: { dims: '72 × 38 × 34 in', weight: 580, qty: 2, shipsIn: 'Ready now', sellerType: 'Operator', service: 'Both units working on location until last month.', returns: 'No returns (as-is)', shipCost: 'Pickup only' },
  108: { weight: 900, cardReader: 'Included', telemetry: ['Telemetry ready'], qty: 1, shipsIn: 'Within 30 days', sellerType: 'Manufacturer / authorized dealer', service: 'Never placed. Factory packing and manual included.', returns: '30-day returns', shipCost: 'Freight quoted per destination' },
  109: { sellerType: 'Refurbisher', service: 'Compressor failed. Control board bench-tested good.', returns: 'No returns (as-is)', shipCost: 'Pickup only' },
  110: { sellerType: 'Operator', service: 'Reliable on our route; no repairs in the last year.', returns: 'No returns (as-is)', shipCost: 'Free within 40 mi' },
  111: { sellerType: 'Refurbisher' },
  201: { commission: 15 }, 203: { rent: 150 }, 205: { commission: 12 },
  301: { grossExact: 168000, cashExact: 41000, ffe: 30000, invValue: 3000, established: 2014, employees: 1, financing: 'Negotiable', vehicle: '2018 cargo van available separately', growth: 'Two buildings on the route have asked for coffee service.', locationCount: 11, locationTypes: ['Office', 'Industrial'], equipment: ['Snack machines', 'Beverage machines'], cashFlow: '$25k–$50k', contracts: 'Written agreements, transferable', reason: 'Owner moving out of state' },
  302: { grossExact: 46000, cashExact: 19000, ffe: 14000, established: 2012, employees: 0, financing: 'Not available', locationCount: 9, locationTypes: ['Office', 'Industrial'], equipment: ['Snack machines', 'Beverage machines'], cashFlow: 'Under $25k', contracts: 'Written agreements', reason: 'Owner retiring' },
  303: { grossExact: 210000, cashExact: 62000, ffe: 55000, invValue: 4500, established: 2017, employees: 2, financing: 'Available', vehicle: 'Storage unit lease transfers', growth: 'Add AI coolers at the two largest sites.', locationCount: 6, locationTypes: ['Office', 'Healthcare'], equipment: ['Coffee', 'Micro market'], cashFlow: '$50k–$100k', contracts: 'Written agreements, transferable', reason: 'Focusing on a larger territory' },
  304: { locationCount: 22, locationTypes: ['Industrial', 'Residential', 'Educational'], equipment: ['Combo machines', 'Beverage machines', 'AI cooler'], cashFlow: 'Not disclosed', contracts: 'Mixed' },
  305: { grossExact: 31000, cashExact: 12000, ffe: 9000, established: 2020, employees: 0, financing: 'Negotiable', locationCount: 4, locationTypes: ['Office', 'Hospitality'], equipment: ['Snack machines', 'Beverage machines'], cashFlow: 'Under $25k', contracts: 'Verbal / handshake', reason: 'Selling to fund a new business' },
};
SEED.forEach((l) => { if (EXTRA[l.id]) l.f = { ...l.f, ...EXTRA[l.id] }; });

/* Demo photos (supplied by the owner) — matched to each machine or route by type */
const PHOTO = { 101: ['snack', 'snack2'], 102: ['drink', 'drink2'], 103: ['combo3', 'combo'], 104: ['drink2'], 105: ['smart', 'smart2', 'combo2'], 106: ['coffee', 'coffee2'], 107: ['snack2'], 108: ['fresh', 'fresh2'], 109: ['frozen', 'frozen2'], 110: ['snack'], 111: ['combo4', 'combo2'], 901: ['combo4'], 301: ['combo', 'snack', 'drink'], 302: ['snack2'], 303: ['coffee2', 'fresh2', 'coffee'], 304: ['industrial', 'workplace', 'drink', 'smart'], 305: ['healthy2', 'healthy'], 501: ['p-coinmech', 'p-coinmech2'], 502: ['p-validator', 'p-validator2'], 503: ['p-spiral', 'p-spiral2'], 504: ['p-board'], 506: ['p-board2'], 505: ['p-lock', 'p-lock2'], 201: ['loc-break1', 'loc-break5'], 202: ['loc-break4', 'loc-break3'], 203: ['loc-break5', 'loc-break1'], 204: ['loc-break2', 'loc-break3'], 205: ['loc-break3', 'loc-break2', 'loc-break4'], 206: ['loc-break1', 'loc-break4'], 401: ['svc-repair'], 402: ['svc-delivery', 'svc-install'], 403: ['svc-cashless'], 404: ['svc-install', 'svc-delivery'], 405: ['svc-supply'], 902: ['svc-supply'] };
SEED.forEach((l) => { if (PHOTO[l.id]) l.photos = PHOTO[l.id].map((n) => 'img/' + n + '.jpg'); });

SEED.filter((l) => l.mine).forEach((l) => delete l.mine);
SEED.forEach((l) => { if (['dm'].includes(l.org)) l.mine = true; });

export const PRIVATE_SEED = { 201: '4100 Distribution Dr' };
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
export const hrefFor = (l) => `#/listing/${l.id}/${slugify(l.title)}`;

// Demo document rooms for route listings (names and sizes only; opening one shows a sample notice).
const ROOM_AT = Date.UTC(2026, 9, 20);
export const DEMO_ROOMS = {
  301: { files: [
    { id: 'demo-301-1', name: '2025 profit and loss (sample).pdf', size: 188416, mime: 'application/pdf', at: ROOM_AT, views: [] },
    { id: 'demo-301-2', name: 'Location agreements, 11 sites (sample).pdf', size: 942080, mime: 'application/pdf', at: ROOM_AT, views: [] },
    { id: 'demo-301-3', name: 'Machine list with serials (sample).xlsx', size: 40960, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', at: ROOM_AT, views: [] },
  ], access: [] },
  303: { files: [
    { id: 'demo-303-1', name: 'Micro market sales by site, 2025 (sample).xlsx', size: 61440, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', at: ROOM_AT, views: [] },
    { id: 'demo-303-2', name: 'Commission statements (sample).pdf', size: 311296, mime: 'application/pdf', at: ROOM_AT, views: [] },
  ], access: [] },
};
