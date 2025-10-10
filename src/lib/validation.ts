import * as z from 'zod';

// Transaction validation schema
export const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['income', 'expense'], { 
    required_error: 'Tipo é obrigatório',
    message: 'Selecione income ou expense'
  }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  account: z.string().min(1, 'Conta é obrigatória'),
  date: z.string().refine(isValidDate, 'Data inválida'),
  recurring: z.boolean().default(false),
});

// Account validation schema
export const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  bank: z.string().min(1, 'Banco é obrigatório').max(50, 'Nome do banco muito longo'),
  type: z.enum(['checking', 'savings', 'investment'], {
    required_error: 'Tipo de conta é obrigatório'
  }),
  balance: z.number().min(0, 'Saldo não pode ser negativo'),
  color: z.string().min(1, 'Cor é obrigatória'),
});

// Credit card validation schema
export const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  bank: z.string().min(1, 'Banco é obrigatório').max(50, 'Nome do banco muito longo'),
  limit: z.number().min(1, 'Limite deve ser maior que zero'),
  currentBalance: z.number().min(0, 'Saldo atual não pode ser negativo'),
  dueDate: z.number().min(1).max(31, 'Dia de vencimento deve estar entre 1 e 31'),
  closingDate: z.number().min(1).max(31, 'Dia de fechamento deve estar entre 1 e 31'),
  color: z.string().min(1, 'Cor é obrigatória'),
});

// Goal validation schema
export const goalSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  targetAmount: z.number().min(1, 'Valor meta deve ser maior que zero'),
  currentAmount: z.number().min(0, 'Valor atual não pode ser negativo'),
  deadline: z.string().refine(isValidDate, 'Data inválida'),
  category: z.enum(['savings', 'investment', 'purchase', 'debt', 'emergency'], {
    required_error: 'Categoria é obrigatória'
  }),
  color: z.string().min(1, 'Cor é obrigatória'),
});

// Budget validation schema
export const budgetSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  limit: z.number().min(1, 'Limite deve ser maior que zero'),
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    required_error: 'Período é obrigatório'
  }),
  color: z.string().min(1, 'Cor é obrigatória'),
  alerts: z.boolean().default(true),
});

// Utility function to validate date strings
function isValidDate(dateString: string): boolean {
  return !isNaN(Date.parse(dateString)) && new Date(dateString).toString() !== 'Invalid Date';
}

// Export types
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
export type CreditCardFormData = z.infer<typeof creditCardSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;