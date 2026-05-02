import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChefHat, Menu, Moon, Sun, X } from "lucide-react";

export default function TopNav({ dark, onToggleTheme, tableNo, rightSlot }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const customerPath = tableNo ? `/menu?table=${tableNo}` : "/menu?table=1";
  const links = [
    { label: "Menu", to: customerPath },
    { label: "Admin", to: "/admin" }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/88 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to={customerPath} className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-ember-500 text-white shadow-soft">
            <ChefHat size={21} />
          </span>
          <span>
            Qrave
            {tableNo && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-ember-700 dark:bg-orange-950 dark:text-orange-200">Table {tableNo}</span>}
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                `${location.pathname}${location.search}` === link.to || (link.label === "Menu" && location.pathname === "/menu")
                  ? "bg-orange-100 text-ember-700 dark:bg-orange-950 dark:text-orange-200"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={onToggleTheme} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-ember-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {rightSlot}
        </div>

        <button onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-900 md:hidden" aria-label="Open menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-orange-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <div className="grid gap-2">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-orange-50 dark:hover:bg-slate-900">
                {link.label}
              </Link>
            ))}
            <button onClick={onToggleTheme} className="btn-secondary justify-start rounded-lg">
              {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? "Light mode" : "Dark mode"}
            </button>
            {rightSlot}
          </div>
        </div>
      )}
    </header>
  );
}
