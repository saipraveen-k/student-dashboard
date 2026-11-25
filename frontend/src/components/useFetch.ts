import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api';

export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true);
    api.get<T>(url)
      .then((r) => alive && (setData(r.data), setError(null)))
      .catch((e) => alive && setError(errorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url]);
  return { data, error, loading };
}
