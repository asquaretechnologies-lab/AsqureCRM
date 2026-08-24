import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportToCSV, CSVColumn } from '../utils/csvExport';
import {
  FileText,
  Download,
  Users,
  HardDrive,
  Key,
  CreditCard,
  TrendingUp,
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

type ReportTab = 'customer' | 'installation' | 'license' | 'finance' | 'sales' | 'support';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('customer');
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [data, setData] = useState<any>(null);

  const fetchReportData = async (tab: ReportTab) => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'customer':
          res = await api.getCustomerReport();
          break;
        case 'installation':
          res = await api.getInstallationReport();
          break;
        case 'license':
          res = await api.getLicenseReport();
          break;
        case 'finance':
          res = await api.getFinanceReport();
          break;
        case 'sales':
          res = await api.getSalesReport();
          break;
        case 'support':
          res = await api.getSupportReport();
          break;
      }
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  const handleExport = () => {
    if (!data || !data.rows || data.rows.length === 0) return;

    let columns: CSVColumn[] = [];
    let filename = `asqurecrm_${activeTab}_report`;

    switch (activeTab) {
      case 'customer':
        columns = [
          { key: 'customerCode', label: 'Customer Code' },
          { key: 'businessName', label: 'Business Name' },
          { key: 'businessType', label: 'Business Type' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'status', label: 'Status' },
          { key: 'outletCount', label: 'Outlets' },
          { key: 'installationCount', label: 'Installations' },
          { key: 'licenseCount', label: 'Licenses' },
          {
            key: 'createdAt',
            label: 'Created Date',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
        ];
        break;

      case 'installation':
        columns = [
          { key: 'installationNumber', label: 'Installation #' },
          { key: 'customerName', label: 'Customer' },
          { key: 'outletName', label: 'Outlet' },
          { key: 'productName', label: 'Product' },
          { key: 'version', label: 'Version' },
          { key: 'terminalCount', label: 'Terminals' },
          { key: 'status', label: 'Status' },
          { key: 'installedByName', label: 'Installed By' },
          {
            key: 'installedDate',
            label: 'Installed Date',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
        ];
        break;

      case 'license':
        columns = [
          { key: 'licenseNumber', label: 'License #' },
          { key: 'customerName', label: 'Customer' },
          { key: 'productName', label: 'Product' },
          { key: 'planName', label: 'Plan' },
          { key: 'licenseType', label: 'Type' },
          {
            key: 'startDate',
            label: 'Start Date',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
          {
            key: 'expiryDate',
            label: 'Expiry Date',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
          {
            key: 'totalAmount',
            label: 'Amount (₹)',
            formatter: (val) => Number(val || 0).toFixed(2),
          },
          { key: 'status', label: 'Status' },
        ];
        break;

      case 'finance':
        columns = [
          { key: 'invoiceNumber', label: 'Invoice #' },
          { key: 'customerName', label: 'Customer' },
          {
            key: 'invoiceDate',
            label: 'Invoice Date',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
          {
            key: 'dueDate',
            label: 'Due Date',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
          {
            key: 'totalAmount',
            label: 'Total Amount (₹)',
            formatter: (val) => Number(val || 0).toFixed(2),
          },
          {
            key: 'amountPaid',
            label: 'Paid (₹)',
            formatter: (val) => Number(val || 0).toFixed(2),
          },
          {
            key: 'balanceAmount',
            label: 'Balance (₹)',
            formatter: (val) => Number(val || 0).toFixed(2),
          },
          { key: 'status', label: 'Status' },
        ];
        break;

      case 'sales':
        columns = [
          { key: 'leadNumber', label: 'Lead #' },
          { key: 'companyName', label: 'Company' },
          { key: 'contactName', label: 'Contact Person' },
          { key: 'phone', label: 'Phone' },
          { key: 'city', label: 'City' },
          {
            key: 'expectedValue',
            label: 'Expected Value (₹)',
            formatter: (val) => Number(val || 0).toFixed(2),
          },
          { key: 'status', label: 'Stage' },
          { key: 'assignedToName', label: 'Assigned Owner' },
        ];
        break;

      case 'support':
        columns = [
          { key: 'ticketNumber', label: 'Ticket #' },
          { key: 'subject', label: 'Subject' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status' },
          { key: 'customerName', label: 'Customer' },
          { key: 'assignedToName', label: 'Assigned Agent' },
          {
            key: 'createdAt',
            label: 'Created At',
            formatter: (val) => (val ? new Date(val).toLocaleDateString() : ''),
          },
        ];
        break;
    }

    exportToCSV(filename, columns, data.rows);
  };

  const filteredRows = React.useMemo(() => {
    if (!data?.rows) return [];
    if (!search.trim()) return data.rows;
    const query = search.toLowerCase();
    return data.rows.filter((row: any) =>
      Object.values(row).some(
        (val) => val && String(val).toLowerCase().includes(query)
      )
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-brand-600" size={28} />
            Reports & Business Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate, filter, and export system-wide operational reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReportData(activeTab)}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={loading || !data?.rows?.length}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 scrollbar-none">
        {[
          { id: 'customer', label: 'Customer Reports', icon: Users },
          { id: 'installation', label: 'Installation Reports', icon: HardDrive },
          { id: 'license', label: 'License & Renewals', icon: Key },
          { id: 'finance', label: 'Financial & Aging', icon: CreditCard },
          { id: 'sales', label: 'Sales & Pipeline', icon: TrendingUp },
          { id: 'support', label: 'Support & Tickets', icon: LifeBuoy },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 size={36} className="text-brand-600 animate-spin mb-3" />
          <p className="text-slate-500 font-medium text-sm">Generating Report Analytics...</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          {data?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeTab === 'customer' && (
                <>
                  <MetricTile title="Total Customers" value={data.summary.totalCustomers} icon={Users} color="blue" />
                  <MetricTile title="Active Customers" value={data.summary.activeCustomers} icon={CheckCircle} color="emerald" />
                  <MetricTile title="Prospects" value={data.summary.prospects} icon={Clock} color="indigo" />
                  <MetricTile title="Inactive" value={data.summary.inactiveCustomers} icon={AlertTriangle} color="amber" />
                </>
              )}

              {activeTab === 'installation' && (
                <>
                  <MetricTile title="Total Installations" value={data.summary.totalInstallations} icon={HardDrive} color="blue" />
                  <MetricTile title="Active Systems" value={data.summary.activeInstallations} icon={CheckCircle} color="emerald" />
                  <MetricTile title="Planned Deployments" value={data.summary.plannedInstallations} icon={Clock} color="indigo" />
                  <MetricTile title="Suspended" value={data.summary.suspendedInstallations} icon={AlertTriangle} color="amber" />
                </>
              )}

              {activeTab === 'license' && (
                <>
                  <MetricTile title="Active Licenses" value={data.summary.activeLicenses} icon={Key} color="emerald" />
                  <MetricTile title="Expiring Soon (30d)" value={data.summary.expiringLicenses} icon={AlertTriangle} color="amber" />
                  <MetricTile title="Expired Licenses" value={data.summary.expiredLicenses} icon={AlertTriangle} color="rose" />
                  <MetricTile title="Renewal Revenue" value={`₹${data.summary.renewalRevenue.toLocaleString()}`} icon={DollarSign} color="blue" />
                </>
              )}

              {activeTab === 'finance' && (
                <>
                  <MetricTile title="Total Billed" value={`₹${data.summary.totalBilled.toLocaleString()}`} icon={DollarSign} color="blue" />
                  <MetricTile title="Total Collected" value={`₹${data.summary.totalCollected.toLocaleString()}`} icon={CheckCircle} color="emerald" />
                  <MetricTile title="Total Outstanding" value={`₹${data.summary.totalOutstanding.toLocaleString()}`} icon={Clock} color="amber" />
                  <MetricTile title="Total Overdue" value={`₹${data.summary.totalOverdue.toLocaleString()}`} icon={AlertTriangle} color="rose" />
                </>
              )}

              {activeTab === 'sales' && (
                <>
                  <MetricTile title="Total Deals" value={data.summary.totalLeads} icon={TrendingUp} color="blue" />
                  <MetricTile title="Won Deals" value={data.summary.wonLeads} icon={CheckCircle} color="emerald" />
                  <MetricTile title="Win Conversion Rate" value={`${data.summary.winRate}%`} icon={TrendingUp} color="indigo" />
                  <MetricTile title="Pipeline Value" value={`₹${data.summary.totalExpectedRevenue.toLocaleString()}`} icon={DollarSign} color="amber" />
                </>
              )}

              {activeTab === 'support' && (
                <>
                  <MetricTile title="Total Tickets" value={data.summary.totalTickets} icon={LifeBuoy} color="blue" />
                  <MetricTile title="Open Tickets" value={data.summary.openTickets} icon={AlertTriangle} color="rose" />
                  <MetricTile title="In Progress" value={data.summary.inProgressTickets} icon={Clock} color="indigo" />
                  <MetricTile title="Resolved Tickets" value={data.summary.resolvedTickets} icon={CheckCircle} color="emerald" />
                </>
              )}
            </div>
          )}

          {/* Breakdown Distribution Panels */}
          {activeTab === 'finance' && data?.summary?.aging && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-semibold text-slate-800 text-base">Outstanding Accounts Aging Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-500 font-medium">0 - 30 Days</span>
                  <div className="text-xl font-bold text-slate-800 mt-1">₹{data.summary.aging.days0To30.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs text-amber-700 font-medium">31 - 60 Days</span>
                  <div className="text-xl font-bold text-amber-900 mt-1">₹{data.summary.aging.days31To60.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="text-xs text-orange-700 font-medium">61 - 90 Days</span>
                  <div className="text-xl font-bold text-orange-900 mt-1">₹{data.summary.aging.days61To90.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <span className="text-xs text-rose-700 font-medium">90+ Days</span>
                  <div className="text-xl font-bold text-rose-900 mt-1">₹{data.summary.aging.days90Plus.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Data Master Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-700">{filteredRows.length}</span> records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  {activeTab === 'customer' && (
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Business Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Outlets</th>
                      <th className="py-3 px-4 text-center">Installations</th>
                      <th className="py-3 px-4 text-center">Licenses</th>
                    </tr>
                  )}
                  {activeTab === 'installation' && (
                    <tr>
                      <th className="py-3 px-4">Installation #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Outlet</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4 text-center">Terminals</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  )}
                  {activeTab === 'license' && (
                    <tr>
                      <th className="py-3 px-4">License #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  )}
                  {activeTab === 'finance' && (
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                      <th className="py-3 px-4 text-right">Balance (₹)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  )}
                  {activeTab === 'sales' && (
                    <tr>
                      <th className="py-3 px-4">Lead #</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4 text-right">Expected (₹)</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Assigned To</th>
                    </tr>
                  )}
                  {activeTab === 'support' && (
                    <tr>
                      <th className="py-3 px-4">Ticket #</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Customer</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No report records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        {activeTab === 'customer' && (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.customerCode}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{row.businessName}</td>
                            <td className="py-3 px-4">{row.businessType}</td>
                            <td className="py-3 px-4">{row.city}, {row.state}</td>
                            <td className="py-3 px-4"><Badge status={row.status} /></td>
                            <td className="py-3 px-4 text-center font-medium">{row.outletCount}</td>
                            <td className="py-3 px-4 text-center font-medium">{row.installationCount}</td>
                            <td className="py-3 px-4 text-center font-medium">{row.licenseCount}</td>
                          </>
                        )}
                        {activeTab === 'installation' && (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.installationNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{row.customerName}</td>
                            <td className="py-3 px-4">{row.outletName}</td>
                            <td className="py-3 px-4">{row.productName}</td>
                            <td className="py-3 px-4 font-mono">{row.version}</td>
                            <td className="py-3 px-4 text-center font-medium">{row.terminalCount}</td>
                            <td className="py-3 px-4"><Badge status={row.status} /></td>
                          </>
                        )}
                        {activeTab === 'license' && (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.licenseNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{row.customerName}</td>
                            <td className="py-3 px-4">{row.productName}</td>
                            <td className="py-3 px-4">{row.planName}</td>
                            <td className="py-3 px-4">{new Date(row.expiryDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right font-medium">₹{Number(row.totalAmount).toLocaleString()}</td>
                            <td className="py-3 px-4"><Badge status={row.status} /></td>
                          </>
                        )}
                        {activeTab === 'finance' && (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.invoiceNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{row.customerName}</td>
                            <td className="py-3 px-4">{new Date(row.invoiceDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{new Date(row.dueDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right font-semibold">₹{Number(row.totalAmount).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-semibold text-rose-600">₹{Number(row.balanceAmount).toLocaleString()}</td>
                            <td className="py-3 px-4"><Badge status={row.status} /></td>
                          </>
                        )}
                        {activeTab === 'sales' && (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.leadNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{row.companyName}</td>
                            <td className="py-3 px-4">{row.contactName}</td>
                            <td className="py-3 px-4">{row.city}</td>
                            <td className="py-3 px-4 text-right font-semibold">₹{Number(row.expectedValue).toLocaleString()}</td>
                            <td className="py-3 px-4"><Badge status={row.status} /></td>
                            <td className="py-3 px-4">{row.assignedToName}</td>
                          </>
                        )}
                        {activeTab === 'support' && (
                          <>
                            <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.ticketNumber}</td>
                            <td className="py-3 px-4 font-medium text-slate-800">{row.subject}</td>
                            <td className="py-3 px-4">{row.category}</td>
                            <td className="py-3 px-4"><Badge status={row.priority} /></td>
                            <td className="py-3 px-4"><Badge status={row.status} /></td>
                            <td className="py-3 px-4">{row.customerName}</td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MetricTile: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({
  title,
  value,
  icon: Icon,
  color,
}) => {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl border ${colorStyles[color] || colorStyles.blue}`}>
        <Icon size={22} />
      </div>
    </div>
  );
};

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toUpperCase() || 'UNKNOWN';

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  if (['ACTIVE', 'ACTIVATED', 'PAID', 'WON', 'RESOLVED', 'HIGH'].includes(s)) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['OPEN', 'PROSPECT', 'IN_PROGRESS', 'PLANNED', 'PROPOSAL', 'MEDIUM'].includes(s)) {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['EXPIRING_SOON', 'UNPAID', 'QUALIFIED', 'URGENT'].includes(s)) {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['EXPIRED', 'SUSPENDED', 'CANCELLED', 'LOST', 'OVERDUE'].includes(s)) {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${style}`}>
      {s}
    </span>
  );
};

export default ReportsPage;
