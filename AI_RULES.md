# AI Rules for Mobills Financial App

## Tech Stack

- **React 18** - Main UI framework with TypeScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens
- **shadcn/ui** - Component library built on Radix UI primitives
- **React Router DOM** - Client-side routing
- **Supabase** - Backend-as-a-Service for auth and database
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Recharts** - Data visualization charts
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Date-fns** - Date manipulation utilities

## Library Usage Rules

### UI Components
- **Always use shadcn/ui components** when available
- **Never create custom UI components** from scratch - use shadcn/ui as the foundation
- **Import components** from `@/components/ui/` (e.g., `import { Button } from "@/components/ui/button"`)
- **Use Tailwind classes** for styling, not inline styles or CSS files
- **Follow the existing design system** defined in `src/index.css` with HSL color variables

### Forms
- **Always use React Hook Form + Zod** for form handling
- **Import** `import { useForm } from "react-hook-form"` and `import { zodResolver } from "@hookform/resolvers/zod"`
- **Define schemas** with Zod (e.g., `const schema = z.object({ ... })`)
- **Use shadcn/ui form components** (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`)
- **Never use native HTML form elements** without proper styling and validation

### Data Fetching & State
- **Use TanStack Query** for all data fetching operations
- **Import** `import { useQuery } from "@tanstack/react-query"`
- **Never use useState for API data** - use TanStack Query instead
- **Use React Context** for global state (like `FinancialContext` and `AuthContext`)
- **Keep local component state** for UI interactions (modals, forms, etc.)

### Routing
- **Use React Router DOM** for all navigation
- **Import** `import { Routes, Route, Navigate } from "react-router-dom"`
- **Keep routes in `src/App.tsx`** as the main routing configuration
- **Use ProtectedRoute** for authenticated routes
- **Never use window.location** for navigation - use React Router

### Icons
- **Always use Lucide React icons** - no other icon libraries
- **Import** `import { IconName } from "lucide-react"`
- **Use consistent icon sizes** (h-4 w-4 for UI, h-5 w-5 for headers, h-6 w-6 for main actions)
- **Never use SVG icons directly** - always import from Lucide

### Data Visualization
- **Use Recharts
<dyad-write path="AI_RULES.md" description="Creating AI_RULES.md file with tech stack and library usage rules">
# AI Rules for Mobills Financial App

## Tech Stack

- **React 18** - Main UI framework with TypeScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **shadcn/ui** - Component library built on Radix UI primitives
- **React Router DOM** - Client-side routing
- **Supabase** - Backend-as-a-Service for auth and database
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Recharts** - Data visualization charts
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Date-fns** - Date manipulation utilities

## Library Usage Rules

### UI Components
- **Always use shadcn/ui components** when available
- **Never create custom UI components** from scratch - use shadcn/ui as the foundation
- **Import components** from `@/components/ui/` (e.g., `import { Button } from "@/components/ui/button"`)
- **Use Tailwind classes** for styling, not inline styles or CSS files
- **Follow the existing design system** defined in `src/index.css` with HSL color variables

### Forms
- **Always use React Hook Form + Zod** for form handling
- **Import** `import { useForm } from "react-hook-form"` and `import { zodResolver } from "@hookform/resolvers/zod"`
- **Define schemas** with Zod (e.g., `const schema = z.object({ ... })`)
- **Use shadcn/ui form components** (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`)
- **Never use native HTML form elements** without proper styling and validation

### Data Fetching & State
- **Use TanStack Query** for all data fetching operations
- **Import** `import { useQuery } from "@tanstack/react-query"`
- **Never use useState for API data** - use TanStack Query instead
- **Use React Context** for global state (like `FinancialContext` and `AuthContext`)
- **Keep local component state** for UI interactions (modals, forms, etc.)

### Routing
- **Use React Router DOM** for all navigation
- **Import** `import { Routes, Route, Navigate } from "react-router-dom"`
- **Keep routes in `src/App.tsx`** as the main routing configuration
- **Use ProtectedRoute** for authenticated routes
- **Never use window.location** for navigation - use React Router

### Icons
- **Always use Lucide React icons** - no other icon libraries
- **Import** `import { IconName } from "lucide-react"`
- **Use consistent icon sizes** (h-4 w-4 for UI, h-5 w-5 for headers, h-6 w-6 for main actions)
- **Never use SVG icons directly** - always import from Lucide

### Data Visualization
- **Use Recharts** for all charts and graphs
- **Import** `import { BarChart, Bar, LineChart, Line, PieChart, Pie } from "recharts"`
- **Use ResponsiveContainer** for responsive charts
- **Follow existing chart patterns** in the codebase for consistency
- **Never use other chart libraries** like Chart.js or D3

### Date Handling
- **Always use Date-fns** for date operations
- **Import** `import { format, addDays, subMonths } from "date-fns"`
- **Use Portuguese locale** for Brazilian users: `import { ptBR } from "date-fns/locale"`
- **Never use native Date methods** for formatting or manipulation

### Notifications
- **Use Sonner** for all toast notifications
- **Import** `import { toast } from "sonner"`
- **Use the existing toast patterns** from `useToast` hook
- **Never use alert() or window.confirm()** - use proper UI components

### Authentication
- **Use Supabase Auth** for all authentication
- **Import** `import { supabase } from "@/integrations/supabase/client"`
- **Use AuthContext** for auth state management
- **Never implement custom auth** - always use Supabase

### Database Operations
- **Use Supabase** for all database operations
- **Import** `import { supabase } from "@/integrations/supabase/client"`
- **Use TypeScript types** from `@/integrations/supabase/types`
- **Never use localStorage for critical data** - use Supabase

### File Structure
- **Keep components in `src/components/`**
- **Put pages in `src/pages/`**
- **Use hooks in `src/hooks/`**
- **Store types in `src/types/`**
- **Keep utilities in `src/lib/`**
- **Use contexts in `src/contexts/`**

### Code Style
- **Use TypeScript** for all components and utilities
- **Follow existing naming conventions** (camelCase for variables, PascalCase for components)
- **Use functional components** with hooks
- **Write descriptive variable names**
- **Add proper error handling** with try/catch blocks
- **Use proper TypeScript types** - avoid `any` type

### Financial Data
- **Use the existing financial types** from `@/types/financial`
- **Follow the existing patterns** for financial calculations
- **Use the FinancialContext** for all financial data operations
- **Never hardcode financial values** - use context or props

### Testing
- **Write unit tests** for utilities and complex functions
- **Use React Testing Library** for component tests
- **Test critical user flows** like authentication and financial operations
- **Never skip tests** for new features