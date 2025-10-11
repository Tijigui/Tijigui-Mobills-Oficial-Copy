import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api';
import { User } from '@supabase/supabase-js'; // Reutilizando o tipo, mas poderia ser um tipo customizado

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Em uma aplicação real, você faria uma chamada para um endpoint como /api/auth/me
        // para validar o token e obter os dados do usuário.
        const userData = await apiClient.get<User>('/api/auth/me');
        setUser(userData);
      } catch (error) {
        console.error("Session validation failed", error);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const signIn = async (credentials: { email: string; password: string }) => {
    const { token, user: userData } = await apiClient.post<{ token: string; user: User }>('/api/auth/login', credentials);
    localStorage.setItem('authToken', token);
    setUser(userData);
    navigate('/');
  };

  const signUp = async (credentials: { email: string; password: string }) => {
    await apiClient.post('/api/auth/register', credentials);
    // Normalmente, você redirecionaria para a página de login com uma mensagem de sucesso.
    navigate('/auth');
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};