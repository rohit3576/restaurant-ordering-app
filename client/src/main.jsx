import React, { Suspense, lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./styles.css";

const CustomerMenu = lazy(() => import("./pages/CustomerMenu.jsx"));
const OrderStatus = lazy(() => import("./pages/OrderStatus.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));

function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <Router>
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-ember-50 text-slate-700 dark:bg-slate-950 dark:text-white">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/menu?table=1" replace />} />
          <Route path="/menu" element={<CustomerMenu dark={dark} onToggleTheme={() => setDark((value) => !value)} />} />
          <Route path="/table/:tableNo" element={<CustomerMenu dark={dark} onToggleTheme={() => setDark((value) => !value)} />} />
          <Route path="/order/:orderId" element={<OrderStatus dark={dark} onToggleTheme={() => setDark((value) => !value)} />} />
          <Route path="/admin" element={<AdminLogin dark={dark} onToggleTheme={() => setDark((value) => !value)} />} />
          <Route path="/admin/dashboard" element={<AdminDashboard dark={dark} onToggleTheme={() => setDark((value) => !value)} />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
