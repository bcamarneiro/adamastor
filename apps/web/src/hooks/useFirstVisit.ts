import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'debaixo-dolho-visited';
const ONBOARDING_DISMISSED_KEY = 'debaixo-dolho-onboarding-dismissed';

export function useFirstVisit() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const visited = localStorage.getItem(STORAGE_KEY);
    if (!visited) {
      setIsFirstVisit(true);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setIsLoading(false);
  }, []);

  const markAsVisited = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setIsFirstVisit(false);
  }, []);

  return { isFirstVisit, isLoading, markAsVisited };
}

export function useOnboardingDismissed() {
  const [isDismissed, setIsDismissed] = useState(true); // Default to dismissed to prevent flash
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY);
    setIsDismissed(dismissed === 'true');
    setIsLoading(false);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
    setIsDismissed(false);
  }, []);

  return { isDismissed, isLoading, dismiss, reset };
}
