import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Bell, ChefHat, IndianRupee, LogOut, Plus, ReceiptText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { socket } from "../services/socket";
import { useSocket } from "../hooks/useSocket";
import {
  deleteLocalMenuItem,
  getLocalAnalytics,
  getLocalMenu,
  getLocalOrders,
  saveLocalMenuItem,
  subscribeToLocalOrders,
  updateLocalOrderStatus
} from "../services/localStore";
import TopNav from "../components/TopNav";
import EmptyState from "../components/EmptyState";
import QrCodeGenerator from "../components/QrCodeGenerator";

const emptyForm = { name: "", price: "", category: "", image: "", description: "", isAvailable: true };

export default function AdminDashboard({ dark, onToggleTheme }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const loadLocalAdminData = useCallback(() => {
    setOrders(getLocalOrders());
    setAnalytics(getLocalAnalytics());
    setMenu(getLocalMenu(true));
    setOfflineMode(true);
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const [ordersRes, analyticsRes, menuRes] = await Promise.all([
        api.get("/orders"),
        api.get("/orders/analytics"),
        api.get("/menu/admin")
      ]);
      setOrders(ordersRes.data);
      setAnalytics(analyticsRes.data);
      setMenu(menuRes.data);
      setOfflineMode(false);
    } catch {
      loadLocalAdminData();
      toast("Using local demo admin data");
    } finally {
      setLoading(false);
    }
  }, [loadLocalAdminData]);

  useEffect(() => {
    loadAdminData();
    if (!socket.connected) socket.connect();
    socket.emit("join:admin");
    const rejoin = () => socket.emit("join:admin");
    socket.on("connect", rejoin);
    return () => socket.off("connect", rejoin);
  }, [loadAdminData]);

  useEffect(() => subscribeToLocalOrders(() => loadLocalAdminData()), [loadLocalAdminData]);

  useSocket(
    "order:new",
    useCallback((order) => {
      setOrders((current) => [order, ...current]);
      setAnalytics((current) => ({
        ...(current || {}),
        totalOrders: (current?.totalOrders || 0) + 1,
        revenue: (current?.revenue || 0) + order.total,
        pending: (current?.pending || 0) + 1
      }));
      playNotification();
      toast.success(`New order from table ${order.tableNo}`);
    }, [])
  );

  useSocket(
    "order:update",
    useCallback((order) => {
      setOrders((current) => current.map((item) => (item._id === order._id ? order : item)));
      loadAdminData();
    }, [loadAdminData])
  );

  const chartData = useMemo(
    () => [
      { name: "Pending", value: analytics?.pending || 0 },
      { name: "Preparing", value: analytics?.preparing || 0 },
      { name: "Served", value: analytics?.served || 0 }
    ],
    [analytics]
  );

  const updateStatus = async (orderId, status) => {
    try {
      if (offlineMode) {
        const data = updateLocalOrderStatus(orderId, status);
        setOrders((current) => current.map((order) => (order._id === orderId || order.id === orderId ? data : order)));
        setAnalytics(getLocalAnalytics());
        toast.success("Status updated");
        return;
      }
      const { data } = await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((current) => current.map((order) => (order._id === orderId ? data : order)));
      toast.success("Status updated");
    } catch {
      toast.error("Could not update status");
    }
  };

  const saveMenuItem = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.category.trim() || !form.image.trim() || Number(form.price) <= 0) {
      return toast.error("Please fill all menu fields with a valid price");
    }
    const payload = { ...form, price: Number(form.price) };
    try {
      if (offlineMode) {
        const data = saveLocalMenuItem(payload, editingId);
        setMenu(getLocalMenu(true));
        setForm(emptyForm);
        setEditingId(null);
        toast.success("Menu saved");
        return;
      }
      if (editingId) {
        const { data } = await api.patch(`/menu/${editingId}`, payload);
        setMenu((current) => current.map((item) => (item._id === editingId ? data : item)));
      } else {
        const { data } = await api.post("/menu", payload);
        setMenu((current) => [data, ...current]);
      }
      setForm(emptyForm);
      setEditingId(null);
      toast.success("Menu saved");
    } catch {
      toast.error("Could not save menu item");
    }
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setForm({ ...item, price: String(item.price) });
  };

  const deleteItem = async (id) => {
    try {
      if (offlineMode) {
        deleteLocalMenuItem(id);
        setMenu(getLocalMenu(true));
        toast.success("Item deleted");
        return;
      }
      await api.delete(`/menu/${id}`);
      setMenu((current) => current.filter((item) => item._id !== id));
      toast.success("Item deleted");
    } catch {
      toast.error("Could not delete item");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <TopNav dark={dark} onToggleTheme={onToggleTheme} rightSlot={<button onClick={logout} className="btn-secondary"><LogOut size={18} /> Logout</button>} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <header className="mb-6 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-ember-700 dark:text-orange-300">Kitchen command</p>
            <h1 className="text-3xl font-black">Admin dashboard</h1>
            {offlineMode && <p className="mt-2 text-sm font-semibold text-ember-700 dark:text-orange-300">LocalStorage demo mode is active.</p>}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Stat icon={<ReceiptText />} label="Orders" value={analytics?.totalOrders || 0} />
          <Stat icon={<IndianRupee />} label="Revenue" value={`Rs.${analytics?.revenue || 0}`} />
          <Stat icon={<ChefHat />} label="In kitchen" value={(analytics?.pending || 0) + (analytics?.preparing || 0)} />
          <Stat icon={<Bell />} label="Served" value={analytics?.served || 0} />
        </section>

        <div className="mt-6">
          <QrCodeGenerator />
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="text-ember-600" />
              <h2 className="text-xl font-bold">Order flow</h2>
            </div>
            <div className="grid h-64 grid-cols-3 items-end gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">
              {chartData.map((item) => {
                const max = Math.max(...chartData.map((entry) => entry.value), 1);
                const height = `${Math.max((item.value / max) * 100, item.value ? 12 : 4)}%`;
                return (
                  <div key={item.name} className="flex h-full flex-col justify-end gap-3">
                    <div className="flex flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-ember-500 transition-all duration-500"
                        style={{ height }}
                        title={`${item.name}: ${item.value}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black">{item.value}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={saveMenuItem} className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="text-ember-600" />
              <h2 className="text-xl font-bold">{editingId ? "Edit menu item" : "Add menu item"}</h2>
            </div>
            <div className="grid gap-3">
              <input required className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <input required className="input" type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input required className="input" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              <textarea className="input min-h-20" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
                Available
              </label>
              <button className="btn-primary rounded-lg">{editingId ? "Update item" : "Add item"}</button>
            </div>
          </form>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="panel overflow-hidden">
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <h2 className="text-xl font-bold">Live orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Time</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
              {loading ? (
                <tr><td className="p-4 text-slate-500" colSpan="6">Loading orders...</td></tr>
              ) : orders.length ? orders.map((order) => (
                    <tr key={order._id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-4 font-semibold">{order.customerName}</td>
                      <td className="p-4">{order.tableNo || order.table}</td>
                      <td className="p-4">{order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}</td>
                      <td className="p-4 font-bold">Rs.{order.total}</td>
                      <td className="p-4">{formatTime(order.createdAt || order.timestamp)}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {["pending", "preparing", "served"].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateStatus(order._id || order.id, status)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
                                order.status === status
                                  ? "bg-ember-500 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-orange-100 dark:bg-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td className="p-4" colSpan="6"><EmptyState title="No live orders" message="New customer orders will appear here instantly." /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <h2 className="text-xl font-bold">Menu manager</h2>
            </div>
            <div className="max-h-[580px] divide-y divide-slate-100 overflow-auto dark:divide-slate-800">
              {menu.length ? menu.map((item) => (
                <div key={item._id} className="flex gap-3 p-4">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.category} / Rs.{item.price}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => editItem(item)} className="btn-secondary px-3 py-1.5 text-xs">Edit</button>
                      <button onClick={() => deleteItem(item._id)} className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-950">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-4"><EmptyState title="No menu items" message="Add your first item to start accepting orders." /></div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatTime(value) {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function playNotification() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  } catch {
    // Browsers may block audio until the page has received user interaction.
  }
}

function Stat({ icon, label, value }) {
  return (
    <div className="panel p-4">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-orange-100 text-ember-700 dark:bg-orange-950 dark:text-orange-200">
        {icon}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
