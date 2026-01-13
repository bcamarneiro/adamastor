import { useIsFetching } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const DELAY_MS = 200;

/**
 * Custom hook that tracks global React Query loading state with a delay
 * to prevent flicker on fast requests (<200ms).
 *
 * @returns Object with isLoading boolean - true when queries are fetching
 *          AND delay threshold has passed
 */
export function useGlobalLoading() {
  const isFetching = useIsFetching();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isFetching > 0) {
      // Delay showing loading screen to prevent flicker on fast requests
      timer = setTimeout(() => {
        setIsLoading(true);
      }, DELAY_MS);
    } else {
      // Immediately hide when all fetches complete
      setIsLoading(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isFetching]);

  return { isLoading };
}
