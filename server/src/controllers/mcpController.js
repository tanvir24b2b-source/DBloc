import { timingSafeEqual } from "crypto";
import SeoSettings from "../models/SeoSettings.js";
import Bloc from "../models/Bloc.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import SiteContent from "../models/SiteContent.js";

function timingSafeTokenCompare(stored, provided) {
  if (!stored || !provided) return false;
  try {
    const a = Buffer.from(stored);
    const b = Buffer.from(provided);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ── slug helper ───────────────────────────────────────────────────────────────
function toSlug(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
}

// ── price-tier calculator ─────────────────────────────────────────────────────
function calcTierPrice(tiers, quantity) {
  if (!tiers?.length) return null;
  for (const t of tiers) {
    const inRange = quantity >= t.min && (t.max === null || t.max === undefined || quantity <= t.max);
    if (inRange) return t.price;
  }
  return tiers[tiers.length - 1].price;
}

// ── auto SEO generator ────────────────────────────────────────────────────────
function generateSeoForBloc(bloc, brandName = "D BLOC") {
  const title = bloc.title || "";
  const desc = bloc.fullDescription || bloc.description || "";
  const price = bloc.blocPrice;
  const currency = "BDT";

  const metaTitle = `${title} | Group Buy at ৳${price} — ${brandName}`.slice(0, 60);
  const metaDescription = `Buy ${title} at wholesale price ৳${price} BDT on ${brandName}. ${desc.slice(0, 100).replace(/\n/g, " ")}`.slice(0, 160);
  const keywords = [
    title.toLowerCase(),
    "group buy bangladesh",
    "wholesale price",
    brandName.toLowerCase(),
    ...(bloc.tags || []).map((t) => t.toLowerCase()),
  ].filter(Boolean);

  const offers = [];
  if (bloc.priceTiers?.length) {
    for (const t of bloc.priceTiers) {
      if (!t.price) continue;
      offers.push({
        "@type": "Offer",
        price: t.price,
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        description: t.max ? `${t.min}–${t.max} units` : `${t.min}+ units`,
      });
    }
  } else {
    offers.push({
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: bloc.filledSpots >= bloc.maxSpots ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    });
  }

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: desc.slice(0, 500),
    image: bloc.image || undefined,
    sku: bloc.sku || undefined,
    brand: { "@type": "Brand", name: brandName },
    offers: offers.length === 1 ? offers[0] : { "@type": "AggregateOffer", lowPrice: Math.min(...offers.map((o) => o.price)), highPrice: Math.max(...offers.map((o) => o.price)), priceCurrency: currency, offerCount: offers.length, offers },
    ...(bloc.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: bloc.rating,
        reviewCount: bloc.reviewCount,
      },
    } : {}),
  };

  return { metaTitle, metaDescription, keywords, schemaMarkup };
}

const TOOLS = [
  // ── existing ────────────────────────────────────────────────────────────────
  {
    name: "get_seo_settings",
    description: "Read current site-wide SEO settings (title, description, keywords, analytics IDs)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_seo_settings",
    description: "Update site-wide SEO settings",
    inputSchema: {
      type: "object",
      properties: {
        siteTitle:       { type: "string", description: "Site title (max 60 chars)" },
        siteDescription: { type: "string", description: "Meta description (max 155 chars)" },
        siteKeywords:    { type: "string", description: "Comma-separated keywords" },
        ogImage:         { type: "string", description: "URL of OG image for social sharing" },
      },
    },
  },
  {
    name: "get_orders_report",
    description: "Get orders report with summary stats and recent orders list",
    inputSchema: {
      type: "object",
      properties: {
        limit:  { type: "number", description: "Number of recent orders to return (default 20)" },
        status: { type: "string", description: "Filter by status: pending, confirmed, shipped, delivered, cancelled" },
        days:   { type: "number", description: "Only show orders from last N days" },
      },
    },
  },
  {
    name: "get_site_stats",
    description: "Get dashboard stats: total orders, revenue, active blocs, top products",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_content",
    description: "Read website content items (text, headings, descriptions) for a page",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "string", description: "Page slug: home, global, allblocs, trackorder" },
      },
    },
  },
  {
    name: "update_content",
    description: "Update a website content item (text on a page)",
    inputSchema: {
      type: "object",
      required: ["key", "value"],
      properties: {
        key:   { type: "string", description: "Content key e.g. hero.headline" },
        value: { type: "string", description: "New value" },
      },
    },
  },

  // ── product management ───────────────────────────────────────────────────────
  {
    name: "list_products",
    description: "List products with optional filters and pagination",
    inputSchema: {
      type: "object",
      properties: {
        limit:    { type: "number", description: "Results per page (default 20, max 50)" },
        page:     { type: "number", description: "Page number (default 1)" },
        status:   { type: "string", description: "Filter: active | full | expired" },
        category: { type: "string", description: "Filter by category name" },
        featured: { type: "boolean", description: "Only featured products" },
        hidden:   { type: "boolean", description: "Include hidden products (default false)" },
        q:        { type: "string", description: "Search by title or tag" },
      },
    },
  },
  {
    name: "fetch_product_details",
    description: "Get full product details by ID, slug, or SKU",
    inputSchema: {
      type: "object",
      properties: {
        id:   { type: "string", description: "Product _id or slug" },
        sku:  { type: "string", description: "Product SKU" },
        name: { type: "string", description: "Partial product name search" },
      },
    },
  },
  {
    name: "add_product",
    description: "Create a new group-buy product (bloc) with full details, pricing, and SEO",
    inputSchema: {
      type: "object",
      required: ["title", "originalPrice", "blocPrice", "maxSpots", "endTime"],
      properties: {
        title:            { type: "string", description: "Product name" },
        slug:             { type: "string", description: "URL slug e.g. 'wireless-soundbar' (auto-generated if omitted)" },
        description:      { type: "string", description: "Short one-line description" },
        fullDescription:  { type: "string", description: "Full product description" },
        originalPrice:    { type: "number", description: "Original retail price in BDT" },
        blocPrice:        { type: "number", description: "D BLOC group-buy price in BDT" },
        pricingTiers:     { type: "array", description: "Tiered pricing [{min,max,price}]", items: { type: "object" } },
        maxSpots:         { type: "number", description: "Maximum order capacity" },
        goal:             { type: "number", description: "Minimum orders to unlock bloc price" },
        endTime:          { type: "string", description: "Deadline ISO 8601 e.g. 2026-07-01T23:59:59Z" },
        image:            { type: "string", description: "Main product image URL or base64" },
        gallery:          { type: "array", items: { type: "string" }, description: "Additional image URLs (max 5)" },
        categoryName:     { type: "string", description: "Category name to assign" },
        tags:             { type: "array", items: { type: "string" }, description: "Product tags" },
        sku:              { type: "string", description: "Product SKU" },
        featured:         { type: "boolean", description: "Mark as featured" },
        featuredSection:  { type: "string", description: "Featured section: hero | deals | homepage" },
        featuredPriority: { type: "number", description: "Display priority (lower = higher priority)" },
        featuredUntil:    { type: "string", description: "Featured expiry date ISO 8601" },
      },
    },
  },
  {
    name: "update_product",
    description: "Update an existing product by ID or slug",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id:               { type: "string", description: "Product _id or slug" },
        title:            { type: "string" },
        slug:             { type: "string" },
        description:      { type: "string" },
        fullDescription:  { type: "string" },
        originalPrice:    { type: "number" },
        blocPrice:        { type: "number" },
        pricingTiers:     { type: "array", items: { type: "object" } },
        maxSpots:         { type: "number" },
        endTime:          { type: "string" },
        image:            { type: "string" },
        gallery:          { type: "array", items: { type: "string" } },
        tags:             { type: "array", items: { type: "string" } },
        sku:              { type: "string" },
        featured:         { type: "boolean" },
        featuredSection:  { type: "string" },
        featuredPriority: { type: "number" },
        featuredUntil:    { type: "string" },
        hidden:           { type: "boolean" },
      },
    },
  },

  // ── tiered pricing ───────────────────────────────────────────────────────────
  {
    name: "set_block_pricing",
    description: "Set tiered pricing structure for a product",
    inputSchema: {
      type: "object",
      required: ["productId", "pricingTiers"],
      properties: {
        productId:    { type: "string", description: "Product _id or slug" },
        pricingTiers: {
          type: "array",
          description: "Pricing tiers [{blockMin, blockMax, price}]. Set blockMax to null for the last tier.",
          items: {
            type: "object",
            properties: {
              blockMin: { type: "number" },
              blockMax: { type: ["number", "null"] },
              price:    { type: "number" },
            },
          },
        },
        regularPrice: { type: "number", description: "Update originalPrice (optional)" },
        specialPrice: { type: "number", description: "Update blocPrice (optional)" },
      },
    },
  },
  {
    name: "get_block_pricing",
    description: "Get pricing tiers for a product and optionally calculate price for a given quantity",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string", description: "Product _id or slug" },
        quantity:  { type: "number", description: "Calculate price for this quantity" },
      },
    },
  },

  // ── featured products ────────────────────────────────────────────────────────
  {
    name: "set_featured_product",
    description: "Mark a product as featured with optional section, priority, and expiry date",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId:        { type: "string", description: "Product _id or slug" },
        section:          { type: "string", description: "Section: hero | deals | homepage (default: homepage)" },
        priority:         { type: "number", description: "Display priority, lower = shown first (default: 0)" },
        featuredUntil:    { type: "string", description: "ISO 8601 expiry date e.g. 2026-07-01" },
      },
    },
  },
  {
    name: "get_featured_products",
    description: "Get all currently featured products, optionally filtered by section",
    inputSchema: {
      type: "object",
      properties: {
        section:    { type: "string", description: "Filter by section: hero | deals | homepage" },
        activeOnly: { type: "boolean", description: "Only return products whose featuredUntil hasn't passed (default true)" },
      },
    },
  },
  {
    name: "remove_featured_product",
    description: "Remove featured status from a product",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string", description: "Product _id or slug" },
      },
    },
  },

  // ── per-product SEO ──────────────────────────────────────────────────────────
  {
    name: "set_product_seo",
    description: "Set SEO metadata for a product (meta title, description, keywords, OG, schema, slug)",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId:       { type: "string", description: "Product _id or slug" },
        metaTitle:       { type: "string", description: "Page title for search engines (max 60 chars)" },
        metaDescription: { type: "string", description: "Meta description (max 160 chars)" },
        keywords:        { type: "array", items: { type: "string" }, description: "SEO keywords" },
        slug:            { type: "string", description: "URL slug (updates the product's URL)" },
        ogImage:         { type: "string", description: "Open Graph image URL" },
        ogDescription:   { type: "string", description: "Open Graph description" },
        canonicalUrl:    { type: "string", description: "Canonical URL" },
        noindex:         { type: "boolean", description: "Exclude from search engines" },
        nofollow:        { type: "boolean", description: "nofollow directive" },
        schemaMarkup:    { type: "object", description: "Custom JSON-LD schema markup (auto-generated if omitted)" },
      },
    },
  },
  {
    name: "get_product_seo",
    description: "Get current SEO metadata for a product plus auto-generated suggestions",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string", description: "Product _id or slug" },
      },
    },
  },
  {
    name: "generate_seo_metadata",
    description: "Auto-generate SEO meta title, description, keywords, and JSON-LD schema for a product",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string", description: "Product _id or slug" },
        apply:     { type: "boolean", description: "Save the generated metadata to the product (default false)" },
      },
    },
  },
  {
    name: "optimize_product_seo",
    description: "Analyze a product's SEO and return actionable improvement suggestions",
    inputSchema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string", description: "Product _id or slug" },
      },
    },
  },

  // ── import from URL ──────────────────────────────────────────────────────────
  {
    name: "import_from_url",
    description: "Fetch a product page URL, extract name/description/price/images, and create the product in D BLOC",
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url:         { type: "string", description: "Full URL of the product page to import" },
        endTime:     { type: "string", description: "Bloc end date ISO 8601 (default: 7 days from now)" },
        maxSpots:    { type: "number", description: "Max order capacity (default: 100)" },
        categoryName:{ type: "string", description: "Category to assign" },
        dryRun:      { type: "boolean", description: "If true, return extracted data without creating the product" },
      },
    },
  },
];

// ── find bloc by id or slug ───────────────────────────────────────────────────
async function findBloc(idOrSlug) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  const bloc = isObjectId
    ? await Bloc.findById(idOrSlug)
    : await Bloc.findOne({ slug: idOrSlug });
  if (!bloc) throw new Error(`Product not found: ${idOrSlug}`);
  return bloc;
}

async function callTool(name, args) {
  switch (name) {

    // ── site SEO ──────────────────────────────────────────────────────────────
    case "get_seo_settings": {
      const seo = await SeoSettings.getSingleton();
      const d = seo.toObject();
      delete d.mcpToken;
      delete d.facebookCapiToken;
      return d;
    }

    case "update_seo_settings": {
      const seo = await SeoSettings.getSingleton();
      const allowed = ["siteTitle", "siteDescription", "siteKeywords", "ogImage"];
      allowed.forEach((k) => { if (args[k] !== undefined) seo[k] = args[k]; });
      await seo.save();
      return { updated: true };
    }

    // ── product listing ───────────────────────────────────────────────────────
    case "list_products": {
      const limit = Math.min(50, args.limit || 20);
      const page  = Math.max(1, args.page || 1);
      const skip  = (page - 1) * limit;
      const filter = {};
      if (!args.hidden) filter.hidden = { $ne: true };
      if (args.featured) filter.featured = true;
      if (args.q) {
        const safe = args.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
        filter.$or = [{ title: { $regex: safe, $options: "i" } }, { tags: { $regex: safe, $options: "i" } }];
      }
      if (args.category) {
        const cat = await Category.findOne({ name: { $regex: args.category, $options: "i" } });
        if (cat) filter.category = cat._id;
      }
      const [blocs, total] = await Promise.all([
        Bloc.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
          .populate("category", "name").select("-gallery -fullDescription -seo -reviews").lean(),
        Bloc.countDocuments(filter),
      ]);
      return {
        total, page, pages: Math.ceil(total / limit),
        products: blocs.map((b) => ({
          ...b,
          discount: b.originalPrice ? Math.round(((b.originalPrice - b.blocPrice) / b.originalPrice) * 100) : 0,
          spotsLeft: Math.max(0, b.maxSpots - b.filledSpots),
          category: b.category?.name || null,
        })),
      };
    }

    case "fetch_product_details": {
      let bloc;
      if (args.sku) {
        bloc = await Bloc.findOne({ sku: args.sku }).populate("category", "name").lean();
        if (!bloc) throw new Error(`No product with SKU: ${args.sku}`);
      } else if (args.id) {
        const isOid = /^[a-f\d]{24}$/i.test(args.id);
        bloc = await Bloc.findOne(isOid ? { _id: args.id } : { slug: args.id })
          .populate("category", "name").lean();
        if (!bloc) throw new Error(`Product not found: ${args.id}`);
      } else if (args.name) {
        const safe = args.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        bloc = await Bloc.findOne({ title: { $regex: safe, $options: "i" } })
          .populate("category", "name").lean();
        if (!bloc) throw new Error(`No product matching: ${args.name}`);
      } else {
        throw new Error("Provide id, sku, or name");
      }
      return bloc;
    }

    // ── create product ────────────────────────────────────────────────────────
    case "add_product": {
      const slug = args.slug ? toSlug(args.slug) : toSlug(args.title);
      const data = {
        title:            args.title,
        slug,
        description:      args.description || "",
        fullDescription:  args.fullDescription || "",
        originalPrice:    args.originalPrice,
        blocPrice:        args.blocPrice,
        priceTiers:       (args.pricingTiers || []).map((t) => ({ min: t.blockMin ?? t.min, max: t.blockMax ?? t.max ?? null, price: t.price })),
        maxSpots:         args.maxSpots,
        goal:             args.goal || Math.ceil(args.maxSpots * 0.5),
        endTime:          new Date(args.endTime),
        image:            args.image || "",
        gallery:          (args.gallery || []).slice(0, 5),
        tags:             args.tags || [],
        sku:              args.sku || "",
        featured:         args.featured || false,
        featuredSection:  args.featuredSection || "",
        featuredPriority: args.featuredPriority ?? 0,
        featuredUntil:    args.featuredUntil ? new Date(args.featuredUntil) : null,
      };
      if (args.categoryName) {
        const cat = await Category.findOne({ name: { $regex: args.categoryName, $options: "i" } });
        if (cat) data.category = cat._id;
      }
      const bloc = await Bloc.create(data);
      return { created: true, _id: bloc._id, slug: bloc.slug, title: bloc.title, url: `/blocs/${bloc.slug || bloc._id}` };
    }

    // ── update product ────────────────────────────────────────────────────────
    case "update_product": {
      const bloc = await findBloc(args.id);
      const allowed = ["title", "description", "fullDescription", "originalPrice", "blocPrice",
        "maxSpots", "goal", "endTime", "image", "gallery", "tags", "sku",
        "featured", "featuredSection", "featuredPriority", "featuredUntil", "hidden"];
      for (const k of allowed) {
        if (args[k] !== undefined) bloc[k] = args[k];
      }
      if (args.slug) bloc.slug = toSlug(args.slug);
      if (args.pricingTiers) {
        bloc.priceTiers = args.pricingTiers.map((t) => ({ min: t.blockMin ?? t.min, max: t.blockMax ?? t.max ?? null, price: t.price }));
      }
      await bloc.save();
      return { updated: true, _id: bloc._id, slug: bloc.slug, title: bloc.title };
    }

    // ── tiered pricing ────────────────────────────────────────────────────────
    case "set_block_pricing": {
      const bloc = await findBloc(args.productId);
      bloc.priceTiers = args.pricingTiers.map((t) => ({
        min:   t.blockMin  ?? t.min,
        max:   (t.blockMax ?? t.max) ?? null,
        price: t.price,
      }));
      if (args.regularPrice !== undefined) bloc.originalPrice = args.regularPrice;
      if (args.specialPrice  !== undefined) bloc.blocPrice     = args.specialPrice;
      await bloc.save();
      return { updated: true, productId: bloc._id, title: bloc.title, priceTiers: bloc.priceTiers };
    }

    case "get_block_pricing": {
      const bloc = await findBloc(args.productId);
      const result = {
        productId:    bloc._id,
        title:        bloc.title,
        regularPrice: bloc.originalPrice,
        blocPrice:    bloc.blocPrice,
        priceTiers:   bloc.priceTiers,
      };
      if (args.quantity !== undefined) {
        result.calculatedPrice = calcTierPrice(bloc.priceTiers, args.quantity) ?? bloc.blocPrice;
        result.quantity = args.quantity;
      }
      return result;
    }

    // ── featured products ─────────────────────────────────────────────────────
    case "set_featured_product": {
      const bloc = await findBloc(args.productId);
      bloc.featured         = true;
      bloc.featuredSection  = args.section  || "homepage";
      bloc.featuredPriority = args.priority ?? 0;
      bloc.featuredUntil    = args.featuredUntil ? new Date(args.featuredUntil) : null;
      await bloc.save();
      return { updated: true, productId: bloc._id, title: bloc.title, featuredSection: bloc.featuredSection, featuredUntil: bloc.featuredUntil };
    }

    case "get_featured_products": {
      const filter = { featured: true, hidden: { $ne: true } };
      if (args.section) filter.featuredSection = args.section;
      const activeOnly = args.activeOnly !== false;
      if (activeOnly) {
        filter.$or = [{ featuredUntil: null }, { featuredUntil: { $gt: new Date() } }];
      }
      const blocs = await Bloc.find(filter).sort({ featuredPriority: 1 })
        .populate("category", "name")
        .select("title slug image blocPrice originalPrice featuredSection featuredPriority featuredUntil endTime filledSpots maxSpots")
        .lean();
      return blocs;
    }

    case "remove_featured_product": {
      const bloc = await findBloc(args.productId);
      bloc.featured         = false;
      bloc.featuredSection  = "";
      bloc.featuredPriority = 0;
      bloc.featuredUntil    = null;
      await bloc.save();
      return { updated: true, productId: bloc._id, title: bloc.title, featured: false };
    }

    // ── per-product SEO ───────────────────────────────────────────────────────
    case "set_product_seo": {
      const bloc = await findBloc(args.productId);
      if (!bloc.seo) bloc.seo = {};
      const seoFields = ["metaTitle", "metaDescription", "keywords", "ogImage", "ogDescription", "canonicalUrl", "noindex", "nofollow", "schemaMarkup"];
      for (const k of seoFields) {
        if (args[k] !== undefined) bloc.seo[k] = args[k];
      }
      if (args.slug) bloc.slug = toSlug(args.slug);
      // If no schema provided, auto-generate
      if (!args.schemaMarkup && !bloc.seo.schemaMarkup) {
        bloc.seo.schemaMarkup = generateSeoForBloc(bloc).schemaMarkup;
      }
      bloc.markModified("seo");
      await bloc.save();
      return { updated: true, productId: bloc._id, title: bloc.title, seo: bloc.seo, slug: bloc.slug };
    }

    case "get_product_seo": {
      const bloc = await findBloc(args.productId);
      const current = bloc.seo || {};
      const suggested = generateSeoForBloc(bloc);
      return {
        productId: bloc._id,
        title:     bloc.title,
        slug:      bloc.slug,
        url:       `/blocs/${bloc.slug || bloc._id}`,
        current,
        suggested: {
          metaTitle:       suggested.metaTitle,
          metaDescription: suggested.metaDescription,
          keywords:        suggested.keywords,
          schemaMarkup:    suggested.schemaMarkup,
        },
      };
    }

    case "generate_seo_metadata": {
      const bloc = await findBloc(args.productId);
      const generated = generateSeoForBloc(bloc);
      if (args.apply) {
        bloc.seo = { ...bloc.seo, ...generated };
        bloc.markModified("seo");
        await bloc.save();
        return { applied: true, productId: bloc._id, title: bloc.title, seo: bloc.seo };
      }
      return { productId: bloc._id, title: bloc.title, generated };
    }

    case "optimize_product_seo": {
      const bloc = await findBloc(args.productId);
      const seo = bloc.seo || {};
      const suggestions = [];
      const score = { total: 0, max: 0 };

      function check(label, passed, tip) {
        score.max += 1;
        if (passed) score.total += 1;
        else suggestions.push({ field: label, tip });
      }

      check("metaTitle",       seo.metaTitle && seo.metaTitle.length >= 20 && seo.metaTitle.length <= 60, `Add a meta title between 20–60 characters. Suggested: "${generateSeoForBloc(bloc).metaTitle}"`);
      check("metaDescription", seo.metaDescription && seo.metaDescription.length >= 50 && seo.metaDescription.length <= 160, `Add a meta description 50–160 characters.`);
      check("keywords",        seo.keywords?.length >= 3, "Add at least 3 keywords.");
      check("slug",            bloc.slug && bloc.slug.length > 0 && !/[A-Z\s]/.test(bloc.slug), "Set a clean lowercase slug e.g. 'wireless-soundbar'.");
      check("image",           bloc.image && bloc.image.length > 0, "Product has no main image — add one for OG and schema.");
      check("ogImage",         seo.ogImage || bloc.image, "Set an ogImage for social sharing.");
      check("description",     bloc.fullDescription?.length >= 100, "Full description is too short (min 100 chars) — helps SEO and schema.");
      check("schemaMarkup",    seo.schemaMarkup != null, "No JSON-LD schema. Use generate_seo_metadata to auto-create one.");
      check("sku",             bloc.sku?.length > 0, "Add a SKU for better product schema and inventory tracking.");
      check("reviews",         bloc.reviewCount > 0 || bloc.reviews?.length > 0, "No reviews — AggregateRating in schema boosts CTR.");

      return {
        productId: bloc._id,
        title:     bloc.title,
        seoScore:  `${score.total}/${score.max}`,
        suggestions,
        quickFix:  suggestions.length > 0 ? "Call generate_seo_metadata with apply:true to auto-fill missing fields." : "SEO looks good! No critical issues found.",
      };
    }

    // ── import from URL ───────────────────────────────────────────────────────
    case "import_from_url": {
      let html;
      try {
        const resp = await fetch(args.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; DBloc-Bot/1.0)",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        html = await resp.text();
      } catch (err) {
        throw new Error(`Failed to fetch URL: ${err.message}`);
      }

      // Extract meta tags
      const getMeta = (name) => {
        const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
                || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
        return m?.[1] || "";
      };
      const getTitle = () => {
        const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return getMeta("og:title") || m?.[1]?.trim() || "";
      };
      const getImage = () => getMeta("og:image") || getMeta("twitter:image") || "";
      const getDesc  = () => getMeta("og:description") || getMeta("description") || "";
      const getPrice = () => {
        const m = html.match(/["']price["']\s*:\s*["']?([\d,\.]+)["']?/)
                || html.match(/৳\s*([\d,]+)/);
        return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
      };

      const extracted = {
        title:       getTitle().slice(0, 200),
        description: getDesc().slice(0, 500),
        image:       getImage(),
        price:       getPrice(),
        sourceUrl:   args.url,
      };

      if (args.dryRun) return { extracted };

      if (!extracted.title) throw new Error("Could not extract product title from the page.");

      const endTime = args.endTime ? new Date(args.endTime) : new Date(Date.now() + 7 * 86400000);
      const blocPrice = extracted.price || 0;
      const originalPrice = blocPrice ? Math.round(blocPrice * 1.3) : 0;

      const data = {
        title:          extracted.title,
        slug:           toSlug(extracted.title),
        description:    extracted.description.slice(0, 200),
        fullDescription:extracted.description,
        originalPrice,
        blocPrice,
        maxSpots:       args.maxSpots || 100,
        goal:           Math.ceil((args.maxSpots || 100) * 0.5),
        endTime,
        image:          extracted.image,
        tags:           [],
      };

      if (args.categoryName) {
        const cat = await Category.findOne({ name: { $regex: args.categoryName, $options: "i" } });
        if (cat) data.category = cat._id;
      }

      const bloc = await Bloc.create(data);
      const seoGenerated = generateSeoForBloc(bloc);
      bloc.seo = seoGenerated;
      bloc.markModified("seo");
      await bloc.save();

      return {
        created: true,
        _id:     bloc._id,
        slug:    bloc.slug,
        title:   bloc.title,
        url:     `/blocs/${bloc.slug || bloc._id}`,
        extracted,
        note:    "Prices may need manual adjustment. Review before publishing.",
      };
    }

    // ── orders & stats ────────────────────────────────────────────────────────
    case "get_orders_report": {
      const limit = Math.min(100, args.limit || 20);
      const filter = {};
      if (args.status) filter.status = args.status;
      if (args.days)   filter.createdAt = { $gte: new Date(Date.now() - args.days * 86400000) };

      const [orders, statusAgg, revenueAgg, topProducts] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).limit(limit)
          .populate("bloc", "title").select("orderId customerName mobile amount status paymentMethod quantity createdAt bloc").lean(),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } }]),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
        Order.aggregate([
          { $group: { _id: "$bloc", orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
          { $sort: { revenue: -1 } }, { $limit: 5 },
          { $lookup: { from: "blocs", localField: "_id", foreignField: "_id", as: "bloc" } },
          { $unwind: "$bloc" },
          { $project: { title: "$bloc.title", orders: 1, revenue: 1 } },
        ]),
      ]);

      const byStatus = {};
      statusAgg.forEach((s) => { byStatus[s._id] = { count: s.count, revenue: s.revenue }; });

      return {
        summary: { totalOrders: revenueAgg[0]?.count || 0, totalRevenue: revenueAgg[0]?.total || 0, byStatus },
        topProducts,
        recentOrders: orders,
      };
    }

    case "get_site_stats": {
      const [totalOrders, totalBlocs, activeBlocs, revenueAgg, todayOrders] = await Promise.all([
        Order.countDocuments(),
        Bloc.countDocuments(),
        Bloc.countDocuments({ endTime: { $gt: new Date() } }),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
        Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      ]);
      return { totalOrders, totalBlocs, activeBlocs, totalRevenue: revenueAgg[0]?.total || 0, todayOrders };
    }

    case "get_content": {
      const items = await SiteContent.find({ page: args.page || "home" }).select("key value label type").lean();
      return items;
    }

    case "update_content": {
      const existing = await SiteContent.findOne({ key: args.key });
      if (!existing) return { content: [{ type: "text", text: `Key "${args.key}" does not exist` }], isError: true };
      await SiteContent.findOneAndUpdate({ key: args.key }, { $set: { value: args.value } }, { new: true });
      return { updated: true, key: args.key };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function verifyToken(req) {
  const auth  = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return false;
  const seo = await SeoSettings.getSingleton();
  return timingSafeTokenCompare(seo.mcpToken, token);
}

export async function mcpHandler(req, res) {
  const ok = await verifyToken(req);
  if (!ok) return res.status(401).json({ error: "Unauthorized — invalid MCP token" });

  const body = req.body;
  const id   = body.id ?? null;

  try {
    if (body.method === "initialize") {
      return res.json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "dbloc-website", version: "2.0.0" },
        },
      });
    }
    if (body.method === "notifications/initialized") return res.status(204).end();
    if (body.method === "tools/list")  return res.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    if (body.method === "tools/call") {
      const { name, arguments: args = {} } = body.params;
      const result = await callTool(name, args);
      return res.json({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
      });
    }
    return res.status(400).json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  } catch (err) {
    const errMsg = process.env.NODE_ENV === "production" ? "Internal error" : err.message;
    return res.status(500).json({ jsonrpc: "2.0", id, error: { code: -32000, message: errMsg } });
  }
}
