# D BLOC — Group-Buy E-commerce Platform

Bangladesh group-buy platform. Join "Blocs" to unlock wholesale prices.
**Fully editable** — every text/image on every page is editable from the admin panel.

> Stack: React 18 (Vite) · Tailwind CSS v4 · Node.js + Express · MongoDB · Zustand · React Query

See [CLAUDE.md](CLAUDE.md) for the full blueprint and design system.

---

## Quick Start (zero setup)

The server uses an **in-memory MongoDB** by default (`USE_MEMORY_DB=true` in `server/.env`),
so you don't need to install MongoDB. Data resets each time the server restarts, and it
**auto-seeds** sample blocs + content on startup.

Open **two terminals**:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server
npm install        # already done
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install        # already done
npm run dev
```

Then open **http://localhost:5173**.

### Admin login
- URL: http://localhost:5173/login
- Email: `admin@dblock.bd`
- Password: `admin123`

After login you get an **ADMIN** button in the navbar → `/admin`.

---

## Editing site content (the "edit everything" feature)

1. Log in as admin → **Admin → Content Editor**.
2. Pick a page in the sidebar (Homepage, All Blocs, etc.).
3. The real frontend page loads in a live preview. **Hover** any text → it highlights orange.
   **Click** it → an edit box opens. Save → the live site updates instantly.
4. For site name, logo, contact info, nav & footer → **Admin → Site Settings**.

All content lives in the `SiteContent` MongoDB collection and is rendered dynamically,
so nothing is hardcoded — you can rename the site or rewrite any page without touching code.

---

## Switching to a persistent database (production)

When you're ready to keep data permanently:

1. Create a free **MongoDB Atlas** cluster (or install MongoDB locally).
2. In `server/.env` set:
   ```
   USE_MEMORY_DB=false
   MONGO_URI=<your connection string>
   ```
3. Seed it once: `cd server && npm run seed`
4. Start as usual.

---

## Project structure

```
Dbloc/
├── client/   React + Vite + Tailwind frontend
├── server/   Express + MongoDB API
├── Recource/ Design reference screenshots
├── CLAUDE.md Full blueprint
└── README.md (this file)
```
