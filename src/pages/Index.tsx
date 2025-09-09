import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Accounts from '@/components/Accounts';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold">Transações</h1>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case 'credit-cards':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold">Cartões de Crédito</h1>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Em desenvolvimento...</p>
          </div>
        );
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
