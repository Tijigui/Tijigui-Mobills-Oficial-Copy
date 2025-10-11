import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, CreditCard, Category, DEFAULT_CATEGORIES } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// Contexts for different entities
interface AccountsContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  loading: boolean;
}

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loading: boolean;
}

interface CreditCardsContextType {
  creditCards: CreditCard[];
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  loading: boolean;
}

interface GoalsContextType {
  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  loading: boolean;
}

interface BudgetsContextType {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loading: boolean;
}

// Individual contexts
const AccountsContext = createContext<AccountsContextType | undefined>(undefined);
const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);
const CreditCardsContext = createContext<CreditCardsContextType | undefined>(undefined);
const GoalsContext = createContext<GoalsContextType | undefined>(undefined);
const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

// Hook for financial data (NO CALCULATIONS)
export const useFinancial = () => {
  const accountsContext = useContext(AccountsContext);
  const transactionsContext = useContext(TransactionsContext);
  const creditCardsContext = useContext(CreditCardsContext);
  const goalsContext = useContext(GoalsContext);
  const budgetsContext = useContext(BudgetsContext);
  
  if (!accountsContext || !transactionsContext || !creditCardsContext || !goalsContext || !budgetsContext) {
    throw new Error('useFinancial must be used within FinancialProvider');
  }

  return {
    accounts: accountsContext.accounts,
    transactions: transactionsContext.transactions,
    creditCards: creditCardsContext.creditCards,
    categories: DEFAULT_CATEGORIES,
    goals: goalsContext.goals,
    budgets: budgetsContext.budgets,
    addAccount: accountsContext.addAccount,
    updateAccount: accountsContext.updateAccount,
    deleteAccount: accountsContext.deleteAccount,
    addTransaction: transactionsContext.addTransaction,
    deleteTransaction: transactionsContext.deleteTransaction,
    addCreditCard: creditCardsContext.addCreditCard,
    addGoal: goalsContext.addGoal,
    updateGoal: goalsContext.updateGoal,
    deleteGoal: goalsContext.deleteGoal,
    addBudget: budgetsContext.addBudget,
    updateBudget: budgetsContext.updateBudget,
    deleteBudget: budgetsContext.deleteBudget,
    loading: accountsContext.loading || transactionsContext.loading || creditCardsContext.loading || goalsContext.loading || budgetsContext.loading,
  };
};

// Account Context Provider
export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadAccounts();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts(data?.map((a: any) => ({
        id: a.id,
        name: a.name,
        bank: a.bank,
        type: a.type as 'checking' | 'savings' | 'investment',
        balance: Number(a.balance),
        color: a.color,
        createdAt: new Date(a.created_at)
      })) || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      toast({
        title: "Erro ao carregar contas",
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

  return (
    <AccountsContext.Provider value={{
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
      loading
    }}>
      {children}
    </AccountsContext.Provider>
  );
};

// Transaction Context Provider
export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setTransactions(data?.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as 'income' | 'expense',
        category: t.category,
        account: t.account_id, // Use account_id
        date: new Date(t.date),
        recurring: t.recurring,
        tags: t.tags || []
      })) || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: transactionData.account, // This is the account ID from the form
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

      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        type: data.type as 'income' | 'expense',
        category: data.category,
        account: data.account_id,
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

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transação não encontrada');

      const balanceChange = transaction.type === 'income' 
        ? -transaction.amount 
        : transaction.amount;

      // Update account balance first
      const { error: updateError } = await supabase.rpc('update_account_balance', {
        account_id: transaction.account, // transaction.account is the ID
        balance_change: balanceChange
      });

      if (updateError) {
        // Fallback to individual updates if RPC fails
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', transaction.account)
          .single();
        
        if(accountError) throw accountError;

        const currentBalance = accountData?.balance || 0;

        const { error: directUpdateError } = await supabase
          .from('accounts')
          .update({ balance: currentBalance + balanceChange })
          .eq('id', transaction.account);

        if (directUpdateError) throw directUpdateError;
      }

      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

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

  return (
    <TransactionsContext.Provider value={{
      transactions,
      addTransaction,
      deleteTransaction,
      loading
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

// Credit Cards Context Provider
export const CreditCardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadCreditCards();
  }, [user]);

  const loadCreditCards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCreditCards(data?.map((c: any) => ({
        id: c.id,
        name: c.name,
        bank: c.bank,
        limit: Number(c.card_limit),
        currentBalance: Number(c.current_balance),
        dueDate: c.due_date,
        closingDate: c.closing_date,
        color: c.color
      })) || []);
    } catch (error: any) {
      console.error('Error loading credit cards:', error);
      toast({
        title: "Erro ao carregar cartões",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <CreditCardsContext.Provider value={{
      creditCards,
      addCreditCard,
      loading
    }}>
      {children}
    </CreditCardsContext.Provider>
  );
};

// Goals Context Provider
export const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGoals(data?.map((g: any) => ({
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
    } catch (error: any) {
      console.error('Error loading goals:', error);
      toast({
        title: "Erro ao carregar metas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <GoalsContext.Provider value={{
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      loading
    }}>
      {children}
    </GoalsContext.Provider>
  );
};

// Budgets Context Provider
export const BudgetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadBudgets();
  }, [user]);

  const loadBudgets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBudgets(data?.map((b: any) => ({
        id: b.id,
        category: b.category,
        limit: Number(b.budget_limit),
        spent: Number(b.spent),
        period: b.period as 'monthly' | 'weekly' | 'yearly',
        color: b.color,
        alerts: b.alerts
      })) || []);
    } catch (error: any) {
      console.error('Error loading budgets:', error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <BudgetsContext.Provider value={{
      budgets,
      addBudget,
      updateBudget,
      deleteBudget,
      loading
    }}>
      {children}
    </BudgetsContext.Provider>
  );
};

// Main Financial Provider
export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AccountsProvider>
      <TransactionsProvider>
        <CreditCardsProvider>
          <GoalsProvider>
            <BudgetsProvider>
              {children}
            </BudgetsProvider>
          </GoalsProvider>
        </CreditCardsProvider>
      </TransactionsProvider>
    </AccountsProvider>
  );
};