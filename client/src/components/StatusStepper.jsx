import { CheckCircle2 } from "lucide-react";

const steps = ["pending", "preparing", "served"];
const labels = { pending: "Pending", preparing: "Preparing", served: "Served" };

export default function StatusStepper({ status }) {
  const activeIndex = steps.indexOf(status);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm font-bold text-ember-700 dark:bg-orange-950 dark:text-orange-200">
        Current status: {labels[status] || status}
      </div>
      {steps.map((step, index) => {
        const done = index <= activeIndex;
        return (
          <div key={step} className="flex items-center gap-3" aria-current={step === status ? "step" : undefined}>
            <span className={`grid h-10 w-10 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p className="font-bold">{labels[step]}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {step === "pending" && "Order received by the kitchen"}
                {step === "preparing" && "Your meal is being prepared"}
                {step === "served" && "Your order has been served"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
