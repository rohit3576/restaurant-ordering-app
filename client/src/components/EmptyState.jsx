import { Sparkles } from "lucide-react";

export default function EmptyState({ title, message, action }) {
  return (
    <div className="panel grid place-items-center p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-100 text-ember-700 dark:bg-orange-950 dark:text-orange-200">
        <Sparkles size={22} />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
