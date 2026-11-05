// Public information pages. One source for the in-app screens and the server-rendered pages.
// Same shape as POLICIES in legal.js: { title, intro, sections: [[heading, [paragraphs]]] }.
// Keep these true to how the product works. Nothing here may promise what VendGrid doesn't do.

export const INFO_KEYS = ['about', 'seller-guide', 'pricing', 'safety'];
export const INFO_PATHS = { about: '/about', 'seller-guide': '/seller-guide', pricing: '/pricing', safety: '/safety' };
export const INFO_LABELS = { about: 'About', 'seller-guide': 'Seller guide', pricing: 'Pricing', safety: 'Safety' };
// Where each page sends the reader next: [label, in-app address]
export const INFO_CTA = {
  about: [['Browse listings', '#/'], ['Post a listing', '#/post']],
  'seller-guide': [['Post a listing', '#/post'], ['Business settings', '#/business-settings']],
  pricing: [['Post a listing', '#/post'], ['See Billing', '#/billing']],
  safety: [['Read the buyer’s guide', '#/guide'], ['Contact support', '#/support']],
};

export const INFO = {
  about: {
    title: 'About VendGrid',
    intro: 'VendGrid is a marketplace for the vending industry. Operators, refurbishers, location owners and service providers use it to list and find machines, parts, locations, routes for sale, services and wanted requests, and to talk to each other directly.',
    sections: [
      ['What you can do here', [
        'Machines: new, used and refurbished snack, drink, combo, coffee and micro market machines.',
        'Parts: coin mechs, bill validators, card readers, boards, motors and spirals, listed by the brands they fit.',
        'Locations: offices, factories, schools, gyms and apartments looking for an operator, with commission or rent terms stated up front.',
        'Routes: established vending routes and businesses for sale, with seller-reported figures and a private document room for serious buyers.',
        'Services: repair, moving, installation, card reader setup and other work for operators.',
        'Wanted: buyers posting what they need so sellers can reply.',
      ]],
      ['How it works', [
        'Browse and search without an account. Sign in with an emailed link when you want to save a listing, send a message or post. There is no password to remember.',
        'Every listing has a Contact button that opens a message tied to that listing, so the conversation always has the context of what was advertised.',
        'Deals are made directly between the buyer and the seller. VendGrid is where you meet and talk, not a party to the sale.',
      ]],
      ['What we promise', [
        'No made-up ratings or reviews. If a number is shown, it is real or it is labelled.',
        'Verified is earned, never bought. A business gets the badge by passing our checks, and paid plans don’t change that.',
        'Sponsored is always labelled. A sponsored listing says so on the card and on the listing page.',
        'Seller-reported figures are marked as seller-reported. VendGrid does not audit revenue, foot traffic or cash flow.',
        'VendGrid does not hold or move money. We don’t offer escrow, and we never ask you to pay us for a deal between you and another member.',
      ]],
      ['Who is behind it', [
        'VendGrid is based in Evansville, Indiana. Listings from anywhere in the United States are welcome.',
        'Questions, corrections and ideas are all welcome through the Contact support page.',
      ]],
    ],
  },

  'seller-guide': {
    title: 'Seller guide',
    intro: 'A good listing answers a buyer’s first three questions before they ask: what exactly is it, where is it, and what does it cost. This guide covers how to post, how to earn the Verified badge, and how to run a route sale with the document room.',
    sections: [
      ['Before you post', [
        'Sign in with your email. Add your business name and city in Business settings so buyers see who they are talking to instead of “Independent seller”.',
        'Posting is free. Pick the type that matches what you are offering: machine, part, location, route, service or wanted.',
      ]],
      ['Write a listing buyers can trust', [
        'Title: say what it is, the model and the condition. “Dixie-Narco 501E cold drink machine, refurbished” beats “Great machine!”.',
        'Photos: show the real item from several sides, the data plate and any damage. A listing without photos gets fewer replies.',
        'Price: state it, or say “price undisclosed” if you must. Prices are in US dollars and are an invitation to talk, not a binding offer.',
        'Details: fill in the specification fields. Buyers filter on them, and a listing with blanks is easy to skip.',
        'Honesty: describe wear, missing keys, board problems and anything that doesn’t transfer. Surprises at pickup end deals and generate reports.',
      ]],
      ['Locations and privacy', [
        'Listings show a city-level pin only. If you add a street address for a location, it stays private and is never shown publicly.',
        'Location hosts need authority to offer the space. Say clearly what you are offering and the terms you expect: commission, rent or neither.',
      ]],
      ['Selling a route', [
        'Revenue, location counts and cash flow are reported by you. VendGrid labels them seller-reported and doesn’t check them, so give honest, good-faith figures.',
        'Say what transfers and what doesn’t: machines, location agreements, equipment, vehicles. Be clear about anything that needs the location owner’s consent.',
        'Use the document room to share what serious buyers need, such as location agreements, route sheets, financial summaries and equipment lists. Files are private and open through short-lived links.',
        'A buyer must accept the confidentiality terms on the listing before asking for access. You approve each request, and you can see when each document was opened. You can still ask for a separate NDA.',
      ]],
      ['Get the Verified badge', [
        'In Business settings, submit your legal business name, a business phone number, your website or email domain, and a registration document.',
        'We review it by hand. Verified means those checks were passed at the time of review. The badge lasts one year and can be removed if the details stop matching.',
        'It is not an endorsement or a guarantee about any deal, and it can’t be bought. Professional and Sponsored plans don’t affect it.',
      ]],
      ['After you post', [
        'Reply to messages promptly. Buyers move on quickly when they hear nothing.',
        'Keep the listing current. Mark it sold, filled, paused or withdrawn the moment it is no longer available.',
        'Your listings page shows views, saves and inquiries for each listing, counted without tracking individual visitors.',
      ]],
    ],
  },

  pricing: {
    title: 'Pricing',
    intro: 'Posting, saving, searching and messaging are free. Two optional paid plans are planned for sellers who want more. They are not yet available to buy, and no card is charged today.',
    sections: [
      ['Standard: free', [
        'Post unlimited listings.',
        'Save listings and searches.',
        'Message buyers and sellers about any listing.',
        'Apply for the Verified badge.',
      ]],
      ['Professional: $49 a month', [
        'Everything in Standard.',
        'Views and inquiries per listing, and business tools.',
        'It does not add a Verified badge. Verification is earned through review, not bought.',
      ]],
      ['Sponsored placement: $29 a month per listing', [
        'Puts one listing higher in results.',
        'Always labelled Sponsored on the card and the listing page.',
        'Pauses automatically when the listing is no longer published.',
      ]],
      ['How billing will work', [
        'The price is shown before you pay. Plans renew monthly until you cancel, and canceling stops the next renewal.',
        'Features unlock only after the payment provider confirms payment.',
        'VendGrid never handles money for deals between members. Plans are the only thing we charge for. See Refunds and cancellation for details.',
      ]],
    ],
  },

  safety: {
    title: 'Safety and trust',
    intro: 'Most vending deals go fine, and a few habits keep it that way. This page explains what VendGrid checks, what it doesn’t, and how to protect yourself.',
    sections: [
      ['What VendGrid checks, and what it doesn’t', [
        'Verified businesses passed a review of a registration document, a business phone number and a website or email domain at the time of review.',
        'We don’t inspect equipment, visit locations, audit revenue or guarantee that a deal will close. Treat Verified as a reason to trust a business a little more, not as a guarantee about any listing.',
        'Figures marked seller-reported come from the seller and are not checked by VendGrid.',
      ]],
      ['Before you pay', [
        'Inspect machines in person or have someone you trust do it. Confirm the model, condition, serial number and that it works.',
        'For a route, visit the locations. Check counts, ask for sales records you can compare with bank deposits, and confirm that location agreements can be transferred.',
        'Ask for the location agreement and read what it says about termination and assignment.',
        'Get the terms in writing: price, what is included, delivery, and what happens if something is wrong.',
      ]],
      ['Paying safely', [
        'VendGrid doesn’t hold money. Never pay VendGrid for a deal between you and another member, and be wary of anyone who says otherwise.',
        'Be careful with payment methods you can’t reverse, such as wire transfers, gift cards, crypto and payment apps, especially with someone you haven’t met.',
        'Walk away from pressure to pay a deposit before you have seen the item, or from prices far below what similar listings ask.',
      ]],
      ['Red flags', [
        'A seller who refuses a phone call or a visit, or who pushes the conversation off VendGrid right away.',
        'Photos that look copied, a location that doesn’t match the listing, or a story that changes.',
        'A request to ship first, pay first or send money to a third party.',
        'Revenue claims with no records to back them up.',
      ]],
      ['Your privacy', [
        'Listings show only a city-level pin. A host’s street address is never shown publicly.',
        'Messages stay inside the conversation on the listing. You can block a conversation if you don’t want more messages.',
        'Documents in a route sale’s document room are private and open only through short-lived links, and each opening is recorded for the seller.',
      ]],
      ['Report a problem', [
        'Use Report on any listing to flag it. We review reports and may edit, hide or remove content, or limit or close an account, where it breaks the Terms.',
        'If you think you are being scammed, stop paying and contact your bank or payment provider right away. For emergencies or threats, contact local police.',
        'For anything else, use the Contact support page.',
      ]],
    ],
  },
};
