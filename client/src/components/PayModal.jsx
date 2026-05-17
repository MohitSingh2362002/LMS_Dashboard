import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

/**
 * PayModal — shows a purchase confirmation dialog for a paid test.
 *
 * Props:
 *   test        – { _id, title, price }
 *   onClose     – called when modal is dismissed
 *   onPurchased – called with the test _id after a successful purchase
 */
const PayModal = ({ test, onClose, onPurchased }) => {
  const [paying, setPaying] = useState(false);

  // Promo code
  const [promoCode,    setPromoCode]    = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult,  setPromoResult]  = useState(null);  // { valid, discount, finalAmount, message }
  const [promoError,   setPromoError]   = useState("");

  const basePrice  = test.price ?? 0;
  const finalPrice = promoResult?.valid ? promoResult.finalAmount : basePrice;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const { data } = await api.post("/promo-codes/validate", {
        code:   promoCode.trim(),
        type:   "test",
        amount: basePrice,
      });
      setPromoResult(data);
    } catch (err) {
      setPromoError(err?.response?.data?.message ?? "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      await api.post(`/purchases/test/${test._id}`);
      // Increment promo usage after successful purchase
      if (promoResult?.valid && promoCode.trim()) {
        api.post("/promo-codes/apply", { code: promoCode.trim() }).catch(() => {});
      }
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

        {/* Price block */}
        <div className="mt-4 rounded-2xl bg-violet-50 border border-violet-100 p-4 text-center">
          {promoResult?.valid ? (
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-bold text-slate-400 line-through">₹{basePrice}</p>
              <p className="text-2xl font-extrabold text-emerald-600">₹{finalPrice}</p>
            </div>
          ) : (
            <p className="text-2xl font-extrabold text-violet-700">₹{basePrice}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-0.5">One-time purchase · Lifetime access</p>
          {promoResult?.valid && (
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">
              🎉 {promoResult.message}
            </p>
          )}
        </div>

        {/* Promo code input */}
        <div className="mt-3">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
            promoResult?.valid ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50"
          }`}>
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoResult(null);
                setPromoError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
              placeholder="Have a promo code?"
              className="flex-1 bg-transparent text-sm font-bold tracking-wider text-brand-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:opacity-40"
            >
              {promoLoading ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : "Apply"}
            </button>
          </div>
          {promoError && (
            <p className="mt-1.5 text-xs font-semibold text-red-500">{promoError}</p>
          )}
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
            {paying ? "Processing…" : `Pay ₹${finalPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayModal;
