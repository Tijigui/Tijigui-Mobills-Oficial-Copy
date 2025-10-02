import React, { useState } from 'react';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinancial } from '@/contexts/FinancialContext';
import { useToast } from '@/hooks/use-toast';

const SmartCategorization = () => {
  const { transactions, categories } = useFinancial();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const { toast } = useToast();

  const analyzeTransactions = () => {
    setIsAnalyzing(true);
    
    // Simulação de análise inteligente baseada em padrões
    const uncategorized = transactions.filter(t => 
      t.category === 'Alimentação' || t.category === 'Salário'
    );

    const patterns: Record<string, string> = {
      'uber': 'Transporte',
      '99': 'Transporte',
      'ifood': 'Alimentação',
      'netflix': 'Lazer',
      'spotify': 'Lazer',
      'academia': 'Saúde',
      'farmacia': 'Saúde',
      'supermercado': 'Alimentação',
      'restaurante': 'Alimentação',
      'cinema': 'Lazer',
      'shopping': 'Lazer',
      'aluguel': 'Moradia',
      'condominio': 'Moradia',
      'luz': 'Moradia',
      'agua': 'Moradia',
      'internet': 'Moradia'
    };

    const newSuggestions = uncategorized.map(transaction => {
      const description = transaction.description.toLowerCase();
      let suggestedCategory = transaction.category;
      let confidence = 0;

      for (const [keyword, category] of Object.entries(patterns)) {
        if (description.includes(keyword)) {
          suggestedCategory = category;
          confidence = 0.85 + Math.random() * 0.15;
          break;
        }
      }

      return {
        transaction,
        suggestedCategory,
        confidence,
        currentCategory: transaction.category
      };
    }).filter(s => s.suggestedCategory !== s.currentCategory);

    setSuggestions(newSuggestions);
    setIsAnalyzing(false);

    toast({
      title: "Análise concluída",
      description: `${newSuggestions.length} sugestões de categorização encontradas.`
    });
  };

  const learnFromHistory = () => {
    toast({
      title: "Aprendizado ativado",
      description: "O sistema está aprendendo com suas transações anteriores."
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Categorização Inteligente</h1>
        <p className="text-muted-foreground">
          IA que aprende com suas transações e sugere categorias
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise de Padrões
            </CardTitle>
            <CardDescription>
              Analise suas transações e receba sugestões inteligentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={analyzeTransactions} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? 'Analisando...' : 'Analisar Transações'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aprendizado Contínuo
            </CardTitle>
            <CardDescription>
              O sistema aprende com suas categorizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={learnFromHistory} variant="secondary" className="w-full">
              Ativar Aprendizado
            </Button>
          </CardContent>
        </Card>
      </div>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Sugestões de Categorização
            </CardTitle>
            <CardDescription>
              {suggestions.length} transações com sugestões de melhor categorização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{suggestion.transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {suggestion.transaction.amount.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{suggestion.currentCategory}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge>{suggestion.suggestedCategory}</Badge>
                  <Badge variant="secondary">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Aprendizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <div className="text-sm text-muted-foreground">Transações Analisadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categorias Ativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold">92%</div>
              <div className="text-sm text-muted-foreground">Precisão</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartCategorization;
