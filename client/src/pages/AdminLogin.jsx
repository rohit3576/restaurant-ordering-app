import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LockKeyhole } from "lucide-react";
import api from "../services/api";
import TopNav from "../components/TopNav";

export default function AdminLogin({ dark, onToggleTheme }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@restaurant.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("adminToken", data.token);
      toast.success("Welcome back");
      navigate("/admin/dashboard");
    } catch {
      toast.error("Invalid login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ember-50 dark:bg-slate-950">
      <TopNav dark={dark} onToggleTheme={onToggleTheme} />
      <section className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10">
      <form onSubmit={login} className="panel w-full max-w-md p-6">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-orange-100 text-ember-700 dark:bg-orange-950 dark:text-orange-200">
          <LockKeyhole />
        </div>
        <h1 className="text-3xl font-black">Admin login</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage orders, menu items, and revenue from one place.</p>
        <div className="mt-6 grid gap-4">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button disabled={loading} className="btn-primary rounded-lg">{loading ? "Signing in..." : "Sign in"}</button>
        </div>
      </form>
      </section>
    </main>
  );
}
