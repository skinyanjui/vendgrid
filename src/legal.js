// VendGrid policies. One source for the in-app pages and the server-rendered /terms and /privacy pages.
// Keep these statements true to how the product actually works. If you change a data flow, change this file.

export const LEGAL = {
  operator: 'VendGrid',
  updated: 'November 5, 2026',
  law: 'Indiana',
  venue: 'Vanderburgh County, Indiana',
  contact: 'the Contact support form at the bottom of every page',
};

const L = LEGAL;

export const POLICIES = {
  terms: {
    title: 'Terms of use',
    intro: `These terms are an agreement between you and ${L.operator} about using the VendGrid marketplace. By creating an account, posting, or sending a message, you agree to them. If you use VendGrid for a business, you agree on behalf of that business.`,
    sections: [
      ['Who can use VendGrid', [
        'You must be at least 18 and able to enter a binding contract. VendGrid is built for people and businesses that buy, sell, host, operate and service vending equipment.',
        'You sign in with a link sent to your email. Keep that inbox secure: anyone who can open your sign-in links can use your account. Tell us through Contact support if you think someone else has.',
      ]],
      ['What VendGrid is, and isn’t', [
        'VendGrid is a place to list and find machines, parts, locations, routes, services and wanted requests, and to message the other side. Deals happen directly between the people involved.',
        'VendGrid is not a party to any sale, lease, placement agreement or service job. We don’t hold or transfer money, offer escrow, inspect equipment, visit locations, audit revenue, or guarantee that anyone will complete a deal.',
        'VendGrid is not a business broker, and nothing on VendGrid is legal, tax, lending or investment advice. Get your own advice before buying a route or signing a placement agreement.',
      ]],
      ['Your listings', [
        'Only list things you have the right to sell, lease, place or offer. Describe condition, specifications, terms and price honestly, and keep the listing current. Mark it sold, filled or withdrawn when it is no longer available.',
        'Location hosts must have authority to offer the space. Route sellers must have the right to transfer the machines and any location agreements they describe, or must say clearly what does not transfer.',
        'Revenue, cash flow, foot traffic and similar numbers are reported by the seller. VendGrid labels them as seller-reported and does not check them. If you post them, they must be your honest, good-faith figures.',
        'Prices are in US dollars. A listed price is an invitation to talk, not a binding offer, unless the seller says otherwise in writing.',
      ]],
      ['Things you can’t do', [
        'List stolen, counterfeit or recalled goods, or anything you can’t legally sell or operate where it will be used.',
        'Post fake, duplicate or bait listings; impersonate another person or business; or misstate who you are.',
        'Use messages for spam, harassment, or to collect money through deception. Don’t ask anyone to pay through a method you know they can’t reverse if the deal is not as described.',
        'Scrape, bulk-download or resell VendGrid content, probe or overload our systems, or try to get around a block, a removal or a security control.',
        'Share another person’s private information, including a host’s street address or a seller’s documents, outside the deal it was shared for.',
      ]],
      ['Messages and the document room', [
        'Messages are tied to a listing and are visible to the people in that conversation. Use them for that listing.',
        'A route seller can share documents in a private document room. Before a buyer can ask for access, the buyer must accept the confidentiality terms shown on the listing. Those terms are an agreement between the buyer and the seller. VendGrid records when they were accepted and each time a document is opened, and shows that record to the seller.',
        'A seller may still ask a buyer to sign a separate non-disclosure agreement. VendGrid does not enforce confidentiality terms on anyone’s behalf.',
      ]],
      ['Verified business badge', [
        'A business earns the Verified badge by passing our checks at the time of review: a registration document, a business phone number and a website or email domain. The badge lasts one year, and we may remove it if the details stop matching.',
        'Verified means those checks were passed. It is not an endorsement, a rating, a credit check or a guarantee about any listing or deal. It can’t be bought, and paid plans don’t affect it.',
      ]],
      ['Paid plans and Sponsored listings', [
        'Posting, saving, searching and messaging are free. VendGrid plans to offer Professional ($49 a month) and Sponsored placement ($29 a month per listing). Paid plans are not yet available for purchase, and no card is charged today.',
        'When paid plans launch, the price will be shown before you pay, plans will renew monthly until you cancel, and canceling stops the next renewal. Sponsored listings are always labelled Sponsored and pause when the listing is no longer published.',
      ]],
      ['Your content', [
        'You keep ownership of what you post. You give VendGrid a non-exclusive, worldwide, royalty-free licence to host, store, copy, resize, display and distribute it to run and promote the marketplace, including in search results and sitemaps. The licence ends when you delete the content, except for copies we must keep under the Privacy policy.',
        'You confirm that you own, or have permission to use, the photos and documents you upload.',
      ]],
      ['Reports and removal', [
        'Anyone can report a listing. We may review, edit for formatting, hide or remove content, limit features, or suspend or close an account that breaks these terms, puts others at risk, or creates legal exposure. Where it is safe and lawful, we’ll tell you why.',
        'You can stop using VendGrid at any time and ask us to delete your account through Contact support.',
      ]],
      ['Deals and disputes between members', [
        'Inspect equipment, confirm the location and contract terms, and check any figures before you pay. Problems with a deal are between the buyer and the seller. We may help by reviewing reports, but we don’t have to and we can’t reverse payments.',
      ]],
      ['Disclaimers', [
        'VendGrid is provided “as is” and “as available”. To the fullest extent the law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, title and non-infringement. We don’t promise the service will be uninterrupted or error-free, or that listings or member information are accurate.',
      ]],
      ['Limits on liability', [
        'To the fullest extent the law allows, VendGrid is not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or goodwill, or for anything arising from a deal between members.',
        'Our total liability for any claim about VendGrid is limited to the greater of $100 or the amount you paid VendGrid in the 12 months before the claim. Some places don’t allow these limits, so they may not apply to you.',
      ]],
      ['Your responsibility to us', [
        'You will defend and compensate VendGrid for claims, losses and costs (including reasonable legal fees) that come from your listings, your deals, your content, or your breaking these terms or the law.',
      ]],
      ['Law and courts', [
        `These terms are governed by the laws of the State of ${L.law}, without regard to conflict-of-law rules. Any dispute about them or about VendGrid will be heard in the state or federal courts located in ${L.venue}, and you and VendGrid agree to those courts’ jurisdiction.`,
      ]],
      ['Changes and contact', [
        'We may update these terms. If a change is material, we’ll show a notice in the app before it takes effect. Continuing to use VendGrid after that means you accept the new terms.',
        `Questions about these terms: use ${L.contact}.`,
      ]],
    ],
  },

  privacy: {
    title: 'Privacy policy',
    intro: 'This policy explains what VendGrid collects, why, who can see it, and the choices you have. VendGrid does not sell personal information, and does not use advertising trackers or analytics cookies.',
    sections: [
      ['What we collect', [
        'Account: your email address. You sign in with an emailed link, so VendGrid never stores a password.',
        'Business profile: the business name, city and description you add. If you apply for the Verified badge: legal business name, business phone, website or email domain, and a registration document.',
        'Listings: the title, description, price, specifications, photos and city you post. For location listings you can add a street address, which is kept private.',
        'Messages: what you and the other person send in a listing conversation, including photos.',
        'Document room: the documents a route seller uploads, buyers’ access requests (including the time they accepted the confidentiality terms), and a record of each time a document is opened.',
        'Activity you choose to save: saved listings, saved searches, reports you file, and support requests (with the email you give us).',
        'Technical: our hosting providers receive your IP address, browser type and the pages you request, as part of delivering the site.',
      ]],
      ['How we use it', [
        'To run the marketplace: show listings, deliver messages, send sign-in links, run saved searches and the document room, and review verification applications.',
        'To keep VendGrid safe: investigate reports, prevent fraud, spam and abuse, and enforce the Terms of use.',
        'To answer support requests and to meet legal obligations. We don’t use your information for advertising and we don’t sell or share it for cross-context behavioural advertising.',
      ]],
      ['Who can see what', [
        'Anyone: published listings (title, description, price, specifications, photos, city and the business name), business profiles, and whether a business is verified. Listings show a city-level pin only, never a street address.',
        'The other person in a conversation: the messages and photos in that conversation. Message photos are stored privately and shown through links that expire.',
        'A route seller: the email address of each buyer who asks for document access, the note they add, when they accepted the confidentiality terms, and when they opened each document. Buyers see a seller’s documents only after the seller grants access, through links that expire after five minutes.',
        'VendGrid staff: verification documents, reports and support requests, and other content only when needed to investigate a report, prevent fraud or abuse, or comply with the law.',
      ]],
      ['Service providers', [
        'Supabase stores our database and files and sends sign-in emails. Vercel hosts the website. Both process data for us under their own security and privacy terms.',
        'Maps load image tiles from OpenStreetMap’s servers, and fonts load from Google Fonts. Your browser requests those files directly, so those services receive your IP address and browser details under their own privacy policies.',
        'We may disclose information if the law requires it, to protect someone’s safety, or as part of a merger or sale of VendGrid, in which case this policy continues to apply to it.',
      ]],
      ['Cookies and browser storage', [
        'VendGrid doesn’t set advertising or analytics cookies. It uses your browser’s local storage to keep you signed in and to remember settings such as theme, location and which messages you have read. Clearing your browser’s site data removes them and signs you out.',
      ]],
      ['How long we keep it', [
        'We keep your account and content while your account is open. Sold, filled and withdrawn listings stay in your account history until you close your account.',
        'When you ask us to delete your account, we delete or de-identify your profile, listings, photos, documents and messages you sent within 30 days. We may keep limited records longer when needed for fraud prevention, a report under review, or a legal obligation. Your messages may remain visible to the other person in a conversation as part of their record.',
      ]],
      ['Your choices and rights', [
        'You can edit or withdraw your listings and edit your business profile at any time, and remove saved items and searches yourself.',
        `To get a copy of your information, correct it, or delete your account, use ${L.contact} and choose “Delete my data” or “Question”. We’ll confirm the request comes from your account’s email and reply within 45 days. Depending on where you live, you may have further rights under local law, and we won’t treat you differently for using them.`,
      ]],
      ['Security', [
        'Access is enforced by the database for every request: you can only read private rows you are entitled to. Verification documents, route documents and message photos are kept in private storage and are shown only through short-lived signed links. No system is perfectly secure, so please use a secure email account and report anything suspicious.',
      ]],
      ['Children', [
        'VendGrid is not for anyone under 18, and we don’t knowingly collect information from children. If you think a child has created an account, tell us and we’ll delete it.',
      ]],
      ['Changes and contact', [
        'If we change this policy in a way that matters, we’ll show a notice in the app before the change takes effect.',
        `Privacy questions or requests: use ${L.contact}.`,
      ]],
    ],
  },

  refunds: {
    title: 'Refunds and cancellation',
    intro: 'Posting, saving, searching and messaging are free.',
    sections: [
      ['Paid plans', [
        'Professional ($49 a month) and Sponsored placement ($29 a month per listing) are not yet available for purchase, and no card is charged today. The Billing screen is a preview.',
        'When paid plans launch, you’ll be able to cancel at any time from Billing. Canceling stops the next renewal, and the plan stays active until the end of the period you paid for.',
        'A Sponsored placement pauses when its listing is sold, filled, paused or withdrawn. For billing questions, use Contact support.',
      ]],
      ['Deals between members', [
        'VendGrid doesn’t handle payments for equipment, routes, placements or services, so it can’t issue refunds for them. Agree on returns and refunds with the other person before you pay.',
      ]],
    ],
  },
};

export const POLICY_KEYS = ['terms', 'privacy', 'refunds'];
