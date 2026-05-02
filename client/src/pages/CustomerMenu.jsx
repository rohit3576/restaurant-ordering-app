import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../services/api";
import { createLocalOrder, getLocalMenu } from "../services/localStore";
import CartBar from "../components/CartBar";
import CategoryTabs from "../components/CategoryTabs";
import CheckoutModal from "../components/CheckoutModal";
import MenuCard from "../components/MenuCard";
import SkeletonMenu from "../components/SkeletonMenu";
import TopNav from "../components/TopNav";
import EmptyState from "../components/EmptyState";

export default function CustomerMenu({ dark, onToggleTheme }) {
  const { tableNo } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const detectedTable = searchParams.get("table") || tableNo || localStorage.getItem("tableNo") || sessionStorage.getItem("tableNo") || "1";
  const normalizedTable = String(Math.max(Number(detectedTable) || 1, 1));
  const cartKey = `qrave_cart_table_${normalizedTable}`;
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || "{}");
    } catch {
      return {};
    }
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    localStorage.setItem("tableNo", normalizedTable);
    sessionStorage.setItem("tableNo", normalizedTable);
  }, [normalizedTable]);

  useEffect(() => {
    setCart(() => {
      try {
        return JSON.parse(localStorage.getItem(cartKey) || "{}");
      } catch {
        return {};
      }
    });
  }, [cartKey]);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  useEffect(() => {
    api
      .get("/menu")
      .then(({ data }) => setMenu(data))
      .catch(() => {
        setMenu(getLocalMenu());
        toast("Using offline demo menu");
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...new Set(menu.map((item) => item.category))], [menu]);
  const visibleMenu = activeCategory === "All" ? menu : menu.filter((item) => item.category === activeCategory);
  const cartItems = useMemo(
    () => Object.values(cart).map(({ item, quantity }) => ({ ...item, quantity })),
    [cart]
  );
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (item) => {
    setCart((current) => {
      const next = {
        ...current,
        [item._id]: { item, quantity: (current[item._id]?.quantity || 0) + 1 }
      };
      localStorage.setItem(cartKey, JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (item) => {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[item._id]?.quantity || 0) - 1;
      if (quantity <= 0) delete next[item._id];
      else next[item._id] = { item, quantity };
      localStorage.setItem(cartKey, JSON.stringify(next));
      return next;
    });
  };

  const placeOrder = async () => {
    if (!cartItems.length) return toast.error("Please add at least one item");
    if (!customerName.trim()) return toast.error("Please enter your name");
    if (placing) return;
    setPlacing(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        tableNo: normalizedTable,
        items: cartItems.map((item) => ({ menuItem: item._id, quantity: item.quantity }))
      };
      const { data } = await api.post("/orders", payload);
      localStorage.removeItem(cartKey);
      setCart({});
      toast.success("Order placed successfully");
      navigate(`/order/${data._id || data.id}`);
    } catch (error) {
      try {
        const order = createLocalOrder({
          customerName: customerName.trim(),
          tableNo: normalizedTable,
          items: cartItems.map((item) => ({ menuItem: item._id, quantity: item.quantity }))
        });
        localStorage.removeItem(cartKey);
        setCart({});
        toast.success("Order placed successfully");
        navigate(`/order/${order.id}`);
      } catch {
        toast.error(error.response?.data?.message || "Could not place order");
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="min-h-screen bg-ember-50 pb-24 dark:bg-slate-950">
      <TopNav dark={dark} onToggleTheme={onToggleTheme} tableNo={normalizedTable} />
      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <p className="text-sm font-bold uppercase tracking-wide text-ember-700 dark:text-orange-300">Table {normalizedTable}</p>
          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-5xl">Order fresh, right from your seat.</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Browse the live menu, add favorites, and track your order as the kitchen updates it.</p>
        </motion.div>

        {!loading && <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {loading ? (
            <div className="sm:col-span-2"><SkeletonMenu /></div>
          ) : visibleMenu.length ? (
            visibleMenu.map((item) => (
              <MenuCard
                key={item._id}
                item={item}
                quantity={cart[item._id]?.quantity || 0}
                onAdd={() => addItem(item)}
                onRemove={() => removeItem(item)}
              />
            ))
          ) : (
            <div className="sm:col-span-2">
              <EmptyState title="No items here yet" message="Try another category or ask the restaurant team to add menu items from the admin dashboard." />
            </div>
          )}
        </div>
      </section>

      <CartBar count={count} total={total} onCheckout={() => setCheckoutOpen(true)} />
      {count > 0 && (
        <div className="fixed bottom-5 right-5 z-40 hidden sm:block">
          <button onClick={() => setCheckoutOpen(true)} className="btn-primary rounded-lg px-5">
            Checkout {count} items / Rs.{total}
          </button>
        </div>
      )}
      <CheckoutModal
        open={checkoutOpen}
        cart={cartItems}
        total={total}
        tableNo={normalizedTable}
        customerName={customerName}
        setCustomerName={setCustomerName}
        loading={placing}
        onClose={() => setCheckoutOpen(false)}
        onPlaceOrder={placeOrder}
      />
    </main>
  );
}
