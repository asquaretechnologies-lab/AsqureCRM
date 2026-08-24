import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, TicketItem, CustomerItem, UserItem, OutletItem } from '../services/api';
import {
  LifeBuoy,
  Building2,
  Phone,
  Mail,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  AlertTriangle,
  Send,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [customerOutlets, setCustomerOutlets] = useState<OutletItem[]>([]);
  const [supportAgents, setSupportAgents] = useState<UserItem[]>([]);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({ openCount: 0, urgentCount: 0, resolvedCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [commentText, setCommentText] = useState('');

  // Create Form State
  const [ticketForm, setTicketForm] = useState({
    customerId: '',
    outletId: '',
    subject: '',
    description: '',
    category: 'SOFTWARE' as const,
    priority: 'MEDIUM' as const,
    assignedToId: '',
  });

  // Drawer Resolution State
  const [resolutionState, setResolutionState] = useState({
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    assignedToId: '',
    resolutionNotes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchTickets(pagination.page);
  }, [search, selectedStatus, selectedPriority, selectedCategory, pagination.page]);

  useEffect(() => {
    if (ticketForm.customerId) {
      fetchOutletsForCustomer(ticketForm.customerId);
    } else {
      setCustomerOutlets([]);
    }
  }, [ticketForm.customerId]);

  const fetchAuxiliaryData = async () => {
    try {
      const [custRes, userRes] = await Promise.all([
        api.getCustomers({ limit: 100 }),
        api.getUsers({ limit: 50 }),
      ]);
      if (custRes.success) setCustomers(custRes.data.customers);
      if (userRes.success) setSupportAgents(userRes.data.users);
    } catch (err) {
      console.error('Failed to load auxiliary ticket data:', err);
    }
  };

  const fetchOutletsForCustomer = async (customerId: string) => {
    try {
      const res = await api.getOutlets({ customerId });
      if (res.success) {
        setCustomerOutlets(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer outlets:', err);
    }
  };

  const fetchTickets = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getTickets({
        page,
        limit: pagination.limit,
        search,
        status: selectedStatus,
        priority: selectedPriority,
        category: selectedCategory,
      });
      if (res.success) {
        setTickets(res.data.tickets);
        setMetrics(res.data.metrics);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createTicket(ticketForm);
      if (res.success) {
        setFormSuccess(`Support Ticket ${res.data.ticketNumber} opened successfully!`);
        setIsCreateOpen(false);
        fetchTickets(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTicketDrawer = async (ticketId: string) => {
    try {
      const res = await api.getTicket(ticketId);
      if (res.success) {
        setSelectedTicket(res.data);
        setResolutionState({
          status: res.data.status,
          priority: res.data.priority,
          assignedToId: res.data.assignedTo?.id || '',
          resolutionNotes: res.data.resolutionNotes || '',
        });
        setIsDrawerOpen(true);
      }
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.updateTicket(selectedTicket.id, resolutionState);
      if (res.success) {
        setFormSuccess(res.message);
        setIsDrawerOpen(false);
        fetchTickets(pagination.page);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to update ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;
    try {
      const res = await api.addTicketComment(selectedTicket.id, commentText);
      if (res.success) {
        setCommentText('');
        openTicketDrawer(selectedTicket.id);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleStatusChange = async (ticket: TicketItem, newStatus: any) => {
    try {
      const res = await api.updateTicket(ticket.id, { status: newStatus });
      if (res.success) {
        fetchTickets(pagination.page);
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="text-brand-600" size={24} /> Customer Support & Helpdesk Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage POS hardware & software technical support issues, SLA resolution times, and agent routing.
          </p>
        </div>
        <button
          onClick={() => {
            const defaultCust = customers.length > 0 ? customers[0].id : '';
            const defaultAgent = supportAgents.length > 0 ? supportAgents[0].id : '';
            setTicketForm({
              customerId: defaultCust,
              outletId: '',
              subject: '',
              description: '',
              category: 'SOFTWARE',
              priority: 'MEDIUM',
              assignedToId: defaultAgent,
            });
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
        >
          <Plus size={18} /> Open Support Ticket
        </button>
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
            <span className="text-xs font-bold uppercase tracking-wider">Total Tickets</span>
            <LifeBuoy size={18} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open / In Progress</span>
            <Clock size={18} className="text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.openCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Urgent Priority</span>
            <ShieldAlert size={18} className="text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{metrics.urgentCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved Tickets</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{metrics.resolvedCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search ticket #, subject, customer..."
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
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Tickets Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Ticket #</th>
                <th className="px-5 py-3">Customer & Outlet</th>
                <th className="px-5 py-3">Issue Subject</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned Agent</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading helpdesk tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No support tickets found</p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-700">{t.ticketNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <Link to={`/customers/${t.customer.id}`} className="hover:text-brand-600 flex items-center gap-1">
                        <Building2 size={14} className="text-slate-400" /> {t.customer.businessName}
                      </Link>
                      {t.outlet && <p className="text-[11px] text-slate-400 font-normal">{t.outlet.outletName}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-800">
                      <p className="font-semibold">{t.subject}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                          t.priority === 'URGENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.priority === 'MEDIUM'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {t.assignedTo?.name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => openTicketDrawer(t.id)}
                        title="View & Resolve Ticket"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>
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
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total tickets)
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

      {/* CREATE TICKET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Open Support Ticket</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Customer Company *</label>
                <select
                  required
                  value={ticketForm.customerId}
                  onChange={(e) => setTicketForm({ ...ticketForm, customerId: e.target.value })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Subject Line *</label>
                <input
                  type="text"
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Thermal Printer Disconnected on Counter 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                  >
                    <option value="SOFTWARE">POS Software</option>
                    <option value="HARDWARE">Hardware / Thermal Printer</option>
                    <option value="LICENSE">Serial License Key</option>
                    <option value="BILLING">Billing & Payments</option>
                    <option value="GENERAL">General Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority *</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                  >
                    <option value="URGENT">URGENT (Store Down)</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Billing terminal receipt printer stops responding after invoice generation."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                ></textarea>
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
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Open Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET RESOLUTION & COMMENTS DRAWER */}
      {isDrawerOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in">
          <div className="bg-white max-w-lg w-full h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {selectedTicket.ticketNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedTicket.subject}</h3>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.customer.businessName}</span>
                </div>
                {selectedTicket.customer.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-800">{selectedTicket.customer.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-800">{selectedTicket.category}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">Issue Description:</p>
                  <p className="bg-white p-2.5 rounded-lg border border-slate-200/80">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateTicket} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">Ticket Status & Resolution</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Status</label>
                    <select
                      value={resolutionState.status}
                      onChange={(e) => setResolutionState({ ...resolutionState, status: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Assigned Agent</label>
                    <select
                      value={resolutionState.assignedToId}
                      onChange={(e) => setResolutionState({ ...resolutionState, assignedToId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      {supportAgents.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Resolution Summary</label>
                  <textarea
                    rows={2}
                    value={resolutionState.resolutionNotes}
                    onChange={(e) => setResolutionState({ ...resolutionState, resolutionNotes: e.target.value })}
                    placeholder="Re-installed thermal printer Windows driver v4.2. Resolution confirmed."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Save Status Update
                </button>
              </form>

              {/* Comments Thread */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Comment Thread ({selectedTicket.comments?.length || 0})</h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTicket.comments?.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-slate-900">{c.user.name}</span>
                        <span className="font-mono text-[10px]">{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-700 pt-0.5">{c.comment}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                  <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl">
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
