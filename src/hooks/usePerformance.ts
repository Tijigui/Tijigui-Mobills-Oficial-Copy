import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
}

export function usePerformance(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
  });

  const renderStartRef = useRef<number>(0);
  const componentCountRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    componentCountRef.current = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === componentName) {
          const renderTime = entry.duration;
          const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
          
          setMetrics({
            renderTime,
            memoryUsage,
            componentCount: componentCountRef.current,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => {
      observer.disconnect();
      const renderTime = performance.now() - renderStartRef.current;
      setMetrics(prev => ({
        ...prev,
        renderTime,
      }));
    };
  }, [componentName]);

  const incrementComponentCount = useCallback(() => {
    componentCountRef.current += 1;
    setMetrics(prev => ({
      ...prev,
      componentCount: componentCountRef.current,
    }));
  }, []);

  return {
    ...metrics,
    incrementComponentCount,
  };
}