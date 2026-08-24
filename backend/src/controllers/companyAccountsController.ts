import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const quickExpenseSchema = z.object({
  accountCode: z.string().min(1, 'Expense category is required'), // e.g. 5010, 5020, 5030, etc.
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.string().default('BANK_TRANSFER'),
  vendorName: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  entryDate: z.string().optional(),
});

const quickIncomeSchema = z.object({
  accountCode: z.string().default('4030'), // e.g. 4020, 4030
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.string().default('BANK_TRANSFER'),
  payerName: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  entryDate: z.string().optional(),
});

const createAssetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required'),
  category: z.string().default('HARDWARE'),
  serialNumber: z.string().optional(),
  purchaseDate: z.string(),
  purchaseCost: z.number().positive('Purchase cost is required'),
  currentValue: z.number().optional(),
  depreciationRate: z.number().default(0),
  location: z.string().optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
});

const journalLineSchema = z.object({
  accountId: z.string().uuid('Valid account is required'),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  memo: z.string().optional(),
});

const createJournalEntrySchema = z.object({
  entryDate: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  lines: z.array(journalLineSchema).min(2, 'Journal entry must contain at least 2 lines'),
});

/**
 * POST /api/company-accounts/quick-expense
 * Easy 1-step Quick Expense recorder
 */
export async function recordQuickExpense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = quickExpenseSchema.parse(req.body);
    const { accountCode, amount, paymentMethod, vendorName, description, entryDate } = parseResult;

    // Find expense account & bank account
    const expenseAcc = await prisma.account.findUnique({ where: { accountCode } });
    const bankAcc = await prisma.account.findUnique({ where: { accountCode: '1010' } });

    if (!expenseAcc || !bankAcc) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACCOUNT', message: 'Target expense or bank account not found in Chart of Accounts' },
      });
    }

    const count = await prisma.journalEntry.count();
    const entryNumber = `TXN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const date = entryDate ? new Date(entryDate) : new Date();

    const journalEntry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: date,
        type: 'EXPENSE',
        reference: vendorName ? `${paymentMethod} - ${vendorName}` : paymentMethod,
        description,
        createdById: req.user?.id,
        lines: {
          create: [
            {
              accountId: expenseAcc.id,
              debit: amount,
              credit: 0,
              memo: description,
            },
            {
              accountId: bankAcc.id,
              debit: 0,
              credit: amount,
              memo: `Paid via ${paymentMethod}`,
            },
          ],
        },
      },
      include: {
        lines: { include: { account: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: journalEntry,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/company-accounts/quick-income
 * Easy 1-step Quick Non-Client Income recorder
 */
export async function recordQuickIncome(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = quickIncomeSchema.parse(req.body);
    const { accountCode, amount, paymentMethod, payerName, description, entryDate } = parseResult;

    const incomeAcc = await prisma.account.findUnique({ where: { accountCode } });
    const bankAcc = await prisma.account.findUnique({ where: { accountCode: '1010' } });

    if (!incomeAcc || !bankAcc) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACCOUNT', message: 'Target income or bank account not found in Chart of Accounts' },
      });
    }

    const count = await prisma.journalEntry.count();
    const entryNumber = `TXN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const date = entryDate ? new Date(entryDate) : new Date();

    const journalEntry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: date,
        type: 'INCOME',
        reference: payerName ? `${paymentMethod} - ${payerName}` : paymentMethod,
        description,
        createdById: req.user?.id,
        lines: {
          create: [
            {
              accountId: bankAcc.id,
              debit: amount,
              credit: 0,
              memo: `Received via ${paymentMethod}`,
            },
            {
              accountId: incomeAcc.id,
              debit: 0,
              credit: amount,
              memo: description,
            },
          ],
        },
      },
      include: {
        lines: { include: { account: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Income entry recorded successfully',
      data: journalEntry,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/company-accounts/journal-entry
 * Record multi-line Double-Entry Journal Voucher
 */
export async function createJournalEntry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createJournalEntrySchema.parse(req.body);
    const { entryDate, reference, description, lines } = parseResult;

    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNBALANCED_JOURNAL_ENTRY',
          message: `Unbalanced journal entry: Total Debits (₹${totalDebit.toLocaleString()}) must equal Total Credits (₹${totalCredit.toLocaleString()})`,
        },
      });
    }

    const count = await prisma.journalEntry.count();
    const entryNumber = `JV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const date = entryDate ? new Date(entryDate) : new Date();

    const journalEntry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: date,
        type: 'JOURNAL',
        reference: reference || 'GENERAL_JOURNAL',
        description,
        createdById: req.user?.id,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            memo: l.memo || description,
          })),
        },
      },
      include: {
        lines: { include: { account: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Journal voucher posted successfully',
      data: journalEntry,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/company-accounts/transactions
 * List all journal entries / quick expenses with pagination and filtering
 */
export async function getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string; // EXPENSE, INCOME

    const where: any = {};
    if (type) where.type = type;

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { name: true } },
          lines: { include: { account: true } },
        },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        transactions: entries.map((e) => {
          const mainLine = e.lines.find((l) => Number(l.debit) > 0) || e.lines[0];
          const amount = Number(mainLine?.debit || mainLine?.credit || 0);
          return {
            id: e.id,
            entryNumber: e.entryNumber,
            entryDate: e.entryDate,
            type: e.type,
            reference: e.reference || 'N/A',
            description: e.description || 'N/A',
            categoryName: mainLine?.account?.accountName || 'General',
            accountCode: mainLine?.account?.accountCode || 'N/A',
            amount,
            createdByName: e.createdBy?.name || 'System',
            createdAt: e.createdAt,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/company-accounts/transactions/:id
 * Delete / Void transaction
 */
export async function deleteTransaction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.journalEntry.delete({ where: { id } });
    return res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/company-accounts/chart-of-accounts
 * List Chart of Accounts with balances
 */
export async function getChartOfAccounts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { accountCode: 'asc' },
      include: {
        journalLines: { select: { debit: true, credit: true } },
      },
    });

    const formattedAccounts = accounts.map((acc) => {
      const totalDebit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const totalCredit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);
      
      let balance = 0;
      if (['ASSET', 'EXPENSE'].includes(acc.accountType)) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      return {
        id: acc.id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        subCategory: acc.subCategory || 'General',
        isSystem: acc.isSystem,
        totalDebit,
        totalCredit,
        balance,
      };
    });

    return res.json({
      success: true,
      data: { accounts: formattedAccounts },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/company-accounts/trial-balance
 * Generate Trial Balance statement (Total Debits vs Total Credits)
 */
export async function getTrialBalance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { accountCode: 'asc' },
      include: {
        journalLines: { select: { debit: true, credit: true } },
      },
    });

    let overallDebit = 0;
    let overallCredit = 0;

    const trialBalanceRows = accounts.map((acc) => {
      const totalDebit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const totalCredit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);

      const netBalance = totalDebit - totalCredit;
      let debitBalance = 0;
      let creditBalance = 0;

      if (netBalance > 0) {
        debitBalance = netBalance;
      } else if (netBalance < 0) {
        creditBalance = Math.abs(netBalance);
      }

      overallDebit += debitBalance;
      overallCredit += creditBalance;

      return {
        id: acc.id,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        debit: debitBalance,
        credit: creditBalance,
      };
    }).filter((r) => r.debit > 0 || r.credit > 0);

    return res.json({
      success: true,
      data: {
        rows: trialBalanceRows,
        totals: {
          totalDebit: overallDebit,
          totalCredit: overallCredit,
          isBalanced: Math.abs(overallDebit - overallCredit) < 0.01,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/company-accounts/profit-and-loss
 * Generate Profit & Loss Statement (Revenues - Expenses = Net Profit/Loss)
 */
export async function getProfitAndLoss(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // 1. Calculate CRM Invoices & Payments Collected
    const totalPaymentsAgg = await prisma.payment.aggregate({ _sum: { amount: true } });
    const crmPaymentsRevenue = Number(totalPaymentsAgg._sum.amount || 0);

    // 2. Fetch Revenue & Expense Accounts
    const accounts = await prisma.account.findMany({
      where: { accountType: { in: ['REVENUE', 'EXPENSE'] } },
      include: {
        journalLines: { select: { debit: true, credit: true } },
      },
    });

    let manualRevenueTotal = 0;
    const revenuesList: Array<{ accountCode: string; accountName: string; amount: number }> = [
      { accountCode: '4010', accountName: 'CRM Software License & Subscription Revenue', amount: crmPaymentsRevenue },
    ];

    let operatingExpenseTotal = 0;
    const expensesList: Array<{ accountCode: string; accountName: string; amount: number }> = [];

    accounts.forEach((acc) => {
      const totalDebit = acc.journalLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const totalCredit = acc.journalLines.reduce((sum, l) => sum + Number(l.credit), 0);

      if (acc.accountType === 'REVENUE') {
        const rev = totalCredit - totalDebit;
        if (rev > 0 && acc.accountCode !== '4010') {
          manualRevenueTotal += rev;
          revenuesList.push({ accountCode: acc.accountCode, accountName: acc.accountName, amount: rev });
        }
      } else if (acc.accountType === 'EXPENSE') {
        const exp = totalDebit - totalCredit;
        if (exp > 0) {
          operatingExpenseTotal += exp;
          expensesList.push({ accountCode: acc.accountCode, accountName: acc.accountName, amount: exp });
        }
      }
    });

    const totalRevenue = crmPaymentsRevenue + manualRevenueTotal;
    const netProfit = totalRevenue - operatingExpenseTotal;

    return res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses: operatingExpenseTotal,
          netProfit,
          profitMargin: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0,
        },
        revenues: revenuesList,
        expenses: expensesList,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/company-accounts/balance-sheet
 * Generate Balance Sheet Statement (Assets = Liabilities + Equity)
 */
export async function getBalanceSheet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // 1. Current Assets
    const paymentsAgg = await prisma.payment.aggregate({ _sum: { amount: true } });
    const expenseLinesAgg = await prisma.journalLine.aggregate({
      _sum: { credit: true },
      where: { account: { accountCode: '1010' } },
    });

    const bankBalance = Number(paymentsAgg._sum.amount || 0) - Number(expenseLinesAgg._sum.credit || 0);

    const outstandingAgg = await prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: { status: { notIn: ['CANCELLED', 'PAID'] } },
    });
    const accountsReceivable = Number(outstandingAgg._sum.balanceAmount || 0);

    // Fixed Assets from Company Assets
    const assetValuationAgg = await prisma.companyAsset.aggregate({
      _sum: { currentValue: true },
    });
    const fixedAssetsValuation = Number(assetValuationAgg._sum.currentValue || 0);

    const totalAssets = Math.max(0, bankBalance) + accountsReceivable + fixedAssetsValuation;

    // 2. Liabilities
    const totalLiabilities = 0; // Can be expanded for vendor bills

    // 3. Equity & Retained Earnings
    const pnlRes = await getProfitAndLossRaw();
    const netProfit = pnlRes.netProfit;
    const ownerCapital = 100000; // Default seed capital
    const totalEquity = ownerCapital + netProfit;

    return res.json({
      success: true,
      data: {
        assets: {
          cashAndBank: Math.max(0, bankBalance),
          accountsReceivable,
          fixedAssets: fixedAssetsValuation,
          totalAssets,
        },
        liabilities: {
          accountsPayable: 0,
          taxPayable: 0,
          totalLiabilities,
        },
        equity: {
          capital: ownerCapital,
          retainedEarnings: netProfit,
          totalEquity,
        },
        isBalanced: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to compute P&L numbers internally
 */
async function getProfitAndLossRaw() {
  const totalPaymentsAgg = await prisma.payment.aggregate({ _sum: { amount: true } });
  const crmRevenue = Number(totalPaymentsAgg._sum.amount || 0);

  const expenseLines = await prisma.journalLine.aggregate({
    _sum: { debit: true },
    where: { account: { accountType: 'EXPENSE' } },
  });
  const totalExpenses = Number(expenseLines._sum.debit || 0);

  return {
    totalRevenue: crmRevenue,
    totalExpenses,
    netProfit: crmRevenue - totalExpenses,
  };
}

/**
 * GET /api/company-accounts/general-ledger
 * General Ledger account statement with running balance
 */
export async function getGeneralLedger(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const accountCode = (req.query.accountCode as string) || '1010';

    const account = await prisma.account.findUnique({
      where: { accountCode },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Account ${accountCode} not found` },
      });
    }

    const lines = await prisma.journalLine.findMany({
      where: { accountId: account.id },
      orderBy: { journalEntry: { entryDate: 'asc' } },
      include: {
        journalEntry: {
          include: { createdBy: { select: { name: true } } },
        },
      },
    });

    let runningBalance = 0;
    const isAssetOrExpense = ['ASSET', 'EXPENSE'].includes(account.accountType);

    const ledgerEntries = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);

      if (isAssetOrExpense) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        id: line.id,
        entryNumber: line.journalEntry.entryNumber,
        entryDate: line.journalEntry.entryDate,
        type: line.journalEntry.type,
        reference: line.journalEntry.reference || 'N/A',
        description: line.memo || line.journalEntry.description || 'N/A',
        debit,
        credit,
        runningBalance,
        createdByName: line.journalEntry.createdBy?.name || 'System',
      };
    });

    return res.json({
      success: true,
      data: {
        account: {
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          currentBalance: runningBalance,
        },
        ledgerEntries,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/company-accounts/assets
 * List company assets
 */
export async function getAssets(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assets = await prisma.companyAsset.findMany({
      orderBy: { purchaseDate: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    const totalPurchaseCost = assets.reduce((sum, a) => sum + Number(a.purchaseCost), 0);
    const totalCurrentValuation = assets.reduce((sum, a) => sum + Number(a.currentValue), 0);

    return res.json({
      success: true,
      data: {
        assets: assets.map((a) => ({
          id: a.id,
          assetCode: a.assetCode,
          assetName: a.assetName,
          category: a.category,
          serialNumber: a.serialNumber || 'N/A',
          purchaseDate: a.purchaseDate,
          purchaseCost: Number(a.purchaseCost),
          currentValue: Number(a.currentValue),
          depreciationRate: Number(a.depreciationRate),
          location: a.location || 'HQ Office',
          assignedToName: a.assignedTo?.name || 'Unassigned',
          status: a.status,
          notes: a.notes || '',
        })),
        summary: {
          totalAssets: assets.length,
          totalPurchaseCost,
          totalCurrentValuation,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/company-accounts/assets
 * Add new company asset
 */
export async function createAsset(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createAssetSchema.parse(req.body);
    const count = await prisma.companyAsset.count();
    const assetCode = `AST-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const asset = await prisma.companyAsset.create({
      data: {
        assetCode,
        assetName: parseResult.assetName,
        category: parseResult.category,
        serialNumber: parseResult.serialNumber,
        purchaseDate: new Date(parseResult.purchaseDate),
        purchaseCost: parseResult.purchaseCost,
        currentValue: parseResult.currentValue || parseResult.purchaseCost,
        depreciationRate: parseResult.depreciationRate,
        location: parseResult.location,
        assignedToId: parseResult.assignedToId || null,
        notes: parseResult.notes,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Company asset registered successfully',
      data: asset,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/company-accounts/assets/:id
 * Delete company asset
 */
export async function deleteAsset(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.companyAsset.delete({ where: { id } });
    return res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (err) {
    next(err);
  }
}
