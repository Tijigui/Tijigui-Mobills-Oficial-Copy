import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = true, retryCount = 3, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let attempts = 0;
    
    const attempt = async () => {
      try {
        const data = await apiFunction();
        setState({ data, loading: false, error: null });
        return data;
      } catch (error: any) {
        attempts++;
        
        if (attempts < retryCount) {
          setTimeout(attempt, retryDelay * attempts);
          return;
        }
        
        const errorMessage = error.message || 'Erro na requisição';
        setState({ data: null, loading: false, error: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    };

    return attempt();
  }, [apiFunction, retryCount, retryDelay]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    refetch: execute,
  };
}