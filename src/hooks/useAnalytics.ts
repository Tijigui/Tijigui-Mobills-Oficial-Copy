import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

interface AnalyticsConfig {
  enableTracking: boolean;
  trackPageViews: boolean;
  trackUserInteractions: boolean;
  debugMode: boolean;
}

export function useAnalytics() {
  const { user } = useAuth();
  const [analyticsConfig, setAnalyticsConfig] = useLocalStorage<AnalyticsConfig>('analytics-config', {
    enableTracking: true,
    trackPageViews: true,
    trackUserInteractions: true,
    debugMode: false,
  });

  const [events, setEvents] = useLocalStorage<AnalyticsEvent[]>('analytics-events', []);

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    if (!analyticsConfig.enableTracking) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        userId: user?.id,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    if (analyticsConfig.debugMode) {
      console.log('Analytics Event:', analyticsEvent);
    }

    setEvents(prev => [...prev, analyticsEvent]);
  }, [analyticsConfig.enableTracking, user?.id, setEvents]);

  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    if (!analyticsConfig.trackPageViews) return;

    trackEvent('page_view', {
      page,
      ...properties,
    });
  }, [analyticsConfig.trackPageViews, trackEvent]);

  const trackUserInteraction = useCallback((element: string, action: string, properties?: Record<string, any>) => {
    if (!analyticsConfig.trackUserInteractions) return;

    trackEvent('user_interaction', {
      element,
      action,
      ...properties,
    });
  }, [analyticsConfig.trackUserInteractions, trackEvent]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    trackEvent('error', {
      error: error.message,
      stack: error.stack,
      context,
    });
  }, [trackEvent]);

  const trackConversion = useCallback((goal: string, properties?: Record<string, any>) => {
    trackEvent('conversion', {
      goal,
      ...properties,
    });
  }, [trackEvent]);

  const getAnalyticsData = useCallback(() => {
    return events;
  }, [events]);

  const clearAnalyticsData = useCallback(() => {
    setEvents([]);
  }, [setEvents]);

  const updateAnalyticsConfig = useCallback((newConfig: Partial<AnalyticsConfig>) => {
    setAnalyticsConfig(prev => ({ ...prev, ...newConfig }));
  }, [setAnalyticsConfig]);

  return {
    trackEvent,
    trackPageView,
    trackUserInteraction,
    trackError,
    trackConversion,
    getAnalyticsData,
    clearAnalyticsData,
    updateAnalyticsConfig,
    analyticsConfig,
  };
}