import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, CustomerItem, UserItem } from '../services/api';
import { exportToCSV } from '../utils/csvExport';
import {
  Building2,
  Users,
  Store,
  KeyRound,
  DollarSign,
  Search,
  Plus,
  Edit2,
  ArrowRight,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Download,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [salesUsers, setSalesUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSalesUser, setSelectedSalesUser] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    customerCode: '',
    businessName: '',
    displayName: '',
    customerType: 'RETAIL',
    businessType: 'Supermarket',
    phone: '',
    email: '',
    taxNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    salesUserId: '',
    status: 'ACTIVE' as 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSalesUsers();
  }, []);

  useEffect(() => {
    fetchCustomers(pagination.page);
  }, [search, selectedStatus, selectedSalesUser, pagination.page]);

  const fetchSalesUsers = async () => {
    try {
      const res = await api.getUsers({ limit: 100 });
      if (res.success) {
        setSalesUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load sales users:', err);
    }
  };

  const fetchCustomers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getCustomers({
        page,
        limit: pagination.limit,
        search,
        status: selectedStatus,
        salesUserId: selectedSalesUser,
      });
      if (res.success) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createCustomer(formData);
      if (res.success) {
        setFormSuccess('Customer profile created successfully!');
        setIsCreateOpen(false);
        resetForm();
        fetchCustomers(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.updateCustomer(selectedCustomer.id, formData);
      if (res.success) {
        setFormSuccess('Customer profile updated successfully!');
        setIsEditOpen(false);
        fetchCustomers(pagination.page);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (cust: CustomerItem) => {
    setSelectedCustomer(cust);
    setFormData({
      customerCode: cust.customerCode,
      businessName: cust.businessName,
      displayName: cust.displayName,
      customerType: cust.customerType || 'RETAIL',
      businessType: cust.businessType || '',
      phone: cust.phone || '',
      email: cust.email || '',
      taxNumber: '',
      addressLine1: cust.addressLine1 || '',
      addressLine2: cust.addressLine2 || '',
      city: cust.city || '',
      state: cust.state || '',
      salesUserId: cust.salesUser?.id || '',
      status: cust.status,
      notes: '',
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    const randomCode = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      customerCode: randomCode,
      businessName: '',
      displayName: '',
      customerType: 'RETAIL',
      businessType: 'Supermarket',
      phone: '',
      email: '',
      taxNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      salesUserId: salesUsers.length > 0 ? salesUsers[0].id : '',
      status: 'ACTIVE',
      notes: '',
    });
    setFormError(null);
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + c.totalOutstanding, 0);
  const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const prospectCount = customers.filter((c) => c.status === 'PROSPECT').length;

  const handleExportCustomers = () => {
    exportToCSV('asqurecrm_customers', [
      { key: 'customerCode', label: 'Customer Code' },
      { key: 'businessName', label: 'Business Name' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'customerType', label: 'Customer Type' },
      { key: 'businessType', label: 'Business Type' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'status', label: 'Status' },
      { key: 'outletCount', label: 'Outlets' },
      { key: 'activeLicenseCount', label: 'Active Licenses' },
      { key: 'totalOutstanding', label: 'Outstanding (₹)', formatter: (val) => Number(val || 0).toFixed(2) },
    ], customers);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-brand-600" size={24} /> Customer Master Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer business profiles, outlets, contacts, software licensing, and financial ledgers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCustomers}
            disabled={customers.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
          >
            <Plus size={18} /> Add New Customer
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
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <Building2 size={18} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Customers</span>
            <Users size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Prospects</span>
            <Store size={18} className="text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{prospectCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Ledger</span>
            <DollarSign size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search code, business name, phone, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            <option value="ACTIVE">Active</option>
            <option value="PROSPECT">Prospect</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Sales User Filter */}
          <select
            value={selectedSalesUser}
            onChange={(e) => {
              setSelectedSalesUser(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Sales Owners</option>
            {salesUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Customer Code</th>
                <th className="px-5 py-3">Business Name</th>
                <th className="px-5 py-3">Primary Contact</th>
                <th className="px-5 py-3">City & Phone</th>
                <th className="px-5 py-3 text-center">Outlets</th>
                <th className="px-5 py-3 text-center">Licenses</th>
                <th className="px-5 py-3 text-right">Outstanding</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading customer directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No customers found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                      <Link to={`/customers/${c.id}`} className="hover:text-brand-600 hover:underline">
                        {c.customerCode}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/customers/${c.id}`} className="font-bold text-slate-900 hover:text-brand-600 block">
                        {c.businessName}
                      </Link>
                      <span className="text-xs text-slate-400">{c.displayName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.primaryContact ? (
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{c.primaryContact.name}</p>
                          <p className="text-[11px] text-slate-400">{c.primaryContact.phone || c.primaryContact.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No primary contact</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400 shrink-0" /> {c.city || '—'}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                        <Phone size={12} className="text-slate-400 shrink-0" /> {c.phone || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-700 text-xs">{c.outletCount}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        {c.activeLicenseCount} Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{c.totalOutstanding.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'PROSPECT'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(c)}
                        title="Edit Customer"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <Link
                        to={`/customers/${c.id}`}
                        title="Open Customer 360"
                        className="p-1.5 inline-block text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <ArrowRight size={16} />
                      </Link>
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
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total customers)
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

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {isCreateOpen ? 'Add New Customer Profile' : `Edit Customer (${selectedCustomer?.customerCode})`}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={isCreateOpen ? handleCreateCustomer : handleUpdateCustomer} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditOpen}
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                    placeholder="CUST-1001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Apex Hypermarket Pvt Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Apex Hypermarket"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Number (GST/VAT)</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="29ABCDE1234F1ZH"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none uppercase font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 8023456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@apexretail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="Building / Street Address"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    placeholder="Suite / Area / Landmark"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Karnataka"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Owner</label>
                  <select
                    value={formData.salesUserId}
                    onChange={(e) => setFormData({ ...formData, salesUserId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {salesUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PROSPECT">PROSPECT</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : isCreateOpen ? 'Create Customer' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
