'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_OPERATOR,
  readCurrentOperator,
} from '@/lib/current-operator';

export function useCurrentOperator() {
  const [operator, setOperator] = useState(DEFAULT_OPERATOR);

  useEffect(() => {
    const sync = () => {
      setOperator(readCurrentOperator(window.localStorage));
    };

    sync();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'esystem.currentOperator') {
        sync();
      }
    };

    const handleCustomEvent = () => sync();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('esystem-operator-change', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('esystem-operator-change', handleCustomEvent as EventListener);
    };
  }, []);

  return operator;
}

export function emitCurrentOperatorChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('esystem-operator-change'));
}
