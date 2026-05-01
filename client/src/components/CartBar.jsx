import { ShoppingBag } from "lucide-react";

export default function CartBar({ count, total, onCheckout }) {
  if (!count) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100 bg-white/95 p-3 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:hidden">
      <button onClick={onCheckout} className="btn-primary w-full justify-between rounded-lg px-4">
        <span className="flex items-center gap-2">
          <ShoppingBag size={18} /> {count} items
        </span>
        <span>Checkout Rs.{total}</span>
      </button>
    </div>
  );
}
