import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, PaymentItem, CustomerItem, InvoiceItem } from '../services/api';
import { exportToCSV } from '../utils/csvExport';
import {
  CreditCard,
  Building2,
  FileText,
  Search,
  Plus,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Download,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<InvoiceItem[]>([]);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    invoiceId: '',
    amount: 14160,
    paymentMethod: 'UPI',
    referenceNumber: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchPayments(pagination.page);
  }, [search, pagination.page]);

  useEffect(() => {
    if (paymentForm.customerId) {
      fetchUnpaidInvoicesForCustomer(paymentForm.customerId);
    } else {
      setCustomerInvoices([]);
    }
  }, [paymentForm.customerId]);

  const fetchAuxiliaryData = async () => {
    try {
      const res = await api.getCustomers({ limit: 100 });
      if (res.success) setCustomers(res.data.customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const fetchUnpaidInvoicesForCustomer = async (customerId: string) => {
    try {
      const res = await api.getInvoices({ customerId, status: 'UNPAID' });
      if (res.success) {
        setCustomerInvoices(res.data.invoices);
        if (res.data.invoices.length > 0) {
          setPaymentForm((prev) => ({
            ...prev,
            invoiceId: res.data.invoices[0].id,
            amount: res.data.invoices[0].balanceAmount,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load customer invoices:', err);
    }
  };

  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getPayments({
        page,
        limit: pagination.limit,
        search,
      });
      if (res.success) {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createPayment(paymentForm);
      if (res.success) {
        setFormSuccess(res.message);
        setIsRecordOpen(false);
        fetchPayments(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportPayments = () => {
    exportToCSV('asqurecrm_payments', [
      { key: 'receiptNumber', label: 'Receipt #' },
      { key: 'invoice', label: 'Invoice #', formatter: (val) => val?.invoiceNumber || '' },
      { key: 'customer', label: 'Customer', formatter: (val) => val?.businessName || '' },
      { key: 'paymentDate', label: 'Payment Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'referenceNumber', label: 'Reference #' },
      { key: 'amount', label: 'Amount (₹)', formatter: (val) => Number(val || 0).toFixed(2) },
      { key: 'collectedBy', label: 'Collected By' },
    ], payments);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="text-emerald-600" size={24} /> Payment Receipts & Collections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical transaction ledger of customer payments, bank transfers, UPI receipts, and reference tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPayments}
            disabled={payments.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => {
              const defaultCust = customers.length > 0 ? customers[0].id : '';
              setPaymentForm({
                customerId: defaultCust,
                invoiceId: '',
                amount: 14160,
                paymentMethod: 'UPI',
                referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                notes: 'Payment collected',
              });
              setFormError(null);
              setIsRecordOpen(true);
            }}
            className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
          >
            <Plus size={18} /> Record Payment Receipt
          </button>
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Payment Receipts</span>
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Amount Collected</span>
            <DollarSign size={18} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search receipt #, reference, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Receipt #</th>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Payment Date</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Reference #</th>
                <th className="px-5 py-3 text-right">Amount Collected</th>
                <th className="px-5 py-3 text-right">Collected By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading receipts...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No payment receipts found</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-emerald-700">{p.receiptNumber}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand-700">
                      {p.invoice?.invoiceNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {p.customer ? (
                        <Link to={`/customers/${p.customer.id}`} className="hover:text-brand-600 flex items-center gap-1">
                          <Building2 size={14} className="text-slate-400" /> {p.customer.businessName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{p.referenceNumber || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-700 text-xs">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-500 font-medium">
                      {p.collectedBy || 'Finance Desk'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total payment receipts)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isRecordOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record Payment Receipt</h3>
              <button onClick={() => setIsRecordOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Company *</label>
                <select
                  required
                  value={paymentForm.customerId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="" disabled>Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Invoice *</label>
                <select
                  required
                  value={paymentForm.invoiceId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="" disabled>Select Customer Invoice</option>
                  {customerInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} (Balance: ₹{inv.balanceAmount.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

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
                  onClick={() => setIsRecordOpen(false)}
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
