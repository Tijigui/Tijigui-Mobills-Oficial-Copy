import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, Transaction, CreditCard, Category, DEFAULT_CATEGORIES } from '@/types/financial';
import { FinancialGoal, Budget } from '@/types/goals';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

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
      const [accountsData, transactionsData] = await Promise.all([
        apiClient.get<Account[]>('/api/accounts'),
        apiClient.get<Transaction[]>('/api/transactions')
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
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
    const newAccount = await apiClient.post<Account>('/api/accounts', accountData);
    setAccounts(prev => [newAccount, ...prev]);
    toast({ title: "Conta adicionada" });
  };

  const updateAccount = async (id: string, accountData: Partial<Account>) => {
    const updatedAccount = await apiClient.put<Account>(`/api/accounts/${id}`, accountData);
    setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
    toast({ title: "Conta atualizada" });
  };

  const deleteAccount = async (id: string) => {
    await apiClient.del(`/api/accounts/${id}`);
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    toast({ title: "Conta excluída" });
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction = await apiClient.post<Transaction>('/api/transactions', transactionData);
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    // O backend deve cuidar da atualização do saldo da conta.
    // Para manter o frontend sincronizado, recarregamos os dados das contas.
    fetchData(); 
    toast({ title: "Transação adicionada" });
  };

  const deleteTransaction = async (id: string) => {
    await apiClient.del(`/api/transactions/${id}`);
    setTransactions(prev => prev.filter(t => t.id !== id));
    // Recarregamos os dados para garantir que o saldo da conta seja atualizado.
    fetchData();
    toast({ title: "Transação excluída" });
  };

  return (
    <FinancialCoreContext.Provider value={{ accounts, transactions, addAccount, updateAccount, deleteAccount, addTransaction, deleteTransaction, loading }}>
      {children}
    </FinancialCoreContext.Provider>
  );
};

const CreditCardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<CreditCard[]>('/api/credit-cards');
        setCreditCards(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const addCreditCard = async (cardData: Omit<CreditCard, 'id'>) => {
    const newCard = await apiClient.post<CreditCard>('/api/credit-cards', cardData);
    setCreditCards(prev => [newCard, ...prev]);
  };

  return <CreditCardsContext.Provider value={{ creditCards, addCreditCard, loading }}>{children}</CreditCardsContext.Provider>;
};

const GoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<FinancialGoal[]>('/api/goals');
        setGoals(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const addGoal = async (goalData: Omit<FinancialGoal, 'id'>) => {
    const newGoal = await apiClient.post<FinancialGoal>('/api/goals', goalData);
    setGoals(prev => [newGoal, ...prev]);
  };

  const updateGoal = async (id: string, goalData: Partial<FinancialGoal>) => {
    const updatedGoal = await apiClient.put<FinancialGoal>(`/api/goals/${id}`, goalData);
    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
  };

  const deleteGoal = async (id: string) => {
    await apiClient.del(`/api/goals/${id}`);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return <GoalsContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, loading }}>{children}</GoalsContext.Provider>;
};

const BudgetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<Budget[]>('/api/budgets');
        setBudgets(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget = await apiClient.post<Budget>('/api/budgets', budgetData);
    setBudgets(prev => [newBudget, ...prev]);
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    const updatedBudget = await apiClient.put<Budget>(`/api/budgets/${id}`, budgetData);
    setBudgets(prev => prev.map(b => b.id === id ? updatedBudget : b));
  };

  const deleteBudget = async (id: string) => {
    await apiClient.del(`/api/budgets/${id}`);
    setBudgets(prev => prev.filter(b => b.id !== id));
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