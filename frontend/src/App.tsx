import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { RolesPage } from './pages/Roles';
import { CustomersPage } from './pages/Customers';
import { Customer360Page } from './pages/Customer360';
import { OutletsPage } from './pages/Outlets';
import { ProductsPage } from './pages/Products';
import { InstallationsPage } from './pages/Installations';
import { LicensesPage } from './pages/Licenses';
import { RenewalsPage } from './pages/Renewals';
import { InvoicesPage } from './pages/Invoices';
import { PaymentsPage } from './pages/Payments';
import { OutstandingPage } from './pages/Outstanding';
import { LeadsPage } from './pages/Leads';
import { TicketsPage } from './pages/Tickets';
import { ReportsPage } from './pages/Reports';
import { CompanyAccounts } from './pages/CompanyAccounts';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-brand-600">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<Customer360Page />} />
            <Route path="outlets" element={<OutletsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="installations" element={<InstallationsPage />} />
            <Route path="licenses" element={<LicensesPage />} />
            <Route path="renewals" element={<RenewalsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="outstanding" element={<OutstandingPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="company-accounts" element={<CompanyAccounts />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
