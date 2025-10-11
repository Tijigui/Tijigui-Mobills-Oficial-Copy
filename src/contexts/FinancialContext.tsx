import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, CreditCard, Category, DEFAULT_CATEGORIES } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// --- INTERFACES DE CONTEXTO ---

interface FinancialCoreContextType {
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
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

// --- CRIAÇÃO DOS CONTEXTOS ---

const FinancialCoreContext = createContext<FinancialCoreContextType | undefined>(undefined);
const CreditCardsContext = createContext<CreditCardsContextType | undefined>(undefined);
const GoalsContext = createContext<GoalsContextType | undefined>(undefined);
const BudgetsContext = createContext<BudgetsContextType | undefined>(undefined);

// --- HOOK PRINCIPAL `useFinancial` ---

export const useFinancial = () => {
  const coreContext = useContext(FinancialCoreContext);
  const creditCardsContext = useContext(CreditCardsContext);
  const goalsContext = useContext(GoalsContext);
  const budgetsContext = useContext(BudgetsContext);
  
  if (!coreContext || !creditCardsContext || !goalsContext || !budgetsContext) {
    throw new Error('useFinancial must be used within FinancialProvider');
  }

  return {
    ...coreContext,
    ...creditCardsContext,
    ...goalsContext,
    ...budgetsContext,
    categories: DEFAULT_CATEGORIES,
    loading: coreContext.loading || creditCardsContext.loading || goalsContext.loading || budgetsContext.loading,
  };
};

// --- PROVEDORES DE CONTEXTO ---

// Provedor para Contas e Transações (dados acoplados)
const FinancialCoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [accountsRes, transactionsRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setAccounts(accountsRes.data?.map((a: any) => ({
        id: a.id, name: a.name, bank: a.bank, type: a.type, balance: Number(a.balance), color: a.color, createdAt: new Date(a.created_at)
      })) || []);

      setTransactions(transactionsRes.data?.map((t: any) => ({
        id: t.id, description: t.description, amount: Number(t.amount), type: t.type, category: t.category, account: t.account_id, date: new Date(t.date), recurring: t.recurring, tags: t.tags || []
      })) || []);

    } catch (error: any) {
      console.error('Error loading core financial data:', error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('accounts').insert({ ...accountData, user_id: user.id }).select().single();
      if (error) throw error;
      const newAccount: Account = { ...data, balance: Number(data.balance), createdAt: new Date(data.created_at) };
      setAccounts(prev => [newAccount, ...prev]);
      toast({ title: "Conta adicionada", description: "Sua nova conta foi criada." });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar conta", description: error.message, variant: "destructive" });
    }
  };

  const updateAccount = async (id: string, accountData: Partial<Account>) => {
     if (!user) return;
    try {
      const { error } = await supabase.from('accounts').update(accountData).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...accountData } : acc));
      toast({ title: "Conta atualizada" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar conta", description: error.message, variant: "destructive" });
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      toast({ title: "Conta excluída" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir conta", description: error.message, variant: "destructive" });
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const accountToUpdate = accounts.find(acc => acc.id === transactionData.account);
    if (!accountToUpdate) {
      toast({ title: "Erro", description: "Conta não encontrada.", variant: "destructive" });
      return;
    }

    try {
      const newBalance = accountToUpdate.balance + transactionData.amount;
      
      const [{ data, error }, updateError] = await Promise.all([
        supabase.from('transactions').insert({
          user_id: user.id,
          account_id: transactionData.account,
          description: transactionData.description,
          amount: transactionData.amount,
          type: transactionData.type,
          category: transactionData.category,
          date: transactionData.date.toISOString(),
          recurring: transactionData.recurring,
          tags: transactionData.tags || []
        }).select().single(),
        supabase.from('accounts').update({ balance: newBalance }).eq('id', transactionData.account)
      ]);

      if (error) throw error;
      if (updateError.error) throw updateError.error;

      const newTransaction: Transaction = { ...data, account: data.account_id, date: new Date(data.date), amount: Number(data.amount) };
      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
      setAccounts(prev => prev.map(acc => acc.id === transactionData.account ? { ...acc, balance: newBalance } : acc));
      toast({ title: "Transação adicionada" });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar transação", description: error.message, variant: "destructive" });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const transactionToDelete = transactions.find(t => t.id === id);
    if (!transactionToDelete) return;
    const accountToUpdate = accounts.find(acc => acc.id === transactionToDelete.account);
    if (!accountToUpdate) return;

    try {
      const newBalance = accountToUpdate.balance - transactionToDelete.amount;

      const [deleteError, updateError] = await Promise.all([
        supabase.from('transactions').delete().eq('id', id),
        supabase.from('accounts').update({ balance: newBalance }).eq('id', transactionToDelete.account)
      ]);

      if (deleteError.error) throw deleteError.error;
      if (updateError.error) throw updateError.error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      setAccounts(prev => prev.map(acc => acc.id === transactionToDelete.account ? { ...acc, balance: newBalance } : acc));
      toast({ title: "Transação excluída" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir transação", description: error.message, variant: "destructive" });
    }
  };

  return (
    <FinancialCoreContext.Provider value={{ accounts, transactions, addAccount, updateAccount, deleteAccount, addTransaction, deleteTransaction, loading }}>
      {children}
    </FinancialCoreContext.Provider>
  );
};

// Provedores para dados desacoplados (CreditCards, Goals, Budgets) - sem alterações
const CreditCardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadCreditCards = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('credit_cards').select('*').eq('user_id', user.id);
        if (error) throw error;
        setCreditCards(data?.map((c: any) => ({ ...c, limit: Number(c.card_limit), currentBalance: Number(c.current_balance) })) || []);
      } catch (error: any) {
        toast({ title: "Erro ao carregar cartões", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadCreditCards();
  }, [user]);

  const addCreditCard = async (cardData: Omit<CreditCard, 'id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('credit_cards').insert({
        user_id: user.id, name: cardData.name, bank: cardData.bank, card_limit: cardData.limit, current_balance: cardData.currentBalance, due_date: cardData.dueDate, closing_date: cardData.closingDate, color: cardData.color
      }).select().single();
      if (error) throw error;
      const newCard: CreditCard = { ...data, limit: Number(data.card_limit), currentBalance: Number(data.current_balance) };
      setCreditCards(prev => [newCard, ...prev]);
      toast({ title: "Cartão adicionado" });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar cartão", description: error.message, variant: "destructive" });
    }
  };

  return <CreditCardsContext.Provider value={{ creditCards, addCreditCard, loading }}>{children}</CreditCardsContext.Provider>;
};

const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadGoals = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('financial_goals').select('*').eq('user_id', user.id);
        if (error) throw error;
        setGoals(data?.map((g: any) => ({ ...g, targetAmount: Number(g.target_amount), currentAmount: Number(g.current_amount), deadline: new Date(g.deadline), createdAt: new Date(g.created_at) })) || []);
      } catch (error: any) {
        toast({ title: "Erro ao carregar metas", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadGoals();
  }, [user]);

  const addGoal = async (goalData: Omit<FinancialGoal, 'id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('financial_goals').insert({
        user_id: user.id, title: goalData.title, description: goalData.description, target_amount: goalData.targetAmount, current_amount: goalData.currentAmount, deadline: goalData.deadline.toISOString().split('T')[0], category: goalData.category, color: goalData.color, completed: goalData.completed
      }).select().single();
      if (error) throw error;
      const newGoal: FinancialGoal = { ...data, targetAmount: Number(data.target_amount), currentAmount: Number(data.current_amount), deadline: new Date(data.deadline), createdAt: new Date(data.created_at) };
      setGoals(prev => [newGoal, ...prev]);
      toast({ title: "Meta adicionada" });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar meta", description: error.message, variant: "destructive" });
    }
  };

  const updateGoal = async (id: string, goalData: Partial<FinancialGoal>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('financial_goals').update({
        title: goalData.title, description: goalData.description, target_amount: goalData.targetAmount, current_amount: goalData.currentAmount, deadline: goalData.deadline?.toISOString().split('T')[0], category: goalData.category, color: goalData.color, completed: goalData.completed
      }).eq('id', id);
      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === id ? { ...g, ...goalData } : g));
      toast({ title: "Meta atualizada" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar meta", description: error.message, variant: "destructive" });
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('financial_goals').delete().eq('id', id);
      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: "Meta excluída" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir meta", description: error.message, variant: "destructive" });
    }
  };

  return <GoalsContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, loading }}>{children}</GoalsContext.Provider>;
};

const BudgetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadBudgets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user.id);
        if (error) throw error;
        setBudgets(data?.map((b: any) => ({ ...b, limit: Number(b.budget_limit), spent: Number(b.spent) })) || []);
      } catch (error: any) {
        toast({ title: "Erro ao carregar orçamentos", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadBudgets();
  }, [user]);

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('budgets').insert({
        user_id: user.id, category: budgetData.category, budget_limit: budgetData.limit, period: budgetData.period, color: budgetData.color, alerts: budgetData.alerts, spent: 0
      }).select().single();
      if (error) throw error;
      const newBudget: Budget = { ...data, limit: Number(data.budget_limit), spent: Number(data.spent) };
      setBudgets(prev => [newBudget, ...prev]);
      toast({ title: "Orçamento adicionado" });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar orçamento", description: error.message, variant: "destructive" });
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('budgets').update({
        category: budgetData.category, budget_limit: budgetData.limit, period: budgetData.period, color: budgetData.color, alerts: budgetData.alerts
      }).eq('id', id);
      if (error) throw error;
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budgetData } : b));
      toast({ title: "Orçamento atualizado" });
    } catch (error: any) {
      toast({ title: "Erro ao atualizar orçamento", description: error.message, variant: "destructive" });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.id !== id));
      toast({ title: "Orçamento excluído" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir orçamento", description: error.message, variant: "destructive" });
    }
  };

  return <BudgetsContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, loading }}>{children}</BudgetsContext.Provider>;
};

// --- PROVEDOR PRINCIPAL ---

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FinancialCoreProvider>
      <CreditCardsProvider>
        <GoalsProvider>
          <BudgetsProvider>
            {children}
          </BudgetsProvider>
        </GoalsProvider>
      </CreditCardsProvider>
    </FinancialCoreProvider>
  );
};