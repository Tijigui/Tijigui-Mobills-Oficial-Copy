import { useMemo } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear } from '@/lib/utils';

interface FinancialCalculations {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  yearlyIncome: number;
  yearlyExpenses: number;
  yearlySavings: number;
  savingsRate: number;
  averageTransaction: number;
  transactionCount: number;
  categoryTotals: { [category: string]: number };
  accountTotals: { [account: string]: number };
}

export const useFinancialCalculations = (dateRange?: {
  start: Date;
  end: Date;
}): FinancialCalculations => {
  const { transactions, accounts } = useFinancial();

  const filteredTransactions = useMemo(() => {
    if (!dateRange) return transactions;
    
    return transactions.filter(transaction => 
      transaction.date >= dateRange.start && transaction.date <= dateRange.end
    );
  }, [transactions, dateRange]);

  const calculations = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const categoryTotals = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const accountTotals = filteredTransactions
      .reduce((acc, t) => {
        acc[t.account] = (acc[t.account] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const averageTransaction = filteredTransactions.length > 0 
      ? filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / filteredTransactions.length
      : 0;

    // Monthly calculations (current month)
    const now = new Date();
    const currentMonthStart = getStartOfMonth(now);
    const currentMonthEnd = getEndOfMonth(now);
    
    const monthlyTransactions = transactions.filter(t => 
      t.date >= currentMonthStart && t.date <= currentMonthEnd
    );

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;

    // Yearly calculations (current year)
    const currentYearStart = getStartOfYear(now);
    const currentYearEnd = getEndOfYear(now);
    
    const yearlyTransactions = transactions.filter(t => 
      t.date >= currentYearStart && t.date <= currentYearEnd
    );

    const yearlyIncome = yearlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const yearlyExpenses = yearlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const yearlySavings = yearlyIncome - yearlyExpenses;

    return {
      totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      yearlyIncome,
      yearlyExpenses,
      yearlySavings,
      savingsRate,
      averageTransaction,
      transactionCount: filteredTransactions.length,
      categoryTotals,
      accountTotals,
    };
  }, [filteredTransactions, accounts, transactions]);

  return calculations;
};