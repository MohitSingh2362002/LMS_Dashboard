import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

/**
 * PayModal — shows a purchase confirmation dialog for a paid test.
 *
 * Props:
 *   test       – { _id, title, price }
 *   onClose    – called when modal is dismissed
 *   onPurchased – called with the test _id after a successful purchase
 */
const PayModal = ({ test, onClose, onPurchased }) => {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      await api.post(`/purchases/test/${test._id}`);
      toast.success("Purchase successful! Test is now unlocked.");
      onPurchased(test._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed. Try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel"
      >
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-violet-600">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3 className="text-center text-base font-extrabold text-brand-ink">Unlock This Test</h3>
        <p className="mt-1 text-center text-xs text-slate-500 line-clamp-2 px-2">{test.title}</p>

        {/* Price */}
        <div className="mt-4 rounded-2xl bg-violet-50 border border-violet-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-violet-700">₹{test.price}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">One-time purchase · Lifetime access</p>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
            Instant access after purchase
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
            Attempt unlimited times
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
            Auto-linked to your child's account (if you are a parent)
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={paying}
            className="rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 transition"
          >
            {paying ? "Processing…" : `Pay ₹${test.price}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayModal;
