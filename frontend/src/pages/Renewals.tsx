import React, { useState, useEffect } from 'react';
import { api, RenewalItem, ExpiringQueueItem } from '../services/api';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  Loader2,
  X,
  AlertCircle,
  History,
} from 'lucide-react';

export const RenewalsPage: React.FC = () => {
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [expiringQueue, setExpiringQueue] = useState<ExpiringQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpiringQueueItem | null>(null);
  const [renewAmount, setRenewAmount] = useState(12000);
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRenewalsData();
  }, []);

  const fetchRenewalsData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getRenewals();
      if (res.success) {
        setRenewals(res.data.renewals);
        setExpiringQueue(res.data.expiringQueue);
      }
    } catch (err) {
      console.error('Failed to load renewals data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewClick = (item: ExpiringQueueItem) => {
    setSelectedItem(item);
    setRenewAmount(item.planPrice || 12000);
    setNotes('Annual subscription renewal');
    setFormError(null);
    setIsRenewOpen(true);
  };

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.renewLicense({
        licenseId: selectedItem.id,
        amount: renewAmount,
        notes,
      });
      if (res.success) {
        setFormSuccess(res.message);
        setIsRenewOpen(false);
        fetchRenewalsData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to renew license');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRenewedRevenue = renewals.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className="text-brand-600" size={24} /> License Renewals & Expiring Queue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor client subscription licenses expiring in the next 60 days and process annual extensions.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {formSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* EXPIRING QUEUE SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-amber-600" size={20} /> Expiring Licenses Queue ({expiringQueue.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Subscriptions expiring within 60 days requiring follow-up.</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Days Remaining</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Product / Plan</th>
                <th className="px-5 py-3">Expiry Date</th>
                <th className="px-5 py-3 text-right">Renewal Price</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading queue...
                  </td>
                </tr>
              ) : expiringQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-xs font-medium">
                    ✨ No software licenses are expiring in the next 60 days!
                  </td>
                </tr>
              ) : (
                expiringQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          item.daysRemaining <= 7
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.daysRemaining <= 0 ? 'Expired Today' : `${item.daysRemaining} days left`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{item.customerName}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        {item.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {item.customerPhone}
                          </span>
                        )}
                        {item.customerEmail && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} /> {item.customerEmail}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-800">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-[11px] text-slate-400">{item.planName || 'Annual Plan'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{item.planPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRenewClick(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Renew Now
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENEWAL HISTORY LEDGER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="text-brand-600" size={20} /> Renewal Ledger & History ({renewals.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical ledger of extended subscriptions. Total revenue: <strong>₹{totalRenewedRevenue.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Renewal Date</th>
                <th className="px-5 py-3">License Key</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Old Expiry &rarr; New Expiry</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-right">Renewed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading renewal history...
                  </td>
                </tr>
              ) : renewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-xs">
                    No historical renewal transactions recorded.
                  </td>
                </tr>
              ) : (
                renewals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{new Date(r.renewalDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-700">{r.licenseKey}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.customerName}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {new Date(r.previousExpiryDate).toLocaleDateString()} &rarr;{' '}
                      <strong className="text-emerald-700">{new Date(r.newExpiryDate).toLocaleDateString()}</strong>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 text-xs">
                      ₹{r.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-500 font-medium">{r.renewedBy || 'System Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENEW MODAL */}
      {isRenewOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Process Renewal Extension</h3>
              <button onClick={() => setIsRenewOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedItem.customerName}</p>
              <p className="font-mono text-brand-700 font-bold">{selectedItem.licenseKey}</p>
              <p className="text-slate-500">Current Expiry: {new Date(selectedItem.expiryDate).toLocaleDateString()}</p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleConfirmRenewal} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Annual subscription renewal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRenewOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Renewal (+1 Year)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
