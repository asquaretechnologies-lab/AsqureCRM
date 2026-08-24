import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, LicenseItem, CustomerItem, ProductItem, InstallationItem } from '../services/api';
import { exportToCSV } from '../utils/csvExport';
import {
  KeyRound,
  Building2,
  MonitorCheck,
  Package,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Download,
} from 'lucide-react';

export const LicensesPage: React.FC = () => {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customerInstallations, setCustomerInstallations] = useState<InstallationItem[]>([]);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseItem | null>(null);

  // Issue Form
  const [issueForm, setIssueForm] = useState({
    customerId: '',
    installationId: '',
    productId: '',
    planId: '',
    terminalCount: 1,
    price: 12000,
    discount: 0,
    notes: '',
  });

  // Renew Form
  const [renewForm, setRenewForm] = useState({
    amount: 12000,
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchLicenses(pagination.page);
  }, [search, selectedProduct, selectedStatus, pagination.page]);

  useEffect(() => {
    if (issueForm.customerId) {
      fetchInstallationsForCustomer(issueForm.customerId);
    } else {
      setCustomerInstallations([]);
    }
  }, [issueForm.customerId]);

  const fetchAuxiliaryData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getProducts(),
      ]);
      if (custRes.success) setCustomers(custRes.data.customers);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load auxiliary license data:', err);
    }
  };

  const fetchInstallationsForCustomer = async (customerId: string) => {
    try {
      const res = await api.getInstallations({ customerId });
      if (res.success) {
        setCustomerInstallations(res.data.installations);
        if (res.data.installations.length > 0) {
          setIssueForm((prev) => ({ ...prev, installationId: res.data.installations[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load customer installations:', err);
    }
  };

  const fetchLicenses = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getLicenses({
        page,
        limit: pagination.limit,
        search,
        productId: selectedProduct,
        status: selectedStatus,
      });
      if (res.success) {
        setLicenses(res.data.licenses);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load licenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.issueLicense(issueForm);
      if (res.success) {
        setFormSuccess(`Serial License Key issued: ${res.data.licenseKey}`);
        setIsIssueOpen(false);
        fetchLicenses(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to issue license');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.renewLicense({
        licenseId: selectedLicense.id,
        amount: renewForm.amount,
        notes: renewForm.notes,
      });
      if (res.success) {
        setFormSuccess(res.message);
        setIsRenewOpen(false);
        fetchLicenses(pagination.page);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to renew license');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRenewModal = (lic: LicenseItem) => {
    setSelectedLicense(lic);
    setRenewForm({
      amount: lic.plan ? lic.plan.price : lic.price || 12000,
      notes: 'Annual license extension',
    });
    setFormError(null);
    setIsRenewOpen(true);
  };

  const handleStatusChange = async (lic: LicenseItem, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to change status of ${lic.licenseNumber} to ${newStatus}?`)) return;
    try {
      const res = await api.updateLicenseStatus(lic.id, newStatus, `Manual action by admin`);
      if (res.success) {
        setFormSuccess(res.message);
        fetchLicenses(pagination.page);
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const activeCount = licenses.filter((l) => l.status === 'ACTIVE').length;
  const expiringSoonCount = licenses.filter((l) => l.status === 'EXPIRING_SOON').length;
  const expiredCount = licenses.filter((l) => l.status === 'EXPIRED').length;

  const handleExportLicenses = () => {
    exportToCSV('asqurecrm_licenses', [
      { key: 'licenseNumber', label: 'License #' },
      { key: 'licenseKey', label: 'Serial Key' },
      { key: 'customer', label: 'Customer', formatter: (val) => val?.businessName || '' },
      { key: 'product', label: 'Product', formatter: (val) => val?.name || '' },
      { key: 'plan', label: 'Plan', formatter: (val) => val?.name || '' },
      { key: 'startDate', label: 'Start Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' },
      { key: 'expiryDate', label: 'Expiry Date', formatter: (val) => val ? new Date(val).toLocaleDateString() : '' },
      { key: 'totalAmount', label: 'Amount (₹)', formatter: (val) => Number(val || 0).toFixed(2) },
      { key: 'status', label: 'Status' },
    ], licenses);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="text-sky-600" size={24} /> Serial License Keys & Subscriptions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue cryptographically signed serial keys, manage annual license terms, and extend subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLicenses}
            disabled={licenses.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => {
              const defaultCust = customers.length > 0 ? customers[0].id : '';
              const defaultProd = products.length > 0 ? products[0].id : '';
              const defaultPlan = products.length > 0 && products[0].plans.length > 0 ? products[0].plans[0].id : '';
              const defaultPrice = products.length > 0 && products[0].plans.length > 0 ? products[0].plans[0].price : 12000;

              setIssueForm({
                customerId: defaultCust,
                installationId: '',
                productId: defaultProd,
                planId: defaultPlan,
                terminalCount: 1,
                price: defaultPrice,
                discount: 0,
                notes: '',
              });
              setFormError(null);
              setIsIssueOpen(true);
            }}
            className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
          >
            <Plus size={18} /> Issue New Serial Key
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Serial Keys</span>
            <KeyRound size={18} className="text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Keys</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expiring (30 Days)</span>
            <Clock size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{expiringSoonCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expired Keys</span>
            <Ban size={18} className="text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{expiredCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search key, license #, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Product Filter */}
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRING_SOON">EXPIRING SOON</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REVOKED">REVOKED</option>
          </select>
        </div>
      </div>

      {/* Licenses Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">License #</th>
                <th className="px-5 py-3">Serial Key String</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Product / Plan</th>
                <th className="px-5 py-3">Expiry Date</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading serial keys...
                  </td>
                </tr>
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No licenses found</p>
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">{lic.licenseNumber}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200/80">
                          {lic.licenseKey}
                        </span>
                        <button
                          onClick={() => handleCopyKey(lic.licenseKey)}
                          title="Copy Serial Key"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                        >
                          {copiedKey === lic.licenseKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <Link to={`/customers/${lic.customer.id}`} className="hover:text-brand-600 flex items-center gap-1">
                        <Building2 size={14} className="text-slate-400" /> {lic.customer.businessName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-800">
                      <p className="font-semibold">{lic.product?.name}</p>
                      <p className="text-[11px] text-slate-400">{lic.plan?.name || 'Annual Plan'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                      {new Date(lic.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{lic.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          lic.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : lic.status === 'EXPIRING_SOON'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : lic.status === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openRenewModal(lic)}
                        title="Renew Subscription"
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <RefreshCw size={16} />
                      </button>
                      {lic.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(lic, 'REVOKED')}
                          title="Revoke License Key"
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Ban size={16} />
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
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total serial keys)
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

      {/* ISSUE LICENSE MODAL */}
      {isIssueOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Issue Serial License Key</h3>
              <button onClick={() => setIsIssueOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleIssueLicense} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Company *</label>
                <select
                  required
                  value={issueForm.customerId}
                  onChange={(e) => setIssueForm({ ...issueForm, customerId: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">POS Installation *</label>
                <select
                  required
                  value={issueForm.installationId}
                  onChange={(e) => setIssueForm({ ...issueForm, installationId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="" disabled>Select Installation</option>
                  {customerInstallations.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.installationNumber} ({ins.outlet?.outletName || 'Main Outlet'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">POS Product *</label>
                  <select
                    required
                    value={issueForm.productId}
                    onChange={(e) => setIssueForm({ ...issueForm, productId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price Amount (₹)</label>
                  <input
                    type="number"
                    value={issueForm.price}
                    onChange={(e) => setIssueForm({ ...issueForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Generate Serial Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEW LICENSE MODAL */}
      {isRenewOpen && selectedLicense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Renew Subscription License</h3>
              <button onClick={() => setIsRenewOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedLicense.customer.businessName}</p>
              <p className="font-mono text-brand-700 font-bold">{selectedLicense.licenseKey}</p>
              <p className="text-slate-500">Current Expiry: {new Date(selectedLicense.expiryDate).toLocaleDateString()}</p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleRenewLicense} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={renewForm.amount}
                  onChange={(e) => setRenewForm({ ...renewForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={renewForm.notes}
                  onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
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
