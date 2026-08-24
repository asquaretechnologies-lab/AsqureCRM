import React, { useState, useEffect } from 'react';
import { api, LeadItem, UserItem, ActivityItem } from '../services/api';
import {
  TrendingUp,
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
  UserCheck,
  PhoneCall,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [salesUsers, setSalesUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({ totalPipelineValue: 0, wonCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  // Modals / Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Forms
  const [leadForm, setLeadForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    city: 'Chennai',
    businessType: 'Supermarket / Retail',
    source: 'Website Lead',
    expectedValue: 45000,
    status: 'NEW' as const,
    assignedToId: '',
    notes: '',
  });

  const [activityForm, setActivityForm] = useState({
    activityType: 'CALL' as const,
    subject: '',
    outcome: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLeads(pagination.page);
  }, [search, selectedStage, pagination.page]);

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers({ limit: 50 });
      if (res.success) setSalesUsers(res.data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchLeads = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getLeads({
        page,
        limit: pagination.limit,
        search,
        status: selectedStage,
      });
      if (res.success) {
        setLeads(res.data.leads);
        setMetrics(res.data.metrics);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivitiesForLead = async (leadId: string) => {
    try {
      const res = await api.getActivities({ leadId });
      if (res.success) setActivities(res.data);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createLead(leadForm);
      if (res.success) {
        setFormSuccess(`Sales Lead ${res.data.leadNumber} created successfully!`);
        setIsCreateOpen(false);
        fetchLeads(1);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDrawer = async (lead: LeadItem) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    fetchActivitiesForLead(lead.id);
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await api.createActivity({
        leadId: selectedLead.id,
        activityType: activityForm.activityType,
        subject: activityForm.subject,
        outcome: activityForm.outcome,
        notes: activityForm.notes,
      });
      if (res.success) {
        setFormSuccess('Activity logged successfully');
        setIsActivityOpen(false);
        fetchActivitiesForLead(selectedLead.id);
        fetchLeads(pagination.page);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertLead = async (lead: LeadItem) => {
    if (!window.confirm(`Are you sure you want to convert ${lead.companyName} into an active Customer record?`)) return;
    try {
      const res = await api.convertLead(lead.id);
      if (res.success) {
        setFormSuccess(res.message);
        setIsDrawerOpen(false);
        fetchLeads(pagination.page);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to convert lead');
    }
  };

  const handleStageChange = async (lead: LeadItem, newStatus: string) => {
    try {
      const res = await api.updateLead(lead.id, { status: newStatus });
      if (res.success) {
        fetchLeads(pagination.page);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-brand-600" size={24} /> Sales Leads Pipeline & Deal Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track sales opportunities, record calls/demos, qualify leads, and convert won deals into active customers.
          </p>
        </div>
        <button
          onClick={() => {
            const defaultUser = salesUsers.length > 0 ? salesUsers[0].id : '';
            setLeadForm({
              companyName: '',
              contactName: '',
              email: '',
              phone: '',
              city: 'Chennai',
              businessType: 'Supermarket / Retail',
              source: 'Website Inquiry',
              expectedValue: 45000,
              status: 'NEW',
              assignedToId: defaultUser,
              notes: '',
            });
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
        >
          <Plus size={18} /> New Sales Lead
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
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Value</span>
            <TrendingUp size={18} className="text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{metrics.totalPipelineValue.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Deals</span>
            <Layers size={18} className="text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{pagination.total}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Won Deals</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{metrics.wonCount}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
            <Sparkles size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            {pagination.total > 0 ? Math.round((metrics.wonCount / pagination.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search lead #, company, contact..."
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
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Pipeline Stages</option>
            <option value="NEW">NEW</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="PROPOSAL">PROPOSAL</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">Lead #</th>
                <th className="px-5 py-3">Company & Contact</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3 text-right">Expected Value</th>
                <th className="px-5 py-3">Sales Owner</th>
                <th className="px-5 py-3 text-center">Activities</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading sales leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">No sales leads found</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-700">{lead.leadNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <Building2 size={14} className="text-slate-400" /> {lead.companyName}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{lead.contactName}</span>
                        {lead.phone && <span className="text-[11px] text-slate-400">({lead.phone})</span>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStageChange(lead, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                          lead.status === 'WON'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lead.status === 'PROPOSAL' || lead.status === 'NEGOTIATION'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : lead.status === 'LOST'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="PROPOSAL">PROPOSAL</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{lead.expectedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {lead.assignedTo?.name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-600 text-xs">
                      {lead.activityCount} logs
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenDrawer(lead)}
                        title="View Lead Details & Timeline"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>
                      {!lead.convertedCustomer && (
                        <button
                          onClick={() => handleConvertLead(lead)}
                          title="Convert to Customer"
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <UserCheck size={16} />
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
            Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total leads)
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

      {/* CREATE LEAD MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Sales Opportunity Lead</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  required
                  value={leadForm.companyName}
                  onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                  placeholder="Grand Hypermarket"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={leadForm.contactName}
                  onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                  placeholder="Mr. Rajesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Value (₹)</label>
                  <input
                    type="number"
                    value={leadForm.expectedValue}
                    onChange={(e) => setLeadForm({ ...leadForm, expectedValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                  >
                    <option value="NEW">NEW</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="PROPOSAL">PROPOSAL</option>
                    <option value="NEGOTIATION">NEGOTIATION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Representative</label>
                  <select
                    value={leadForm.assignedToId}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedToId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                  >
                    {salesUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
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
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD DETAIL & ACTIVITY TIMELINE DRAWER */}
      {isDrawerOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {selectedLead.leadNumber}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedLead.companyName}</h3>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-bold text-slate-900">{selectedLead.contactName}</span>
                </div>
                {selectedLead.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-800">{selectedLead.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Deal Value:</span>
                  <span className="font-mono font-bold text-emerald-700">₹{selectedLead.expectedValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stage:</span>
                  <span className="font-bold text-brand-700">{selectedLead.status}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActivityForm({ activityType: 'CALL', subject: 'Follow-up Call', outcome: 'Interested', notes: '' });
                    setIsActivityOpen(true);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <PhoneCall size={14} /> Log Activity
                </button>
                {!selectedLead.convertedCustomer && (
                  <button
                    onClick={() => handleConvertLead(selectedLead)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                  >
                    <UserCheck size={14} /> Convert
                  </button>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Interaction History Timeline</h4>

                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No sales activities logged yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {act.activityType}
                          </span>
                          <span className="font-mono">{new Date(act.activityDate).toLocaleString()}</span>
                        </div>
                        <p className="font-bold text-slate-900 pt-1">{act.subject}</p>
                        {act.outcome && <p className="text-slate-600">Outcome: {act.outcome}</p>}
                        <p className="text-[11px] text-slate-400 text-right">Logged by {act.user.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG ACTIVITY MODAL */}
      {isActivityOpen && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Log Sales Activity</h3>
              <button onClick={() => setIsActivityOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type *</label>
                <select
                  value={activityForm.activityType}
                  onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none text-xs"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="DEMO">Product Demo</option>
                  <option value="MEETING">On-Site Meeting</option>
                  <option value="EMAIL">Email Sent</option>
                  <option value="NOTE">General Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={activityForm.subject}
                  onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                  placeholder="POS Product Demo conducted"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome</label>
                <input
                  type="text"
                  value={activityForm.outcome}
                  onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })}
                  placeholder="Client requested proposal quote"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActivityOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
