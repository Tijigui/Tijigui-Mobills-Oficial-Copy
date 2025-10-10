import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  
  const { toast } = useToast();

  // Check current session
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
        return;
      }

      if (session?.user) {
        setAuthState({
          user: {
            id: session.user.id,
            email: session.user.email!,
            created_at: session.user.created_at,
          },
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              created_at: session.user.created_at,
            },
            loading: false,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkSession]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Sign up function
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Conta criada",
        description: "Verifique seu email para confirmar a conta.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Saindo",
        description: "Até logo!",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Email enviado",
        description: "Verifique seu email para redefinir a senha.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Update password function
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Erro ao atualizar senha",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    checkSession,
  };
}