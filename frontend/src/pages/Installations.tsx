import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, InstallationItem, CustomerItem, ProductItem, OutletItem } from '../services/api';
import { exportToCSV } from '../utils/csvExport';
import {
  MonitorCheck,
  Building2,
  Store,
  Package,
  Search,
  Plus,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Download,
} from 'lucide-react';

export const InstallationsPage: React.FC = () => {
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customerOutlets, setCustomerOutlets] = useState<OutletItem[]>([]);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Deploy Modal
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [deployForm, setDeployForm] = useState({
    customerId: '',
    outletId: '',
    productId: '',
    version: '4.2.0',
    terminalCount: 1,
    userCount: 2,
    serverType: 'LOCAL_SERVER',
    serverName: 'POS-SRV-01',
    status: 'ACTIVATED' as const,
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchInstallations(pagination.page);
  }, [search, selectedProduct, selectedStatus, pagination.page]);

  useEffect(() => {
    if (deployForm.customerId) {
      fetchOutletsForCustomer(deployForm.customerId);
    } else {
      setCustomerOutlets([]);
    }
  }, [deployForm.customerId]);

  const fetchAuxiliaryData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getProducts(),
      ]);
      if (custRes.success) setCustomers(custRes.data.customers);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load auxiliary deployment data:', err);
    }
  };

  const fetchOutletsForCustomer = async (customerId: string) => {
    try {
      const res = await api.getOutlets({ customerId });
      if (res.success) {
        setCustomerOutlets(res.data);
        if (res.data.length > 0) {
          setDeployForm((prev) => ({ ...prev, outletId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load customer outlets:', err);
    }
  };

  const fetchInstallations = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getInstallations({
        page,
        limit: pagination.limit,
        search,
        productId: selectedProduct,
        status: selectedStatus,
      });
      if (res.success) {
        setInstallations(res.data.installations);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load installations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createInstallation(deployForm);
      if (res.success) {
        setFormSuccess('POS Software instance deployed successfully!');
        setIsDeployOpen(false);
        fetchInstallations(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to deploy POS installation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDeployForm = () => {
    const defaultCust = customers.length > 0 ? customers[0].id : '';
    const defaultProd = products.length > 0 ? products[0].id : '';
    const defaultVersion = products.length > 0 ? products[0].version || '4.2.0' : '4.2.0';

    setDeployForm({
      customerId: defaultCust,
      outletId: '',
      productId: defaultProd,
      version: defaultVersion,
      terminalCount: 1,
      userCount: 2,
      serverType: 'LOCAL_SERVER',
      serverName: 'POS-SRV-01',
      status: 'ACTIVATED',
      notes: '',
    });
    setFormError(null);
  };

  const activatedCount = installations.filter((i) => i.status === 'ACTIVATED').length;
  const installedCount = installations.filter((i) => i.status === 'INSTALLED').length;

  const handleExportInstallations = () => {
    exportToCSV('asqurecrm_installations', [
      { key: 'installationNumber', label: 'Installation #' },
      { key: 'customer', label: 'Customer', formatter: (val) => val?.businessName || '' },
      { key: 'outlet', label: 'Outlet', formatter: (val) => val?.outletName || '' },
      { key: 'product', label: 'Product', formatter: (val) => val?.name || '' },
      { key: 'version', label: 'Version' },
      { key: 'terminalCount', label: 'Terminals' },
      { key: 'status', label: 'Status' },
      { key: 'installedBy', label: 'Installed By', formatter: (val) => val?.name || '' },
    ], installations);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-1xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MonitorCheck className="text-emerald-600" size={24} /> POS Software Deployments (Installations)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track deployed POS software systems, branch outlets, terminal counters, and software version builds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportInstallations}
            disabled={installations.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => {
              resetDeployForm();
              setIsDeployOpen(true);
            }}
            className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
          >
            <Plus size={18} /> New POS Deployment
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Deployments</span>
            <MonitorCheck size={18} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Activated</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{activatedCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Installed</span>
            <Layers size={18} className="text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{installedCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Products Supported</span>
            <Package size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{products.length}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search installation #, customer, version..."
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
            <option value="ACTIVATED">ACTIVATED</option>
            <option value="INSTALLED">INSTALLED</option>
            <option value="PLANNED">PLANNED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DECOMMISSIONED">DECOMMISSIONED</option>
          </select>
        </div>
      </div>

      {/* Installations Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Installation #</th>
                <th className="px-5 py-3">Customer Company</th>
                <th className="px-5 py-3">Branch Outlet</th>
                <th className="px-5 py-3">POS Product</th>
                <th className="px-5 py-3">Build Version</th>
                <th className="px-5 py-3 text-center">Terminals</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Installed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading POS installations...
                  </td>
                </tr>
              ) : installations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No installations found</p>
                  </td>
                </tr>
              ) : (
                installations.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-700">{ins.installationNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {ins.customer ? (
                        <Link to={`/customers/${ins.customer.id}`} className="hover:text-brand-600 flex items-center gap-1">
                          <Building2 size={14} className="text-slate-400" /> {ins.customer.businessName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <Store size={14} className="text-slate-400" /> {ins.outlet?.outletName || 'Main Outlet'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800 text-xs">{ins.product?.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">v{ins.version || '1.0.0'}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700 text-xs">{ins.terminalCount} Pos</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          ins.status === 'ACTIVATED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ins.status === 'INSTALLED'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-500 font-medium">
                      {ins.installedBy?.name || 'Installer'}
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
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total deployments)
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

      {/* DEPLOYMENT MODAL */}
      {isDeployOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Deploy New POS Software Instance</h3>
              <button onClick={() => setIsDeployOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleDeployInstallation} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Customer Company *</label>
                <select
                  required
                  value={deployForm.customerId}
                  onChange={(e) => setDeployForm({ ...deployForm, customerId: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Outlet Location *</label>
                <select
                  required
                  value={deployForm.outletId}
                  onChange={(e) => setDeployForm({ ...deployForm, outletId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="" disabled>Select Outlet Branch</option>
                  {customerOutlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.outletName} ({o.outletCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">POS Product *</label>
                  <select
                    required
                    value={deployForm.productId}
                    onChange={(e) => setDeployForm({ ...deployForm, productId: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Software Version *</label>
                  <input
                    type="text"
                    required
                    value={deployForm.version}
                    onChange={(e) => setDeployForm({ ...deployForm, version: e.target.value })}
                    placeholder="4.2.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Terminal Counters</label>
                  <input
                    type="number"
                    min={1}
                    value={deployForm.terminalCount}
                    onChange={(e) => setDeployForm({ ...deployForm, terminalCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deployment Status</label>
                  <select
                    value={deployForm.status}
                    onChange={(e) => setDeployForm({ ...deployForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="ACTIVATED">ACTIVATED</option>
                    <option value="INSTALLED">INSTALLED</option>
                    <option value="PLANNED">PLANNED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Deploy POS System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
