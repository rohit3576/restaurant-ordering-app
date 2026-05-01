import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function MenuCard({ item, quantity, onAdd, onRemove }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel overflow-hidden"
    >
      <div className="flex gap-3 p-3">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-28 w-28 shrink-0 rounded-lg object-cover sm:h-36 sm:w-40"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold leading-tight">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
            <p className="shrink-0 font-bold text-ember-700 dark:text-orange-300">Rs.{item.price}</p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-ember-700 dark:bg-orange-950 dark:text-orange-200">
              {item.category}
            </span>
            {quantity ? (
              <div className="flex items-center gap-3 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                <button aria-label="Remove item" onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-white">
                  <Minus size={16} />
                </button>
                <span className="w-5 text-center font-bold">{quantity}</span>
                <button aria-label="Add item" onClick={onAdd} className="grid h-8 w-8 place-items-center rounded-full bg-ember-500 text-white shadow-sm">
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <button onClick={onAdd} className="btn-primary px-3 py-2 text-sm">
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
