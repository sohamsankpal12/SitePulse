import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic fetch hook.
 * @param {Function} fetchFn - async function that returns data
 * @param {Array}    deps    - dependency array for re-fetching
 */
export function useApi(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const isMounted             = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (isMounted.current) setData(result);
    } catch (err) {
      if (isMounted.current) setError(err?.response?.data?.message || err?.message || 'Unknown error');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMounted.current = true;
    execute();
    return () => { isMounted.current = false; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
