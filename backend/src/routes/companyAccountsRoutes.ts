import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  recordQuickExpense,
  recordQuickIncome,
  createJournalEntry,
  getTransactions,
  deleteTransaction,
  getChartOfAccounts,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
  getGeneralLedger,
  getAssets,
  createAsset,
  deleteAsset,
} from '../controllers/companyAccountsController';

const router = Router();

router.use(authenticateToken);

router.post('/quick-expense', recordQuickExpense);
router.post('/quick-income', recordQuickIncome);
router.post('/journal-entry', createJournalEntry);
router.get('/transactions', getTransactions);
router.delete('/transactions/:id', deleteTransaction);

router.get('/chart-of-accounts', getChartOfAccounts);
router.get('/trial-balance', getTrialBalance);
router.get('/profit-and-loss', getProfitAndLoss);
router.get('/balance-sheet', getBalanceSheet);
router.get('/general-ledger', getGeneralLedger);

router.get('/assets', getAssets);
router.post('/assets', createAsset);
router.delete('/assets/:id', deleteAsset);

export default router;
