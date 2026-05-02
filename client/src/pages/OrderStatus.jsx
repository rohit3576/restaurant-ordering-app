import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { socket } from "../services/socket";
import { useSocket } from "../hooks/useSocket";
import { getLocalOrderById, subscribeToLocalOrders } from "../services/localStore";
import StatusStepper from "../components/StatusStepper";
import TopNav from "../components/TopNav";

export default function OrderStatus({ dark, onToggleTheme }) {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${orderId}`)
      .then(({ data }) => setOrder(data))
      .catch(() => {
        const localOrder = getLocalOrderById(orderId);
        if (localOrder) setOrder(localOrder);
        else toast.error("Order not found");
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit("join:order", orderId);
    const rejoin = () => socket.emit("join:order", orderId);
    socket.on("connect", rejoin);
    return () => socket.off("connect", rejoin);
  }, [orderId]);

  useSocket(
    "order:update",
    useCallback((updated) => {
      if (String(updated._id) === String(orderId)) {
        setOrder(updated);
        toast.success(`Order is ${updated.status}`);
      }
    }, [orderId])
  );

  useEffect(
    () =>
      subscribeToLocalOrders(() => {
        const localOrder = getLocalOrderById(orderId);
        if (localOrder) setOrder(localOrder);
      }),
    [orderId]
  );

  if (loading) return <main className="grid min-h-screen place-items-center bg-ember-50 dark:bg-slate-950">Loading order...</main>;
  if (!order) return <main className="grid min-h-screen place-items-center bg-ember-50 dark:bg-slate-950">Order not found</main>;

  return (
    <main className="min-h-screen bg-ember-50 dark:bg-slate-950">
      <TopNav dark={dark} onToggleTheme={onToggleTheme} tableNo={order.tableNo} />
      <section className="mx-auto max-w-2xl px-4 py-8">
        <div className="panel p-5 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-ember-700 dark:text-orange-300">Table {order.tableNo || order.table}</p>
          <h1 className="mt-2 text-3xl font-black">Thanks, {order.customerName}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Your order is live. Keep this page open for kitchen updates.</p>

          <div className="mt-8">
            <StatusStepper status={order.status} />
          </div>

          <div className="mt-8 rounded-lg bg-orange-50 p-4 dark:bg-slate-950">
            {order.items.map((item) => (
              <div key={`${item.menuItem}-${item.name}`} className="flex justify-between py-2 text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span className="font-semibold">Rs.{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-orange-100 pt-3 text-lg font-bold dark:border-slate-800">
              <span>Total</span>
              <span>Rs.{order.total}</span>
            </div>
          </div>

          <Link to={`/menu?table=${order.tableNo || order.table}`} className="btn-secondary mt-6 w-full">Back to menu</Link>
        </div>
      </section>
    </main>
  );
}
