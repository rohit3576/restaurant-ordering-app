import { motion } from "framer-motion";

export default function CategoryTabs({ categories, active, onChange }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 overflow-x-auto border-b border-orange-100 bg-ember-50/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:mx-0 sm:rounded-lg sm:border">
      <div className="flex min-w-max gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === category
                ? "text-white"
                : "bg-white text-slate-700 hover:text-ember-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {active === category && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-ember-500"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative">{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
