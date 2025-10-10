import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Accounts from '@/components/Accounts';
import Transactions from '@/components/Transactions';
import CreditCards from '@/components/CreditCards';
import Settings from '@/components/Settings';
import FinancialGoals from '@/components/FinancialGoals';
import Reports from '@/components/Reports';
import BudgetTracker from '@/components/BudgetTracker';
import Analytics from '@/components/Analytics';
import NotificationCenter from '@/components/NotificationCenter';
import ImportStatements from '@/components/ImportStatements';
import PaymentReminders from '@/components/PaymentReminders';
import SmartCategorization from '@/components/SmartCategorization';
import PeriodComparison from '@/components/PeriodComparison';
import ReportExporter from '@/components/ReportExporter';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'credit-cards':
        return <CreditCards />;
      case 'goals':
        return <FinancialGoals />;
      case 'budget':
        return <BudgetTracker />;
      case 'reports':
        return <Reports />;
      case 'analytics':
        return <Analytics />;
      case 'notifications':
        return <NotificationCenter />;
      case 'import':
        return <ImportStatements />;
      case 'reminders':
        return <PaymentReminders />;
      case 'smart-categorization':
        return <SmartCategorization />;
      case 'comparison':
        return <PeriodComparison />;
      case 'export':
        return <ReportExporter />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
