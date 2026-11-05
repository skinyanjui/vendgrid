// Public, crawlable addresses. The server function renders these; the app boots from them.
import { slugify } from './data.js';

export const CAT_PATHS = { machines: 'vending-machines', parts: 'vending-machine-parts', locations: 'vending-locations', routes: 'vending-routes-for-sale', services: 'vending-services', wanted: 'vending-wanted' };
export const PATH_CATS = Object.fromEntries(Object.entries(CAT_PATHS).map(([k, v]) => [v, k]));
export const CAT_SEO = {
  machines: ['Vending machines for sale', 'New, used and refurbished snack, drink, combo, coffee and micro market machines from operators, refurbishers and dealers.'],
  parts: ['Vending machine parts for sale', 'Coin mechs, bill validators, card readers, boards, motors and spirals, listed by the brands they fit.'],
  locations: ['Vending machine locations', 'Offices, factories, schools, gyms and apartments looking for a vending operator, with commission or rent terms up front.'],
  routes: ['Vending routes for sale', 'Established vending routes and businesses for sale, with seller-reported revenue, location counts and equipment lists.'],
  services: ['Vending machine services', 'Repair, moving, installation, card reader setup and other services for vending operators.'],
  wanted: ['Wanted: vending equipment and routes', 'Buyers looking for vending machines, parts, routes and locations. Reply if you have what they need.'],
};
export const listingPath = (l) => `/listing/${l.id}-${slugify(l.title || 'listing')}`;
export const POLICY_PATHS = { terms: '/terms', privacy: '/privacy', refunds: '/refunds' };

/** Turn a crawlable path into the app's in-memory route, or null if the path isn't one of ours. */
export function pathToRoute(pathname) {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  let m;
  if ((m = p.match(/^\/listing\/(\d+)(?:-[a-z0-9-]*)?$/))) return '#/listing/' + m[1] + '/x';
  if ((m = p.match(/^\/([a-z-]+)$/)) && PATH_CATS[m[1]]) return '#/?cat=' + PATH_CATS[m[1]];
  if ((m = p.match(/^\/(terms|privacy|refunds)$/))) return '#/legal?doc=' + m[1];
  if ((m = p.match(/^\/(about|seller-guide|pricing|safety|support|sellers)$/))) return '#/' + m[1];
  return null;
}
