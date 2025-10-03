import React, { useState } from 'react';
import { Download, FileText, Table, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancial } from '@/contexts/FinancialContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ReportExporter = () => {
  const { transactions, accounts, budgets, goals } = useFinancial();
  const [reportType, setReportType] = useState('transactions');
  const [period, setPeriod] = useState('current-month');
  const [exportFormat, setExportFormat] = useState('csv');
  const { toast } = useToast();

  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'current-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'current-year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar neste período.",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const generateTransactionsReport = () => {
    const { start, end } = getPeriodDates();
    const filtered = transactions.filter(t => 
      isWithinInterval(t.date, { start, end })
    );

    const data = filtered.map(t => ({
      Data: format(t.date, 'dd/MM/yyyy'),
      Descrição: t.description,
      Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
      Categoria: t.category,
      Conta: t.account,
      Valor: t.amount.toFixed(2),
      Recorrente: t.recurring ? 'Sim' : 'Não'
    }));

    return data;
  };

  const generateAccountsReport = () => {
    return accounts.map(acc => ({
      Nome: acc.name,
      Banco: acc.bank,
      Tipo: acc.type,
      Saldo: acc.balance.toFixed(2),
      'Data de Criação': format(acc.createdAt, 'dd/MM/yyyy')
    }));
  };

  const generateBudgetsReport = () => {
    if (!budgets) return [];
    
    return budgets.map(budget => ({
      Categoria: budget.category,
      Limite: budget.limit.toFixed(2),
      Gasto: budget.spent.toFixed(2),
      Restante: (budget.limit - budget.spent).toFixed(2),
      Período: budget.period,
      'Status de Alerta': budget.alerts ? 'Ativo' : 'Inativo'
    }));
  };

  const generateGoalsReport = () => {
    if (!goals) return [];
    
    return goals.map(goal => ({
      Título: goal.title,
      Descrição: goal.description,
      'Valor Alvo': goal.targetAmount.toFixed(2),
      'Valor Atual': goal.currentAmount.toFixed(2),
      Progresso: `${((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%`,
      Prazo: format(goal.deadline, 'dd/MM/yyyy'),
      Categoria: goal.category,
      Status: goal.completed ? 'Concluído' : 'Em andamento'
    }));
  };

  const handleExport = () => {
    let data: any[] = [];
    let filename = '';

    switch (reportType) {
      case 'transactions':
        data = generateTransactionsReport();
        filename = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      case 'accounts':
        data = generateAccountsReport();
        filename = `contas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      case 'budgets':
        data = generateBudgetsReport();
        filename = `orcamentos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      case 'goals':
        data = generateGoalsReport();
        filename = `metas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
      case 'complete':
        const transData = generateTransactionsReport();
        const accData = generateAccountsReport();
        const allData = [];
        
        if (transData.length > 0) {
          allData.push({ Tipo: 'TRANSAÇÕES' });
          allData.push(...transData);
          allData.push({ Tipo: '' });
        }
        
        if (accData.length > 0) {
          allData.push({ Tipo: 'CONTAS' });
          allData.push(...accData);
        }
        
        data = allData;
        filename = `relatorio_completo_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        break;
    }

    if (exportFormat === 'csv') {
      exportToCSV(data, filename);
      toast({
        title: "Relatório exportado",
        description: `O arquivo ${filename} foi baixado com sucesso.`
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Exportação de Relatórios</h1>
        <p className="text-muted-foreground">
          Exporte seus dados financeiros para análise externa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Exportação</CardTitle>
          <CardDescription>
            Escolha o tipo de relatório e o formato de exportação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactions">Transações</SelectItem>
                <SelectItem value="accounts">Contas</SelectItem>
                <SelectItem value="budgets">Orçamentos</SelectItem>
                <SelectItem value="goals">Metas Financeiras</SelectItem>
                <SelectItem value="complete">Relatório Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'transactions' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Mês Atual</SelectItem>
                  <SelectItem value="last-month">Mês Anterior</SelectItem>
                  <SelectItem value="current-year">Ano Atual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Formato</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="pdf" disabled>PDF (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Formatos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              <span>CSV - Compatível com Excel e Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>PDF - Em breve</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de Transações:</span>
              <span className="font-medium">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contas Ativas:</span>
              <span className="font-medium">{accounts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orçamentos:</span>
              <span className="font-medium">{budgets?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportExporter;
