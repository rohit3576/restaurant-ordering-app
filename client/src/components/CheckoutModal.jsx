import { X } from "lucide-react";

export default function CheckoutModal({
  open,
  cart,
  total,
  customerName,
  setCustomerName,
  tableNo,
  loading,
  onClose,
  onPlaceOrder
}) {
  if (!open) return null;
  const canPlaceOrder = cart.length > 0 && customerName.trim() && !loading;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 sm:place-items-center sm:p-4">
      <section className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-soft dark:bg-slate-900 sm:rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Confirm order</h2>
          <button aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 max-h-56 space-y-3 overflow-auto">
          {cart.map((item) => (
            <div key={item._id} className="flex items-center justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span className="font-semibold">Rs.{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          <label className="text-sm font-semibold">
            Your name
            <input className="input mt-1" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter name" />
          </label>
          <label className="text-sm font-semibold">
            Table
            <input className="input mt-1" value={tableNo} readOnly />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-lg font-bold">Rs.{total}</p>
          <button onClick={onPlaceOrder} disabled={!canPlaceOrder} className="btn-primary">
            {loading ? "Placing..." : "Place order"}
          </button>
        </div>
      </section>
    </div>
  );
}
