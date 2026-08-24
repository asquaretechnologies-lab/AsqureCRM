import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Building2,
  Users,
  Store,
  MonitorCheck,
  KeyRound,
  FileText,
  CreditCard,
  Headphones,
  History,
  Phone,
  Mail,
  MapPin,
  Plus,
  ArrowLeft,
  Loader2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  Activity,
} from 'lucide-react';

export const Customer360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data360, setData360] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'contacts' | 'outlets' | 'installations' | 'licenses' | 'invoices' | 'payments' | 'tickets' | 'audit'
  >('overview');

  // Contact Modal state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    designation: '',
    phone: '',
    email: '',
    isPrimary: false,
  });

  // Outlet Modal state
  const [isAddOutletOpen, setIsAddOutletOpen] = useState(false);
  const [outletForm, setOutletForm] = useState({
    outletCode: '',
    outletName: '',
    city: '',
    contactPerson: '',
    phone: '',
    status: 'ACTIVE',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData360(id);
    }
  }, [id]);

  const fetchData360 = async (customerId: string) => {
    setIsLoading(true);
    try {
      const res = await api.getCustomer360(customerId);
      if (res.success) {
        setData360(res.data);
      }
    } catch (err) {
      console.error('Failed to load Customer 360 view:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createContact({ ...contactForm, customerId: id });
      if (res.success) {
        setIsAddContactOpen(false);
        setContactForm({ name: '', designation: '', phone: '', email: '', isPrimary: false });
        fetchData360(id);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createOutlet({ ...outletForm, customerId: id });
      if (res.success) {
        setIsAddOutletOpen(false);
        setOutletForm({ outletCode: '', outletName: '', city: '', contactPerson: '', phone: '', status: 'ACTIVE' });
        fetchData360(id);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to add outlet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 size={32} className="animate-spin text-brand-600 mb-2" />
        <p className="text-sm font-semibold">Loading Customer 360 View...</p>
      </div>
    );
  }

  if (!data360) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center">
        <AlertCircle size={32} className="text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Customer Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The requested customer record does not exist or was removed.</p>
        <Link to="/customers" className="inline-block mt-4 text-xs font-semibold text-brand-600 hover:underline">
          &larr; Return to Customer Directory
        </Link>
      </div>
    );
  }

  const { customer, summary, auditLogs } = data360;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header Card */}
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft size={14} /> Back to Customer Directory
        </Link>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 font-extrabold text-2xl flex items-center justify-center shrink-0">
              {customer.businessName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{customer.businessName}</h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {customer.customerCode}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                    customer.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{customer.displayName} • {customer.businessType || 'Retail Business'}</p>

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 flex-wrap">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" /> {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" /> {customer.email}
                  </span>
                )}
                {customer.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" /> {customer.city}, {customer.state}
                  </span>
                )}
                {customer.salesUser && (
                  <span className="flex items-center gap-1 font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    <UserCheck size={13} /> Manager: {customer.salesUser.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setContactForm({ name: '', designation: '', phone: '', email: '', isPrimary: false });
                setIsAddContactOpen(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-200"
            >
              <Plus size={14} /> Add Contact
            </button>
            <button
              onClick={() => {
                setOutletForm({
                  outletCode: `OUT-${Math.floor(10 + Math.random() * 90)}`,
                  outletName: '',
                  city: customer.city || '',
                  contactPerson: '',
                  phone: '',
                  status: 'ACTIVE',
                });
                setIsAddOutletOpen(true);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus size={14} /> Add Outlet
            </button>
          </div>
        </div>
      </div>

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Outlets</span>
            <Store size={16} className="text-brand-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{summary.outletCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Deployments</span>
            <MonitorCheck size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{summary.installationCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Keys</span>
            <KeyRound size={16} className="text-sky-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{summary.activeLicenseCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Outstanding</span>
            <FileText size={16} className="text-purple-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">₹{summary.totalOutstanding.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Tickets</span>
            <Headphones size={16} className="text-rose-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{summary.openTicketCount}</p>
        </div>
      </div>

      {/* Tabs Bar & Content Area */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 flex items-center gap-1 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: Building2 },
            { key: 'contacts', label: `Contacts (${customer.contacts.length})`, icon: Users },
            { key: 'outlets', label: `Outlets (${customer.outlets.length})`, icon: Store },
            { key: 'installations', label: `Installations (${customer.installations.length})`, icon: MonitorCheck },
            { key: 'licenses', label: `Licenses (${customer.licenses.length})`, icon: KeyRound },
            { key: 'invoices', label: `Invoices (${customer.invoices.length})`, icon: FileText },
            { key: 'payments', label: `Payments (${customer.payments.length})`, icon: CreditCard },
            { key: 'tickets', label: `Tickets (${customer.tickets.length})`, icon: Headphones },
            { key: 'audit', label: `Audit Log (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-700 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Company Business Profile</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Business Name</span>
                    <span className="font-semibold text-slate-900">{customer.businessName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">GST / Tax Number</span>
                    <span className="font-mono font-bold text-slate-800">{customer.taxNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Customer Type</span>
                    <span className="font-medium text-slate-800">{customer.customerType || 'RETAIL'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Business Category</span>
                    <span className="font-medium text-slate-800">{customer.businessType || 'Supermarket'}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 pt-4">Contact & Location</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Phone</span>
                    <span className="font-semibold text-slate-800">{customer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Email</span>
                    <span className="font-semibold text-slate-800">{customer.email || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-400 font-medium block">Address</span>
                    <span className="text-slate-800">
                      {customer.addressLine1} {customer.addressLine2}, {customer.city}, {customer.state} {customer.postalCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Financial Overview</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Billed Revenue</span>
                    <span className="font-mono font-bold text-slate-900">₹{summary.totalBilled.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Payments Received</span>
                    <span className="font-mono font-bold text-emerald-700">₹{summary.totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Outstanding Balance</span>
                    <span className="font-mono font-bold text-rose-600">₹{summary.totalOutstanding.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Customer Authorized Contacts</h3>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Contact
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Phone / WhatsApp</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.contacts.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          {c.isPrimary && <Star size={14} className="text-amber-500 fill-amber-400" />} {c.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.designation || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{c.phone || c.whatsapp || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                        <td className="px-4 py-3">
                          {c.isPrimary && (
                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                              Primary Contact
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: OUTLETS */}
          {activeTab === 'outlets' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Branch Outlets & Locations</h3>
                <button
                  onClick={() => setIsAddOutletOpen(true)}
                  className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Outlet
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Outlet Code</th>
                      <th className="px-4 py-3">Branch Name</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Branch Incharge</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.outlets.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{o.outletCode}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{o.outletName}</td>
                        <td className="px-4 py-3 text-slate-600">{o.city || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{o.contactPerson || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INSTALLATIONS */}
          {activeTab === 'installations' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">POS Software Installations</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Installation #</th>
                      <th className="px-4 py-3">Branch Outlet</th>
                      <th className="px-4 py-3">POS Product</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.installations.map((ins: any) => (
                      <tr key={ins.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{ins.installationNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{ins.outlet?.outletName || 'Main'}</td>
                        <td className="px-4 py-3 text-slate-800">{ins.product?.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">v{ins.posVersion}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                            {ins.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: LICENSES */}
          {activeTab === 'licenses' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Software License Keys</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">License Key</th>
                      <th className="px-4 py-3">Product / Plan</th>
                      <th className="px-4 py-3">Expiry Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.licenses.map((lic: any) => (
                      <tr key={lic.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand-700">{lic.licenseKey}</td>
                        <td className="px-4 py-3 text-slate-800">
                          {lic.product?.name} ({lic.plan?.name})
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {new Date(lic.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                            {lic.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Invoices & Billing Ledger</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          ₹{Number(inv.balanceAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              inv.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Payment Receipts</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Receipt #</th>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.invoice?.invoiceNumber}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{p.paymentMode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Support Tickets</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Ticket #</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customer.tickets.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{t.subject}</td>
                        <td className="px-4 py-3 text-slate-600">{t.outlet?.outletName || 'Main'}</td>
                        <td className="px-4 py-3 font-semibold text-amber-700 text-xs">{t.priority}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded font-semibold">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Audit Change History</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 text-xs">
                        <td className="px-4 py-3 font-mono text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{log.user?.name || 'System'}</td>
                        <td className="px-4 py-3 font-bold text-brand-700">{log.action}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{JSON.stringify(log.newValues || log.oldValues)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD CONTACT MODAL */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Customer Contact</h3>
              <button onClick={() => setIsAddContactOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={contactForm.designation}
                  onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                  placeholder="General Manager"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="ramesh@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-semibold text-slate-800">Set as Primary Contact</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD OUTLET MODAL */}
      {isAddOutletOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Outlet Branch</h3>
              <button onClick={() => setIsAddOutletOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddOutlet} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Outlet Code *</label>
                  <input
                    type="text"
                    required
                    value={outletForm.outletCode}
                    onChange={(e) => setOutletForm({ ...outletForm, outletCode: e.target.value })}
                    placeholder="OUT-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={outletForm.outletName}
                    onChange={(e) => setOutletForm({ ...outletForm, outletName: e.target.value })}
                    placeholder="Indiranagar Branch"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={outletForm.city}
                    onChange={(e) => setOutletForm({ ...outletForm, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Incharge</label>
                  <input
                    type="text"
                    value={outletForm.contactPerson}
                    onChange={(e) => setOutletForm({ ...outletForm, contactPerson: e.target.value })}
                    placeholder="Manager Store"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOutletOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
