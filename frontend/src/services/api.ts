import axios from 'axios';

export interface UserItem {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
  };
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  userCount: number;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionItem {
  id: string;
  module: string;
  action: string;
  description?: string;
}

export interface CustomerItem {
  id: string;
  customerCode: string;
  businessName: string;
  displayName: string;
  customerType?: string;
  businessType?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  status: 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  salesUser?: { id: string; name: string; email: string };
  primaryContact?: { id: string; name: string; phone?: string; email?: string };
  outletCount: number;
  installationCount: number;
  activeLicenseCount: number;
  openTicketCount: number;
  totalOutstanding: number;
  createdAt: string;
}

export interface ContactItem {
  id: string;
  customerId: string;
  name: string;
  designation?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  contactType?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export interface OutletItem {
  id: string;
  customerId: string;
  outletCode: string;
  outletName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  customer?: { id: string; businessName: string; customerCode: string };
  _count?: { installations: number };
  createdAt: string;
}

export interface ProductPlanItem {
  id: string;
  planCode: string;
  name: string;
  billingPeriod: string;
  price: number;
  maxTerminals: number;
  maxUsers: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductItem {
  id: string;
  productCode: string;
  name: string;
  description?: string;
  version?: string;
  status: 'ACTIVE' | 'INACTIVE';
  installationCount: number;
  licenseCount: number;
  plans: ProductPlanItem[];
  createdAt: string;
}

export interface InstallationItem {
  id: string;
  installationNumber: string;
  customerId: string;
  outletId: string;
  productId: string;
  version?: string;
  serverType?: string;
  serverName?: string;
  terminalCount: number;
  userCount: number;
  installedDate?: string;
  status: 'PLANNED' | 'INSTALLED' | 'ACTIVATED' | 'SUSPENDED' | 'DECOMMISSIONED';
  notes?: string;
  customer?: { id: string; businessName: string; customerCode: string };
  outlet?: { id: string; outletName: string; outletCode: string; city?: string };
  product?: { id: string; name: string; productCode: string };
  installedBy?: { id: string; name: string };
  _count?: { licenses: number };
  createdAt: string;
}

export interface LicenseItem {
  id: string;
  licenseNumber: string;
  licenseKey: string;
  licenseType: string;
  startDate: string;
  expiryDate: string;
  terminalCount: number;
  userCount: number;
  price: number;
  totalAmount: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
  autoRenew: boolean;
  customer: { id: string; businessName: string; customerCode: string };
  installation?: { id: string; installationNumber: string };
  product: { id: string; name: string; productCode: string };
  plan?: { id: string; name: string; planCode: string; billingPeriod: string; price: number };
  issuedBy?: { id: string; name: string };
  createdAt: string;
}

export interface RenewalItem {
  id: string;
  licenseId: string;
  licenseNumber?: string;
  licenseKey?: string;
  customerName?: string;
  productName?: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  amount: number;
  renewalDate: string;
  renewedBy?: string;
  notes?: string;
}

export interface ExpiringQueueItem {
  id: string;
  licenseNumber: string;
  licenseKey: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productName: string;
  planName?: string;
  planPrice: number;
  expiryDate: string;
  daysRemaining: number;
  status: string;
}

export interface InvoiceItemModel {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  product?: { id: string; name: string; productCode: string };
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  customer: { id: string; businessName: string; customerCode: string; taxNumber?: string; phone?: string; email?: string; addressLine1?: string; city?: string; state?: string };
  outlet?: { id: string; outletName: string; outletCode?: string; city?: string };
  installation?: { id: string; installationNumber: string; version?: string };
  createdBy?: string | { id: string; name: string };
  itemCount?: number;
  paymentCount?: number;
  items?: InvoiceItemModel[];
  payments?: PaymentItem[];
  createdAt: string;
}

export interface PaymentItem {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  bankName?: string;
  customer?: { id: string; businessName: string; customerCode: string };
  invoice?: { id: string; invoiceNumber: string; totalAmount: number; balanceAmount: number };
  collectedBy?: string;
  createdAt: string;
}

export interface UnpaidInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerCode: string;
  customerPhone?: string;
  customerEmail?: string;
  outletName?: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  daysOverdue: number;
  status: string;
}

export interface ActivityItem {
  id: string;
  activityType: 'CALL' | 'MEETING' | 'EMAIL' | 'DEMO' | 'NOTE';
  subject: string;
  activityDate: string;
  outcome?: string;
  nextFollowupDate?: string;
  notes?: string;
  user: { id: string; name: string; email?: string };
  lead?: { id: string; leadNumber: string; companyName: string };
  customer?: { id: string; businessName: string };
  createdAt: string;
}

export interface LeadItem {
  id: string;
  leadNumber: string;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  city?: string;
  businessType?: string;
  source?: string;
  expectedValue: number;
  status: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  assignedTo?: { id: string; name: string; email?: string };
  convertedCustomer?: { id: string; businessName: string; customerCode: string };
  activityCount?: number;
  activities?: ActivityItem[];
  createdAt: string;
}

export interface TicketCommentItem {
  id: string;
  ticketId: string;
  comment: string;
  user: { id: string; name: string };
  createdAt: string;
}

export interface TicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'LICENSE' | 'BILLING' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  customer: { id: string; businessName: string; customerCode: string; phone?: string; email?: string };
  outlet?: { id: string; outletName: string; outletCode?: string };
  installation?: { id: string; installationNumber: string; version?: string };
  contact?: { id: string; name: string; phone?: string; email?: string };
  assignedTo?: { id: string; name: string; email?: string };
  commentCount?: number;
  comments?: TicketCommentItem[];
  createdAt: string;
}

export interface ManagementDashboardData {
  metrics: {
    totalCustomers: number;
    newCustomers: number;
    activeInstallations: number;
    activeLicenses: number;
    expiringLicenses: number;
    expiredLicenses: number;
    monthlyRevenue: number;
    totalOutstanding: number;
    totalOverdue: number;
    openTickets: number;
  };
  recentInstallations: Array<{
    id: string;
    installationNumber: string;
    customerName: string;
    outletName: string;
    productName: string;
    version?: string;
    status: string;
    createdAt: string;
  }>;
  recentRenewals: Array<{
    id: string;
    licenseNumber: string;
    customerName: string;
    productName: string;
    amount: number;
    newExpiryDate: string;
    renewedByName: string;
  }>;
}

export interface SalesDashboardData {
  metrics: {
    newLeads: number;
    openLeads: number;
    demosCount: number;
    quotationsCount: number;
    wonLeads: number;
    lostLeads: number;
    expectedRevenue: number;
    todayFollowupsCount: number;
  };
  pipeline: Array<{
    status: string;
    count: number;
    value: number;
  }>;
  todaysFollowups: Array<{
    id: string;
    activityType: string;
    subject: string;
    nextFollowupDate: string;
    companyOrCustomer: string;
    contactPerson: string;
    phone: string;
    userName: string;
  }>;
  recentLeads: Array<{
    id: string;
    leadNumber: string;
    companyName: string;
    contactName: string;
    expectedValue: number;
    status: string;
    assignedToName: string;
    createdAt: string;
  }>;
}

export interface AccountsDashboardData {
  metrics: {
    totalInvoices: number;
    totalPayments: number;
    todaysCollection: number;
    monthlyCollection: number;
    totalOutstanding: number;
    totalOverdue: number;
    aging: {
      days0To30: number;
      days31To60: number;
      days61To90: number;
      days90Plus: number;
    };
  };
  overdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerCode: string;
    totalAmount: number;
    balanceAmount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  recentPayments: Array<{
    id: string;
    receiptNumber: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
  }>;
}

export interface SupportDashboardData {
  metrics: {
    openTickets: number;
    inProgressTickets: number;
    criticalTickets: number;
    unassignedTickets: number;
    myTickets: number;
    resolvedToday: number;
    avgResolutionTimeHours: number;
  };
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    customerName: string;
    assignedToName: string;
    createdAt: string;
  }>;
}

export const api = {
  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string; roleId?: string; status?: string }) => {
    const res = await axios.get('/api/users', { params });
    return res.data;
  },

  getUser: async (id: string) => {
    const res = await axios.get(`/api/users/${id}`);
    return res.data;
  },

  createUser: async (data: any) => {
    const res = await axios.post('/api/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: any) => {
    const res = await axios.put(`/api/users/${id}`, data);
    return res.data;
  },

  resetPassword: async (id: string, password: string) => {
    const res = await axios.post(`/api/users/${id}/reset-password`, { password });
    return res.data;
  },

  // Roles & Permissions
  getRoles: async () => {
    const res = await axios.get('/api/roles');
    return res.data;
  },

  getPermissions: async () => {
    const res = await axios.get('/api/roles/permissions');
    return res.data;
  },

  getRolePermissions: async (roleId: string) => {
    const res = await axios.get(`/api/roles/${roleId}/permissions`);
    return res.data;
  },

  createRole: async (data: { name: string; description?: string }) => {
    const res = await axios.post('/api/roles', data);
    return res.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const res = await axios.put(`/api/roles/${roleId}/permissions`, { permissionIds });
    return res.data;
  },

  // Customers
  getCustomers: async (params?: { page?: number; limit?: number; search?: string; status?: string; salesUserId?: string }) => {
    const res = await axios.get('/api/customers', { params });
    return res.data;
  },

  getCustomer360: async (id: string) => {
    const res = await axios.get(`/api/customers/${id}/360`);
    return res.data;
  },

  createCustomer: async (data: any) => {
    const res = await axios.post('/api/customers', data);
    return res.data;
  },

  updateCustomer: async (id: string, data: any) => {
    const res = await axios.put(`/api/customers/${id}`, data);
    return res.data;
  },

  // Contacts
  getContacts: async (customerId?: string) => {
    const res = await axios.get('/api/customers/contacts/all', { params: { customerId } });
    return res.data;
  },

  createContact: async (data: any) => {
    const res = await axios.post('/api/customers/contacts', data);
    return res.data;
  },

  updateContact: async (id: string, data: any) => {
    const res = await axios.put(`/api/customers/contacts/${id}`, data);
    return res.data;
  },

  deleteContact: async (id: string) => {
    const res = await axios.delete(`/api/customers/contacts/${id}`);
    return res.data;
  },

  // Outlets
  getOutlets: async (params?: { customerId?: string; search?: string }) => {
    const res = await axios.get('/api/customers/outlets/all', { params });
    return res.data;
  },

  createOutlet: async (data: any) => {
    const res = await axios.post('/api/customers/outlets', data);
    return res.data;
  },

  updateOutlet: async (id: string, data: any) => {
    const res = await axios.put(`/api/customers/outlets/${id}`, data);
    return res.data;
  },

  deleteOutlet: async (id: string) => {
    const res = await axios.delete(`/api/customers/outlets/${id}`);
    return res.data;
  },

  // Products & Plans
  getProducts: async () => {
    const res = await axios.get('/api/products');
    return res.data;
  },

  createProduct: async (data: any) => {
    const res = await axios.post('/api/products', data);
    return res.data;
  },

  updateProduct: async (id: string, data: any) => {
    const res = await axios.put(`/api/products/${id}`, data);
    return res.data;
  },

  createProductPlan: async (data: any) => {
    const res = await axios.post('/api/products/plans', data);
    return res.data;
  },

  updateProductPlan: async (planId: string, data: any) => {
    const res = await axios.put(`/api/products/plans/${planId}`, data);
    return res.data;
  },

  // Installations
  getInstallations: async (params?: { page?: number; limit?: number; search?: string; productId?: string; status?: string; customerId?: string }) => {
    const res = await axios.get('/api/installations', { params });
    return res.data;
  },

  createInstallation: async (data: any) => {
    const res = await axios.post('/api/installations', data);
    return res.data;
  },

  updateInstallation: async (id: string, data: any) => {
    const res = await axios.put(`/api/installations/${id}`, data);
    return res.data;
  },

  // Licenses
  getLicenses: async (params?: { page?: number; limit?: number; search?: string; productId?: string; status?: string; customerId?: string }) => {
    const res = await axios.get('/api/licenses', { params });
    return res.data;
  },

  issueLicense: async (data: any) => {
    const res = await axios.post('/api/licenses', data);
    return res.data;
  },

  validateLicense: async (licenseKey: string) => {
    const res = await axios.post('/api/licenses/validate', { licenseKey });
    return res.data;
  },

  updateLicenseStatus: async (id: string, status: string, reason?: string) => {
    const res = await axios.put(`/api/licenses/${id}/status`, { status, reason });
    return res.data;
  },

  // Renewals
  getRenewals: async () => {
    const res = await axios.get('/api/renewals');
    return res.data;
  },

  renewLicense: async (data: { licenseId: string; renewalMonths?: number; amount: number; notes?: string }) => {
    const res = await axios.post('/api/renewals', data);
    return res.data;
  },

  // Invoices
  getInvoices: async (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }) => {
    const res = await axios.get('/api/invoices', { params });
    return res.data;
  },

  getInvoice: async (id: string) => {
    const res = await axios.get(`/api/invoices/${id}`);
    return res.data;
  },

  createInvoice: async (data: any) => {
    const res = await axios.post('/api/invoices', data);
    return res.data;
  },

  getOutstanding: async () => {
    const res = await axios.get('/api/invoices/outstanding');
    return res.data;
  },

  // Payments
  getPayments: async (params?: { page?: number; limit?: number; search?: string; customerId?: string }) => {
    const res = await axios.get('/api/payments', { params });
    return res.data;
  },

  createPayment: async (data: { invoiceId: string; customerId: string; amount: number; paymentMethod: string; referenceNumber?: string; bankName?: string; notes?: string }) => {
    const res = await axios.post('/api/payments', data);
    return res.data;
  },

  // Leads
  getLeads: async (params?: { page?: number; limit?: number; search?: string; status?: string; assignedToId?: string }) => {
    const res = await axios.get('/api/leads', { params });
    return res.data;
  },

  getLead: async (id: string) => {
    const res = await axios.get(`/api/leads/${id}`);
    return res.data;
  },

  createLead: async (data: any) => {
    const res = await axios.post('/api/leads', data);
    return res.data;
  },

  updateLead: async (id: string, data: any) => {
    const res = await axios.put(`/api/leads/${id}`, data);
    return res.data;
  },

  convertLead: async (id: string) => {
    const res = await axios.post(`/api/leads/${id}/convert`);
    return res.data;
  },

  // Activities
  getActivities: async (params?: { leadId?: string; customerId?: string }) => {
    const res = await axios.get('/api/activities', { params });
    return res.data;
  },

  createActivity: async (data: { leadId?: string; customerId?: string; activityType: string; subject: string; outcome?: string; notes?: string }) => {
    const res = await axios.post('/api/activities', data);
    return res.data;
  },

  // Tickets
  getTickets: async (params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string; category?: string; customerId?: string }) => {
    const res = await axios.get('/api/tickets', { params });
    return res.data;
  },

  getTicket: async (id: string) => {
    const res = await axios.get(`/api/tickets/${id}`);
    return res.data;
  },

  createTicket: async (data: any) => {
    const res = await axios.post('/api/tickets', data);
    return res.data;
  },

  updateTicket: async (id: string, data: { status?: string; priority?: string; category?: string; assignedToId?: string; resolutionNotes?: string }) => {
    const res = await axios.put(`/api/tickets/${id}`, data);
    return res.data;
  },

  addTicketComment: async (id: string, comment: string) => {
    const res = await axios.post(`/api/tickets/${id}/comments`, { comment });
    return res.data;
  },

  // Dashboards
  getManagementDashboard: async () => {
    const res = await axios.get('/api/dashboard/management');
    return res.data;
  },

  getSalesDashboard: async () => {
    const res = await axios.get('/api/dashboard/sales');
    return res.data;
  },

  getAccountsDashboard: async () => {
    const res = await axios.get('/api/dashboard/accounts');
    return res.data;
  },

  getSupportDashboard: async () => {
    const res = await axios.get('/api/dashboard/support');
    return res.data;
  },

  // Reports
  getCustomerReport: async () => {
    const res = await axios.get('/api/reports/customer');
    return res.data;
  },

  getInstallationReport: async () => {
    const res = await axios.get('/api/reports/installation');
    return res.data;
  },

  getLicenseReport: async () => {
    const res = await axios.get('/api/reports/license');
    return res.data;
  },

  getFinanceReport: async () => {
    const res = await axios.get('/api/reports/finance');
    return res.data;
  },

  getSalesReport: async () => {
    const res = await axios.get('/api/reports/sales');
    return res.data;
  },

  getSupportReport: async () => {
    const res = await axios.get('/api/reports/support');
    return res.data;
  },

  // Notifications
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const res = await axios.get('/api/notifications', { params });
    return res.data;
  },

  markNotificationRead: async (id: string) => {
    const res = await axios.put(`/api/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await axios.put('/api/notifications/read-all');
    return res.data;
  },

  generateNotifications: async () => {
    const res = await axios.post('/api/notifications/generate');
    return res.data;
  },

  // Company Accounts & Assets
  getCompanyTransactions: async (params?: { page?: number; limit?: number; type?: string }) => {
    const res = await axios.get('/api/company-accounts/transactions', { params });
    return res.data;
  },

  recordQuickExpense: async (data: {
    accountCode: string;
    amount: number;
    paymentMethod: string;
    vendorName?: string;
    description: string;
    entryDate?: string;
  }) => {
    const res = await axios.post('/api/company-accounts/quick-expense', data);
    return res.data;
  },

  recordQuickIncome: async (data: {
    accountCode: string;
    amount: number;
    paymentMethod: string;
    payerName?: string;
    description: string;
    entryDate?: string;
  }) => {
    const res = await axios.post('/api/company-accounts/quick-income', data);
    return res.data;
  },

  createJournalEntry: async (data: {
    entryDate?: string;
    reference?: string;
    description: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      memo?: string;
    }>;
  }) => {
    const res = await axios.post('/api/company-accounts/journal-entry', data);
    return res.data;
  },

  deleteCompanyTransaction: async (id: string) => {
    const res = await axios.delete(`/api/company-accounts/transactions/${id}`);
    return res.data;
  },

  getChartOfAccounts: async () => {
    const res = await axios.get('/api/company-accounts/chart-of-accounts');
    return res.data;
  },

  getTrialBalance: async () => {
    const res = await axios.get('/api/company-accounts/trial-balance');
    return res.data;
  },

  getProfitAndLoss: async () => {
    const res = await axios.get('/api/company-accounts/profit-and-loss');
    return res.data;
  },

  getBalanceSheet: async () => {
    const res = await axios.get('/api/company-accounts/balance-sheet');
    return res.data;
  },

  getGeneralLedger: async (params?: { accountCode?: string }) => {
    const res = await axios.get('/api/company-accounts/general-ledger', { params });
    return res.data;
  },

  getCompanyAssets: async () => {
    const res = await axios.get('/api/company-accounts/assets');
    return res.data;
  },

  createCompanyAsset: async (data: any) => {
    const res = await axios.post('/api/company-accounts/assets', data);
    return res.data;
  },

  deleteCompanyAsset: async (id: string) => {
    const res = await axios.delete(`/api/company-accounts/assets/${id}`);
    return res.data;
  },

  // Mobile POS
  registerMobilePos: async (data: {
    businessName: string;
    displayName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    outletName?: string;
    productId?: string;
    licenseType?: string;
    validityDays?: number;
    terminalCount?: number;
    deviceInfo?: string;
  }) => {
    const res = await axios.post('/api/mobile-pos/register', data);
    return res.data;
  },
};

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS';
  category: 'LICENSE' | 'FINANCE' | 'SALES' | 'SUPPORT' | 'GENERAL';
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CompanyTransactionItem {
  id: string;
  entryNumber: string;
  entryDate: string;
  type: 'EXPENSE' | 'INCOME' | 'JOURNAL';
  reference: string;
  description: string;
  categoryName: string;
  accountCode: string;
  amount: number;
  createdByName: string;
  createdAt: string;
}

export interface ChartAccountItem {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  subCategory: string;
  isSystem: boolean;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface CompanyAssetItem {
  id: string;
  assetCode: string;
  assetName: string;
  category: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  depreciationRate: number;
  location: string;
  assignedToName: string;
  status: string;
  notes: string;
}

export interface TrialBalanceRow {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

export interface ProfitAndLossReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  revenues: Array<{ accountCode: string; accountName: string; amount: number }>;
  expenses: Array<{ accountCode: string; accountName: string; amount: number }>;
}

export interface BalanceSheetReport {
  assets: {
    cashAndBank: number;
    accountsReceivable: number;
    fixedAssets: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    taxPayable: number;
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  isBalanced: boolean;
}

export interface LedgerStatementData {
  account: {
    accountCode: string;
    accountName: string;
    accountType: string;
    currentBalance: number;
  };
  ledgerEntries: Array<{
    id: string;
    entryNumber: string;
    entryDate: string;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
    createdByName: string;
  }>;
}


