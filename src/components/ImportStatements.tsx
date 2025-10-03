import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinancial } from '@/contexts/FinancialContext';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types/financial';

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

const ImportStatements = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const { addTransaction, accounts } = useFinancial();
  const { toast } = useToast();

  const parseCSV = (content: string): ParsedTransaction[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const transactions: ParsedTransaction[] = [];

    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('data') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(/[,;]/);
      if (parts.length >= 3) {
        try {
          const dateStr = parts[0].trim();
          const description = parts[1].trim();
          const amountStr = parts[2].trim().replace(/[^\d.,-]/g, '').replace(',', '.');
          const amount = Math.abs(parseFloat(amountStr));

          if (!isNaN(amount) && description) {
            transactions.push({
              date: new Date(dateStr),
              description,
              amount,
              type: amountStr.includes('-') ? 'expense' : 'income'
            });
          }
        } catch (e) {
          console.error('Error parsing line:', lines[i], e);
        }
      }
    }

    return transactions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.ofx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV ou OFX.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const content = await file.text();
      const parsed = parseCSV(content);

      let success = 0;
      let failed = 0;

      const defaultAccount = accounts[0]?.name || 'Conta Principal';

      for (const trans of parsed) {
        try {
          addTransaction({
            ...trans,
            account: defaultAccount,
            category: trans.type === 'income' ? 'Salário' : 'Alimentação',
            recurring: false
          });
          success++;
        } catch (e) {
          failed++;
        }
      }

      setResults({ success, failed });
      toast({
        title: "Importação concluída",
        description: `${success} transações importadas com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Importar Extratos</h1>
        <p className="text-muted-foreground">
          Importe suas transações de arquivos CSV ou OFX
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Selecione um arquivo CSV ou OFX do seu banco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild disabled={isProcessing}>
                <span>
                  {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
                </span>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.ofx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
            <p className="text-sm text-muted-foreground mt-2">
              Formatos suportados: CSV, OFX
            </p>
          </div>

          {results && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-income">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{results.success} transações importadas</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{results.failed} transações falharam</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Formato do CSV
            </h3>
            <div className="bg-muted rounded-lg p-4 text-sm font-mono">
              <div>Data,Descrição,Valor</div>
              <div>2024-01-15,Supermercado,-150.00</div>
              <div>2024-01-20,Salário,5000.00</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportStatements;
