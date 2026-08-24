import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Building,
  Laptop,
  BookOpen,
  PieChart,
  Scale,
  Calendar,
  Layers,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import {
  api,
  CompanyTransactionItem,
  ChartAccountItem,
  CompanyAssetItem,
  TrialBalanceRow,
  ProfitAndLossReport,
  BalanceSheetReport,
  LedgerStatementData,
} from '../services/api';
import { exportToCSV } from '../utils/csvExport';

export const CompanyAccounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'statements' | 'generalLedger' | 'assets' | 'coa'>('ledger');
  const [statementSubTab, setStatementSubTab] = useState<'pnl' | 'balanceSheet' | 'trialBalance'>('pnl');

  // State Data
  const [transactions, setTransactions] = useState<CompanyTransactionItem[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartAccountItem[]>([]);
  const [assets, setAssets] = useState<CompanyAssetItem[]>([]);
  const [trialBalance, setTrialBalance] = useState<{ rows: TrialBalanceRow[]; totals: { totalDebit: number; totalCredit: number; isBalanced: boolean } } | null>(null);
  const [pnlReport, setPnlReport] = useState<ProfitAndLossReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetReport | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerStatementData | null>(null);
  const [selectedLedgerAcc, setSelectedLedgerAcc] = useState<string>('1010');

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Form Inputs
  const [journalForm, setJournalForm] = useState<{
    entryDate: string;
    reference: string;
    description: string;
    lines: Array<{ accountId: string; debit: string; credit: string; memo: string }>;
  }>({
    entryDate: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { accountId: '', debit: '', credit: '', memo: '' },
      { accountId: '', debit: '', credit: '', memo: '' },
    ],
  });

  // Form Inputs
  const [expenseForm, setExpenseForm] = useState({
    accountCode: '5020',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    vendorName: '',
    description: '',
  });

  const [incomeForm, setIncomeForm] = useState({
    accountCode: '4030',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    payerName: '',
    description: '',
  });

  const [assetForm, setAssetForm] = useState({
    assetName: '',
    category: 'HARDWARE',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    currentValue: '',
    depreciationRate: '15',
    location: 'Bangalore HQ Office',
    notes: '',
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [txRes, coaRes, assetRes, pnlRes, bsRes, tbRes, glRes] = await Promise.all([
        api.getCompanyTransactions({ limit: 100 }).catch(() => ({ success: false })),
        api.getChartOfAccounts().catch(() => ({ success: false })),
        api.getCompanyAssets().catch(() => ({ success: false })),
        api.getProfitAndLoss().catch(() => ({ success: false })),
        api.getBalanceSheet().catch(() => ({ success: false })),
        api.getTrialBalance().catch(() => ({ success: false })),
        api.getGeneralLedger({ accountCode: selectedLedgerAcc }).catch(() => ({ success: false })),
      ]);

      if (txRes.success && txRes.data) setTransactions(txRes.data.transactions || []);
      if (coaRes.success && coaRes.data) setChartOfAccounts(coaRes.data.accounts || []);
      if (assetRes.success && assetRes.data) setAssets(assetRes.data.assets || []);
      if (pnlRes.success && pnlRes.data) setPnlReport(pnlRes.data);
      if (bsRes.success && bsRes.data) setBalanceSheet(bsRes.data);
      if (tbRes.success && tbRes.data) setTrialBalance(tbRes.data);
      if (glRes.success && glRes.data) setLedgerData(glRes.data);
    } catch (err) {
      console.error('Failed to load company accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleFetchLedger = async (accCode: string) => {
    setSelectedLedgerAcc(accCode);
    try {
      const res = await api.getGeneralLedger({ accountCode: accCode });
      if (res.success && res.data) {
        setLedgerData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.recordQuickExpense({
        accountCode: expenseForm.accountCode,
        amount: parseFloat(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        vendorName: expenseForm.vendorName,
        description: expenseForm.description,
      });
      if (res.success) {
        setShowExpenseModal(false);
        setExpenseForm({ accountCode: '5020', amount: '', paymentMethod: 'BANK_TRANSFER', vendorName: '', description: '' });
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to record expense:', err);
    }
  };

  const handleRecordIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.recordQuickIncome({
        accountCode: incomeForm.accountCode,
        amount: parseFloat(incomeForm.amount),
        paymentMethod: incomeForm.paymentMethod,
        payerName: incomeForm.payerName,
        description: incomeForm.description,
      });
      if (res.success) {
        setShowIncomeModal(false);
        setIncomeForm({ accountCode: '4030', amount: '', paymentMethod: 'BANK_TRANSFER', payerName: '', description: '' });
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to record income:', err);
    }
  };

  const handleAddJournalLine = () => {
    setJournalForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', debit: '', credit: '', memo: '' }],
    }));
  };

  const handleRemoveJournalLine = (index: number) => {
    if (journalForm.lines.length <= 2) return;
    setJournalForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleJournalLineChange = (index: number, field: string, value: string) => {
    setJournalForm((prev) => {
      const updatedLines = [...prev.lines];
      updatedLines[index] = { ...updatedLines[index], [field]: value };
      return { ...prev, lines: updatedLines };
    });
  };

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedLines = journalForm.lines.map((l) => ({
      accountId: l.accountId,
      debit: parseFloat(l.debit || '0'),
      credit: parseFloat(l.credit || '0'),
      memo: l.memo || journalForm.description,
    }));

    const totalDebit = formattedLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = formattedLines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`Unbalanced Journal Entry!\nTotal Debits: ₹${totalDebit.toLocaleString()}\nTotal Credits: ₹${totalCredit.toLocaleString()}\nDebits and Credits must be equal to post.`);
      return;
    }

    try {
      const res = await api.createJournalEntry({
        entryDate: journalForm.entryDate,
        reference: journalForm.reference,
        description: journalForm.description,
        lines: formattedLines,
      });

      if (res.success) {
        setShowJournalModal(false);
        setJournalForm({
          entryDate: new Date().toISOString().split('T')[0],
          reference: '',
          description: '',
          lines: [
            { accountId: '', debit: '', credit: '', memo: '' },
            { accountId: '', debit: '', credit: '', memo: '' },
          ],
        });
        fetchAllData();
      }
    } catch (err: any) {
      console.error('Failed to post journal entry:', err);
      alert(err.response?.data?.error?.message || 'Failed to post journal voucher');
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCompanyAsset({
        assetName: assetForm.assetName,
        category: assetForm.category,
        serialNumber: assetForm.serialNumber,
        purchaseDate: assetForm.purchaseDate,
        purchaseCost: parseFloat(assetForm.purchaseCost),
        currentValue: assetForm.currentValue ? parseFloat(assetForm.currentValue) : parseFloat(assetForm.purchaseCost),
        depreciationRate: parseFloat(assetForm.depreciationRate || '0'),
        location: assetForm.location,
        notes: assetForm.notes,
      });
      if (res.success) {
        setShowAssetModal(false);
        setAssetForm({ assetName: '', category: 'HARDWARE', serialNumber: '', purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: '', currentValue: '', depreciationRate: '15', location: 'Bangalore HQ Office', notes: '' });
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to create asset:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction entry?')) return;
    try {
      await api.deleteCompanyTransaction(id);
      fetchAllData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete/dispose this company asset?')) return;
    try {
      await api.deleteCompanyAsset(id);
      fetchAllData();
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.entryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportLedgerCSV = () => {
    const columns = [
      { key: 'entryNumber', label: 'Txn Number' },
      { key: 'entryDate', label: 'Date', formatter: (val: any) => new Date(val).toLocaleDateString() },
      { key: 'type', label: 'Type' },
      { key: 'categoryName', label: 'Category' },
      { key: 'accountCode', label: 'Account Code' },
      { key: 'description', label: 'Description' },
      { key: 'reference', label: 'Reference' },
      { key: 'amount', label: 'Amount' },
      { key: 'createdByName', label: 'Recorded By' },
    ];
    exportToCSV(`Company_Expense_Ledger_${new Date().toISOString().split('T')[0]}`, columns, filteredTransactions);
  };

  const expenseAccounts = chartOfAccounts.filter((a) => a.accountType === 'EXPENSE');

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="h-7 w-7 text-brand-600" />
            Company Accounts & Financials
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            General Ledger, Easy Expense & Income Entry, P&L, Balance Sheet, Trial Balance, & Asset Management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJournalModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            Journal Entry
          </button>
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Quick Income
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Quick Expense
          </button>
          <button
            onClick={fetchAllData}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh Financials"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{(pnlReport?.summary?.totalRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Customer payments + manual income</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{(pnlReport?.summary?.totalExpenses || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Salaries, Rent, Hosting & Utilities</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Operating Profit</span>
            <div className={`p-2 rounded-lg ${(pnlReport?.summary?.netProfit || 0) >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold ${(pnlReport?.summary?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{(pnlReport?.summary?.netProfit || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Margin: {pnlReport?.summary?.profitMargin || 0}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fixed Asset Valuation</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Laptop className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">
              ₹{(balanceSheet?.assets?.fixedAssets || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{assets.length} items in asset register</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 pt-3 rounded-xl border shadow-xs">
        <nav className="flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wallet className="h-4 w-4" />
            Expense & Income Ledger
          </button>

          <button
            onClick={() => setActiveTab('statements')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'statements'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PieChart className="h-4 w-4" />
            Financial Statements (P&L / BS / TB)
          </button>

          <button
            onClick={() => setActiveTab('generalLedger')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'generalLedger'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            General Ledger Statement
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'assets'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Laptop className="h-4 w-4" />
            Asset Register ({assets.length})
          </button>

          <button
            onClick={() => setActiveTab('coa')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'coa'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="h-4 w-4" />
            Chart of Accounts
          </button>
        </nav>
      </div>

      {/* TAB 1: Easy Expense & Income Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="EXPENSE">Expenses Only</option>
                <option value="INCOME">Income Only</option>
              </select>
            </div>

            <button
              onClick={handleExportLedgerCSV}
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Txn Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No ledger transactions found. Click "+ Quick Expense" or "+ Quick Income" to record entries.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.entryNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(item.entryDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.type === 'EXPENSE'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.categoryName}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.description}</td>
                      <td className="py-3 px-4 text-slate-500">{item.reference}</td>
                      <td className={`py-3 px-4 text-right font-bold ${item.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.type === 'EXPENSE' ? '-' : '+'}₹{item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Financial Statements (P&L, Balance Sheet, Trial Balance) */}
      {activeTab === 'statements' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setStatementSubTab('pnl')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                statementSubTab === 'pnl'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Profit & Loss (P&L) Statement
            </button>
            <button
              onClick={() => setStatementSubTab('balanceSheet')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                statementSubTab === 'balanceSheet'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Balance Sheet
            </button>
            <button
              onClick={() => setStatementSubTab('trialBalance')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                statementSubTab === 'trialBalance'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Trial Balance Report
            </button>
          </div>

          {/* Sub-Tab: Profit & Loss */}
          {statementSubTab === 'pnl' && pnlReport && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h2>
                  <p className="text-xs text-slate-500">For current accounting period</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">NET OPERATING MARGIN</span>
                  <span className={`text-xl font-bold ${pnlReport.summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ₹{pnlReport.summary.netProfit.toLocaleString()} ({pnlReport.summary.profitMargin}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Section */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 border-b pb-2 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <TrendingUp className="h-4 w-4" /> Operating Revenues
                    </span>
                    <span className="text-emerald-700 font-bold">₹{pnlReport.summary.totalRevenue.toLocaleString()}</span>
                  </h3>
                  <div className="space-y-2">
                    {pnlReport.revenues.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-600 py-1 border-b border-slate-100">
                        <span>{r.accountCode} - {r.accountName}</span>
                        <span className="font-semibold text-slate-900">₹{r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 border-b pb-2 text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <TrendingDown className="h-4 w-4" /> Operating Expenses
                    </span>
                    <span className="text-rose-700 font-bold">₹{pnlReport.summary.totalExpenses.toLocaleString()}</span>
                  </h3>
                  <div className="space-y-2">
                    {pnlReport.expenses.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-600 py-1 border-b border-slate-100">
                        <span>{e.accountCode} - {e.accountName}</span>
                        <span className="font-semibold text-slate-900">₹{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Balance Sheet */}
          {statementSubTab === 'balanceSheet' && balanceSheet && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Company Balance Sheet</h2>
                  <p className="text-xs text-slate-500">Assets = Liabilities + Equity</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Balanced Statement
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-slate-900 border-b pb-2 text-sm text-brand-700">ASSETS</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Cash & Bank Balances</span>
                      <span className="font-semibold">₹{balanceSheet.assets.cashAndBank.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Accounts Receivable (Outstanding Invoices)</span>
                      <span className="font-semibold">₹{balanceSheet.assets.accountsReceivable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Fixed & Digital Assets Valuation</span>
                      <span className="font-semibold">₹{balanceSheet.assets.fixedAssets.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-bold text-slate-900 border-t">
                      <span>TOTAL ASSETS</span>
                      <span className="text-brand-700">₹{balanceSheet.assets.totalAssets.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-slate-900 border-b pb-2 text-sm text-purple-700">LIABILITIES & EQUITY</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Accounts Payable & Liabilities</span>
                      <span className="font-semibold">₹{balanceSheet.liabilities.totalLiabilities.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Owner Capital Account</span>
                      <span className="font-semibold">₹{balanceSheet.equity.capital.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Retained Earnings (Net Operating Profit)</span>
                      <span className="font-semibold text-emerald-600">₹{balanceSheet.equity.retainedEarnings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-bold text-slate-900 border-t">
                      <span>TOTAL LIABILITIES & EQUITY</span>
                      <span className="text-purple-700">₹{(balanceSheet.liabilities.totalLiabilities + balanceSheet.equity.totalEquity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab: Trial Balance */}
          {statementSubTab === 'trialBalance' && trialBalance && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Trial Balance Statement</h2>
                  <p className="text-xs text-slate-500">Audit report verifying total debits equal total credits across all accounts</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Debits = Credits Match
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-semibold border-b">
                    <tr>
                      <th className="py-3 px-4">Account Code</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Debit Balance (₹)</th>
                      <th className="py-3 px-4 text-right">Credit Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trialBalance.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">{row.accountCode}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{row.accountName}</td>
                        <td className="py-2.5 px-4 text-xs text-slate-500">{row.accountType}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                          {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-slate-900">
                          {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-4">TOTALS</td>
                      <td className="py-3 px-4 text-right text-brand-700">₹{trialBalance.totals.totalDebit.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-brand-700">₹{trialBalance.totals.totalCredit.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: General Ledger Statement */}
      {activeTab === 'generalLedger' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">General Ledger Statement</h2>
              <p className="text-xs text-slate-500">Itemized debit/credit entries with running balance</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Select Account:</label>
              <select
                value={selectedLedgerAcc}
                onChange={(e) => handleFetchLedger(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none"
              >
                {chartOfAccounts.map((acc) => (
                  <option key={acc.id} value={acc.accountCode}>
                    {acc.accountCode} - {acc.accountName} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {ledgerData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ledgerData.account.accountCode} - {ledgerData.account.accountName}</h3>
                  <span className="text-xs text-slate-500">Account Type: {ledgerData.account.accountType}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">CURRENT BALANCE</span>
                  <span className="text-lg font-bold text-brand-700">₹{ledgerData.account.currentBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[11px] font-semibold border-b">
                    <tr>
                      <th className="py-3 px-4">Txn #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Debit (₹)</th>
                      <th className="py-3 px-4 text-right">Credit (₹)</th>
                      <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerData.ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          No transactions logged for this account yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerData.ledgerEntries.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">{line.entryNumber}</td>
                          <td className="py-3 px-4 text-slate-500">{new Date(line.entryDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{line.description}</td>
                          <td className="py-3 px-4 text-slate-500">{line.reference}</td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                            {line.debit > 0 ? `₹${line.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-rose-600">
                            {line.credit > 0 ? `₹${line.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ₹{line.runningBalance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Asset Register */}
      {activeTab === 'assets' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Company Asset Register</h2>
              <p className="text-xs text-slate-500">Track physical & digital assets, valuation, and employee assignment</p>
            </div>

            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Register Asset
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 uppercase text-[11px] font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Asset Code</th>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Purchase Cost</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No assets registered. Click "+ Register Asset" to add company hardware, vehicles, or software.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{asset.assetCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{asset.assetName}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">{asset.category}</td>
                      <td className="py-3 px-4 text-slate-500">{asset.location}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          <UserCheck className="h-3 w-3 text-slate-500" />
                          {asset.assignedToName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">₹{asset.purchaseCost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{asset.currentValue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Delete asset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Chart of Accounts */}
      {activeTab === 'coa' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chart of Accounts (COA)</h2>
              <p className="text-xs text-slate-500">Master ledger accounts for Assets, Liabilities, Equity, Revenues & Expenses</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 uppercase text-[11px] font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Debit Total</th>
                  <th className="py-3 px-4 text-right">Credit Total</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartOfAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{acc.accountCode}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{acc.accountName}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{acc.subCategory}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500">₹{acc.totalDebit.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-slate-500">₹{acc.totalCredit.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-brand-700">₹{acc.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Plus className="h-5 w-5 text-rose-600" />
                Record Quick Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={expenseForm.accountCode}
                  onChange={(e) => setExpenseForm({ ...expenseForm, accountCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                  required
                >
                  {expenseAccounts.map((acc) => (
                    <option key={acc.id} value={acc.accountCode}>
                      {acc.accountCode} - {acc.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Cloud, Landlord, Employee Name"
                  value={expenseForm.vendorName}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Memo *</label>
                <input
                  type="text"
                  placeholder="e.g. Office Rent for February 2026"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Save Expense Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Plus className="h-5 w-5 text-emerald-600" />
                Record Quick Income Entry
              </h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordIncome} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Income Account Category *</label>
                <select
                  value={incomeForm.accountCode}
                  onChange={(e) => setIncomeForm({ ...incomeForm, accountCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  required
                >
                  <option value="4020">4020 - Consulting & Implementation Revenue</option>
                  <option value="4030">4030 - Other Miscellaneous Income</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={incomeForm.paymentMethod}
                    onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payer / Source Name</label>
                <input
                  type="text"
                  placeholder="e.g. Client Name / Partner"
                  value={incomeForm.payerName}
                  onChange={(e) => setIncomeForm({ ...incomeForm, payerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Custom POS setup fee"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Save Income Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Register Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Laptop className="h-5 w-5 text-brand-600" />
                Register Company Asset
              </h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell XPS 15 Laptop"
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  >
                    <option value="HARDWARE">Hardware & Laptops</option>
                    <option value="VEHICLE">Vehicles</option>
                    <option value="FURNITURE">Furniture & Fixtures</option>
                    <option value="SOFTWARE_LICENSE">Software Licenses</option>
                    <option value="OFFICE_EQUIPMENT">Office Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-98421"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 115000"
                    value={assetForm.purchaseCost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank for purchase cost"
                    value={assetForm.currentValue}
                    onChange={(e) => setAssetForm({ ...assetForm, currentValue: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Journal Entry Voucher Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Post Double-Entry Journal Voucher
              </h3>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalEntry} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    value={journalForm.entryDate}
                    onChange={(e) => setJournalForm({ ...journalForm, entryDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Doc #</label>
                  <input
                    type="text"
                    placeholder="e.g. JV-2026-001"
                    value={journalForm.reference}
                    onChange={(e) => setJournalForm({ ...journalForm, reference: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Header Description *</label>
                  <input
                    type="text"
                    placeholder="e.g. Year-End Depreciation Adjustment"
                    value={journalForm.description}
                    onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Multi-Line Journal Entry Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Journal Lines (Debits & Credits)</h4>
                  <button
                    type="button"
                    onClick={handleAddJournalLine}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Line
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                      <tr>
                        <th className="py-2.5 px-3">Account *</th>
                        <th className="py-2.5 px-3">Memo / Line Note</th>
                        <th className="py-2.5 px-3 text-right w-32">Debit (₹)</th>
                        <th className="py-2.5 px-3 text-right w-32">Credit (₹)</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {journalForm.lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <select
                              value={line.accountId}
                              onChange={(e) => handleJournalLineChange(idx, 'accountId', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
                              required
                            >
                              <option value="">Select Account...</option>
                              {chartOfAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.accountCode} - {acc.accountName} ({acc.accountType})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Line memo"
                              value={line.memo}
                              onChange={(e) => handleJournalLineChange(idx, 'memo', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={line.debit}
                              onChange={(e) => handleJournalLineChange(idx, 'debit', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={line.credit}
                              onChange={(e) => handleJournalLineChange(idx, 'credit', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {journalForm.lines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveJournalLine(idx)}
                                className="text-slate-400 hover:text-rose-600 transition"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation & Balance Validation Bar */}
              {(() => {
                const totalDebit = journalForm.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
                const totalCredit = journalForm.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
                const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

                return (
                  <div className={`p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between text-xs font-semibold ${
                    isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isBalanced ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 text-rose-600" />
                      )}
                      <span>
                        {isBalanced
                          ? 'Balanced Entry (Total Debits = Total Credits)'
                          : `Unbalanced Entry: Difference ₹${Math.abs(totalDebit - totalCredit).toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
                      <span>Total Debits: ₹{totalDebit.toLocaleString()}</span>
                      <span>Total Credits: ₹{totalCredit.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
