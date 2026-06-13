# D BLOC — Project Blueprint

## Concept
Bangladesh group-buy e-commerce platform. Users join "Blocs" (group-buy sessions) to unlock wholesale pricing. No middleman.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Payments | SSLCommerz, bKash, Cash on Delivery |
| Image Upload | Cloudinary |

---

## Design System

### Colors
```
Primary Orange:    #F97316   (CTAs, badges, accents, logo bg)
Orange Hover:      #EA6C0A
Dark Hero BG:      #111827   (hero section, dark navbar)
Light BG:          #F5F4F0   (page backgrounds, footer)
White:             #FFFFFF   (cards, modals)
Text Primary:      #1A1A1A
Text Secondary:    #6B7280
Border/Divider:    #E5E7EB
Success Green:     #22C55E
Countdown Red:     #EF4444
Progress Fill:     #F97316
Progress Track:    #E5E7EB
```

### Typography
- **Font Family:** Inter (Google Fonts)
- **Weights used:** 400
- **Scale (Tailwind):**
  - Hero headline: `text-4xl font-extrabold` (desktop) / `text-2xl` (mobile)
  - Section title: `text-2xl font-bold`
  - Card title: `text-base font-semibold`
  - Body: `text-sm font-normal`
  - Badge/label: `text-xs font-semibold uppercase tracking-wide`

### Component Patterns (from reference images)
- **Discount badge:** Orange pill, top-left of product card — `XX% OFF`
- **Countdown timer:** `HH:MM:SS` format, dark bg chip, red text on urgency
- **Progress bar:** Orange fill on light track — shows `XX% FULL` + `NNN SPOTS`
- **CTA Button:** Orange bg, white text, rounded-full, `JOIN THIS BLOC →`
- **Nav:** Dark bg, logo left, links center, search bar center-right, login right
- **Cards:** White bg, subtle shadow, image top, info bottom, join button full-width
- **Modal:** Center overlay, form fields: Name, Mobile, Email, Address, Password, Delivery

---

## Pages & Routes

### Frontend Routes

/                     Homepage
/blocs                All Blocs (listing + filter)
/categories           Category Page
/blocs/:id            Bloc Detail (product page)
/track-order          Track Order
/login                Auth — Login
/register             Auth — Register
/admin/*              Admin Panel (protected)
```

### Homepage Sections (in order, from reference)
1. **Navbar** — dark bg, logo, nav links, search, login
2. **Hero** — dark bg, headline "Buy Together, Save More.", sub-copy, countdown to next deal, CTA button, featured product card right
3. **Ticker/Marquee** — scrolling product names strip (orange bg)
4. **Active Blocs** — horizontal scroll card row with "VIEW ALL BLOCS" link
5. **How D Bloc Works** — step-by-step explainer section
6. **For You** — personalized/featured bloc recommendations
7. **Customer Reviews** — testimonials section
8. **Notify / Newsletter** — email capture strip
9. **Footer** — logo, tagline, social icons, 3-column links (Platform, Support, Contact), hotline number, copyright

---

## Key Business Logic

### Bloc (Group Buy Session)
```
- Each Bloc has: product, original_price, bloc_price, discount_%, max_spots, filled_spots, end_time
- Status: active | full | expired | completed
- Users "join" a Bloc → creates an Order linked to the Bloc
- When filled_spots >= max_spots → Bloc is FULL, no more joins
- When end_time passes → Bloc expires
- Progress = (filled_spots / max_spots) * 100
```

### Order Flow
```
1. User clicks "JOIN THIS BLOC"
2. Modal opens: fill Name, Mobile, Email, Address, Password (new users auto-register)
3. Select delivery type
4. Select payment: SSLCommerz | bKash | COD
5. Submit → create Order + decrement Bloc spots
6. User gets Order ID for tracking
```

### Track Order
```
- Input: Order ID or Mobile Number
- Returns: order status, product, delivery info
```

---

## API Structure (Express REST)

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Blocs
```
GET  /api/blocs              list (filter: category, status, sort)
GET  /api/blocs/:id          single bloc detail
POST /api/blocs              [admin] create
PUT  /api/blocs/:id          [admin] update
DEL  /api/blocs/:id          [admin] delete
```

### Categories
```
GET  /api/categories
POST /api/categories         [admin]
```

### Orders
```
POST /api/orders             place order (joins bloc)
GET  /api/orders/track       ?orderId= or ?mobile=
GET  /api/orders             [admin] all orders
GET  /api/orders/my          [user] own orders
PUT  /api/orders/:id/status  [admin] update status
```

### Payments
```
POST /api/payment/sslcommerz/init
POST /api/payment/sslcommerz/success   (webhook)
POST /api/payment/sslcommerz/fail
POST /api/payment/bkash/init
POST /api/payment/bkash/callback
```

### Admin
```
GET  /api/admin/dashboard    stats: total blocs, orders, revenue, active users
GET  /api/admin/users
PUT  /api/admin/users/:id
```

### Content / CMS
```
GET  /api/content            ?page= filter by page slug
PUT  /api/content/:key       [admin] update one content item
POST /api/content/bulk       [admin] update multiple items
POST /api/content/seed       [admin] seed default content (first-time setup)
```

---

## Folder Structure

### Frontend (`/client`)
```
src/
  assets/
  components/
    common/         Navbar, Footer, Button, Badge, CountdownTimer, ProgressBar
    home/           Hero, ActiveBlocs, HowItWorks, ForYou, Reviews, NotifyStrip
    bloc/           BlocCard, BlocDetail, JoinModal
    checkout/       CheckoutForm
    admin/          AdminSidebar, BlocForm, OrderTable, UserTable, ContentEditor, SiteSettingsForm
  pages/
    Home.jsx
    AllBlocs.jsx
    Categories.jsx
    BlocDetail.jsx
    TrackOrder.jsx
    Login.jsx
    Register.jsx
    admin/
      Dashboard.jsx
      ManageBlocs.jsx
      ManageOrders.jsx
      ManageUsers.jsx
      ContentEditor.jsx    ← edit all page text/images
      SiteSettings.jsx     ← edit site name, logo, contact, socials
  store/
    useAuthStore.js
    useBlocStore.js
    useCartStore.js
  hooks/
  lib/              axios instance, utils
  App.jsx
  main.jsx
```

### Backend (`/server`)
```
src/
  models/           User, Bloc, Order, Category, Payment, SiteContent
  routes/           auth, blocs, orders, categories, payment, admin, content
  controllers/
  middleware/       auth, isAdmin, errorHandler
  utils/            sslcommerz, bkash helpers
  config/           db.js, cloudinary.js
  index.js
```

---

## Admin Panel

Full admin with:
- Dashboard stats (active blocs, total orders, revenue, users)
- Manage Blocs (create/edit/delete, set timer, price, spots, category)
- Manage Orders (view, update status: pending → confirmed → shipped → delivered)
- Manage Users (view, ban/unban)
- Manage Categories
- **Site Settings** — edit site name, logo, tagline, contact info, social links anytime
- **Content Editor (CMS)** — edit every text/section on every page from admin, no code needed

---

## CMS / Content Editor (Admin)

All website content is stored in MongoDB (`SiteContent` collection) and fetched dynamically. Admin can edit everything from `/admin/content`.

### Data Model: `SiteContent`
```
{
  key: String,          // unique identifier e.g. "hero.headline"
  value: String,        // the actual content
  type: "text" | "image" | "richtext" | "url",
  page: String,         // "home" | "global" | "allblocs" | "trackorder" etc.
  label: String         // human-readable label shown in admin UI
}
```

### Site Settings (editable anytime)
```
site.name              → "D BLOC" (used in navbar, tab title, footer)
site.tagline           → "Bangladesh's group-buy platform..."
site.logo_url          → logo image
site.favicon_url
site.hotline           → "16633"
site.support_email     → "support@dblock.bd"
site.support_hours     → "9AM–9PM · Every day"
site.facebook_url
site.instagram_url
site.whatsapp_url
site.currency_symbol   → "৳"
```

### Homepage Content (editable)
```
hero.headline          → "Buy Together, Save More."
hero.subheadline       → "Wholesale price. No middleman."
hero.cta_text          → "BROWSE BLOCS"
hero.cta_url           → "/blocs"
hero.bg_color          → "#111827"
ticker.text            → comma-separated scrolling product names
howitworks.title       → "How D Bloc Works"
howitworks.step1_title / step1_desc
howitworks.step2_title / step2_desc
howitworks.step3_title / step3_desc
foryou.section_title   → "For You"
reviews.section_title  → "What Our Customers Say"
notify.headline        → notify/newsletter strip headline
notify.subtext
notify.cta_text        → "Notify Me"
footer.copyright       → "© 2025 Digital Bloc BD · All rights reserved"
footer.nav_col1_title  → "PLATFORM"
footer.nav_col2_title  → "SUPPORT"
footer.nav_col3_title  → "CONTACT"
```

### All Blocs Page Content
```
allblocs.page_title    → "All Blocs"
allblocs.empty_text    → "No active blocs right now."
```

### Track Order Page Content
```
trackorder.headline
trackorder.subtext
trackorder.input_placeholder
trackorder.cta_text
```

### API Endpoints for Content
```
GET  /api/content?page=home        fetch all content for a page
GET  /api/content?page=global      fetch site settings
PUT  /api/content/:key             [admin] update single content item
POST /api/content/bulk             [admin] update multiple items at once
```

### Admin Content Editor UI (`/admin/content`)

**Visual Page Editor — the page looks exactly like the live frontend.**

Flow:
1. Admin opens `/admin/content`
2. Left sidebar lists all pages: Global Settings, Homepage, All Blocs, Bloc Detail, Category, Track Order
3. Selecting a page renders the **full frontend page** inside an iframe (read-only preview mode)
4. Every editable text/image has a subtle highlight border on hover
5. Click any text → inline edit popover appears with a text input/textarea
6. "Save" on popover → PUT `/api/content/:key` → DB updated → iframe refreshes
7. Changes reflect on live site immediately (frontend fetches from DB, not hardcoded)

**Site Settings panel** (Global tab):
- Site name, tagline, logo upload, favicon, hotline, email, hours
- Social links (Facebook, Instagram, WhatsApp, Email)
- Currency symbol
- All changes propagate everywhere instantly

**Editable element types:**
- `text` — single line (headlines, button labels, nav items)
- `richtext` — multi-line with basic formatting (section descriptions)
- `image` — Cloudinary upload picker
- `url` — link targets
- `color` — color picker (for bg colors, accent swaps)

**Implementation approach:**
- Frontend wraps every CMS-driven text in `<EditableText keyName="hero.headline" />` component
- In normal mode: renders the text value
- In admin preview mode (iframe with `?editMode=true`): renders with click-to-edit overlay
- No full page reload needed — updates via React Query invalidation

---

## Environment Variables

### Server `.env`
```
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASS=
SSLCOMMERZ_IS_LIVE=false
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
CLIENT_URL=http://localhost:5173
```

### Client `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## Reference Images
All design references are in `Recource/`:
- `Homepage/` — Hero, mid sections, mobile views, footer
- `Product Page/` — Bloc detail page (6 screenshots)
- `All Bloc Page.PNG` — listing page
- `Catagory pAGE.PNG` — category filter page
- `Checkout Form.PNG` — join/order modal
- `Track order page.PNG` — order tracking UI

---

## Notes
- Currency: BDT (৳)
- Language: English UI (Bengali product names acceptable)
- Mobile-first design — all pages have mobile reference screenshots
- Hotline: 16633 | support@dblock.bd | 9AM–9PM daily
- Brand tagline: "Bangladesh's group-buy platform. Buy together, pay wholesale."
