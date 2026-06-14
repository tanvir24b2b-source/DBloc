import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";

import Layout from "./components/common/Layout.jsx";
import Home from "./pages/Home.jsx";
import AllBlocs from "./pages/AllBlocs.jsx";
import Categories from "./pages/Categories.jsx";
import BlocDetail from "./pages/BlocDetail.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import StaticPage from "./pages/StaticPage.jsx";
import Profile from "./pages/Profile.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import RequireAdmin from "./components/admin/RequireAdmin.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import ManageBlocs from "./pages/admin/ManageBlocs.jsx";
import ManageOrders from "./pages/admin/ManageOrders.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageCategories from "./pages/admin/ManageCategories.jsx";
import ManageProducts from "./pages/admin/ManageProducts.jsx";
import ProductEditor from "./pages/admin/ProductEditor.jsx";
import ManageStaff from "./pages/admin/ManageStaff.jsx";
import ManageSubscribers from "./pages/admin/ManageSubscribers.jsx";
import ManageBlocRequests from "./pages/admin/ManageBlocRequests.jsx";
import RequestBlocPage from "./pages/RequestBlocPage.jsx";
import ContentEditor from "./pages/admin/ContentEditor.jsx";
import SiteSettings from "./pages/admin/SiteSettings.jsx";
import ManageSEO from "./pages/admin/ManageSEO.jsx";
import ManagePaymentGateways from "./pages/admin/ManagePaymentGateways.jsx";
import ManageSms from "./pages/admin/ManageSms.jsx";
import ManageIntegrations from "./pages/admin/ManageIntegrations.jsx";
import ManageCouriers from "./pages/admin/ManageCouriers.jsx";

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => { fetchMe(); }, [fetchMe]);

  return (
    <Routes>
      {/* Storefront */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/blocs" element={<Navigate to="/categories" replace />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/blocs/:id" element={<BlocDetail />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/about" element={<StaticPage />} />
        <Route path="/help-center" element={<StaticPage />} />
        <Route path="/refund-policy" element={<StaticPage />} />
        <Route path="/delivery-info" element={<StaticPage />} />
        <Route path="/terms" element={<StaticPage />} />
        <Route path="/privacy-policy" element={<StaticPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/request-bloc" element={<RequestBlocPage />} />
      </Route>

      {/* Admin login — standalone, no layout, no auth guard */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

      {/* Admin panel — protected, staff only */}
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="blocs" element={<ManageBlocs />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="subscribers" element={<ManageSubscribers />} />
        <Route path="bloc-requests" element={<ManageBlocRequests />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="products/new" element={<ProductEditor />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="staff" element={<ManageStaff />} />
        <Route path="content" element={<ContentEditor />} />
        <Route path="settings" element={<SiteSettings />} />
        <Route path="seo" element={<ManageSEO />} />
        <Route path="payment-gateways" element={<ManagePaymentGateways />} />
        <Route path="couriers" element={<ManageCouriers />} />
        <Route path="sms" element={<ManageSms />} />
        <Route path="integrations" element={<ManageIntegrations />} />
      </Route>
    </Routes>
  );
}
