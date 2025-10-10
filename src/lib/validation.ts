import * as z from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Email inválido');
export const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');
export const requiredStringSchema = z.string().min(1, 'Campo obrigatório');
export const positiveNumberSchema = z.number().min(0.01, 'Valor deve ser maior que zero');

// Transaction validation schema
export const transactionSchema = z.object({
  description: requiredStringSchema.max(200, 'Descrição muito longa'),
  amount: positiveNumberSchema,
  type: z.enum(['income', 'expense'], { 
    required_error: 'Tipo é obrigatório',
    message: 'Selecione income ou expense'
  }),
  category: requiredStringSchema,
  account: requiredStringSchema,
  date: z.string().refine(isValidDate, 'Data inválida'),
  recurring: z.boolean().default(false),
});

// Account validation schema
export const accountSchema = z.object({
  name: requiredStringSchema.max(100, 'Nome muito longo'),
  bank: requiredStringSchema.max(50, 'Nome do banco muito longo'),
  type: z.enum(['checking', 'savings', 'investment'], {
    required_error: 'Tipo de conta é obrigatório'
  }),
  balance: z.number().min(0, 'Saldo não pode ser negativo'),
  color: requiredStringSchema,
});

// Credit card validation schema
export const creditCardSchema = z.object({
  name: requiredStringSchema.max(100, 'Nome muito longo'),
  bank: requiredStringSchema.max(50, 'Nome do banco muito longo'),
  limit: positiveNumberSchema,
  currentBalance: z.number().min(0, 'Saldo atual não pode ser negativo'),
  dueDate: z.number().min(1).max(31, 'Dia de vencimento deve estar entre 1 e 31'),
  closingDate: z.number().min(1).max(31, 'Dia de fechamento deve estar entre 1 e 31'),
  color: requiredStringSchema,
});

// Goal validation schema
export const goalSchema = z.object({
  title: requiredStringSchema.max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  targetAmount: positiveNumberSchema,
  currentAmount: z.number().min(0, 'Valor atual não pode ser negativo'),
  deadline: z.string().refine(isValidDate, 'Data inválida'),
  category: z.enum(['savings', 'investment', 'purchase', 'debt', 'emergency'], {
    required_error: 'Categoria é obrigatória'
  }),
  color: requiredStringSchema,
});

// Budget validation schema
export const budgetSchema = z.object({
  category: requiredStringSchema,
  limit: positiveNumberSchema,
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    required_error: 'Período é obrigatório'
  }),
  color: requiredStringSchema,
  alerts: z.boolean().default(true),
});

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: requiredStringSchema,
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: requiredStringSchema.max(100, 'Nome muito longo'),
  email: emailSchema,
});

// Utility function to validate date strings
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
}

// Utility function to validate account numbers
export function isValidAccountNumber(accountNumber: string): boolean {
  return /^\d{4,20}$/.test(accountNumber.replace(/\s/g, ''));
}

// Utility function to validate credit card numbers
export function isValidCreditCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned) && luhnCheck(cleaned);
}

// Luhn algorithm for credit card validation
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Utility function to validate CPF
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

// Export types
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
export type CreditCardFormData = z.infer<typeof creditCardSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type UserRegistrationFormData = z.infer<typeof userRegistrationSchema>;
export type UserLoginFormData = z.infer<typeof userLoginSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Validation error helper
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return errors;
}

// Form validation hook
export function useFormValidation<T extends z.ZodType>(schema: T) {
  const validate = (data: unknown): { success: boolean; errors: Record<string, string> } => {
    try {
      schema.parse(data);
      return { success: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: getValidationErrors(error) };
      }
      return { success: false, errors: { general: 'Erro de validação' } };
    }
  };
  
  return { validate };
}