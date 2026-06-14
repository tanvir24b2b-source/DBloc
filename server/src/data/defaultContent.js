// Default editable content for the entire site.
// Every text/image the admin can edit lives here. Seeded into MongoDB on first run.
// type: text | richtext | image | url | color

export const defaultContent = [
  // ---------- GLOBAL / SITE SETTINGS ----------
  { key: "site.name", value: "D BLOC", type: "text", page: "global", group: "Brand", label: "Site Name" },
  { key: "site.tagline", value: "Bangladesh's group-buy platform. Buy together, pay wholesale.", type: "text", page: "global", group: "Brand", label: "Tagline" },
  { key: "site.logoText", value: "BLOC", type: "text", page: "global", group: "Brand", label: "Logo Text (next to D mark)" },
  { key: "site.logoUrl", value: "", type: "image", page: "global", group: "Brand", label: "Logo Image (optional, overrides text)" },
  { key: "site.currency", value: "৳", type: "text", page: "global", group: "Brand", label: "Currency Symbol" },

  { key: "site.hotline", value: "16633", type: "text", page: "global", group: "Contact", label: "Hotline Number" },
  { key: "site.email", value: "support@dblock.bd", type: "text", page: "global", group: "Contact", label: "Support Email" },
  { key: "site.hours", value: "9AM–9PM · Every day", type: "text", page: "global", group: "Contact", label: "Support Hours" },
  { key: "site.socialMain", value: '[{"icon":"","url":"https://facebook.com","label":"Facebook"},{"icon":"","url":"https://instagram.com","label":"Instagram"},{"icon":"","url":"https://wa.me/","label":"WhatsApp"},{"icon":"","url":"mailto:support@dblock.bd","label":"Email"}]', type: "sociallinks", page: "global", group: "Social", label: "Social Links (icon + URL for each)" },
  { key: "site.socialExtra", value: "[]", type: "sociallinks", page: "global", group: "Social", label: "Extra Social Links" },

  // ---------- NAVBAR ----------
  { key: "nav.link1", value: "ALL BLOCS", type: "text", page: "global", group: "Navbar", label: "Nav Link 1" },
  { key: "nav.link2", value: "CATEGORIES", type: "text", page: "global", group: "Navbar", label: "Nav Link 2" },
  { key: "nav.link3", value: "TRACK ORDER", type: "text", page: "global", group: "Navbar", label: "Nav Link 3" },
  { key: "nav.searchPlaceholder", value: "Search deals, products...", type: "text", page: "global", group: "Navbar", label: "Search Placeholder" },
  { key: "nav.login", value: "LOGIN", type: "text", page: "global", group: "Navbar", label: "Login Label" },

  // ---------- HERO ----------
  { key: "hero.headline1", value: "Buy Together,", type: "text", page: "home", group: "Hero", label: "Headline Line 1" },
  { key: "hero.headline2", value: "Save More.", type: "text", page: "home", group: "Hero", label: "Headline Line 2 (orange)" },
  { key: "hero.subtext", value: "Wholesale price. No middleman.", type: "text", page: "home", group: "Hero", label: "Sub-text" },
  { key: "hero.ctaText", value: "BROWSE BLOCS", type: "text", page: "home", group: "Hero", label: "CTA Button Text" },
  { key: "hero.ctaUrl", value: "/blocs", type: "url", page: "home", group: "Hero", label: "CTA Button Link" },
  { key: "hero.bgColor", value: "#111827", type: "color", page: "home", group: "Hero", label: "Hero Background Color" },
  { key: "hero.bgImage", value: "", type: "image", page: "home", group: "Hero", label: "Hero Background Image (1440×700px)" },
  { key: "hero.countdownLabel", value: "NEXT BLOC CLOSES IN", type: "text", page: "home", group: "Hero", label: "Countdown Label" },

  // ---------- TICKER ----------
  { key: "ticker.text", value: "২৪ ঘণ্টার মধ্যে শেষ হবে এমন ব্লক · Ending soon · Limited spots · Wholesale price", type: "text", page: "home", group: "Ticker", label: "Scrolling Ticker Text" },

  // ---------- ACTIVE BLOCS ----------
  { key: "activeBlocs.title", value: "ACTIVE BLOCS", type: "text", page: "home", group: "Active Blocs", label: "Section Title" },
  { key: "activeBlocs.viewAll", value: "VIEW ALL BLOCS", type: "text", page: "home", group: "Active Blocs", label: "View All Link Text" },

  // ---------- HOW IT WORKS ----------
  { key: "how.title", value: "How D Bloc Works", type: "text", page: "home", group: "How It Works", label: "Section Title" },
  { key: "how.step1Title", value: "Find a Bloc", type: "text", page: "home", group: "How It Works", label: "Step 1 Title" },
  { key: "how.step1Desc", value: "Browse active group-buy deals on products you love.", type: "richtext", page: "home", group: "How It Works", label: "Step 1 Description" },
  { key: "how.step2Title", value: "Join the Bloc", type: "text", page: "home", group: "How It Works", label: "Step 2 Title" },
  { key: "how.step2Desc", value: "Reserve your spot before the timer ends. More buyers, bigger discount.", type: "richtext", page: "home", group: "How It Works", label: "Step 2 Description" },
  { key: "how.step3Title", value: "Get Wholesale Price", type: "text", page: "home", group: "How It Works", label: "Step 3 Title" },
  { key: "how.step3Desc", value: "When the Bloc fills, everyone pays the wholesale price. Delivered to your door.", type: "richtext", page: "home", group: "How It Works", label: "Step 3 Description" },

  // ---------- ENDING SOON ----------
  { key: "endingSoon.title", value: "Ending Soon", type: "text", page: "home", group: "Ending Soon", label: "Section Title" },
  { key: "endingSoon.viewAll", value: "VIEW ALL", type: "text", page: "home", group: "Ending Soon", label: "View All Link Text" },

  // ---------- FOR YOU ----------
  { key: "forYou.title", value: "For You", type: "text", page: "home", group: "For You", label: "Section Title" },
  { key: "home.viewAllBlocs", value: "VIEW ALL BLOCS", type: "text", page: "home", group: "For You", label: "Bottom 'View All Blocs' Button" },
  { key: "forYou.subtitle", value: "Handpicked Blocs based on what's trending", type: "text", page: "home", group: "For You", label: "Section Subtitle" },

  // ---------- REVIEWS ----------
  { key: "reviews.title", value: "What Our Customers Say", type: "text", page: "home", group: "Reviews", label: "Section Title" },
  { key: "reviews.r1Text", value: "Got my soundbar at almost half price. The Bloc filled up in hours!", type: "richtext", page: "home", group: "Reviews", label: "Review 1 Text" },
  { key: "reviews.r1Name", value: "Rahim, Dhaka", type: "text", page: "home", group: "Reviews", label: "Review 1 Author" },
  { key: "reviews.r2Text", value: "So simple. Joined a Bloc, paid wholesale, delivered in 3 days.", type: "richtext", page: "home", group: "Reviews", label: "Review 2 Text" },
  { key: "reviews.r2Name", value: "Sadia, Chittagong", type: "text", page: "home", group: "Reviews", label: "Review 2 Author" },
  { key: "reviews.r3Text", value: "Best prices in Bangladesh. No middleman markup at all.", type: "richtext", page: "home", group: "Reviews", label: "Review 3 Text" },
  { key: "reviews.r3Name", value: "Karim, Sylhet", type: "text", page: "home", group: "Reviews", label: "Review 3 Author" },
  { key: "reviews.r4Text", value: "Ordered the air fryer with my friends. Got it at almost wholesale. Super fast delivery too!", type: "richtext", page: "home", group: "Reviews", label: "Review 4 Text" },
  { key: "reviews.r4Name", value: "Fatema, Rajshahi", type: "text", page: "home", group: "Reviews", label: "Review 4 Author" },
  { key: "reviews.r5Text", value: "The countdown timer keeps me alert for new deals. Already joined 3 blocs this month!", type: "richtext", page: "home", group: "Reviews", label: "Review 5 Text" },
  { key: "reviews.r5Name", value: "Arif, Comilla", type: "text", page: "home", group: "Reviews", label: "Review 5 Author" },
  { key: "reviews.r6Text", value: "Never thought I could afford a noise-cancelling headphone. D BLOC made it possible.", type: "richtext", page: "home", group: "Reviews", label: "Review 6 Text" },
  { key: "reviews.r6Name", value: "Mitu, Khulna", type: "text", page: "home", group: "Reviews", label: "Review 6 Author" },

  // ---------- NOTIFY ----------
  { key: "notify.headline", value: "Never miss a Bloc", type: "text", page: "home", group: "Notify", label: "Headline" },
  { key: "notify.subtext", value: "Get notified when new group-buy deals go live.", type: "text", page: "home", group: "Notify", label: "Sub-text" },
  { key: "notify.placeholder", value: "Enter your email", type: "text", page: "home", group: "Notify", label: "Input Placeholder" },
  { key: "notify.ctaText", value: "Notify Me", type: "text", page: "home", group: "Notify", label: "CTA Button Text" },

  // ---------- FOOTER ----------
  { key: "footer.tagline", value: "Bangladesh's group-buy platform. Buy together, pay wholesale.", type: "richtext", page: "global", group: "Footer", label: "Footer Tagline" },
  { key: "footer.col1Title", value: "PLATFORM", type: "text", page: "global", group: "Footer", label: "Column 1 Title" },
  { key: "footer.col1Links", value: "All Blocs, Categories, Track Order, How It Works, Request a Bloc", type: "text", page: "global", group: "Footer", label: "Column 1 Links (comma separated)" },
  { key: "footer.col2Title", value: "SUPPORT", type: "text", page: "global", group: "Footer", label: "Column 2 Title" },
  { key: "footer.col2Links", value: "Help Center, Refund Policy, Delivery Info, Terms of Service, Privacy Policy", type: "text", page: "global", group: "Footer", label: "Column 2 Links (comma separated)" },
  { key: "footer.col3Title", value: "CONTACT", type: "text", page: "global", group: "Footer", label: "Column 3 Title" },
  { key: "footer.copyright", value: "© 2025 Digital Bloc BD · All rights reserved", type: "text", page: "global", group: "Footer", label: "Copyright Text" },
  { key: "footer.legal", value: "Privacy, Terms, Cookies", type: "text", page: "global", group: "Footer", label: "Legal Links (comma separated)" },

  // ---------- ALL BLOCS PAGE ----------
  { key: "allblocs.title", value: "All Blocs", type: "text", page: "allblocs", group: "All Blocs Page", label: "Page Title" },
  { key: "allblocs.subtitle", value: "Join a group-buy and unlock wholesale prices", type: "text", page: "allblocs", group: "All Blocs Page", label: "Page Subtitle" },
  { key: "allblocs.empty", value: "No active Blocs right now. Check back soon!", type: "text", page: "allblocs", group: "All Blocs Page", label: "Empty State Text" },

  // ---------- CATEGORIES PAGE ----------
  { key: "categories.title", value: "Categories", type: "text", page: "categories", group: "Categories Page", label: "Page Title" },
  { key: "categories.subtitle", value: "Shop Blocs by category", type: "text", page: "categories", group: "Categories Page", label: "Page Subtitle" },

  // ---------- PRODUCT (BLOC DETAIL) PAGE ----------
  { key: "bloc.lowestLabel", value: "Lowest Price Achieved", type: "text", page: "blocdetail", group: "Product Page", label: "Lowest Price Label" },
  { key: "bloc.verifiedBadge", value: "✓ Verified Deal", type: "text", page: "blocdetail", group: "Product Page", label: "Verified Badge Text" },
  { key: "bloc.regularLabel", value: "Regular", type: "text", page: "blocdetail", group: "Product Page", label: "Regular Price Label" },
  { key: "bloc.dblocLabel", value: "D-Bloc Price", type: "text", page: "blocdetail", group: "Product Page", label: "D-Bloc Price Label" },
  { key: "bloc.closingLabel", value: "Closing In", type: "text", page: "blocdetail", group: "Product Page", label: "Closing In Label" },
  { key: "bloc.hurryText", value: "Hurry — closes soon!", type: "text", page: "blocdetail", group: "Product Page", label: "Hurry Text" },
  { key: "bloc.participationLabel", value: "Current Participation", type: "text", page: "blocdetail", group: "Product Page", label: "Participation Label" },
  { key: "bloc.unlockLabel", value: "Unlock Progress", type: "text", page: "blocdetail", group: "Product Page", label: "Unlock Progress Label" },
  { key: "bloc.capacityLabel", value: "Capacity Status", type: "text", page: "blocdetail", group: "Product Page", label: "Capacity Label" },
  { key: "bloc.tiersTitle", value: "Pricing Tiers", type: "text", page: "blocdetail", group: "Product Page", label: "Pricing Tiers Title" },
  { key: "bloc.qtyLabel", value: "Select Quantity", type: "text", page: "blocdetail", group: "Product Page", label: "Quantity Label" },
  { key: "bloc.totalLabel", value: "Bloc Total", type: "text", page: "blocdetail", group: "Product Page", label: "Total Label" },
  { key: "bloc.recentTitle", value: "Recent Joins", type: "text", page: "blocdetail", group: "Product Page", label: "Recent Joins Title" },
  { key: "bloc.deliveryTitle", value: "Delivery", type: "text", page: "blocdetail", group: "Product Page", label: "Delivery Title" },
  { key: "bloc.deliveryNote", value: "🚚 Dhaka 1–2d · Outside 3–5d after dispatch", type: "text", page: "blocdetail", group: "Product Page", label: "Delivery Note" },
  { key: "bloc.featuresTitle", value: "Key Features", type: "text", page: "blocdetail", group: "Product Page", label: "Features Title" },
  { key: "bloc.featuresSubtitle", value: "Everything you get when you join this Bloc.", type: "text", page: "blocdetail", group: "Product Page", label: "Features Subtitle" },
  { key: "bloc.moreTitle", value: "More Deals For You", type: "text", page: "blocdetail", group: "Product Page", label: "More Deals Title" },
  { key: "bloc.moreSubtitle", value: "Join more Blocs & save bigger", type: "text", page: "blocdetail", group: "Product Page", label: "More Deals Subtitle" },

  // ---------- TRACK ORDER PAGE ----------
  { key: "track.title", value: "Track Your Order", type: "text", page: "trackorder", group: "Track Order Page", label: "Page Title" },
  { key: "track.subtitle", value: "Enter your Order ID or mobile number to see status", type: "text", page: "trackorder", group: "Track Order Page", label: "Page Subtitle" },
  { key: "track.placeholder", value: "Order ID (e.g. DB1A2B3C) or Mobile", type: "text", page: "trackorder", group: "Track Order Page", label: "Input Placeholder" },
  { key: "track.ctaText", value: "Track Order", type: "text", page: "trackorder", group: "Track Order Page", label: "Button Text" },

  // ---------- STATIC PAGES ----------
  { key: "page.about.title",    value: "About Us",         type: "text",     page: "about",    group: "About Us",       label: "Page Title" },
  { key: "page.about.body",     value: "D BLOC is Bangladesh's first group-buy e-commerce platform. We connect buyers together so everyone can access wholesale prices — no middleman, no markup. Our mission is to make quality products affordable for everyone.\n\nFounded in 2024, D BLOC has helped thousands of customers across Bangladesh save money on electronics, home goods, and more through the power of group buying.\n\nWe believe in transparency, fair pricing, and community. When we buy together, we all win.",
    type: "richtext", page: "about",    group: "About Us",       label: "Page Body" },

  { key: "page.helpcenter.title", value: "Help Center",    type: "text",     page: "helpcenter", group: "Help Center",  label: "Page Title" },
  { key: "page.helpcenter.body",  value: "Welcome to the D BLOC Help Center. Here you'll find answers to the most common questions.\n\n**How do I join a Bloc?**\nBrowse active Blocs, click \"Join This Bloc\", fill in your details and payment method. Your spot is reserved instantly.\n\n**How do I track my order?**\nGo to Track Order and enter your Order ID or mobile number.\n\n**When will my order be delivered?**\nDelivery happens after the Bloc closes and the batch is confirmed — usually within 5–7 business days.\n\n**Can I cancel my order?**\nOrders can be cancelled before the Bloc is confirmed. Contact us via WhatsApp or email for assistance.\n\n**Need more help?**\nCall our hotline 16633 or email support@dblock.bd — available 9AM–9PM every day.",
    type: "richtext", page: "helpcenter", group: "Help Center",  label: "Page Body" },

  { key: "page.refund.title",   value: "Refund Policy",   type: "text",     page: "refund",   group: "Refund Policy",  label: "Page Title" },
  { key: "page.refund.body",    value: "At D BLOC, we want you to be completely satisfied with your purchase.\n\n**Eligibility for Refund**\nRefunds are accepted within 7 days of delivery if the product is defective, damaged, or significantly different from the description.\n\n**Non-refundable Items**\nOpened electronics, perishables, and custom-order items are not eligible for refund.\n\n**How to Request a Refund**\n1. Contact us at support@dblock.bd with your Order ID and photos of the issue.\n2. Our team will review within 2 business days.\n3. Approved refunds are processed within 5–7 business days to your original payment method.\n\n**Exchanges**\nWe offer exchanges for defective products subject to stock availability.",
    type: "richtext", page: "refund",   group: "Refund Policy",  label: "Page Body" },

  { key: "page.delivery.title", value: "Delivery Info",   type: "text",     page: "delivery", group: "Delivery Info",  label: "Page Title" },
  { key: "page.delivery.body",  value: "D BLOC delivers across Bangladesh.\n\n**Delivery Timeline**\nOrders are dispatched after the Bloc closes and the full batch is confirmed. Standard delivery takes 5–7 business days from dispatch date.\n\n**Delivery Charges**\n- Dhaka City: ৳60 flat\n- Outside Dhaka: ৳120 flat\n- Free delivery on orders above ৳3,000\n\n**Delivery Partners**\nWe use Pathao, Steadfast, and our own logistics team to ensure reliable delivery.\n\n**Tracking Your Delivery**\nOnce dispatched, you'll receive an SMS with a tracking link. You can also track via our Track Order page using your Order ID or mobile number.\n\n**Failed Delivery**\nIf delivery fails 2 times, the order will be returned. Contact us to reschedule.",
    type: "richtext", page: "delivery", group: "Delivery Info",  label: "Page Body" },

  { key: "page.terms.title",    value: "Terms of Service", type: "text",    page: "terms",    group: "Terms of Service", label: "Page Title" },
  { key: "page.terms.body",     value: "By using D BLOC, you agree to the following terms.\n\n**1. Use of Service**\nD BLOC is a group-buy platform available to users aged 18 and above. You agree to provide accurate information when placing orders.\n\n**2. Orders & Payment**\nAll prices are in BDT. Payment must be completed at the time of joining a Bloc. Orders are binding once a Bloc closes.\n\n**3. Cancellations**\nCancellations are only accepted before a Bloc is confirmed. Once confirmed, the order cannot be cancelled.\n\n**4. Intellectual Property**\nAll content on D BLOC — including logos, images, and text — is the property of Digital Bloc BD.\n\n**5. Limitation of Liability**\nD BLOC is not responsible for delays caused by third-party logistics providers or circumstances beyond our control.\n\n**6. Changes to Terms**\nWe reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance.",
    type: "richtext", page: "terms",    group: "Terms of Service", label: "Page Body" },

  { key: "page.privacy.title",  value: "Privacy Policy",  type: "text",     page: "privacy",  group: "Privacy Policy", label: "Page Title" },
  { key: "page.privacy.body",   value: "Your privacy is important to us. This policy explains how D BLOC collects and uses your data.\n\n**What We Collect**\n- Name, email, mobile number, and delivery address when you place an order\n- Device and browser information for analytics\n- Payment transaction references (we do not store full card details)\n\n**How We Use Your Data**\n- To process and deliver your orders\n- To send order updates via SMS/email\n- To improve our platform and services\n\n**Data Sharing**\nWe do not sell your data. We share it only with delivery partners and payment processors as needed to fulfil your order.\n\n**Cookies**\nWe use essential cookies to keep you logged in and improve your experience. You can disable cookies in your browser settings.\n\n**Your Rights**\nYou may request access to, correction of, or deletion of your personal data by contacting support@dblock.bd.\n\n**Contact**\nFor privacy concerns: support@dblock.bd",
    type: "richtext", page: "privacy",  group: "Privacy Policy", label: "Page Body" },

  // ---------- JOIN / CHECKOUT MODAL ----------
  { key: "join.title", value: "Join This Bloc", type: "text", page: "global", group: "Join Modal", label: "Modal Title" },
  { key: "join.ctaText", value: "CREATE ACCOUNT AND JOIN BLOC", type: "text", page: "global", group: "Join Modal", label: "Submit Button Text" },
  { key: "join.detailCta", value: "JOIN THIS BLOC", type: "text", page: "global", group: "Join Modal", label: "Product Page Join Button" },
];
