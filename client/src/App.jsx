import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";

import Layout from "./components/common/Layout.jsx";
import RequireAdmin from "./components/admin/RequireAdmin.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import LoadingScreen from "./components/common/LoadingScreen.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const AllBlocs = lazy(() => import("./pages/AllBlocs.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const BlocDetail = lazy(() => import("./pages/BlocDetail.jsx"));
const TrackOrder = lazy(() => import("./pages/TrackOrder.jsx"));
const StaticPage = lazy(() => import("./pages/StaticPage.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const RequestBlocPage = lazy(() => import("./pages/RequestBlocPage.jsx"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.jsx"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const ManageBlocs = lazy(() => import("./pages/admin/ManageBlocs.jsx"));
const ManageOrders = lazy(() => import("./pages/admin/ManageOrders.jsx"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers.jsx"));
const ManageCategories = lazy(() => import("./pages/admin/ManageCategories.jsx"));
const ManageProducts = lazy(() => import("./pages/admin/ManageProducts.jsx"));
const ProductEditor = lazy(() => import("./pages/admin/ProductEditor.jsx"));
const ManageStaff = lazy(() => import("./pages/admin/ManageStaff.jsx"));
const ManageSubscribers = lazy(() => import("./pages/admin/ManageSubscribers.jsx"));
const ManageBlocRequests = lazy(() => import("./pages/admin/ManageBlocRequests.jsx"));
const ContentEditor = lazy(() => import("./pages/admin/ContentEditor.jsx"));
const SiteSettings = lazy(() => import("./pages/admin/SiteSettings.jsx"));
const ManageSEO = lazy(() => import("./pages/admin/ManageSEO.jsx"));
const ManagePaymentGateways = lazy(() => import("./pages/admin/ManagePaymentGateways.jsx"));
const ManageSms = lazy(() => import("./pages/admin/ManageSms.jsx"));
const ManageEmail = lazy(() => import("./pages/admin/ManageEmail.jsx"));
const ManageIntegrations = lazy(() => import("./pages/admin/ManageIntegrations.jsx"));
const ManageCouriers = lazy(() => import("./pages/admin/ManageCouriers.jsx"));

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => { fetchMe(); }, [fetchMe]);

  return (
    <Suspense fallback={<LoadingScreen />}>
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
          <Route path="email" element={<ManageEmail />} />
          <Route path="integrations" element={<ManageIntegrations />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
