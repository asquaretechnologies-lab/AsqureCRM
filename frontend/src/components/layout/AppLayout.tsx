import React, { useState } from 'react';
import { NotificationTray } from './NotificationTray';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  MonitorCheck,
  KeyRound,
  RefreshCw,
  FileText,
  CreditCard,
  AlertCircle,
  Headphones,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Package,
  Settings,
  History,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  Search,
  Building2,
  TrendingUp,
  Landmark,
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: {
    label: string;
    path: string;
    icon: React.ElementType;
    module?: string;
  }[];
}

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation: NavGroup[] = [
    {
      label: 'Main',
      items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'Sales',
      items: [
        { label: 'Leads', path: '/leads', icon: TrendingUp, module: 'leads' },
        { label: 'Activities', path: '/activities', icon: RefreshCw, module: 'activities' },
      ],
    },
    {
      label: 'Customers',
      items: [
        { label: 'Customers', path: '/customers', icon: Building2, module: 'customers' },
        { label: 'Outlets', path: '/outlets', icon: Store, module: 'outlets' },
        { label: 'Installations', path: '/installations', icon: MonitorCheck, module: 'installations' },
      ],
    },
    {
      label: 'Licensing',
      items: [
        { label: 'Licenses', path: '/licenses', icon: KeyRound, module: 'licenses' },
        { label: 'Renewals', path: '/renewals', icon: RefreshCw, module: 'renewals' },
      ],
    },
    {
      label: 'Billing & Accounts',
      items: [
        { label: 'Invoices', path: '/invoices', icon: FileText, module: 'invoices' },
        { label: 'Payments', path: '/payments', icon: CreditCard, module: 'payments' },
        { label: 'Outstanding', path: '/outstanding', icon: AlertCircle, module: 'invoices' },
        { label: 'Company Accounts & Assets', path: '/company-accounts', icon: Landmark, module: 'invoices' },
      ],
    },
    {
      label: 'Support',
      items: [{ label: 'Tickets', path: '/tickets', icon: Headphones, module: 'tickets' }],
    },
    {
      label: 'Analytics',
      items: [{ label: 'Reports', path: '/reports', icon: BarChart3, module: 'reports' }],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Users', path: '/users', icon: UserCheck, module: 'users' },
        { label: 'Roles', path: '/roles', icon: ShieldCheck, module: 'roles' },
        { label: 'Products', path: '/products', icon: Package, module: 'products' },
        { label: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
        { label: 'Audit Logs', path: '/audit-logs', icon: History, module: 'audit_logs' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between z-30 sticky top-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/20">
              AQ
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">Asqure</span>
              <span className="text-xs ml-1 text-brand-700 font-semibold px-1.5 py-0.5 rounded bg-brand-50 border border-brand-200">
                CRM
              </span>
            </div>
          </Link>
        </div>

        {/* Search Input */}
        <div className="hidden md:flex items-center max-w-md w-full relative">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search customers, installations, licenses, invoices..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
          />
        </div>

        {/* User Stats & Profile */}
        <div className="flex items-center gap-4">
          <NotificationTray />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-semibold text-brand-700 text-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{user?.role}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                    {user?.employeeCode}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
          } transition-all duration-300 bg-white border-r border-slate-200/80 flex flex-col z-20 overflow-y-auto shrink-0 shadow-xs`}
        >
          <div className="p-3 space-y-6">
            {navigation.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-1">
                  {group.label}
                </p>
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 border border-brand-200/80 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* Main Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
