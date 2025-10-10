import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancial } from '@/contexts/FinancialContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PeriodComparison = () => {
  const { transactions } = useFinancial();
  const [period1, setPeriod1] = useState('0'); // Mês atual
  const [period2, setPeriod2] = useState('1'); // Mês anterior

  const getPeriodData = (monthsAgo: number) => {
    const date = subMonths(new Date(), monthsAgo);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const periodTransactions = transactions.filter(t =>
      isWithinInterval(t.date, { start, end })
    );

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const byCategory = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
      income,
      expenses,
      balance: income - expenses,
      byCategory,
      transactionCount: periodTransactions.length
    };
  };

  const period1Data = useMemo(() => getPeriodData(parseInt(period1)), [period1, transactions]);
  const period2Data = useMemo(() => getPeriodData(parseInt(period2)), [period2, transactions]);

  const getVariation = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const categoryComparison = useMemo(() => {
    const allCategories = new Set([
      ...Object.keys(period1Data.byCategory),
      ...Object.keys(period2Data.byCategory)
    ]);

    return Array.from(allCategories).map(category => ({
      category,
      period1: period1Data.byCategory[category] || 0,
      period2: period2Data.byCategory[category] || 0
    }));
  }, [period1Data, period2Data]);

  const comparisonData = [
    { name: period2Data.label, Receitas: period2Data.income, Despesas: period2Data.expenses },
    { name: period1Data.label, Receitas: period1Data.income, Despesas: period1Data.expenses }
  ];

  const periodOptions = [
    { value: '0', label: 'Mês Atual' },
    { value: '1', label: 'Mês Anterior' },
    { value: '2', label: 'Há 2 Meses' },
    { value: '3', label: 'Há 3 Meses' },
    { value: '6', label: 'Há 6 Meses' },
    { value: '12', label: 'Há 1 Ano' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Comparativo de Períodos</h1>
        <p className="text-muted-foreground">
          Compare suas finanças entre diferentes períodos
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Período 1</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={period1} onValueChange={setPeriod1}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Período 2</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={period2} onValueChange={setPeriod2}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-income">
              R$ {period1Data.income.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              {getVariation(period1Data.income, period2Data.income) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-income" />
              ) : (
                <TrendingDown className="h-4 w-4 text-expense" />
              )}
              <span className={getVariation(period1Data.income, period2Data.income) >= 0 ? 'text-income' : 'text-expense'}>
                {Math.abs(getVariation(period1Data.income, period2Data.income)).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              R$ {period1Data.expenses.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              {getVariation(period1Data.expenses, period2Data.expenses) <= 0 ? (
                <TrendingDown className="h-4 w-4 text-income" />
              ) : (
                <TrendingUp className="h-4 w-4 text-expense" />
              )}
              <span className={getVariation(period1Data.expenses, period2Data.expenses) <= 0 ? 'text-income' : 'text-expense'}>
                {Math.abs(getVariation(period1Data.expenses, period2Data.expenses)).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {period1Data.balance.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              {getVariation(period1Data.balance, period2Data.balance) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-income" />
              ) : (
                <TrendingDown className="h-4 w-4 text-expense" />
              )}
              <span className={getVariation(period1Data.balance, period2Data.balance) >= 0 ? 'text-income' : 'text-expense'}>
                {Math.abs(getVariation(period1Data.balance, period2Data.balance)).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Receitas e Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Receitas" fill="#10b981" />
              <Bar dataKey="Despesas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryComparison.map(cat => (
            <div key={cat.category} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">{cat.category}</span>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{period2Data.label}</div>
                  <div className="font-medium">R$ {cat.period2.toFixed(2)}</div>
                </div>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{period1Data.label}</div>
                  <div className="font-medium">R$ {cat.period1.toFixed(2)}</div>
                </div>
                <div className={`text-sm font-medium ${getVariation(cat.period1, cat.period2) <= 0 ? 'text-income' : 'text-expense'}`}>
                  {getVariation(cat.period1, cat.period2) > 0 ? '+' : ''}
                  {getVariation(cat.period1, cat.period2).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PeriodComparison;
