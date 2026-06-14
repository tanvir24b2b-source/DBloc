import { Router } from "express";
import * as auth from "../controllers/authController.js";
import * as bloc from "../controllers/blocController.js";
import * as order from "../controllers/orderController.js";
import * as category from "../controllers/categoryController.js";
import * as content from "../controllers/contentController.js";
import * as admin from "../controllers/adminController.js";
import * as subscriber from "../controllers/subscriberController.js";
import * as blocRequest from "../controllers/blocRequestController.js";
import * as seo from "../controllers/seoController.js";
import * as paymentGw from "../controllers/paymentGatewayController.js";
import * as smsCtrl from "../controllers/smsController.js";
import * as integrationCtrl from "../controllers/integrationController.js";
import { protect, isAdmin, isMasterAdmin } from "../middleware/auth.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";

const router = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const adminGuard = [protect, isAdmin];

// --- Auth ---
router.post("/auth/register", wrap(auth.register));
router.post("/auth/login", wrap(auth.login));
router.post("/auth/refresh", wrap(auth.refresh));
router.get("/auth/me", protect, wrap(auth.me));
router.post("/auth/logout", wrap(auth.logout));
router.put("/auth/profile", protect, wrap(auth.updateProfile));
router.post("/auth/forgot-password", wrap(auth.forgotPassword));

// --- Blocs ---
router.get("/blocs", wrap(bloc.listBlocs));
router.get("/blocs/:id", wrap(bloc.getBloc));
router.post("/blocs", adminGuard, wrap(bloc.createBloc));
router.put("/blocs/:id", adminGuard, wrap(bloc.updateBloc));
router.delete("/blocs/:id", adminGuard, wrap(bloc.deleteBloc));

// --- Categories ---
router.get("/categories", wrap(category.listCategories));
router.post("/categories", adminGuard, wrap(category.createCategory));
router.put("/categories/:id", adminGuard, wrap(category.updateCategory));
router.delete("/categories/:id", adminGuard, wrap(category.deleteCategory));

// --- Orders ---
router.post("/orders", wrap(order.placeOrder));
router.get("/orders/track", wrap(order.trackOrder));
router.get("/orders/my", protect, wrap(order.myOrders));
router.get("/orders/bloc/:blocId/recent", wrap(order.recentBlocOrders));
router.get("/orders", adminGuard, wrap(order.allOrders));
router.put("/orders/:id/status", adminGuard, wrap(order.updateOrderStatus));

// --- Bloc Requests ---
router.post("/bloc-requests", protect, wrap(blocRequest.submitRequest));
router.get("/bloc-requests", adminGuard, wrap(blocRequest.listRequests));
router.put("/bloc-requests/:id", adminGuard, wrap(blocRequest.updateRequestStatus));

// --- Subscribers (newsletter / notify) ---
router.post("/subscribers", wrap(subscriber.subscribe));
router.get("/subscribers", adminGuard, wrap(subscriber.listSubscribers));
router.delete("/subscribers/:id", adminGuard, wrap(subscriber.deleteSubscriber));

// --- Content / CMS ---
router.get("/content", wrap(content.getContent));
router.put("/content/:key", adminGuard, wrap(content.updateContentItem));
router.post("/content/bulk", adminGuard, wrap(content.bulkUpdateContent));
router.post("/content/seed", adminGuard, wrap(content.seedContent));

// --- SEO ---
router.get("/seo", wrap(seo.getSettings));
router.get("/seo/admin", adminGuard, wrap(seo.getSettingsAdmin));
router.put("/seo", adminGuard, wrap(seo.updateSettings));
router.post("/seo/mcp-token", adminGuard, wrap(seo.generateMcpToken));

// --- Payment Gateways ---
router.get("/payment-gateways", wrap(paymentGw.listPublic));
router.get("/admin/payment-gateways", adminGuard, wrap(paymentGw.listAdmin));
router.put("/admin/payment-gateways/:id", adminGuard, wrap(paymentGw.updateGateway));
router.post("/admin/payment-gateways", adminGuard, wrap(paymentGw.addGateway));

// --- SMS ---
router.get("/admin/sms", adminGuard, wrap(smsCtrl.getSettings));
router.put("/admin/sms", adminGuard, wrap(smsCtrl.updateSettings));
router.post("/admin/sms/test", adminGuard, wrap(smsCtrl.testSms));

// --- Integrations ---
router.get("/admin/integrations", adminGuard, wrap(integrationCtrl.list));
router.post("/admin/integrations", adminGuard, wrap(integrationCtrl.create));
router.put("/admin/integrations/:id", adminGuard, wrap(integrationCtrl.update));
router.delete("/admin/integrations/:id", adminGuard, wrap(integrationCtrl.remove));

// --- Admin ---
router.get("/admin/search", adminGuard, wrap(admin.globalSearch));
router.get("/admin/dashboard", adminGuard, wrap(admin.dashboard));
router.get("/admin/analytics", adminGuard, wrap(admin.analytics));
router.get("/admin/users", adminGuard, wrap(admin.listUsers));
router.get("/admin/customers", adminGuard, wrap(admin.listCustomers));
router.put("/admin/users/:id", adminGuard, wrap(admin.updateUser));

// --- Staff management (master_admin only) ---
const masterGuard = [protect, isMasterAdmin];
router.get("/admin/staff", masterGuard, wrap(admin.listStaff));
router.post("/admin/staff", masterGuard, wrap(admin.createStaff));
router.put("/admin/staff/:id", masterGuard, wrap(admin.updateStaff));
router.delete("/admin/staff/:id", masterGuard, wrap(admin.deleteStaff));
router.delete("/admin/orders/reset", masterGuard, wrap(async (req, res) => {
  await Order.deleteMany({});
  await Counter.deleteMany({ _id: "orderId" });
  res.json({ message: "All orders deleted, counter reset" });
}));

export default router;
