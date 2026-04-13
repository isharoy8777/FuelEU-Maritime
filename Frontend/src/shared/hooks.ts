import { useState, useCallback, useEffect } from 'react';

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFn();
      setData(response);
      setStatus('success');
      return response;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setStatus('error');
      // Re-throw so caller can catch if manually executing
      throw err;
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {});
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}
