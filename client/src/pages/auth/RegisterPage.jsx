import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created");
      navigate("/learner", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-xl rounded-[32px] bg-white p-8 shadow-panel">
        <h1 className="font-display text-4xl text-slate-900">Learner Registration</h1>
        <p className="mt-3 text-sm text-slate-500">Instructor accounts are created by admins. Learners can register here directly.</p>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="mt-6 w-full rounded-2xl bg-teal-700 px-4 py-3 font-medium text-white" disabled={loading}>
          {loading ? "Creating..." : "Create Learner Account"}
        </button>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-teal-700">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
