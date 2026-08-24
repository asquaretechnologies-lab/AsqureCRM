import React, { useState, useEffect } from 'react';
import { api, UnpaidInvoiceItem } from '../services/api';
import {
  Clock,
  Building2,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  X,
} from 'lucide-react';

export const OutstandingPage: React.FC = () => {
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoiceItem[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<UnpaidInvoiceItem | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'UPI',
    referenceNumber: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    setIsLoading(true);
    try {
      const res = await api.getOutstanding();
      if (res.success) {
        setUnpaidInvoices(res.data.invoices);
        setTotalOutstanding(res.data.totalOutstanding);
      }
    } catch (err) {
      console.error('Failed to load outstanding ledgers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayClick = (inv: UnpaidInvoiceItem) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: inv.balanceAmount,
      paymentMethod: 'UPI',
      referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Payment collected against outstanding balance',
    });
    setFormError(null);
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createPayment({
        invoiceId: selectedInvoice.id,
        customerId: selectedInvoice.customerCode,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      });
      if (res.success) {
        setFormSuccess(res.message);
        setIsPaymentOpen(false);
        fetchOutstanding();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="text-amber-600" size={24} /> Outstanding Balances & Aging Ledgers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit customer accounts with unpaid invoices, overdue balances, and collection aging.
          </p>
        </div>
        <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-right">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Total Uncollected Balance</p>
          <p className="text-xl font-extrabold text-rose-700 font-mono">₹{totalOutstanding.toLocaleString('en-IN')}</p>
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

      {/* Outstanding Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Overdue Aging</th>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3 text-right">Invoice Amount</th>
                <th className="px-5 py-3 text-right">Amount Paid</th>
                <th className="px-5 py-3 text-right">Balance Due</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading outstanding ledgers...
                  </td>
                </tr>
              ) : unpaidInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-emerald-700 text-xs font-bold">
                    ✨ Fantastic news! There are zero outstanding or overdue balances!
                  </td>
                </tr>
              ) : (
                unpaidInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          inv.daysOverdue > 30
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : inv.daysOverdue > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {inv.daysOverdue > 0 ? `${inv.daysOverdue} days overdue` : 'Due Soon'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-700">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>
                        <p className="flex items-center gap-1">
                          <Building2 size={14} className="text-slate-400" /> {inv.customerName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-normal flex items-center gap-2 mt-0.5">
                          {inv.customerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} /> {inv.customerPhone}
                            </span>
                          )}
                          {inv.customerEmail && (
                            <span className="flex items-center gap-1">
                              <Mail size={10} /> {inv.customerEmail}
                            </span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-700 text-xs">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 text-xs">
                      ₹{inv.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-700 text-xs">
                      ₹{inv.balanceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handlePayClick(inv)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 ml-auto"
                      >
                        <CreditCard size={14} /> Record Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isPaymentOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record Payment Receipt</h3>
              <button onClick={() => setIsPaymentOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedInvoice.customerName}</p>
              <p className="font-mono text-brand-700 font-bold">{selectedInvoice.invoiceNumber}</p>
              <p className="text-slate-500">
                Balance Due: <strong className="text-rose-700">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</strong>
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    placeholder="TXN-880291"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Payment Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
