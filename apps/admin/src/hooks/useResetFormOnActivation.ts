import { useEffect, useRef } from 'react';

export function useResetFormOnActivation<TValues>(
  active: boolean,
  reset: (values: TValues) => void,
  values: TValues,
  resetKey?: string | number | boolean | null,
) {
  const wasActiveRef = useRef(false);
  const lastResetKeyRef = useRef<typeof resetKey>(undefined);

  useEffect(() => {
    const becameActive = active && !wasActiveRef.current;
    const keyChanged = active && resetKey !== lastResetKeyRef.current;

    wasActiveRef.current = active;

    if (!active || (!becameActive && !keyChanged)) return;

    lastResetKeyRef.current = resetKey;
    reset(values);
  }, [active, reset, resetKey, values]);
}