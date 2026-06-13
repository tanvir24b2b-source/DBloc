import SeoSettings from "../models/SeoSettings.js";
import Bloc from "../models/Bloc.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import SiteContent from "../models/SiteContent.js";

const TOOLS = [
  {
    name: "get_seo_settings",
    description: "Read current SEO settings (title, description, keywords, analytics IDs)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "update_seo_settings",
    description: "Update SEO settings for the website",
    inputSchema: {
      type: "object",
      properties: {
        siteTitle: { type: "string", description: "Site title (max 60 chars)" },
        siteDescription: { type: "string", description: "Meta description (max 155 chars)" },
        siteKeywords: { type: "string", description: "Comma-separated keywords" },
        ogImage: { type: "string", description: "URL of OG image for social sharing" },
      },
    },
  },
  {
    name: "list_products",
    description: "List all bloc (group-buy) products on the website",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results (default 20)" },
        status: { type: "string", description: "Filter by status: active, full, expired" },
      },
    },
  },
  {
    name: "create_product",
    description: "Create a new group-buy product (bloc) on the website",
    inputSchema: {
      type: "object",
      required: ["title", "originalPrice", "blocPrice", "maxSpots", "endTime"],
      properties: {
        title: { type: "string", description: "Product name" },
        description: { type: "string", description: "Short description shown on product cards" },
        fullDescription: { type: "string", description: "Full product description" },
        originalPrice: { type: "number", description: "Original retail price in BDT" },
        blocPrice: { type: "number", description: "D BLOC group-buy price in BDT" },
        maxSpots: { type: "number", description: "Maximum number of orders allowed" },
        goal: { type: "number", description: "Minimum orders to unlock the bloc price" },
        endTime: { type: "string", description: "Deadline ISO date string e.g. 2025-12-31T23:59:59Z" },
        image: { type: "string", description: "Product image URL" },
        tags: { type: "array", items: { type: "string" }, description: "Product tags" },
        featured: { type: "boolean", description: "Show on homepage featured section" },
        sku: { type: "string", description: "Product SKU" },
        categoryName: { type: "string", description: "Category name to assign (must exist)" },
      },
    },
  },
  {
    name: "update_product",
    description: "Update an existing product by its ID",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Product _id" },
        title: { type: "string" },
        description: { type: "string" },
        originalPrice: { type: "number" },
        blocPrice: { type: "number" },
        maxSpots: { type: "number" },
        endTime: { type: "string" },
        featured: { type: "boolean" },
        hidden: { type: "boolean", description: "Hide from storefront" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "get_orders_report",
    description: "Get orders report with summary stats and recent orders list",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of recent orders to return (default 20)" },
        status: { type: "string", description: "Filter by status: pending, confirmed, shipped, delivered, cancelled" },
        days: { type: "number", description: "Only show orders from last N days" },
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
        key: { type: "string", description: "Content key e.g. hero.headline" },
        value: { type: "string", description: "New value" },
      },
    },
  },
];

async function callTool(name, args) {
  switch (name) {

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

    case "list_products": {
      const limit = Math.min(50, args.limit || 20);
      const filter = {};
      if (args.status) filter.status = args.status;
      const blocs = await Bloc.find(filter)
        .limit(limit)
        .populate("category", "name")
        .select("title description blocPrice originalPrice filledSpots maxSpots endTime featured hidden tags sku")
        .lean();
      return blocs.map((b) => ({
        ...b,
        discount: b.originalPrice ? Math.round(((b.originalPrice - b.blocPrice) / b.originalPrice) * 100) : 0,
        spotsLeft: Math.max(0, b.maxSpots - b.filledSpots),
        category: b.category?.name || null,
      }));
    }

    case "create_product": {
      const data = {
        title: args.title,
        description: args.description || "",
        fullDescription: args.fullDescription || "",
        originalPrice: args.originalPrice,
        blocPrice: args.blocPrice,
        maxSpots: args.maxSpots,
        goal: args.goal || Math.ceil(args.maxSpots * 0.5),
        endTime: new Date(args.endTime),
        image: args.image || "",
        tags: args.tags || [],
        featured: args.featured || false,
        sku: args.sku || "",
      };
      if (args.categoryName) {
        const cat = await Category.findOne({ name: { $regex: args.categoryName, $options: "i" } });
        if (cat) data.category = cat._id;
      }
      const bloc = await Bloc.create(data);
      return { created: true, _id: bloc._id, title: bloc.title };
    }

    case "update_product": {
      const { id, ...rest } = args;
      const allowed = ["title", "description", "fullDescription", "originalPrice", "blocPrice", "maxSpots", "goal", "endTime", "featured", "hidden", "tags", "image", "sku"];
      const update = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)));
      const bloc = await Bloc.findByIdAndUpdate(id, update, { new: true });
      if (!bloc) throw new Error(`Product not found: ${id}`);
      return { updated: true, _id: bloc._id, title: bloc.title };
    }

    case "get_orders_report": {
      const limit = Math.min(100, args.limit || 20);
      const filter = {};
      if (args.status) filter.status = args.status;
      if (args.days) filter.createdAt = { $gte: new Date(Date.now() - args.days * 86400000) };

      const [orders, statusAgg, revenueAgg, topProducts] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .populate("bloc", "title")
          .select("orderId customerName mobile amount status paymentMethod quantity createdAt bloc")
          .lean(),
        Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$amount" } } }]),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
        Order.aggregate([
          { $group: { _id: "$bloc", orders: { $sum: 1 }, revenue: { $sum: "$amount" } } },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
          { $lookup: { from: "blocs", localField: "_id", foreignField: "_id", as: "bloc" } },
          { $unwind: "$bloc" },
          { $project: { title: "$bloc.title", orders: 1, revenue: 1 } },
        ]),
      ]);

      const byStatus = {};
      statusAgg.forEach((s) => { byStatus[s._id] = { count: s.count, revenue: s.revenue }; });

      return {
        summary: {
          totalOrders: revenueAgg[0]?.count || 0,
          totalRevenue: revenueAgg[0]?.total || 0,
          byStatus,
        },
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
      await SiteContent.findOneAndUpdate({ key: args.key }, { value: args.value }, { upsert: true });
      return { updated: true, key: args.key };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function verifyToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return false;
  const seo = await SeoSettings.getSingleton();
  return seo.mcpToken && seo.mcpToken === token;
}

export async function mcpHandler(req, res) {
  const ok = await verifyToken(req);
  if (!ok) return res.status(401).json({ error: "Unauthorized — invalid MCP token" });

  const body = req.body;
  const id = body.id ?? null;

  try {
    if (body.method === "initialize") {
      return res.json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "dbloc-website", version: "1.0.0" },
        },
      });
    }
    if (body.method === "notifications/initialized") return res.status(204).end();
    if (body.method === "tools/list") return res.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
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
    return res.status(500).json({ jsonrpc: "2.0", id, error: { code: -32000, message: err.message } });
  }
}
