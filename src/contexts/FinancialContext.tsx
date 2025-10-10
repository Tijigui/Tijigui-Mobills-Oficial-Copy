import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Account, Transaction, CreditCard, Category, DEFAULT_CATEGORIES } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FinancialContextType {
  accounts: Account[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  categories: Category[];
  goals?: FinancialGoal[];
  budgets?: Budget[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal?: (goal: Omit<FinancialGoal, 'id'>) => Promise<void>;
  updateGoal?: (id: string, goal: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal?: (id: string) => Promise<void>;
  addBudget?: (budget: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  updateBudget?: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget?: (id: string) => Promise<void>;
  getTotalBalance: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
  loading: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load all data from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      setAccounts(accountsData?.map((a: any) => ({
        id: a.id,
        name: a.name,
        bank: a.bank,
        type: a.type as 'checking' | 'savings' | 'investment',
        balance: Number(a.balance),
        color: a.color,
        createdAt: new Date(a.created_at)
      })) || []);

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, accounts!transactions_account_id_fkey(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData?.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as 'income' | 'expense',
        category: t.category,
        account: t.accounts?.name || '',
        date: new Date(t.date),
        recurring: t.recurring,
        tags: t.tags || []
      })) || []);

      // Load credit cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      setCreditCards(cardsData?.map((c: any) => ({
        id: c.id,
        name: c.name,
        bank: c.bank,
        limit: Number(c.card_limit),
        currentBalance: Number(c.current_balance),
        dueDate: c.due_date,
        closingDate: c.closing_date,
        color: c.color
      })) || []);

      // Load goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      setGoals(goalsData?.map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        targetAmount: Number(g.target_amount),
        currentAmount: Number(g.current_amount),
        deadline: new Date(g.deadline),
        category: g.category as 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency',
        color: g.color,
        createdAt: new Date(g.created_at),
        completed: g.completed
      })) || []);

      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (budgetsError) throw budgetsError;

      setBudgets(budgetsData?.map((b: any) => ({
        id: b.id,
        category: b.category,
        limit: Number(b.budget_limit),
        spent: Number(b.spent),
        period: b.period as 'monthly' | 'weekly' | 'yearly',
        color: b.color,
        alerts: b.alerts
      })) || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: accountData.name,
          bank: accountData.bank,
          type: accountData.type,
          balance: accountData.balance,
          color: accountData.color
        })
        .select()
        .single();

      if (error) throw error;

      const newAccount: Account = {
        id: data.id,
        name: data.name,
        bank: data.bank,
        type: data.type as 'checking' | 'savings' | 'investment',
        balance: Number(data.balance),
        color: data.color,
        createdAt: new Date(data.created_at)
      };

      setAccounts(prev => [newAccount, ...prev]);

      toast({
        title: "Conta adicionada",
        description: "Conta criada com sucesso!"
      });
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast({
        title: "Erro ao adicionar conta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      // Find account by name
      const account = accounts.find(a => a.name === transactionData.account);
      if (!account) throw new Error('Conta não encontrada');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: account.id,
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          category: transactionData.category,
          date: transactionData.date.toISOString(),
          recurring: transactionData.recurring,
          tags: transactionData.tags || []
        })
        .select()
        .single();

      if (error) throw error;

      // Update account balance
      const balanceChange = transactionData.type === 'income' 
        ? transactionData.amount 
        : -transactionData.amount;

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceChange })
        .eq('id', account.id);

      if (updateError) throw updateError;

      // Update local state
      setAccounts(prev => prev.map(a => 
        a.id === account.id ? { ...a, balance: a.balance + balanceChange } : a
      ));

      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        type: data.type as 'income' | 'expense',
        category: data.category,
        account: transactionData.account,
        date: new Date(data.date),
        recurring: data.recurring,
        tags: data.tags || []
      };

      setTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: "Transação adicionada",
        description: "Transação criada com sucesso!"
      });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro ao adicionar transação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addCreditCard = async (cardData: Omit<CreditCard, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: user.id,
          name: cardData.name,
          bank: cardData.bank,
          card_limit: cardData.limit,
          current_balance: cardData.currentBalance,
          due_date: cardData.dueDate,
          closing_date: cardData.closingDate,
          color: cardData.color
        })
        .select()
        .single();

      if (error) throw error;

      const newCard: CreditCard = {
        id: data.id,
        name: data.name,
        bank: data.bank,
        limit: Number(data.card_limit),
        currentBalance: Number(data.current_balance),
        dueDate: data.due_date,
        closingDate: data.closing_date,
        color: data.color
      };

      setCreditCards(prev => [newCard, ...prev]);

      toast({
        title: "Cartão adicionado",
        description: "Cartão criado com sucesso!"
      });
    } catch (error: any) {
      console.error('Error adding credit card:', error);
      toast({
        title: "Erro ao adicionar cartão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateAccount = async (id: string, accountData: Partial<Account>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (accountData.name !== undefined) updateData.name = accountData.name;
      if (accountData.bank !== undefined) updateData.bank = accountData.bank;
      if (accountData.type !== undefined) updateData.type = accountData.type;
      if (accountData.balance !== undefined) updateData.balance = accountData.balance;
      if (accountData.color !== undefined) updateData.color = accountData.color;

      const { error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, ...accountData } : account
      ));

      toast({
        title: "Conta atualizada",
        description: "Conta atualizada com sucesso!"
      });
    } catch (error: any) {
      console.error('Error updating account:', error);
      toast({
        title: "Erro ao atualizar conta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAccounts(prev => prev.filter(account => account.id !== id));

      toast({
        title: "Conta excluída",
        description: "Conta excluída com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transação não encontrada');

      const account = accounts.find(a => a.name === transaction.account);
      if (!account) throw new Error('Conta não encontrada');

      // Calculate balance change
      const balanceChange = transaction.type === 'income' 
        ? -transaction.amount 
        : transaction.amount;

      // Use a transaction to ensure atomicity
      const { error: updateError } = await supabase.rpc('update_account_balance', {
        account_id: account.id,
        balance_change: balanceChange
      });

      if (updateError) {
        // Fallback to individual updates if RPC fails
        const currentBalance = (await supabase
          .from('accounts')
          .select('balance')
          .eq('id', account.id)
          .single()).data?.balance || 0;

        const { error: directUpdateError } = await supabase
          .from('accounts')
          .update({ balance: currentBalance + balanceChange })
          .eq('id', account.id);

        if (directUpdateError) throw directUpdateError;
      }

      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAccounts(prev => prev.map(a => 
        a.id === account.id ? { ...a, balance: a.balance + balanceChange } : a
      ));

      setTransactions(prev => prev.filter(t => t.id !== id));

      toast({
        title: "Transação excluída",
        description: "Transação excluída com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTotalBalance = useMemo(() => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  }, [accounts]);

  const getMonthlyIncome = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === 'income' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  const getMonthlyExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.date.getMonth() === currentMonth && 
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  }, [transactions]);

  // Goals methods
  const addGoal = async (goalData: Omit<FinancialGoal, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          title: goalData.title,
          description: goalData.description,
          target_amount: goalData.targetAmount,
          current_amount: goalData.currentAmount,
          deadline: goalData.deadline.toISOString().split('T')[0],
          category: goalData.category,
          color: goalData.color,
          completed: goalData.completed
        })
        .select()
        .single();

      if (error) throw error;

      const newGoal: FinancialGoal = {
        id: data.id,
        title: data.title,
        description: data.description,
        targetAmount: Number(data.target_amount),
        currentAmount: Number(data.current_amount),
        deadline: new Date(data.deadline),
        category: data.category as 'savings' | 'investment' | 'purchase' | 'debt' | 'emergency',
        color: data.color,
        createdAt: new Date(data.created_at),
        completed: data.completed
      };

      setGoals(prev => [newGoal, ...prev]);

      toast({
        title: "Meta adicionada",
        description: "Meta criada com sucesso!"
      });
    } catch (error: any) {
      console.error('Error adding goal:', error);
      toast({
        title: "Erro ao adicionar meta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateGoal = async (id: string, goalData: Partial<FinancialGoal>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (goalData.title !== undefined) updateData.title = goalData.title;
      if (goalData.description !== undefined) updateData.description = goalData.description;
      if (goalData.targetAmount !== undefined) updateData.target_amount = goalData.targetAmount;
      if (goalData.currentAmount !== undefined) updateData.current_amount = goalData.currentAmount;
      if (goalData.deadline !== undefined) updateData.deadline = goalData.deadline.toISOString().split('T')[0];
      if (goalData.category !== undefined) updateData.category = goalData.category;
      if (goalData.color !== undefined) updateData.color = goalData.color;
      if (goalData.completed !== undefined) updateData.completed = goalData.completed;

      const { error } = await supabase
        .from('financial_goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...goalData } : goal
      ));

      toast({
        title: "Meta atualizada",
        description: "Meta atualizada com sucesso!"
      });
    } catch (error: any) {
      console.error('Error updating goal:', error);
      toast({
        title: "Erro ao atualizar meta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== id));

      toast({
        title: "Meta excluída",
        description: "Meta excluída com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Erro ao excluir meta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Budget methods
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category: budgetData.category,
          budget_limit: budgetData.limit,
          spent: 0,
          period: budgetData.period,
          color: budgetData.color,
          alerts: budgetData.alerts
        })
        .select()
        .single();

      if (error) throw error;

      const newBudget: Budget = {
        id: data.id,
        category: data.category,
        limit: Number(data.budget_limit),
        spent: Number(data.spent),
        period: data.period as 'monthly' | 'weekly' | 'yearly',
        color: data.color,
        alerts: data.alerts
      };

      setBudgets(prev => [newBudget, ...prev]);

      toast({
        title: "Orçamento adicionado",
        description: "Orçamento criado com sucesso!"
      });
    } catch (error: any) {
      console.error('Error adding budget:', error);
      toast({
        title: "Erro ao adicionar orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (budgetData.category !== undefined) updateData.category = budgetData.category;
      if (budgetData.limit !== undefined) updateData.budget_limit = budgetData.limit;
      if (budgetData.spent !== undefined) updateData.spent = budgetData.spent;
      if (budgetData.period !== undefined) updateData.period = budgetData.period;
      if (budgetData.color !== undefined) updateData.color = budgetData.color;
      if (budgetData.alerts !== undefined) updateData.alerts = budgetData.alerts;

      const { error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBudgets(prev => prev.map(budget => 
        budget.id === id ? { ...budget, ...budgetData } : budget
      ));

      toast({
        title: "Orçamento atualizado",
        description: "Orçamento atualizado com sucesso!"
      });
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast({
        title: "Erro ao atualizar orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBudgets(prev => prev.filter(budget => budget.id !== id));

      toast({
        title: "Orçamento excluído",
        description: "Orçamento excluído com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({
        title: "Erro ao excluir orçamento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const value = {
    accounts,
    transactions,
    creditCards,
    categories,
    goals,
    budgets,
    addAccount,
    addTransaction,
    addCreditCard,
    updateAccount,
    deleteAccount,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addBudget,
    updateBudget,
    deleteBudget,
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    loading,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};