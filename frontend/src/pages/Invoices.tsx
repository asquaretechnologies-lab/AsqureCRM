import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, InvoiceItem, CustomerItem, ProductItem } from '../services/api';
import { exportToCSV } from '../utils/csvExport';
import {
  FileText,
  Building2,
  Plus,
  Search,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Trash2,
  Printer,
  Download,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // Create Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    discount: 0,
    notes: '',
    items: [
      { description: 'POS Software License & Installation Fee', quantity: 1, unitPrice: 12000, tax: 18 },
    ],
  });

  // Payment Form State
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
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchInvoices(pagination.page);
  }, [search, selectedStatus, pagination.page]);

  const fetchAuxiliaryData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getProducts(),
      ]);
      if (custRes.success) setCustomers(custRes.data.customers);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load auxiliary invoice data:', err);
    }
  };

  const fetchInvoices = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getInvoices({
        page,
        limit: pagination.limit,
        search,
        status: selectedStatus,
      });
      if (res.success) {
        setInvoices(res.data.invoices);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, tax: 18 }],
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    if (invoiceForm.items.length <= 1) return;
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...invoiceForm.items];
    (newItems[index] as any)[field] = value;
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createInvoice(invoiceForm);
      if (res.success) {
        setFormSuccess(`Invoice ${res.data.invoiceNumber} created successfully!`);
        setIsCreateOpen(false);
        fetchInvoices(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to generate invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewInvoice = async (id: string) => {
    try {
      const res = await api.getInvoice(id);
      if (res.success) {
        setSelectedInvoice(res.data);
        setIsViewOpen(true);
      }
    } catch (err) {
      console.error('Failed to load invoice detail:', err);
    }
  };

  const openPaymentModal = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: inv.balanceAmount,
      paymentMethod: 'UPI',
      referenceNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Payment received',
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
        customerId: selectedInvoice.customer.id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      });
      if (res.success) {
        setFormSuccess(res.message);
        setIsPaymentOpen(false);
        fetchInvoices(pagination.page);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations for create modal
  const calculatedSubtotal = invoiceForm.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const calculatedTax = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) * (item.tax / 100), 0);
  const calculatedTotal = calculatedSubtotal + calculatedTax - invoiceForm.discount;

  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balanceAmount, 0);

  const handleExportInvoices = () => {
    exportToCSV('asqurecrm_invoices', [
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'customer', label: 'Customer', formatter: (val) => val?.businessName || '' },
      { key: 'invoiceDate', label: 'Invoice Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' },
      { key: 'dueDate', label: 'Due Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' },
      { key: 'totalAmount', label: 'Total (₹)', formatter: (val) => Number(val || 0).toFixed(2) },
      { key: 'amountPaid', label: 'Paid (₹)', formatter: (val) => Number(val || 0).toFixed(2) },
      { key: 'balanceAmount', label: 'Balance Due (₹)', formatter: (val) => Number(val || 0).toFixed(2) },
      { key: 'status', label: 'Status' },
    ], invoices);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-brand-600" size={24} /> Finance & Invoicing Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate GST tax invoices, track payment status, record transaction receipts, and audit balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportInvoices}
            disabled={invoices.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => {
              const defaultCust = customers.length > 0 ? customers[0].id : '';
              setInvoiceForm({
                customerId: defaultCust,
                discount: 0,
                notes: 'Thank you for your business.',
                items: [{ description: 'POS Software License & Installation Fee', quantity: 1, unitPrice: 12000, tax: 18 }],
              });
              setFormError(null);
              setIsCreateOpen(true);
            }}
            className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
          >
            <Plus size={18} /> Create New Invoice
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

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Billed Revenue</span>
            <DollarSign size={18} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{totalBilled.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Payments Collected</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{totalPaid.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Balance</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Invoice Date</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3 text-right">Total Amount</th>
                <th className="px-5 py-3 text-right">Balance Due</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading billing records...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No invoices found</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-700">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <Link to={`/customers/${inv.customer.id}`} className="hover:text-brand-600 flex items-center gap-1">
                        <Building2 size={14} className="text-slate-400" /> {inv.customer.businessName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-700 text-xs">
                      ₹{inv.balanceAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'PARTIAL'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : inv.status === 'UNPAID'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openViewInvoice(inv.id)}
                        title="View Invoice Detail"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>
                      {inv.balanceAmount > 0 && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          title="Record Payment"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <CreditCard size={16} />
                        </button>
                      )}
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
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total invoices)
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

      {/* CREATE INVOICE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Generate GST Invoice</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer Company *</label>
                <select
                  required
                  value={invoiceForm.customerId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
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

              {/* Line Items Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase">Invoice Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
                      <input
                        type="text"
                        placeholder="Item Description"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center font-mono focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        required
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="number"
                        placeholder="Tax %"
                        value={item.tax}
                        onChange={(e) => handleItemChange(idx, 'tax', Number(e.target.value))}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center font-mono focus:outline-none focus:border-brand-500"
                      />
                      <span className="w-24 text-right font-mono font-bold text-slate-800">
                        ₹{(item.quantity * item.unitPrice * (1 + item.tax / 100)).toLocaleString('en-IN')}
                      </span>
                      {invoiceForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-right">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-mono font-semibold">₹{calculatedSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST Tax (18%):</span>
                  <span className="font-mono font-semibold">₹{calculatedTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-brand-700">₹{calculatedTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE DETAIL MODAL */}
      {isViewOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200">
                  {selectedInvoice.invoiceNumber}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedInvoice.customer.businessName}</h3>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px]">Billed To</p>
                <p className="font-bold text-slate-900 mt-1">{selectedInvoice.customer.businessName}</p>
                <p className="text-slate-600">{selectedInvoice.customer.customerCode}</p>
                {selectedInvoice.customer.phone && <p className="text-slate-500">{selectedInvoice.customer.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-slate-400 uppercase font-bold text-[10px]">Invoice Dates</p>
                <p className="text-slate-700 mt-1">Invoice Date: <strong>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</strong></p>
                <p className="text-slate-700">Due Date: <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</strong></p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Tax (GST)</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-sans font-medium text-slate-900">{it.description}</td>
                      <td className="p-3 text-center">{it.quantity}</td>
                      <td className="p-3 text-right">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">₹{it.tax.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{it.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-right font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Total Amount:</span>
                <span className="font-bold text-slate-900">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Amount Paid:</span>
                <span className="text-emerald-700 font-bold">₹{selectedInvoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold">
                <span className="font-sans text-slate-900">Balance Due:</span>
                <span className="text-rose-700">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <p className="font-bold text-slate-900">{selectedInvoice.customer.businessName}</p>
              <p className="font-mono text-brand-700 font-bold">{selectedInvoice.invoiceNumber}</p>
              <p className="text-slate-500">Balance Due: <strong className="text-rose-700">₹{selectedInvoice.balanceAmount.toLocaleString('en-IN')}</strong></p>
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
