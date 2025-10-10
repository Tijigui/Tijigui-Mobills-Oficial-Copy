import { useMemo } from 'react';
import { useFinancial } from '@/contexts/FinancialContext';
import { getStartOfMonth, getEndOfMonth, getStartOfYear, getEndOfYear, getStartOfWeek, getEndOfWeek } from '@/lib/utils';

interface FinancialCalculations {
  // Basic totals
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  yearlyIncome: number;
  yearlyExpenses: number;
  yearlySavings: number;
  savingsRate: number;
  
  // Transaction metrics
  averageTransaction: number;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  
  // Category analysis
  categoryTotals: { [category: string]: number };
  categoryPercentages: { [category: string]: number };
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  
  // Account analysis
  accountTotals: { [account: string]: number };
  accountPercentages: { [account: string]: number };
  topAccounts: Array<{ account: string; amount: number; percentage: number }>;
  
  // Time-based analysis
  weeklyData: Array<{ week: string; income: number; expenses: number; savings: number }>;
  monthlyData: Array<{ month: string; income: number; expenses: number; savings: number }>;
  yearlyData: Array<{ year: string; income: number; expenses: number; savings: number }>;
  
  // Budget analysis
  budgetUtilization: { [budgetId: string]: number };
  budgetStatus: { [budgetId: string]: 'under' | 'at' | 'over' };
}

export const useFinancialCalculations = (dateRange?: {
  start: Date;
  end: Date;
}): FinancialCalculations => {
  const { transactions, accounts, budgets } = useFinancial();

  const filteredTransactions = useMemo(() => {
    if (!dateRange) return transactions;
    
    return transactions.filter(transaction => 
      transaction.date >= dateRange.start && transaction.date <= dateRange.end
    );
  }, [transactions, dateRange]);

  const calculations = useMemo(() => {
    // Basic income/expense calculations
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Transaction metrics
    const totalTransactions = filteredTransactions.length;
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income').length;
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense').length;
    const averageTransaction = totalTransactions > 0 
      ? filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / totalTransactions
      : 0;

    // Category analysis
    const categoryTotals = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const categoryPercentages = Object.fromEntries(
      Object.entries(categoryTotals).map(([category, amount]) => [
        category, 
        totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      ])
    );

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: categoryPercentages[category]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Account analysis
    const accountTotals = filteredTransactions
      .reduce((acc, t) => {
        acc[t.account] = (acc[t.account] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const totalAccountActivity = Object.values(accountTotals).reduce((sum, amount) => sum + amount, 0);
    const accountPercentages = Object.fromEntries(
      Object.entries(accountTotals).map(([account, amount]) => [
        account, 
        totalAccountActivity > 0 ? (amount / totalAccountActivity) * 100 : 0
      ])
    );

    const topAccounts = Object.entries(accountTotals)
      .map(([account, amount]) => ({
        account,
        amount,
        percentage: accountPercentages[account]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Time-based analysis
    const weeklyData = generateTimeSeriesData(getStartOfWeek, getEndOfWeek, 'week');
    const monthlyData = generateTimeSeriesData(getStartOfMonth, getEndOfMonth, 'month');
    const yearlyData = generateTimeSeriesData(getStartOfYear, getEndOfYear, 'year');

    // Budget analysis
    const budgetUtilization: { [budgetId: string]: number } = {};
    const budgetStatus: { [budgetId: string]: 'under' | 'at' | 'over' } = {};

    budgets?.forEach(budget => {
      const spent = categoryTotals[budget.category] || 0;
      const utilization = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      budgetUtilization[budget.id] = utilization;
      budgetStatus[budget.id] = utilization < 100 ? 'under' : utilization === 100 ? 'at' : 'over';
    });

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
      transactionCount: totalTransactions,
      incomeTransactionCount: incomeTransactions,
      expenseTransactionCount: expenseTransactions,
      categoryTotals,
      categoryPercentages,
      topCategories,
      accountTotals,
      accountPercentages,
      topAccounts,
      weeklyData,
      monthlyData,
      yearlyData,
      budgetUtilization,
      budgetStatus,
    };
  }, [filteredTransactions, accounts, budgets]);

  // Helper function to generate time series data
  const generateTimeSeriesData = (
    getStart: (date: Date) => Date,
    getEnd: (date: Date) => Date,
    period: 'week' | 'month' | 'year'
  ) => {
    const now = new Date();
    const data = [];
    let currentDate = period === 'year' ? getStartOfYear(now) : 
                    period === 'month' ? getStartOfMonth(now) : 
                    getStartOfWeek(now);

    while (currentDate <= now) {
      const periodEnd = getEnd(currentDate);
      const periodTransactions = filteredTransactions.filter(t => 
        t.date >= currentDate && t.date <= periodEnd
      );

      const income = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const savings = income - expenses;

      const periodLabel = period === 'week' ? 
        `Semana ${Math.floor((currentDate.getTime() - getStartOfYear(now).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}` :
        period === 'month' ? 
        format(currentDate, 'MMM/yyyy', { locale: ptBR }) :
        format(currentDate, 'yyyy', { locale: ptBR });

      data.push({
        week: periodLabel,
        income,
        expenses,
        savings
      });

      // Move to next period
      currentDate = period === 'week' ? 
        new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000) :
        period === 'month' ? 
        new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 1) :
        new Date(periodEnd.getFullYear() + 1, 0, 1);
    }

    return data.reverse();
  };

  return calculations;
};