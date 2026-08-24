import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  api,
  ManagementDashboardData,
  SalesDashboardData,
  AccountsDashboardData,
  SupportDashboardData,
} from '../services/api';
import {
  Users,
  MonitorCheck,
  KeyRound,
  AlertTriangle,
  DollarSign,
  Receipt,
  Headphones,
  TrendingUp,
  Clock,
  RefreshCw,
  Calendar,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  PieChart,
  UserPlus,
} from 'lucide-react';

type DashboardTab = 'management' | 'sales' | 'accounts' | 'support';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('management');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Data State
  const [managementData, setManagementData] = useState<ManagementDashboardData | null>(null);
  const [salesData, setSalesData] = useState<SalesDashboardData | null>(null);
  const [accountsData, setAccountsData] = useState<AccountsDashboardData | null>(null);
  const [supportData, setSupportData] = useState<SupportDashboardData | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'management') {
        const res = await api.getManagementDashboard();
        if (res.success) setManagementData(res.data);
      } else if (activeTab === 'sales') {
        const res = await api.getSalesDashboard();
        if (res.success) setSalesData(res.data);
      } else if (activeTab === 'accounts') {
        const res = await api.getAccountsDashboard();
        if (res.success) setAccountsData(res.data);
      } else if (activeTab === 'support') {
        const res = await api.getSupportDashboard();
        if (res.success) setSupportData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<any>; color: string }[] = [
    { id: 'management', label: 'Management', icon: Building2, color: 'text-brand-600' },
    { id: 'sales', label: 'Sales & Leads', icon: TrendingUp, color: 'text-emerald-600' },
    { id: 'accounts', label: 'Accounts & Billing', icon: CreditCard, color: 'text-purple-600' },
    { id: 'support', label: 'Support Operations', icon: Headphones, color: 'text-rose-600' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 rounded-2xl border border-slate-800 shadow-lg text-white">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Welcome back, {user?.name}! 👋</h1>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {user?.role || 'Administrator'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-department operational overview for your POS CRM workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-brand-400' : 'text-slate-400'} />
            Refresh
          </button>

          <span className="text-xs bg-slate-800/80 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono">
            <Clock size={14} className="text-brand-400" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Dashboard View Segment Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition border whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-brand-400' : tab.color} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon size={16} className="text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboardData} className="font-semibold underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw size={28} className="animate-spin text-brand-600" />
          <p className="text-xs font-medium text-slate-500">Loading {activeTab} analytics & operational metrics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MANAGEMENT DASHBOARD */}
          {activeTab === 'management' && managementData && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Customers"
                  value={managementData.metrics.totalCustomers}
                  subtext={`+${managementData.metrics.newCustomers} new this month`}
                  icon={Users}
                  color="bg-brand-50 text-brand-600 border-brand-200"
                  onClick={() => navigate('/customers')}
                />
                <MetricCard
                  label="Active Installations"
                  value={managementData.metrics.activeInstallations}
                  subtext="Operational Outlets"
                  icon={MonitorCheck}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/installations')}
                />
                <MetricCard
                  label="Active Licenses"
                  value={managementData.metrics.activeLicenses}
                  subtext={`${managementData.metrics.expiringLicenses} expiring in 30d`}
                  icon={KeyRound}
                  color="bg-sky-50 text-sky-600 border-sky-200"
                  onClick={() => navigate('/licenses')}
                />
                <MetricCard
                  label="Monthly Revenue"
                  value={`₹${managementData.metrics.monthlyRevenue.toLocaleString()}`}
                  subtext="Current Month Collections"
                  icon={DollarSign}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/payments')}
                />
                <MetricCard
                  label="Total Outstanding"
                  value={`₹${managementData.metrics.totalOutstanding.toLocaleString()}`}
                  subtext={`Overdue: ₹${managementData.metrics.totalOverdue.toLocaleString()}`}
                  icon={Receipt}
                  color="bg-purple-50 text-purple-600 border-purple-200"
                  onClick={() => navigate('/invoices')}
                />
                <MetricCard
                  label="Expiring Licenses"
                  value={managementData.metrics.expiringLicenses}
                  subtext="Requires Renewal"
                  icon={AlertTriangle}
                  color="bg-amber-50 text-amber-600 border-amber-200"
                  onClick={() => navigate('/renewals')}
                />
                <MetricCard
                  label="Expired Licenses"
                  value={managementData.metrics.expiredLicenses}
                  subtext="Inactive Software"
                  icon={AlertOctagon}
                  color="bg-rose-50 text-rose-600 border-rose-200"
                  onClick={() => navigate('/licenses')}
                />
                <MetricCard
                  label="Open Support Tickets"
                  value={managementData.metrics.openTickets}
                  subtext="Pending Resolution"
                  icon={Headphones}
                  color="bg-rose-50 text-rose-600 border-rose-200"
                  onClick={() => navigate('/tickets')}
                />
              </div>

              {/* Management Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Installations */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <MonitorCheck size={16} className="text-brand-600" />
                      Recent POS Installations
                    </h3>
                    <button
                      onClick={() => navigate('/installations')}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight size={14} />
                    </button>
                  </div>

                  {managementData.recentInstallations.length === 0 ? (
                    <EmptyState message="No recent installations found." />
                  ) : (
                    <div className="space-y-3">
                      {managementData.recentInstallations.map((item) => (
                        <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.customerName}</p>
                            <p className="text-[11px] text-slate-500">
                              {item.outletName} • {item.productName} ({item.version || 'v1.0'})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                              {item.status}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.installationNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent License Renewals */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      Recent License Renewals
                    </h3>
                    <button
                      onClick={() => navigate('/renewals')}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      Renewals Log <ArrowRight size={14} />
                    </button>
                  </div>

                  {managementData.recentRenewals.length === 0 ? (
                    <EmptyState message="No license renewals recorded yet." />
                  ) : (
                    <div className="space-y-3">
                      {managementData.recentRenewals.map((r) => (
                        <div key={r.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{r.customerName}</p>
                            <p className="text-[11px] text-slate-500">
                              {r.productName} • Renewed by {r.renewedByName}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 font-mono">₹{r.amount.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Exp: {new Date(r.newExpiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SALES DASHBOARD */}
          {activeTab === 'sales' && salesData && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="New Leads"
                  value={salesData.metrics.newLeads}
                  subtext="Unassigned / Fresh"
                  icon={UserPlus}
                  color="bg-sky-50 text-sky-600 border-sky-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Open Opportunities"
                  value={salesData.metrics.openLeads}
                  subtext="Active Pipeline"
                  icon={TrendingUp}
                  color="bg-brand-50 text-brand-600 border-brand-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Expected Revenue"
                  value={`₹${salesData.metrics.expectedRevenue.toLocaleString()}`}
                  subtext="Open Pipeline Value"
                  icon={DollarSign}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Scheduled Demos"
                  value={salesData.metrics.demosCount}
                  subtext="Total Demos"
                  icon={MonitorCheck}
                  color="bg-purple-50 text-purple-600 border-purple-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Quotations Sent"
                  value={salesData.metrics.quotationsCount}
                  subtext="In Proposal Phase"
                  icon={Receipt}
                  color="bg-amber-50 text-amber-600 border-amber-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Deals Won"
                  value={salesData.metrics.wonLeads}
                  subtext="Converted Customers"
                  icon={CheckCircle2}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Deals Lost"
                  value={salesData.metrics.lostLeads}
                  subtext="Closed Lost"
                  icon={AlertTriangle}
                  color="bg-rose-50 text-rose-600 border-rose-200"
                  onClick={() => navigate('/leads')}
                />
                <MetricCard
                  label="Today's Follow-ups"
                  value={salesData.metrics.todayFollowupsCount}
                  subtext="Actionable Tasks"
                  icon={Calendar}
                  color="bg-blue-50 text-blue-600 border-blue-200"
                  onClick={() => navigate('/leads')}
                />
              </div>

              {/* Sales Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pipeline Breakdown */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <PieChart size={16} className="text-brand-600" />
                    Sales Pipeline Stage Distribution
                  </h3>
                  <div className="space-y-3">
                    {salesData.pipeline.map((stage) => (
                      <div key={stage.status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{stage.status}</span>
                          <span className="text-slate-500 font-mono">
                            {stage.count} leads • ₹{stage.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${
                              stage.status === 'WON'
                                ? 'bg-emerald-500'
                                : stage.status === 'LOST'
                                ? 'bg-rose-400'
                                : 'bg-brand-500'
                            }`}
                            style={{ width: `${Math.min(100, (stage.count / (salesData.metrics.openLeads || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today's Follow-ups */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <PhoneCall size={16} className="text-blue-600" />
                      Today's Scheduled Follow-ups
                    </h3>
                    <button
                      onClick={() => navigate('/leads')}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight size={14} />
                    </button>
                  </div>

                  {salesData.todaysFollowups.length === 0 ? (
                    <EmptyState message="No sales follow-ups scheduled for today." />
                  ) : (
                    <div className="space-y-3">
                      {salesData.todaysFollowups.map((act) => (
                        <div key={act.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{act.companyOrCustomer}</p>
                            <p className="text-[11px] text-slate-500">
                              {act.activityType} • {act.subject} ({act.contactPerson})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-semibold text-brand-600">{act.phone}</span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Owner: {act.userName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS & BILLING DASHBOARD */}
          {activeTab === 'accounts' && accountsData && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Outstanding"
                  value={`₹${accountsData.metrics.totalOutstanding.toLocaleString()}`}
                  subtext="Uncollected Invoices"
                  icon={Receipt}
                  color="bg-purple-50 text-purple-600 border-purple-200"
                  onClick={() => navigate('/invoices')}
                />
                <MetricCard
                  label="Total Overdue"
                  value={`₹${accountsData.metrics.totalOverdue.toLocaleString()}`}
                  subtext="Past Due Date"
                  icon={AlertTriangle}
                  color="bg-rose-50 text-rose-600 border-rose-200"
                  onClick={() => navigate('/invoices')}
                />
                <MetricCard
                  label="Today's Collection"
                  value={`₹${accountsData.metrics.todaysCollection.toLocaleString()}`}
                  subtext="Payments Today"
                  icon={DollarSign}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/payments')}
                />
                <MetricCard
                  label="Monthly Collection"
                  value={`₹${accountsData.metrics.monthlyCollection.toLocaleString()}`}
                  subtext="Current Month Total"
                  icon={CreditCard}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/payments')}
                />
              </div>

              {/* Accounts Aging Breakdown */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  Accounts Aging Breakdown
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700">0 - 30 Days</p>
                    <p className="text-xl font-bold text-emerald-900 mt-1 font-mono">
                      ₹{accountsData.metrics.aging.days0To30.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Current / Low Risk</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-700">31 - 60 Days</p>
                    <p className="text-xl font-bold text-amber-900 mt-1 font-mono">
                      ₹{accountsData.metrics.aging.days31To60.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Medium Follow-up required</p>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-700">61 - 90 Days</p>
                    <p className="text-xl font-bold text-orange-900 mt-1 font-mono">
                      ₹{accountsData.metrics.aging.days61To90.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-orange-600 mt-0.5">High Priority Overdue</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                    <p className="text-xs font-semibold text-rose-700">90+ Days</p>
                    <p className="text-xl font-bold text-rose-900 mt-1 font-mono">
                      ₹{accountsData.metrics.aging.days90Plus.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-rose-600 mt-0.5">Critical Collection Risk</p>
                  </div>
                </div>
              </div>

              {/* Accounts Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overdue Invoices */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-600" />
                      Critical Overdue Invoices
                    </h3>
                    <button
                      onClick={() => navigate('/invoices')}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight size={14} />
                    </button>
                  </div>

                  {accountsData.overdueInvoices.length === 0 ? (
                    <EmptyState message="No overdue invoices currently pending." />
                  ) : (
                    <div className="space-y-3">
                      {accountsData.overdueInvoices.map((inv) => (
                        <div key={inv.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{inv.customerName}</p>
                            <p className="text-[11px] text-slate-500">
                              {inv.invoiceNumber} • {inv.daysOverdue} days overdue
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-rose-700 font-mono">
                              ₹{inv.balanceAmount.toLocaleString()}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Due: {new Date(inv.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Payments */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Recent Payment Receipts
                    </h3>
                    <button
                      onClick={() => navigate('/payments')}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight size={14} />
                    </button>
                  </div>

                  {accountsData.recentPayments.length === 0 ? (
                    <EmptyState message="No payment receipts logged yet." />
                  ) : (
                    <div className="space-y-3">
                      {accountsData.recentPayments.map((p) => (
                        <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{p.customerName}</p>
                            <p className="text-[11px] text-slate-500">
                              Receipt: {p.receiptNumber} • Method: {p.paymentMethod}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-700 font-mono">
                              +₹{p.amount.toLocaleString()}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT OPERATIONS DASHBOARD */}
          {activeTab === 'support' && supportData && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Open Tickets"
                  value={supportData.metrics.openTickets}
                  subtext="Unresolved Issues"
                  icon={Headphones}
                  color="bg-rose-50 text-rose-600 border-rose-200"
                  onClick={() => navigate('/tickets')}
                />
                <MetricCard
                  label="In Progress"
                  value={supportData.metrics.inProgressTickets}
                  subtext="Being Handled"
                  icon={Clock}
                  color="bg-amber-50 text-amber-600 border-amber-200"
                  onClick={() => navigate('/tickets')}
                />
                <MetricCard
                  label="Critical / Urgent"
                  value={supportData.metrics.criticalTickets}
                  subtext="High Priority"
                  icon={AlertOctagon}
                  color="bg-rose-50 text-rose-600 border-rose-200"
                  onClick={() => navigate('/tickets')}
                />
                <MetricCard
                  label="Unassigned Tickets"
                  value={supportData.metrics.unassignedTickets}
                  subtext="Requires Tech Assignment"
                  icon={UserCheck}
                  color="bg-purple-50 text-purple-600 border-purple-200"
                  onClick={() => navigate('/tickets')}
                />
                <MetricCard
                  label="My Assigned Tickets"
                  value={supportData.metrics.myTickets}
                  subtext="Assigned to Me"
                  icon={Users}
                  color="bg-brand-50 text-brand-600 border-brand-200"
                  onClick={() => navigate('/tickets')}
                />
                <MetricCard
                  label="Resolved Today"
                  value={supportData.metrics.resolvedToday}
                  subtext="Tickets Closed Today"
                  icon={CheckCircle2}
                  color="bg-emerald-50 text-emerald-600 border-emerald-200"
                  onClick={() => navigate('/tickets')}
                />
                <MetricCard
                  label="Avg Resolution Time"
                  value={`${supportData.metrics.avgResolutionTimeHours} hrs`}
                  subtext="Performance Metric"
                  icon={Clock}
                  color="bg-sky-50 text-sky-600 border-sky-200"
                  onClick={() => navigate('/tickets')}
                />
              </div>

              {/* Support Tickets Table */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Headphones size={16} className="text-rose-600" />
                    High Priority & Recent Support Tickets
                  </h3>
                  <button
                    onClick={() => navigate('/tickets')}
                    className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    Ticket Queue <ArrowRight size={14} />
                  </button>
                </div>

                {supportData.recentTickets.length === 0 ? (
                  <EmptyState message="No pending support tickets." />
                ) : (
                  <div className="space-y-3">
                    {supportData.recentTickets.map((ticket) => (
                      <div key={ticket.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{ticket.subject}</span>
                            <span className="text-[10px] font-mono text-slate-400">{ticket.ticketNumber}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Customer: {ticket.customerName} • Category: {ticket.category} • Tech: {ticket.assignedToName}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              ticket.priority === 'URGENT' || ticket.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Reusable Metric Card Helper Component
interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, icon: Icon, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:shadow-md transition cursor-pointer group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl border ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {subtext}
        </span>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
    <p className="text-xs text-slate-500 font-medium">{message}</p>
  </div>
);
